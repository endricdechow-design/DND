-- =====================================================================
--  002 – CHARAKTERE: Charakterbögen und Avatar-Bilder
--
--  So benutzt du diese Datei:
--  Supabase → SQL Editor → New query → kompletten Inhalt einfügen → Run.
--  Voraussetzung: 001_fundament.sql wurde bereits ausgeführt.
--  Das Skript kann gefahrlos mehrfach ausgeführt werden.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) TABELLE: ein Charakter pro Spieler und Runde
-- ---------------------------------------------------------------------
create table if not exists public.characters (
  id          uuid primary key default gen_random_uuid(),
  game_id     uuid not null references public.games (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  level       int  not null default 1 check (level between 1 and 20),
  race        text not null,
  class       text not null,
  avatar_url  text,
  hp_current  int  not null default 0,
  hp_temp     int  not null default 0 check (hp_temp >= 0),
  -- Alle weiteren Angaben (Attribute, Fertigkeiten, Hintergrund, Rüstung, Notizen …)
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (game_id, user_id)
);

create index if not exists characters_game_id_idx on public.characters (game_id);

-- "Zuletzt geändert" automatisch setzen
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists characters_updated_at on public.characters;
create trigger characters_updated_at
  before update on public.characters
  for each row execute function public.set_updated_at();

-- Ein Charakter darf nicht in eine andere Runde oder zu einem anderen Spieler "wandern"
create or replace function public.characters_protect_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.game_id <> old.game_id or new.user_id <> old.user_id then
    raise exception 'Runde und Besitzer eines Charakters können nicht geändert werden.';
  end if;
  return new;
end;
$$;

drop trigger if exists characters_protect_owner on public.characters;
create trigger characters_protect_owner
  before update on public.characters
  for each row execute function public.characters_protect_owner();

-- ---------------------------------------------------------------------
-- 2) ZUGRIFFSREGELN
-- ---------------------------------------------------------------------
alter table public.characters enable row level security;

-- Alle Mitglieder der Runde sehen die Charaktere ihrer Gruppe
drop policy if exists "Mitglieder sehen Charaktere" on public.characters;
create policy "Mitglieder sehen Charaktere"
  on public.characters for select to authenticated
  using (public.is_game_member(game_id));

-- Spieler erstellen ihren eigenen Charakter (der Spielleiter braucht keinen)
drop policy if exists "Spieler erstellen eigenen Charakter" on public.characters;
create policy "Spieler erstellen eigenen Charakter"
  on public.characters for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_game_member(game_id)
    and not public.is_game_master(game_id)
  );

-- Bearbeiten und Löschen: der Besitzer oder der Spielleiter der Runde
drop policy if exists "Besitzer oder Spielleiter bearbeiten Charakter" on public.characters;
create policy "Besitzer oder Spielleiter bearbeiten Charakter"
  on public.characters for update to authenticated
  using (user_id = (select auth.uid()) or public.is_game_master(game_id))
  with check (user_id = (select auth.uid()) or public.is_game_master(game_id));

drop policy if exists "Besitzer oder Spielleiter löschen Charakter" on public.characters;
create policy "Besitzer oder Spielleiter löschen Charakter"
  on public.characters for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_game_master(game_id));

-- ---------------------------------------------------------------------
-- 3) REALTIME: Änderungen (z. B. Trefferpunkte) sofort bei allen anzeigen
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'characters'
  ) then
    alter publication supabase_realtime add table public.characters;
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 4) BILDER: Speicherplatz "avatars" für Charakterbilder
--    Öffentlich lesbar (für die Anzeige), max. 5 MB, nur Bildformate.
--    Jeder darf nur in seinen eigenen Ordner (= seine Benutzer-ID) schreiben.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/webp', 'image/png', 'image/jpeg', 'image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Avatare: eigene Dateien sehen" on storage.objects;
create policy "Avatare: eigene Dateien sehen"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Avatare: in eigenen Ordner hochladen" on storage.objects;
create policy "Avatare: in eigenen Ordner hochladen"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Avatare: eigene Dateien ersetzen" on storage.objects;
create policy "Avatare: eigene Dateien ersetzen"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Avatare: eigene Dateien löschen" on storage.objects;
create policy "Avatare: eigene Dateien löschen"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Fertig! 🧝
