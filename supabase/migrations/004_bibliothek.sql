-- =====================================================================
--  004 – BIBLIOTHEK DES SPIELLEITERS
--  Gegenstände, Karten, Handouts und Effekte – verstecken, freischalten,
--  einzelnen Spielern zuteilen.
--
--  So benutzt du diese Datei:
--  Supabase → SQL Editor → New query → kompletten Inhalt einfügen → Run.
--  Voraussetzung: 001 bis 003 wurden bereits ausgeführt.
--  Das Skript kann gefahrlos mehrfach ausgeführt werden.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) EINTRÄGE der Bibliothek
-- ---------------------------------------------------------------------
create table if not exists public.library_items (
  id          uuid primary key default gen_random_uuid(),
  game_id     uuid not null references public.games (id) on delete cascade,
  type        text not null check (type in ('item', 'map', 'handout', 'effect')),
  name        text not null check (char_length(name) between 1 and 80),
  description text not null default '',
  folder      text not null default '',
  image_url   text,
  -- 'hidden' = nur Spielleiter, 'all' = alle in der Runde
  visibility  text not null default 'hidden' check (visibility in ('hidden', 'all')),
  -- Zusatzangaben je nach Art (z. B. Seltenheit, Dauer)
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists library_items_game_id_idx on public.library_items (game_id);

drop trigger if exists library_items_updated_at on public.library_items;
create trigger library_items_updated_at
  before update on public.library_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 2) ZUTEILUNGEN: welcher Spieler hat/sieht welchen Eintrag
-- ---------------------------------------------------------------------
create table if not exists public.library_assignments (
  item_id    uuid not null references public.library_items (id) on delete cascade,
  game_id    uuid not null references public.games (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (item_id, user_id)
);

create index if not exists library_assignments_user_idx on public.library_assignments (game_id, user_id);

-- Hilfsfunktion: wurde der Eintrag dem eingeloggten Benutzer zugeteilt?
-- (security definer verhindert eine Endlosschleife in den Regeln)
create or replace function public.is_assigned_to_me(p_item_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.library_assignments
    where item_id = p_item_id and user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------
-- 3) ZUGRIFFSREGELN
-- ---------------------------------------------------------------------
alter table public.library_items       enable row level security;
alter table public.library_assignments enable row level security;

-- Spielleiter sieht alles; Spieler nur Freigeschaltetes oder ihnen Zugeteiltes
drop policy if exists "Bibliothek lesen" on public.library_items;
create policy "Bibliothek lesen"
  on public.library_items for select to authenticated
  using (
    public.is_game_master(game_id)
    or (visibility = 'all' and public.is_game_member(game_id))
    or public.is_assigned_to_me(id)
  );

drop policy if exists "Bibliothek: Spielleiter legt an" on public.library_items;
create policy "Bibliothek: Spielleiter legt an"
  on public.library_items for insert to authenticated
  with check (public.is_game_master(game_id));

drop policy if exists "Bibliothek: Spielleiter bearbeitet" on public.library_items;
create policy "Bibliothek: Spielleiter bearbeitet"
  on public.library_items for update to authenticated
  using (public.is_game_master(game_id))
  with check (public.is_game_master(game_id));

drop policy if exists "Bibliothek: Spielleiter löscht" on public.library_items;
create policy "Bibliothek: Spielleiter löscht"
  on public.library_items for delete to authenticated
  using (public.is_game_master(game_id));

-- Zuteilungen: Spielleiter sieht alle, Spieler nur die eigenen
drop policy if exists "Zuteilungen lesen" on public.library_assignments;
create policy "Zuteilungen lesen"
  on public.library_assignments for select to authenticated
  using (public.is_game_master(game_id) or user_id = (select auth.uid()));

-- Nur der Spielleiter teilt zu – und nur an Mitglieder seiner Runde,
-- und nur Einträge aus derselben Runde
drop policy if exists "Zuteilungen: Spielleiter teilt zu" on public.library_assignments;
create policy "Zuteilungen: Spielleiter teilt zu"
  on public.library_assignments for insert to authenticated
  with check (
    public.is_game_master(game_id)
    and exists (select 1 from public.library_items i where i.id = item_id and i.game_id = library_assignments.game_id)
    and exists (select 1 from public.game_members m where m.game_id = library_assignments.game_id and m.user_id = library_assignments.user_id)
  );

drop policy if exists "Zuteilungen: Spielleiter entfernt" on public.library_assignments;
create policy "Zuteilungen: Spielleiter entfernt"
  on public.library_assignments for delete to authenticated
  using (public.is_game_master(game_id));

-- ---------------------------------------------------------------------
-- 4) REALTIME
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'library_items') then
    alter publication supabase_realtime add table public.library_items;
  end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'library_assignments') then
    alter publication supabase_realtime add table public.library_assignments;
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 5) BILDER: Speicherplatz "library" (Karten, Handouts, Gegenstände)
--    Ordner = ID der Runde; hochladen darf nur deren Spielleiter.
--    Dateinamen enthalten zufällige IDs und sind nicht erratbar.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('library', 'library', true, 10485760, array['image/webp', 'image/png', 'image/jpeg', 'image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Bibliothek-Bilder: Spielleiter sieht" on storage.objects;
create policy "Bibliothek-Bilder: Spielleiter sieht"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'library'
    and (storage.foldername(name))[1] in (
      select m.game_id::text from public.game_members m where m.user_id = (select auth.uid()) and m.role = 'gm'
    )
  );

drop policy if exists "Bibliothek-Bilder: Spielleiter lädt hoch" on storage.objects;
create policy "Bibliothek-Bilder: Spielleiter lädt hoch"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'library'
    and (storage.foldername(name))[1] in (
      select m.game_id::text from public.game_members m where m.user_id = (select auth.uid()) and m.role = 'gm'
    )
  );

drop policy if exists "Bibliothek-Bilder: Spielleiter löscht" on storage.objects;
create policy "Bibliothek-Bilder: Spielleiter löscht"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'library'
    and (storage.foldername(name))[1] in (
      select m.game_id::text from public.game_members m where m.user_id = (select auth.uid()) and m.role = 'gm'
    )
  );

-- Fertig! 📚
