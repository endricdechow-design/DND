-- =====================================================================
--  003 – GRUPPENANSICHT: Sichtbarkeit, Gruppenkarten und Zustände
--
--  So benutzt du diese Datei:
--  Supabase → SQL Editor → New query → kompletten Inhalt einfügen → Run.
--  Voraussetzung: 001 und 002 wurden bereits ausgeführt.
--  Das Skript kann gefahrlos mehrfach ausgeführt werden.
--
--  Idee:
--  * Den VOLLEN Charakterbogen sehen nur der Besitzer und der Spielleiter.
--  * Alle anderen in der Runde sehen eine "Gruppenkarte" (Tabelle party_cards):
--    Name, Bild, Volk, Klasse, Stufe, Lebensbalken (in %), Zustände
--    und öffentliche Notizen. Diese Karte wird automatisch aktuell gehalten.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Neue Spalten am Charakter
-- ---------------------------------------------------------------------
-- Maximale TP werden von der App berechnet und hier nur für den Lebensbalken abgelegt
alter table public.characters add column if not exists hp_max int;
-- Zustände wie "poisoned", "prone" … (Schlüssel aus der App)
alter table public.characters add column if not exists conditions text[] not null default '{}';

-- ---------------------------------------------------------------------
-- 2) Voller Bogen: nur noch Besitzer und Spielleiter
-- ---------------------------------------------------------------------
drop policy if exists "Mitglieder sehen Charaktere" on public.characters;
drop policy if exists "Besitzer oder Spielleiter sehen Charakter" on public.characters;
create policy "Besitzer oder Spielleiter sehen Charakter"
  on public.characters for select to authenticated
  using (user_id = (select auth.uid()) or public.is_game_master(game_id));

-- ---------------------------------------------------------------------
-- 3) Gruppenkarten: das, was alle in der Runde sehen dürfen
-- ---------------------------------------------------------------------
create table if not exists public.party_cards (
  character_id uuid primary key references public.characters (id) on delete cascade,
  game_id      uuid not null references public.games (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  name         text not null,
  avatar_url   text,
  race         text not null,
  class        text not null,
  level        int  not null,
  hp_percent   int,            -- 0–100, null = noch unbekannt
  conditions   text[] not null default '{}',
  public_notes text not null default '',
  updated_at   timestamptz not null default now()
);

create index if not exists party_cards_game_id_idx on public.party_cards (game_id);

alter table public.party_cards enable row level security;

drop policy if exists "Mitglieder sehen Gruppenkarten" on public.party_cards;
create policy "Mitglieder sehen Gruppenkarten"
  on public.party_cards for select to authenticated
  using (public.is_game_member(game_id));
-- Kein insert/update/delete für Benutzer: die Karten pflegt nur der Trigger unten.

-- Gruppenkarte automatisch aus dem Charakter erzeugen/aktualisieren
create or replace function public.sync_party_card()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.party_cards
    (character_id, game_id, user_id, name, avatar_url, race, class, level, hp_percent, conditions, public_notes, updated_at)
  values (
    new.id, new.game_id, new.user_id, new.name, new.avatar_url, new.race, new.class, new.level,
    case when coalesce(new.hp_max, 0) > 0
      then least(100, greatest(0, round(100.0 * new.hp_current / new.hp_max)))::int
    end,
    new.conditions,
    coalesce(new.data ->> 'notes', ''),
    now()
  )
  on conflict (character_id) do update set
    name = excluded.name,
    avatar_url = excluded.avatar_url,
    race = excluded.race,
    class = excluded.class,
    level = excluded.level,
    hp_percent = excluded.hp_percent,
    conditions = excluded.conditions,
    public_notes = excluded.public_notes,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists characters_sync_party_card on public.characters;
create trigger characters_sync_party_card
  after insert or update on public.characters
  for each row execute function public.sync_party_card();

-- Gruppenkarten für bereits vorhandene Charaktere anlegen
insert into public.party_cards
  (character_id, game_id, user_id, name, avatar_url, race, class, level, hp_percent, conditions, public_notes)
select
  c.id, c.game_id, c.user_id, c.name, c.avatar_url, c.race, c.class, c.level,
  case when coalesce(c.hp_max, 0) > 0
    then least(100, greatest(0, round(100.0 * c.hp_current / c.hp_max)))::int
  end,
  c.conditions,
  coalesce(c.data ->> 'notes', '')
from public.characters c
on conflict (character_id) do nothing;

-- ---------------------------------------------------------------------
-- 4) REALTIME für die Gruppenkarten
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'party_cards'
  ) then
    alter publication supabase_realtime add table public.party_cards;
  end if;
end;
$$;

-- Fertig! 👥
