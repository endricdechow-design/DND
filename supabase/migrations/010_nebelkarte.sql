-- =====================================================================
--  010 – NEBELKARTE + TISCH-BILDSCHIRM
--  Der Spielleiter lädt eine Karte hoch, deckt Bereiche auf (Nebel des
--  Krieges) und zeigt sie den Spielern. Ein Tisch-Bildschirm (Fernseher,
--  Laptop, Tablet) kann die Karte ohne Anmeldung per Code anzeigen.
--
--  So benutzt du diese Datei:
--  Supabase → SQL Editor → New query → kompletten Inhalt einfügen → Run.
--  Voraussetzung: 001 bis 009 wurden bereits ausgeführt.
--  Das Skript kann gefahrlos mehrfach ausgeführt werden.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) KARTEN einer Runde
--    fog   = Liste der Aufdeck-/Verdeck-Schritte (in Reihenfolge)
--    rooms = vorbereitete Räume (Name + Umriss)
--    view  = wohin der Tisch-Bildschirm schaut (null = ganze Karte)
--    active = diese Karte wird gerade den Spielern gezeigt (max. eine)
-- ---------------------------------------------------------------------
create table if not exists public.battle_maps (
  id         uuid primary key default gen_random_uuid(),
  game_id    uuid not null references public.games (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 80),
  image_url  text not null,
  fog        jsonb not null default '[]'::jsonb,
  rooms      jsonb not null default '[]'::jsonb,
  view       jsonb,
  active     boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists battle_maps_game_idx on public.battle_maps (game_id);
create unique index if not exists battle_maps_one_active on public.battle_maps (game_id) where active;

drop trigger if exists battle_maps_updated_at on public.battle_maps;
create trigger battle_maps_updated_at
  before update on public.battle_maps
  for each row execute function public.set_updated_at();

alter table public.battle_maps enable row level security;

-- Spielleiter sieht alle Karten, Spieler nur die gerade gezeigte
drop policy if exists "Karten lesen" on public.battle_maps;
create policy "Karten lesen"
  on public.battle_maps for select to authenticated
  using (public.is_game_master(game_id) or (active and public.is_game_member(game_id)));

drop policy if exists "Karten: Spielleiter legt an" on public.battle_maps;
create policy "Karten: Spielleiter legt an"
  on public.battle_maps for insert to authenticated
  with check (public.is_game_master(game_id));

drop policy if exists "Karten: Spielleiter bearbeitet" on public.battle_maps;
create policy "Karten: Spielleiter bearbeitet"
  on public.battle_maps for update to authenticated
  using (public.is_game_master(game_id))
  with check (public.is_game_master(game_id));

drop policy if exists "Karten: Spielleiter löscht" on public.battle_maps;
create policy "Karten: Spielleiter löscht"
  on public.battle_maps for delete to authenticated
  using (public.is_game_master(game_id));

-- Eine Karte zeigen (p_map_id = null → keine Karte zeigen)
create or replace function public.show_battle_map(p_game_id uuid, p_map_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_game_master(p_game_id) then
    raise exception 'Nur der Spielleiter kann Karten zeigen.';
  end if;
  update public.battle_maps set active = false where game_id = p_game_id and active and id is distinct from p_map_id;
  if p_map_id is not null then
    update public.battle_maps set active = true where game_id = p_game_id and id = p_map_id;
  end if;
end;
$$;

grant execute on function public.show_battle_map(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 2) TISCH-BILDSCHIRM: Zuschau-Code je Runde (ohne Anmeldung nutzbar)
-- ---------------------------------------------------------------------
create table if not exists public.game_displays (
  game_id    uuid primary key references public.games (id) on delete cascade,
  code       text not null unique,
  created_at timestamptz not null default now()
);

-- Keine Richtlinien = niemand liest die Tabelle direkt, nur über die Funktionen unten
alter table public.game_displays enable row level security;

create or replace function public.new_display_code()
returns text
language sql
volatile
as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '')
  from generate_series(1, 6);
$$;

-- Spielleiter: Code holen (wird beim ersten Mal erzeugt)
create or replace function public.get_display_code(p_game_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  if not public.is_game_master(p_game_id) then
    raise exception 'Nur der Spielleiter kann den Tisch-Bildschirm einrichten.';
  end if;
  select code into v_code from public.game_displays where game_id = p_game_id;
  while v_code is null loop
    begin
      insert into public.game_displays (game_id, code) values (p_game_id, public.new_display_code())
      returning code into v_code;
    exception when unique_violation then
      select code into v_code from public.game_displays where game_id = p_game_id;
    end;
  end loop;
  return v_code;
end;
$$;

-- Spielleiter: neuen Code erzeugen (alter Link funktioniert dann nicht mehr)
create or replace function public.renew_display_code(p_game_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  if not public.is_game_master(p_game_id) then
    raise exception 'Nur der Spielleiter kann den Tisch-Bildschirm einrichten.';
  end if;
  loop
    begin
      insert into public.game_displays (game_id, code) values (p_game_id, public.new_display_code())
      on conflict (game_id) do update set code = excluded.code, created_at = now()
      returning code into v_code;
      return v_code;
    exception when unique_violation then
      -- Code zufällig schon vergeben → nochmal würfeln
    end;
  end loop;
end;
$$;

-- Tisch-Bildschirm: aktuelle Karte holen (auch ohne Anmeldung)
-- Gibt NIE die Räume-Namen heraus, nur Bild, Nebel und Blickwinkel.
create or replace function public.get_display_state(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_game_id uuid;
  v_result  jsonb;
begin
  select game_id into v_game_id from public.game_displays where code = upper(trim(p_code));
  if v_game_id is null then
    return null;
  end if;
  select jsonb_build_object(
           'game_id', g.id,
           'game_name', g.name,
           'map', (
             select jsonb_build_object('id', m.id, 'name', m.name, 'image_url', m.image_url,
                                       'fog', m.fog, 'view', m.view, 'updated_at', m.updated_at)
             from public.battle_maps m
             where m.game_id = g.id and m.active
           )
         )
    into v_result
    from public.games g
   where g.id = v_game_id;
  return v_result;
end;
$$;

revoke execute on function public.new_display_code() from public, anon, authenticated;
grant execute on function public.get_display_code(uuid) to authenticated;
grant execute on function public.renew_display_code(uuid) to authenticated;
grant execute on function public.get_display_state(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 3) LIVE-UPDATES
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'battle_maps') then
    alter publication supabase_realtime add table public.battle_maps;
  end if;
end;
$$;

-- Fertig! 🗺️
