-- =====================================================================
--  006 – INVENTAR: Anzahl, Gewicht/Traglast und Fundstücke
--
--  * Zuteilungen haben eine Anzahl (z. B. 3 Heiltränke)
--  * Charaktere haben eine Traglast (Stärke × 7,5 kg, von der App berechnet)
--  * Spieler melden Fundstücke, der Spielleiter bestätigt oder lehnt ab
--  * Wer überladen ist, kann nichts mehr aufsammeln
--
--  So benutzt du diese Datei:
--  Supabase → SQL Editor → New query → kompletten Inhalt einfügen → Run.
--  Voraussetzung: 001 bis 005 wurden bereits ausgeführt.
--  Das Skript kann gefahrlos mehrfach ausgeführt werden.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Neue Spalten
-- ---------------------------------------------------------------------
alter table public.library_assignments add column if not exists quantity int not null default 1;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'library_assignments_quantity_check') then
    alter table public.library_assignments add constraint library_assignments_quantity_check check (quantity > 0);
  end if;
end;
$$;

-- Traglast in kg (Cache – die App schreibt Stärke × 7,5)
alter table public.characters add column if not exists carry_capacity numeric;

-- Protokoll: an wen richtet sich eine Meldung? (z. B. "Fund abgelehnt" an den Spieler)
alter table public.game_log add column if not exists target_user_id uuid references public.profiles (id) on delete cascade;

drop policy if exists "Protokoll lesen" on public.game_log;
create policy "Protokoll lesen"
  on public.game_log for select to authenticated
  using (
    public.is_game_master(game_id)
    or user_id = (select auth.uid())
    or target_user_id = (select auth.uid())
  );

-- ---------------------------------------------------------------------
-- 2) FUNDSTÜCKE: Anfragen der Spieler
-- ---------------------------------------------------------------------
create table if not exists public.item_requests (
  id          uuid primary key default gen_random_uuid(),
  game_id     uuid not null references public.games (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 80),
  description text not null default '',
  data        jsonb not null default '{}'::jsonb,   -- rarity, stat, weight
  quantity    int not null default 1 check (quantity between 1 and 999),
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  item_id     uuid references public.library_items (id) on delete set null,
  created_at  timestamptz not null default now(),
  decided_at  timestamptz
);

create index if not exists item_requests_game_idx on public.item_requests (game_id, status);

alter table public.item_requests enable row level security;

-- Spielleiter sieht alle Anfragen seiner Runde, Spieler ihre eigenen.
-- Anlegen und Entscheiden nur über die Funktionen unten.
drop policy if exists "Fundstücke lesen" on public.item_requests;
create policy "Fundstücke lesen"
  on public.item_requests for select to authenticated
  using (public.is_game_master(game_id) or user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- 3) HILFSFUNKTION: aktuelles Gewicht eines Spielers (Inventar + offene Funde)
--    (nur für sich selbst oder als Spielleiter abrufbar)
-- ---------------------------------------------------------------------
create or replace function public.inventory_weight(p_game_id uuid, p_user_id uuid)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce((
      select sum(coalesce((i.data ->> 'weight')::numeric, 0) * a.quantity)
      from public.library_assignments a
      join public.library_items i on i.id = a.item_id
      where a.game_id = p_game_id and a.user_id = p_user_id
        and (p_user_id = auth.uid() or public.is_game_master(p_game_id))
    ), 0)
    +
    coalesce((
      select sum(coalesce((r.data ->> 'weight')::numeric, 0) * r.quantity)
      from public.item_requests r
      where r.game_id = p_game_id and r.user_id = p_user_id and r.status = 'pending'
        and (p_user_id = auth.uid() or public.is_game_master(p_game_id))
    ), 0);
$$;

