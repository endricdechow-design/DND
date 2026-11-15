-- =====================================================================
--  007 – HAUSREGELN für das Kompendium
--  Der Spielleiter schreibt eigene Regeln für seine Runde,
--  alle Mitglieder der Runde können sie im Kompendium nachlesen.
--
--  So benutzt du diese Datei:
--  Supabase → SQL Editor → New query → kompletten Inhalt einfügen → Run.
--  Voraussetzung: 001 bis 006 wurden bereits ausgeführt.
--  Das Skript kann gefahrlos mehrfach ausgeführt werden.
-- =====================================================================

create table if not exists public.house_rules (
  id         uuid primary key default gen_random_uuid(),
  game_id    uuid not null references public.games (id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 80),
  body       text not null default '' check (char_length(body) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists house_rules_game_idx on public.house_rules (game_id);

drop trigger if exists house_rules_updated_at on public.house_rules;
create trigger house_rules_updated_at
  before update on public.house_rules
  for each row execute function public.set_updated_at();

alter table public.house_rules enable row level security;

drop policy if exists "Hausregeln lesen" on public.house_rules;
create policy "Hausregeln lesen"
  on public.house_rules for select to authenticated
  using (public.is_game_member(game_id));

drop policy if exists "Hausregeln: Spielleiter legt an" on public.house_rules;
create policy "Hausregeln: Spielleiter legt an"
  on public.house_rules for insert to authenticated
  with check (public.is_game_master(game_id));

drop policy if exists "Hausregeln: Spielleiter bearbeitet" on public.house_rules;
create policy "Hausregeln: Spielleiter bearbeitet"
  on public.house_rules for update to authenticated
  using (public.is_game_master(game_id))
  with check (public.is_game_master(game_id));

drop policy if exists "Hausregeln: Spielleiter löscht" on public.house_rules;
create policy "Hausregeln: Spielleiter löscht"
  on public.house_rules for delete to authenticated
  using (public.is_game_master(game_id));

-- Fertig! 🏠
