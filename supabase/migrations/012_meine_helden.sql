-- =====================================================================
--  012 – MEINE HELDEN
--  Charaktere können ohne Runde existieren („Meine Helden“) und in eine
--  Runde mitgenommen werden – pro Runde ein Held, ein Held ist immer nur
--  in einer Runde. Verlässt man die Runde (oder wird sie gelöscht),
--  kehrt der Held zurück, statt gelöscht zu werden.
--
--  So benutzt du diese Datei:
--  Supabase → SQL Editor → New query → kompletten Inhalt einfügen → Run.
--  Voraussetzung: 001 bis 011 wurden bereits ausgeführt.
--  Das Skript kann gefahrlos mehrfach ausgeführt werden.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Charakter darf ohne Runde sein; Runde gelöscht → Held bleibt
-- ---------------------------------------------------------------------
alter table public.characters alter column game_id drop not null;

do $$
declare
  v_name text;
begin
  -- alte Verknüpfung „Runde gelöscht → Charakter gelöscht“ entfernen
  for v_name in
    select con.conname
      from pg_constraint con
      join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any (con.conkey)
     where con.conrelid = 'public.characters'::regclass
       and con.contype = 'f'
       and att.attname = 'game_id'
  loop
    execute format('alter table public.characters drop constraint %I', v_name);
  end loop;
  alter table public.characters
    add constraint characters_game_id_fkey foreign key (game_id) references public.games (id) on delete set null;
end;
$$;

-- ---------------------------------------------------------------------
-- 2) Besitzer bleibt fest; die Runde ändert sich nur über die Funktionen unten
--    (oder auf „keine Runde“, z. B. wenn die Runde gelöscht wird)
-- ---------------------------------------------------------------------
create or replace function public.characters_protect_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id <> old.user_id then
    raise exception 'Der Besitzer eines Charakters kann nicht geändert werden.';
  end if;
  if new.game_id is distinct from old.game_id
     and new.game_id is not null
     and coalesce(current_setting('app.moving_character', true), '') <> '1' then
    raise exception 'Ein Held kommt nur über „Helden mitbringen“ in eine Runde.';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 3) Zugriffsregeln: Helden ohne Runde gehören nur dem Besitzer
--    (Lesen/Bearbeiten/Löschen funktionierten schon über „Besitzer oder Spielleiter“)
-- ---------------------------------------------------------------------
drop policy if exists "Spieler erstellen eigenen Charakter" on public.characters;
create policy "Spieler erstellen eigenen Charakter"
  on public.characters for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (
      game_id is null
      or (public.is_game_member(game_id) and not public.is_game_master(game_id))
    )
  );

-- ---------------------------------------------------------------------
-- 4) Gruppenkarte: nur solange der Held in einer Runde ist
-- ---------------------------------------------------------------------
create or replace function public.sync_party_card()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.game_id is null then
    delete from public.party_cards where character_id = new.id;
    return new;
  end if;
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
    game_id = excluded.game_id,
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

-- ---------------------------------------------------------------------
-- 5) Runde verlassen / entfernt werden → Held kehrt zurück
-- ---------------------------------------------------------------------
create or replace function public.release_characters_on_leave()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.characters set game_id = null
   where game_id = old.game_id and user_id = old.user_id;
  return old;
end;
$$;

drop trigger if exists game_members_release_characters on public.game_members;
create trigger game_members_release_characters
  after delete on public.game_members
  for each row execute function public.release_characters_on_leave();

-- ---------------------------------------------------------------------
-- 6) Helden in eine Runde mitbringen
-- ---------------------------------------------------------------------
create or replace function public.bring_character(p_character_id uuid, p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_char public.characters;
begin
  select * into v_char from public.characters where id = p_character_id;
  if v_char.id is null or v_char.user_id <> auth.uid() then
    raise exception 'Diesen Helden gibt es nicht.';
  end if;
  if not public.is_game_member(p_game_id) or public.is_game_master(p_game_id) then
    raise exception 'Nur Spieler dieser Runde können einen Helden mitbringen.';
  end if;
  if v_char.game_id is not null then
    raise exception '% ist gerade in einer anderen Runde unterwegs.', v_char.name;
  end if;
  if exists (select 1 from public.characters where game_id = p_game_id and user_id = auth.uid()) then
    raise exception 'Du hast in dieser Runde schon einen Helden.';
  end if;

  perform set_config('app.moving_character', '1', true);
  update public.characters set game_id = p_game_id where id = p_character_id;
  perform set_config('app.moving_character', '', true);
end;
$$;

grant execute on function public.bring_character(uuid, uuid) to authenticated;

-- Fertig! 🧝
