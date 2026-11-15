-- =====================================================================
--  008 – SPIELLEITER-WERKSTATT
--  Abenteuer vorbereiten (unabhängig von einer Runde), mit einem Klick
--  in eine Runde laden und per Teilen-Code an andere Spielleiter geben.
--
--  So benutzt du diese Datei:
--  Supabase → SQL Editor → New query → kompletten Inhalt einfügen → Run.
--  Voraussetzung: 001 bis 007 wurden bereits ausgeführt.
--  Das Skript kann gefahrlos mehrfach ausgeführt werden.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) ABENTEUER (gehören genau einem Benutzer)
-- ---------------------------------------------------------------------
create table if not exists public.adventures (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 80),
  description text not null default '',
  share_code  text not null unique default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8)),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists adventures_owner_idx on public.adventures (owner_id);

drop trigger if exists adventures_updated_at on public.adventures;
create trigger adventures_updated_at
  before update on public.adventures
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 2) INHALTE eines Abenteuers
--    Arten wie in der Bibliothek + 'npc' (Nichtspielercharakter)
-- ---------------------------------------------------------------------
create table if not exists public.adventure_items (
  id           uuid primary key default gen_random_uuid(),
  adventure_id uuid not null references public.adventures (id) on delete cascade,
  type         text not null check (type in ('item', 'map', 'handout', 'effect', 'npc')),
  name         text not null check (char_length(name) between 1 and 80),
  description  text not null default '',
  image_url    text,
  data         jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists adventure_items_adventure_idx on public.adventure_items (adventure_id);

drop trigger if exists adventure_items_updated_at on public.adventure_items;
create trigger adventure_items_updated_at
  before update on public.adventure_items
  for each row execute function public.set_updated_at();

-- Gehört das Abenteuer dem eingeloggten Benutzer?
create or replace function public.owns_adventure(p_adventure_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.adventures where id = p_adventure_id and owner_id = auth.uid());
$$;

-- ---------------------------------------------------------------------
-- 3) ZUGRIFFSREGELN: nur der Besitzer sieht und ändert seine Abenteuer
-- ---------------------------------------------------------------------
alter table public.adventures      enable row level security;
alter table public.adventure_items enable row level security;

drop policy if exists "Abenteuer: nur Besitzer" on public.adventures;
create policy "Abenteuer: nur Besitzer"
  on public.adventures for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "Abenteuer-Inhalte: nur Besitzer" on public.adventure_items;
create policy "Abenteuer-Inhalte: nur Besitzer"
  on public.adventure_items for all to authenticated
  using (public.owns_adventure(adventure_id))
  with check (public.owns_adventure(adventure_id));

-- ---------------------------------------------------------------------
-- 4) IN RUNDE LADEN: kopiert alle Inhalte versteckt in die Bibliothek
--    (Ordner = Name des Abenteuers). Schon geladene Inhalte werden
--    übersprungen – "erneut laden" bringt nur Neues dazu.
-- ---------------------------------------------------------------------
create or replace function public.load_adventure_into_game(p_adventure_id uuid, p_game_id uuid)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_adv public.adventures;
  v_count int;
begin
  select * into v_adv from public.adventures where id = p_adventure_id and owner_id = auth.uid();
  if not found then
    raise exception 'Dieses Abenteuer gehört dir nicht.';
  end if;
  if not public.is_game_master(p_game_id) then
    raise exception 'Du bist nicht Spielleiter dieser Runde.';
  end if;

  insert into public.library_items (game_id, type, name, description, folder, image_url, visibility, data)
  select
    p_game_id,
    case when ai.type = 'npc' then 'handout' else ai.type end,
    ai.name,
    ai.description,
    left(v_adv.name, 40),
    ai.image_url,
    'hidden',
    ai.data || jsonb_build_object('source', jsonb_build_object('adventure_id', v_adv.id, 'item_id', ai.id), 'npc', ai.type = 'npc')
  from public.adventure_items ai
  where ai.adventure_id = v_adv.id
    and not exists (
      select 1 from public.library_items li
      where li.game_id = p_game_id and li.data -> 'source' ->> 'item_id' = ai.id::text
    );

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------
-- 5) TEILEN: Abenteuer per Code als Kopie übernehmen
-- ---------------------------------------------------------------------
create or replace function public.import_shared_adventure(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_src public.adventures;
  v_new uuid;
begin
  if auth.uid() is null then
    raise exception 'Du bist nicht angemeldet.';
  end if;
  select * into v_src from public.adventures where share_code = upper(trim(p_code));
  if not found then
    raise exception 'Zu diesem Code gibt es kein Abenteuer.';
  end if;

  insert into public.adventures (owner_id, name, description)
  values (auth.uid(), left(v_src.name || case when v_src.owner_id = auth.uid() then ' (Kopie)' else '' end, 80), v_src.description)
  returning id into v_new;

  insert into public.adventure_items (adventure_id, type, name, description, image_url, data)
  select v_new, type, name, description, image_url, data
  from public.adventure_items where adventure_id = v_src.id;

  return v_new;
end;
$$;

revoke execute on function public.load_adventure_into_game(uuid, uuid) from public, anon;
revoke execute on function public.import_shared_adventure(text) from public, anon;
grant execute on function public.load_adventure_into_game(uuid, uuid) to authenticated;
grant execute on function public.import_shared_adventure(text) to authenticated;

-- ---------------------------------------------------------------------
-- 6) BILDER: Speicherplatz "workshop" (Ordner = Benutzer-ID)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('workshop', 'workshop', true, 10485760, array['image/webp', 'image/png', 'image/jpeg', 'image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Werkstatt-Bilder: eigene sehen" on storage.objects;
create policy "Werkstatt-Bilder: eigene sehen"
  on storage.objects for select to authenticated
  using (bucket_id = 'workshop' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Werkstatt-Bilder: hochladen" on storage.objects;
create policy "Werkstatt-Bilder: hochladen"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'workshop' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Werkstatt-Bilder: löschen" on storage.objects;
create policy "Werkstatt-Bilder: löschen"
  on storage.objects for delete to authenticated
  using (bucket_id = 'workshop' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Fertig! 🛠️
