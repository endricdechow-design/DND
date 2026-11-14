-- =====================================================================
--  005 – GEGENSTÄNDE BENUTZEN + Ereignis-Protokoll
--  Spieler können Gegenstände aus ihrem Inventar benutzen (verbrauchen).
--  Der Spielleiter bekommt davon eine Meldung.
--
--  So benutzt du diese Datei:
--  Supabase → SQL Editor → New query → kompletten Inhalt einfügen → Run.
--  Voraussetzung: 001 bis 004 wurden bereits ausgeführt.
--  Das Skript kann gefahrlos mehrfach ausgeführt werden.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) PROTOKOLL: was in der Runde passiert ist (z. B. "Lyra hat Heiltrank benutzt")
-- ---------------------------------------------------------------------
create table if not exists public.game_log (
  id         uuid primary key default gen_random_uuid(),
  game_id    uuid not null references public.games (id) on delete cascade,
  user_id    uuid references public.profiles (id) on delete set null,
  kind       text not null,          -- z. B. 'item_used'
  item_id    uuid references public.library_items (id) on delete set null,
  text       text not null,
  created_at timestamptz not null default now()
);

create index if not exists game_log_game_idx on public.game_log (game_id, created_at);

alter table public.game_log enable row level security;

-- Spielleiter sieht das Protokoll seiner Runde, Spieler ihre eigenen Einträge.
-- Geschrieben wird nur über die Funktion unten.
drop policy if exists "Protokoll lesen" on public.game_log;
create policy "Protokoll lesen"
  on public.game_log for select to authenticated
  using (public.is_game_master(game_id) or user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- 2) GEGENSTAND BENUTZEN: aus dem eigenen Inventar entfernen + protokollieren
-- ---------------------------------------------------------------------
create or replace function public.use_library_item(p_item_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.library_items;
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

  delete from public.library_assignments
   where item_id = p_item_id and user_id = auth.uid();
  if not found then
    raise exception 'Dieser Gegenstand ist nicht in deinem Inventar.';
  end if;

  -- Anzeigename: Charaktername, sonst Benutzername
  select coalesce(
    (select c.name from public.characters c where c.game_id = v_item.game_id and c.user_id = auth.uid()),
    (select p.username from public.profiles p where p.id = auth.uid()),
    'Jemand'
  ) into v_who;

  insert into public.game_log (game_id, user_id, kind, item_id, text)
  values (v_item.game_id, auth.uid(), 'item_used', v_item.id, v_who || ' hat „' || v_item.name || '“ benutzt');
end;
$$;

revoke execute on function public.use_library_item(uuid) from public, anon;
grant  execute on function public.use_library_item(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 3) REALTIME für das Protokoll
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'game_log') then
    alter publication supabase_realtime add table public.game_log;
  end if;
end;
$$;

-- Fertig! 🧪
