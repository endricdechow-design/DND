-- =====================================================================
--  001 – FUNDAMENT: Profile, Runden, Teilnehmer, Live-Lobby
--
--  So benutzt du diese Datei:
--  Supabase → SQL Editor → New query → kompletten Inhalt einfügen → Run.
--  Das Skript kann gefahrlos mehrfach ausgeführt werden und übernimmt
--  bestehende Konten und Runden aus der alten Version.
--
--  Rollen gibt es PRO RUNDE: Wer eine Runde erstellt, ist dort
--  Spielleiter ('gm'), alle anderen sind Spieler ('player').
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) TABELLEN
-- ---------------------------------------------------------------------

-- Profil: ein Eintrag pro Benutzer (Anzeigename)
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  username   text not null check (char_length(username) between 1 and 40),
  created_at timestamptz not null default now()
);
-- Alte Version hatte eine Rolle pro Konto – die wird nicht mehr gebraucht
alter table public.profiles drop column if exists role;

-- Spielrunden mit 6-stelligem Einladungscode
create table if not exists public.games (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 80),
  invite_code text not null unique check (invite_code ~ '^[A-Z0-9]{6}$'),
  owner_id    uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- Teilnehmer einer Runde inkl. Rolle in DIESER Runde
create table if not exists public.game_members (
  game_id   uuid not null references public.games (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (game_id, user_id)
);
alter table public.game_members
  add column if not exists role text not null default 'player';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'game_members_role_check') then
    alter table public.game_members
      add constraint game_members_role_check check (role in ('gm', 'player'));
  end if;
end;
$$;

create index if not exists game_members_user_id_idx on public.game_members (user_id);
create index if not exists games_owner_id_idx on public.games (owner_id);

-- Bestehende Daten an das neue Modell anpassen
update public.game_members m
   set role = 'gm'
  from public.games g
 where g.id = m.game_id and g.owner_id = m.user_id and m.role <> 'gm';

-- Fehlende Profile für bereits registrierte Konten nachtragen
insert into public.profiles (id, username)
select u.id, left(coalesce(nullif(trim(u.raw_user_meta_data ->> 'username'), ''), 'Abenteurer'), 40)
  from auth.users u
 where not exists (select 1 from public.profiles p where p.id = u.id);

-- ---------------------------------------------------------------------
-- 2) PROFIL AUTOMATISCH BEI REGISTRIERUNG ANLEGEN
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'username'), ''), 'Abenteurer'), 40)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 3) HILFSFUNKTIONEN
-- ---------------------------------------------------------------------

-- Ist der eingeloggte Benutzer Mitglied der Runde?
-- (security definer verhindert eine Endlosschleife in den RLS-Regeln)
create or replace function public.is_game_member(p_game_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.game_members
    where game_id = p_game_id and user_id = auth.uid()
  );
$$;

-- Ist der eingeloggte Benutzer Spielleiter der Runde?
create or replace function public.is_game_master(p_game_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.game_members
    where game_id = p_game_id and user_id = auth.uid() and role = 'gm'
  );
$$;

-- Eindeutiger 6-stelliger Code (ohne verwechselbare Zeichen wie 0/O, 1/I)
create or replace function public.generate_invite_code()
returns text
language plpgsql
set search_path = ''
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  new_code text;
begin
  loop
    new_code := '';
    for i in 1..6 loop
      new_code := new_code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    end loop;
    exit when not exists (select 1 from public.games where invite_code = new_code);
  end loop;
  return new_code;
end;
$$;

-- Neue Runde erstellen – jeder darf das und wird dabei Spielleiter
create or replace function public.create_game(p_name text)
returns public.games
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_game public.games;
begin
  if auth.uid() is null then
    raise exception 'Du bist nicht angemeldet.';
  end if;

  if coalesce(trim(p_name), '') = '' then
    raise exception 'Bitte gib einen Namen für die Runde ein.';
  end if;

  insert into public.games (name, invite_code, owner_id)
  values (left(trim(p_name), 80), public.generate_invite_code(), auth.uid())
  returning * into new_game;

  insert into public.game_members (game_id, user_id, role)
  values (new_game.id, auth.uid(), 'gm');

  return new_game;
end;
$$;

-- Mit Einladungscode beitreten (als Spieler)
create or replace function public.join_game(p_code text)
returns public.games
language plpgsql
security definer
set search_path = ''
as $$
declare
  found_game public.games;
begin
  if auth.uid() is null then
    raise exception 'Du bist nicht angemeldet.';
  end if;

  select * into found_game
  from public.games
  where invite_code = upper(trim(p_code));

  if not found then
    raise exception 'Zu diesem Einladungscode gibt es keine Runde.';
  end if;

  -- Wer schon dabei ist, behält seine Rolle
  insert into public.game_members (game_id, user_id, role)
  values (found_game.id, auth.uid(), 'player')
  on conflict do nothing;

  return found_game;
end;
$$;

revoke execute on function public.create_game(text) from public, anon;
revoke execute on function public.join_game(text)   from public, anon;
grant  execute on function public.create_game(text) to authenticated;
grant  execute on function public.join_game(text)   to authenticated;

-- ---------------------------------------------------------------------
-- 4) ZUGRIFFSREGELN (Row Level Security)
-- ---------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.games        enable row level security;
alter table public.game_members enable row level security;

-- PROFILES: eingeloggte Benutzer sehen Namen, ändern nur den eigenen
drop policy if exists "Profile sind für eingeloggte Benutzer sichtbar" on public.profiles;
create policy "Profile sind für eingeloggte Benutzer sichtbar"
  on public.profiles for select to authenticated
  using (true);

drop policy if exists "Eigenes Profil bearbeiten" on public.profiles;
create policy "Eigenes Profil bearbeiten"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- GAMES: nur für Mitglieder sichtbar; Spielleiter darf umbenennen/löschen
drop policy if exists "Runden sind für Mitglieder sichtbar" on public.games;
create policy "Runden sind für Mitglieder sichtbar"
  on public.games for select to authenticated
  using (owner_id = (select auth.uid()) or public.is_game_member(id));

drop policy if exists "Spielleiter darf Runde bearbeiten" on public.games;
create policy "Spielleiter darf Runde bearbeiten"
  on public.games for update to authenticated
  using (public.is_game_master(id))
  with check (public.is_game_master(id));

drop policy if exists "Spielleiter darf eigene Runde löschen" on public.games;
create policy "Spielleiter darf eigene Runde löschen"
  on public.games for delete to authenticated
  using (owner_id = (select auth.uid()));

-- GAME_MEMBERS: Mitglieder sehen sich gegenseitig
drop policy if exists "Mitglieder sehen Mitspieler" on public.game_members;
create policy "Mitglieder sehen Mitspieler"
  on public.game_members for select to authenticated
  using (public.is_game_member(game_id));

-- Spieler dürfen austreten, der Spielleiter darf Spieler entfernen.
-- Der Spielleiter selbst kann nicht "austreten" (er löscht die Runde).
drop policy if exists "Austreten oder Spieler entfernen" on public.game_members;
create policy "Austreten oder Spieler entfernen"
  on public.game_members for delete to authenticated
  using (
    role <> 'gm'
    and (user_id = (select auth.uid()) or public.is_game_master(game_id))
  );

-- ---------------------------------------------------------------------
-- 5) REALTIME für die Teilnehmerliste
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'game_members'
  ) then
    alter publication supabase_realtime add table public.game_members;
  end if;
end;
$$;

-- Fertig! 🎲
