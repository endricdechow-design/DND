-- =====================================================================
--  014 – RASTER AUF KARTEN
--  Jede Nebelkarte kann ein Raster haben (1 Feld = 1,5 m im Kampf).
--  Der Tisch-Bildschirm bekommt das Raster mitgeliefert.
--
--  So benutzt du diese Datei:
--  Supabase → SQL Editor → New query → kompletten Inhalt einfügen → Run.
--  Voraussetzung: 001 bis 013 wurden bereits ausgeführt.
--  Das Skript kann gefahrlos mehrfach ausgeführt werden.
-- =====================================================================

-- Raster: { type, size, ox, oy, meters, show } – null = Standard-Raster der App
alter table public.battle_maps add column if not exists grid jsonb;

-- Tisch-Bildschirm: Raster mitliefern (weiterhin ohne Räume)
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
                                       'fog', m.fog, 'view', m.view, 'grid', m.grid, 'updated_at', m.updated_at)
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

grant execute on function public.get_display_state(text) to anon, authenticated;

-- Fertig! 📐
