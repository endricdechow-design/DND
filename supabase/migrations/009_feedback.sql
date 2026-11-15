-- =====================================================================
--  009 – FEEDBACK + PUSH-BENACHRICHTIGUNG (über die App "ntfy")
--
--  * Jeder kann aus der App Feedback senden (mit Seite und optional Bild).
--  * Der Betreiber der App (du) sieht alles auf der Feedback-Seite.
--  * Bei jedem neuen Feedback schickt die Datenbank eine Push-Nachricht
--    an deinen geheimen ntfy-Kanal – dein Handy klingelt.
--
--  So benutzt du diese Datei:
--  Supabase → SQL Editor → New query → kompletten Inhalt einfügen → Run.
--  Voraussetzung: 001 bis 008 wurden bereits ausgeführt.
--  Das Skript kann gefahrlos mehrfach ausgeführt werden.
--  WICHTIG: Danach in der App sofort auf der Feedback-Seite
--  „Ich bin der Betreiber“ tippen (der Erste wird Betreiber).
-- =====================================================================

-- Für Push-Nachrichten: Datenbank darf Web-Anfragen schicken
create extension if not exists pg_net;

-- ---------------------------------------------------------------------
-- 1) BETREIBER der App (sieht alle Rückmeldungen)
-- ---------------------------------------------------------------------
create table if not exists public.app_admins (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.app_admins enable row level security;

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.app_admins where user_id = auth.uid());
$$;

drop policy if exists "Betreiber sehen Betreiber" on public.app_admins;
create policy "Betreiber sehen Betreiber"
  on public.app_admins for select to authenticated
  using (public.is_app_admin());

-- Gibt es schon einen Betreiber? (für die Anzeige in der App)
create or replace function public.app_admin_exists()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.app_admins);
$$;

-- Der Erste, der das aufruft, wird Betreiber – danach geht es nicht mehr
create or replace function public.claim_app_admin()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Du bist nicht angemeldet.';
  end if;
  if exists (select 1 from public.app_admins) then
    return public.is_app_admin();
  end if;
  insert into public.app_admins (user_id) values (auth.uid());
  return true;
end;
$$;

-- ---------------------------------------------------------------------
-- 2) EINSTELLUNGEN (z. B. geheimer ntfy-Kanal) – nur für Betreiber
-- ---------------------------------------------------------------------
create table if not exists public.app_settings (
  key   text primary key,
  value text not null default ''
);
alter table public.app_settings enable row level security;

drop policy if exists "Einstellungen: nur Betreiber" on public.app_settings;
create policy "Einstellungen: nur Betreiber"
  on public.app_settings for all to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

-- ---------------------------------------------------------------------
-- 3) FEEDBACK
-- ---------------------------------------------------------------------
create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles (id) on delete set null,
  category   text not null default 'bug' check (category in ('bug', 'idea', 'unclear', 'praise')),
  message    text not null check (char_length(message) between 1 and 4000),
  page_url   text not null default '',
  image_url  text,
  device     text not null default '',
  version    text not null default '',
  status     text not null default 'new' check (status in ('new', 'done')),
  created_at timestamptz not null default now()
);
create index if not exists feedback_created_idx on public.feedback (created_at desc);
alter table public.feedback enable row level security;

drop policy if exists "Feedback senden" on public.feedback;
create policy "Feedback senden"
  on public.feedback for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'new');

drop policy if exists "Feedback lesen" on public.feedback;
create policy "Feedback lesen"
  on public.feedback for select to authenticated
  using (public.is_app_admin() or user_id = (select auth.uid()));

drop policy if exists "Feedback bearbeiten" on public.feedback;
create policy "Feedback bearbeiten"
  on public.feedback for update to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

drop policy if exists "Feedback löschen" on public.feedback;
create policy "Feedback löschen"
  on public.feedback for delete to authenticated
  using (public.is_app_admin());

-- ---------------------------------------------------------------------
-- 4) PUSH an ntfy (https://ntfy.sh) – Fehler beim Senden blockieren nie das Feedback
-- ---------------------------------------------------------------------
create or replace function public.send_push(p_title text, p_message text, p_click text, p_tags text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_topic text;
begin
  select value into v_topic from public.app_settings where key = 'ntfy_topic';
  if coalesce(v_topic, '') = '' then
    return;
  end if;
  perform net.http_post(
    url := 'https://ntfy.sh/',
    body := jsonb_build_object(
      'topic', v_topic,
      'title', p_title,
      'message', left(p_message, 1000),
      'tags', to_jsonb(p_tags),
      'click', p_click
    )
  );
exception when others then
  -- Push ist "nice to have": niemals das Speichern verhindern
  null;
end;
$$;

create or replace function public.notify_new_feedback()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_label text;
begin
  select username into v_name from public.profiles where id = new.user_id;
  v_label := case new.category when 'bug' then 'Fehler' when 'idea' then 'Idee' when 'unclear' then 'Unklar' else 'Lob' end;
  perform public.send_push(
    v_label || ' von ' || coalesce(v_name, 'jemandem'),
    new.message,
    coalesce(nullif(split_part(new.page_url, '/', 1) || '//' || split_part(new.page_url, '/', 3), '//'), '') || '/feedback',
    case new.category when 'bug' then array['beetle'] when 'idea' then array['bulb'] when 'unclear' then array['thinking'] else array['tada'] end
  );
  return new;
end;
$$;

drop trigger if exists feedback_notify on public.feedback;
create trigger feedback_notify
  after insert on public.feedback
  for each row execute function public.notify_new_feedback();

-- Test-Nachricht (Knopf auf der Feedback-Seite)
create or replace function public.send_test_push()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_app_admin() then
    raise exception 'Nur der Betreiber kann das.';
  end if;
  perform public.send_push('Test aus der Dungeon Lobby', 'Push-Benachrichtigungen funktionieren! 🐉', '', array['dragon']);
end;
$$;

revoke execute on function public.send_push(text, text, text, text[]) from public, anon, authenticated;
revoke execute on function public.claim_app_admin() from public, anon;
revoke execute on function public.send_test_push() from public, anon;
grant execute on function public.claim_app_admin() to authenticated;
grant execute on function public.app_admin_exists() to authenticated;
grant execute on function public.send_test_push() to authenticated;

-- ---------------------------------------------------------------------
-- 5) SCREENSHOTS: Speicherplatz "feedback" (Ordner = Benutzer-ID)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('feedback', 'feedback', true, 10485760, array['image/webp', 'image/png', 'image/jpeg', 'image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Feedback-Bilder: hochladen" on storage.objects;
create policy "Feedback-Bilder: hochladen"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'feedback' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Fertig! 💬