-- ---------------------------------------------------------------------
-- 4) SPIELER: Fundstück melden (wird abgelehnt, wenn er dadurch überladen wäre)
-- ---------------------------------------------------------------------
create or replace function public.request_found_item(
  p_game_id uuid, p_name text, p_description text, p_data jsonb, p_quantity int
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_capacity numeric;
  v_char_name text;
  v_new_weight numeric;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Du bist nicht angemeldet.';
  end if;
  if not exists (select 1 from public.game_members where game_id = p_game_id and user_id = auth.uid() and role = 'player') then
    raise exception 'Nur Spieler dieser Runde können Fundstücke melden.';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'Bitte gib einen Namen ein.';
  end if;

  select c.carry_capacity, c.name into v_capacity, v_char_name
  from public.characters c where c.game_id = p_game_id and c.user_id = auth.uid();
  if v_char_name is null then
    raise exception 'Erstelle zuerst einen Charakter.';
  end if;

  v_new_weight := coalesce(nullif(p_data ->> 'weight', '')::numeric, 0) * greatest(1, coalesce(p_quantity, 1));
  if v_capacity is not null
     and v_new_weight > 0
     and public.inventory_weight(p_game_id, auth.uid()) + v_new_weight > v_capacity then
    raise exception 'Du bist überladen und kannst das nicht mehr tragen.';
  end if;

  insert into public.item_requests (game_id, user_id, name, description, data, quantity)
  values (p_game_id, auth.uid(), left(trim(p_name), 80), coalesce(p_description, ''), coalesce(p_data, '{}'::jsonb), greatest(1, coalesce(p_quantity, 1)))
  returning id into v_id;

  insert into public.game_log (game_id, user_id, kind, text)
  values (p_game_id, auth.uid(), 'item_found',
          v_char_name || ' hat „' || left(trim(p_name), 80) || '“'
          || case when coalesce(p_quantity, 1) > 1 then ' ×' || p_quantity else '' end
          || ' gefunden – bitte bestätigen');
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 5) SPIELLEITER: Fund annehmen (ggf. mit Änderungen) oder ablehnen
-- ---------------------------------------------------------------------
create or replace function public.decide_item_request(
  p_request_id uuid, p_approve boolean, p_name text, p_description text, p_data jsonb, p_quantity int
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_req public.item_requests;
  v_item_id uuid;
begin
  select * into v_req from public.item_requests where id = p_request_id;
  if not found then
    raise exception 'Diese Anfrage gibt es nicht mehr.';
  end if;
  if not public.is_game_master(v_req.game_id) then
    raise exception 'Nur der Spielleiter kann Fundstücke bestätigen.';
  end if;
  if v_req.status <> 'pending' then
    raise exception 'Diese Anfrage wurde schon entschieden.';
  end if;

  if p_approve then
    insert into public.library_items (game_id, type, name, description, folder, visibility, data)
    values (
      v_req.game_id, 'item',
      left(coalesce(nullif(trim(p_name), ''), v_req.name), 80),
      coalesce(p_description, v_req.description),
      'Fundstücke', 'hidden',
      coalesce(p_data, v_req.data)
    )
    returning id into v_item_id;

    insert into public.library_assignments (item_id, game_id, user_id, quantity)
    values (v_item_id, v_req.game_id, v_req.user_id, greatest(1, coalesce(p_quantity, v_req.quantity)));

    update public.item_requests set status = 'approved', item_id = v_item_id, decided_at = now() where id = v_req.id;
  else
    update public.item_requests set status = 'rejected', decided_at = now() where id = v_req.id;

    insert into public.game_log (game_id, user_id, kind, target_user_id, text)
    values (v_req.game_id, auth.uid(), 'item_rejected', v_req.user_id,
            'Der Spielleiter hat deinen Fund „' || v_req.name || '“ abgelehnt.');
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 6) SPIELLEITER: Eintrag geben (hat der Spieler ihn schon, erhöht sich die Anzahl)
-- ---------------------------------------------------------------------
create or replace function public.give_library_item(p_item_id uuid, p_user_id uuid, p_quantity int)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_game uuid;
begin
  select game_id into v_game from public.library_items where id = p_item_id;
  if v_game is null then
    raise exception 'Diesen Eintrag gibt es nicht mehr.';
  end if;
  if not public.is_game_master(v_game) then
    raise exception 'Nur der Spielleiter kann Einträge geben.';
  end if;
  if not exists (select 1 from public.game_members where game_id = v_game and user_id = p_user_id) then
    raise exception 'Dieser Spieler ist nicht in der Runde.';
  end if;

  insert into public.library_assignments (item_id, game_id, user_id, quantity)
  values (p_item_id, v_game, p_user_id, greatest(1, coalesce(p_quantity, 1)))
  on conflict (item_id, user_id) do update
    set quantity = public.library_assignments.quantity + excluded.quantity,
        created_at = now();  -- damit der Spieler die Geschenk-Meldung bekommt
end;
$$;

-- ---------------------------------------------------------------------
-- 7) BENUTZEN: zieht jetzt nur 1 ab (bei Anzahl 1 verschwindet der Gegenstand)
-- ---------------------------------------------------------------------
create or replace function public.use_library_item(p_item_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.library_items;
  v_qty  int;
  v_who  text;
begin
  if auth.uid() is null then
    raise exception 'Du bist nicht angemeldet.';
  end if;

  select * into v_item from public.library_items where id = p_item_id;
  if not found then
    raise exception 'Diesen Gegenstand gibt es nicht mehr.';
  end if;
  if v_item.type <> 'item' then
    raise exception 'Nur Gegenstände können benutzt werden.';
  end if;

  select quantity into v_qty from public.library_assignments where item_id = p_item_id and user_id = auth.uid();
  if v_qty is null then
    raise exception 'Dieser Gegenstand ist nicht in deinem Inventar.';
  end if;

  if v_qty > 1 then
    update public.library_assignments set quantity = quantity - 1 where item_id = p_item_id and user_id = auth.uid();
  else
    delete from public.library_assignments where item_id = p_item_id and user_id = auth.uid();
  end if;

  select coalesce(
    (select c.name from public.characters c where c.game_id = v_item.game_id and c.user_id = auth.uid()),
    (select p.username from public.profiles p where p.id = auth.uid()),
    'Jemand'
  ) into v_who;

  insert into public.game_log (game_id, user_id, kind, item_id, text)
  values (v_item.game_id, auth.uid(), 'item_used', v_item.id,
          v_who || ' hat „' || v_item.name || '“ benutzt'
          || case when v_qty > 1 then ' (noch ' || (v_qty - 1) || ')' else '' end);
end;
$$;

-- Rechte für die Funktionen
revoke execute on function public.request_found_item(uuid, text, text, jsonb, int) from public, anon;
revoke execute on function public.decide_item_request(uuid, boolean, text, text, jsonb, int) from public, anon;
revoke execute on function public.give_library_item(uuid, uuid, int) from public, anon;
revoke execute on function public.inventory_weight(uuid, uuid) from public, anon;
grant execute on function public.request_found_item(uuid, text, text, jsonb, int) to authenticated;
grant execute on function public.decide_item_request(uuid, boolean, text, text, jsonb, int) to authenticated;
grant execute on function public.give_library_item(uuid, uuid, int) to authenticated;
grant execute on function public.inventory_weight(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 8) REALTIME
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'item_requests') then
    alter publication supabase_realtime add table public.item_requests;
  end if;
end;
$$;

-- Fertig! ⚖️
