-- =====================================================================
--  013 – HAUSREGELN-MELDUNGEN + SPARSAMER TISCH-BILDSCHIRM
--  1) Ändert der Spielleiter Hausregeln, bekommen die Spieler eine Meldung.
--  2) Der Tisch-Bildschirm fragt nur noch kurz „Hat sich etwas geändert?“
--     und lädt die Karte nur dann komplett neu.
--
--  So benutzt du diese Datei:
--  Supabase → SQL Editor → New query → kompletten Inhalt einfügen → Run.
--  Voraussetzung: 001 bis 012 wurden bereits ausgeführt.
--  Das Skript kann gefahrlos mehrfach ausgeführt werden.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Hausregeln: Meldung an alle Spieler der Runde
--    (eine Meldung pro Speichern – auch wenn mehrere Vorlagen auf einmal kommen)
-- ---------------------------------------------------------------------
create or replace function public.notify_house_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game  record;
  v_text  text;
begin
  for v_game in
    select r.game_id, count(*) as n, min(r.title) as title
      from changed_rules r
     group by r.game_id
  loop
    v_text := case
      when tg_op = 'INSERT' and v_game.n = 1 then format('🏠 Neue Hausregel: %s', v_game.title)
      when tg_op = 'INSERT' then format('🏠 %s neue Hausregeln', v_game.n)
      when v_game.n = 1 then format('🏠 Hausregel geändert: %s', v_game.title)
      else format('🏠 %s Hausregeln geändert', v_game.n)
    end;
    insert into public.game_log (game_id, user_id, kind, target_user_id, text)
    select v_game.game_id, auth.uid(), 'house_rule', m.user_id, v_text
      from public.game_members m
     where m.game_id = v_game.game_id and m.role = 'player';
  end loop;
  return null;
end;
$$;

drop trigger if exists house_rules_notify_insert on public.house_rules;
create trigger house_rules_notify_insert
  after insert on public.house_rules
  referencing new table as changed_rules
  for each statement execute function public.notify_house_rules();

drop trigger if exists house_rules_notify_update on public.house_rules;
create trigger house_rules_notify_update
  after update on public.house_rules
  referencing new table as changed_rules
  for each statement execute function public.notify_house_rules();

-- ---------------------------------------------------------------------
-- 2) Tisch-Bildschirm: nur den „Stand“ abfragen (winzige Antwort)
--    Ändert sich der Stand, lädt der Bildschirm get_display_state neu.
-- ---------------------------------------------------------------------
create or replace function public.get_display_version(p_code text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
           (select m.id::text || '@' || m.updated_at::text
              from public.battle_maps m
             where m.game_id = d.game_id and m.active),
           'none')
    from public.game_displays d
   where d.code = upper(trim(p_code));
$$;

grant execute on function public.get_display_version(text) to anon, authenticated;

-- Fertig! 🏠
