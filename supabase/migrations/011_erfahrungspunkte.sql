-- =====================================================================
--  011 – ERFAHRUNGSPUNKTE (EP)
--  Der Spielleiter verteilt EP. Spieler können erst aufsteigen, wenn
--  sie genug EP für die nächste Stufe haben (SRD-Tabelle).
--  EP ändern darf nur der Spielleiter – das prüft die Datenbank.
--
--  So benutzt du diese Datei:
--  Supabase → SQL Editor → New query → kompletten Inhalt einfügen → Run.
--  Voraussetzung: 001 bis 010 wurden bereits ausgeführt.
--  Das Skript kann gefahrlos mehrfach ausgeführt werden.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) EP-Tabelle: wie viele EP braucht man für eine Stufe?
-- ---------------------------------------------------------------------
create or replace function public.xp_for_level(p_level int)
returns int
language sql
immutable
as $$
  select (array[0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
                85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000])
         [least(greatest(p_level, 1), 20)];
$$;

-- ---------------------------------------------------------------------
-- 2) Neue Spalte + bestehende Charaktere bekommen die EP ihrer Stufe
-- ---------------------------------------------------------------------
alter table public.characters add column if not exists xp int not null default 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'characters_xp_check') then
    alter table public.characters add constraint characters_xp_check check (xp >= 0);
  end if;
end;
$$;

update public.characters set xp = public.xp_for_level(level) where xp < public.xp_for_level(level);

-- ---------------------------------------------------------------------
-- 3) Schutz: nur der Spielleiter ändert EP; Spieler steigen nur mit genug EP auf
-- ---------------------------------------------------------------------
create or replace function public.guard_character_xp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_gm boolean;
begin
  -- Änderungen direkt im SQL Editor (ohne angemeldeten Benutzer) nicht einschränken
  if auth.uid() is null then
    return new;
  end if;
  v_is_gm := new.game_id is not null and public.is_game_master(new.game_id);

  if tg_op = 'INSERT' then
    -- Neue Charaktere starten mit den EP ihrer Stufe (Spieler können sich keine EP schenken)
    if not v_is_gm or new.xp < public.xp_for_level(new.level) then
      new.xp := public.xp_for_level(new.level);
    end if;
    return new;
  end if;

  -- EP: nur der Spielleiter
  if new.xp is distinct from old.xp and not v_is_gm then
    raise exception 'Nur der Spielleiter kann Erfahrungspunkte vergeben.';
  end if;

  if new.level > old.level then
    if v_is_gm then
      -- Spielleiter setzt die Stufe direkt → EP mindestens auf diese Stufe anheben
      new.xp := greatest(new.xp, public.xp_for_level(new.level));
    elsif new.xp < public.xp_for_level(new.level) then
      raise exception 'Noch nicht genug Erfahrungspunkte für Stufe % (% von % EP).',
        new.level, new.xp, public.xp_for_level(new.level);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists characters_guard_xp on public.characters;
create trigger characters_guard_xp
  before insert or update on public.characters
  for each row execute function public.guard_character_xp();

-- ---------------------------------------------------------------------
-- 4) Spielleiter verteilt EP
--    p_split = true  → p_amount wird auf alle gewählten Spieler aufgeteilt
--    p_split = false → jeder bekommt p_amount
--    Negative Werte ziehen EP ab (nie unter 0).
--    Jeder Spieler bekommt eine Meldung im Protokoll.
-- ---------------------------------------------------------------------
create or replace function public.award_xp(
  p_game_id uuid,
  p_user_ids uuid[],
  p_amount int,
  p_split boolean default false,
  p_reason text default ''
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_each  int;
  v_char  record;
  v_new   int;
  v_text  text;
begin
  if not public.is_game_master(p_game_id) then
    raise exception 'Nur der Spielleiter kann Erfahrungspunkte vergeben.';
  end if;
  if p_amount = 0 then
    raise exception 'Bitte eine Zahl ungleich 0 eingeben.';
  end if;

  select count(*) into v_count
    from public.characters c
   where c.game_id = p_game_id and c.user_id = any (p_user_ids);
  if v_count = 0 then
    raise exception 'Keiner der gewählten Spieler hat einen Charakter.';
  end if;

  v_each := case when p_split then trunc(p_amount::numeric / v_count)::int else p_amount end;
  if v_each = 0 then
    raise exception 'Aufgeteilt bekäme jeder 0 EP – bitte eine größere Zahl eingeben.';
  end if;

  for v_char in
    select c.id, c.user_id, c.name, c.xp, c.level
      from public.characters c
     where c.game_id = p_game_id and c.user_id = any (p_user_ids)
  loop
    v_new := greatest(0, v_char.xp + v_each);
    update public.characters set xp = v_new where id = v_char.id;

    v_text := case when v_each > 0
                then format('✨ +%s EP für %s', v_each, v_char.name)
                else format('%s EP abgezogen bei %s', v_each, v_char.name) end;
    if coalesce(trim(p_reason), '') <> '' then
      v_text := v_text || ' – ' || left(trim(p_reason), 80);
    end if;
    if v_char.level < 20 and v_new >= public.xp_for_level(v_char.level + 1) then
      v_text := v_text || '. ⬆️ Du kannst aufsteigen!';
    end if;

    insert into public.game_log (game_id, user_id, kind, target_user_id, text)
    values (p_game_id, auth.uid(), 'xp_awarded', v_char.user_id, v_text);
  end loop;

  return v_each;
end;
$$;

grant execute on function public.xp_for_level(int) to authenticated;
grant execute on function public.award_xp(uuid, uuid[], int, boolean, text) to authenticated;

-- Fertig! ✨
