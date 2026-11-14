# Projekt-Hinweise für Claude

D&D-5e-Web-App für eine private Spielrunde. Die Entwickler sind **Programmier-Anfänger**:
Antworten und Erklärungen auf **Deutsch**, einfach und Schritt für Schritt. Sie installieren nichts lokal –
Claude baut, testet und pusht; die Seite wird automatisch aus `main` veröffentlicht.

## Stack
- React 19 + Vite, Routing mit `react-router`
- Tailwind CSS v4 (`@tailwindcss/vite`); wiederverwendbare Klassen in `src/index.css`
  (`card`, `title`, `input`, `label`, `btn-primary`, `btn-secondary`, `btn-ghost`, `btn-danger`, `badge-gm`, `badge-player`, `alert-error`, `alert-info`)
- Supabase (Auth, Postgres mit RLS, Realtime, später Storage) – Client in `src/lib/supabase.js`
- Öffentliche Supabase-Werte stehen bewusst in `.env` (Publishable Key). Nie einen secret/service_role Key committen.

## Struktur
- `src/lib/` – Supabase-Client, Auth-Kontext (`useAuth()` → `session`, `profile`, `signOut`), Fehlerübersetzung
- `src/pages/` – eine Datei pro Seite; `src/components/` – wiederverwendbare Bausteine
- `netlify.toml` – Build-Einstellungen für das automatische Veröffentlichen (Ordner `dist`)
- `supabase/migrations/NNN_name.sql` – nummerierte, **idempotente** SQL-Skripte, die der Nutzer selbst im Supabase SQL Editor ausführt.
  Neue Änderungen = neue Datei, alte nie umschreiben. Nach dem Pushen dem Nutzer sagen, welche Datei er ausführen muss.

## Datenmodell & Regeln
- Rollen gelten **pro Runde**: `game_members.role` ist `'gm'` (Spielleiter, Ersteller) oder `'player'`.
- Zugriff über RLS; Hilfsfunktionen `is_game_member(game_id)` und `is_game_master(game_id)` (security definer) nutzen,
  um Rekursion in Policies zu vermeiden. Schreibvorgänge mit Logik (z. B. Code erzeugen) als `security definer`-RPC.
- Live-Updates: Tabelle zur Publikation `supabase_realtime` hinzufügen; im Client bei Änderungen neu laden.
- Spielinhalte nur aus dem frei lizenzierten **SRD 5.1 (CC-BY-4.0)**, keine geschützten Texte aus Büchern.

## Prüfen vor dem Commit
- `npm run build` und `npm run lint` müssen durchlaufen.
- UI-Texte auf Deutsch, dunkles Fantasy-Design beibehalten, mobil nutzbar (ab 360 px Breite).
