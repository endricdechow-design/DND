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
- `src/pages/` – eine Datei pro Seite; `src/components/` – wiederverwendbare Bausteine (`character/` für den Erschaffungs-Assistenten, `party/` für die Gruppenansicht, `library/` für die Bibliothek,
  `Modal.jsx` für Pop-ups (per Portal in `<body>`), `GameNav.jsx` als Navigation auf allen Seiten einer Runde,
  `GiftNotifier.jsx` = globale Einblendung bei neuen Zuteilungen)
- `src/data/srd.js` – Regeldaten (Völker, Klassen, Fertigkeiten, Rüstungen …); `src/lib/character.js` – alle Berechnungen
  (`deriveCharacter(row)`). Abgeleitete Werte (TP-Maximum, RK, Boni) werden **nie** gespeichert, sondern immer berechnet.
- `src/data/catalog.js` – Vorschlagskatalog für die Bibliothek (`searchCatalog(type, text)`); Einträge mit `stat`
  (Kurzinfo, landet in `library_items.data.stat` und auf der Kachel)
- `src/data/spells.js` – Zauber (Grad 0–3) + `spellRules(class, level, mods)` (Plätze, Zähler, Modus known/prepared/spellbook).
  Auswahl/Plätze gespeichert in `characters.data.spells` `{ cantrips, known, prepared, slotsUsed }`; Zähler sind nur Hinweise.
  Komponenten in `src/components/spells/`. Grade 4–9 fehlen noch.
- `src/data/compendium/` – Kompendium: `rules.js` (Regeln/Glossar/SL-Tipps als kompakte Arrays), `monsters.js` (SRD-Werte),
  `index.js` (führt alles zusammen: Regeln, Zustände, Fertigkeiten, Zauber, Katalog, Völker, Klassen, Monster + `searchCompendium`).
  IDs `kategorie:schlüssel`; ⓘ-Symbole über `<InfoTip id="…" />`. `src/lib/compendium.jsx` = Provider (Pop-up + Hausregeln).
  Tabelle `house_rules` (Migration 007): lesen alle Mitglieder, schreiben nur Spielleiter.
- Werkstatt (Migration 008): Tabellen `adventures` (Besitzer, `share_code`) und `adventure_items` (type inkl. `npc`), nur für den
  Besitzer sichtbar. RPCs `load_adventure_into_game` (kopiert versteckt in die Bibliothek, Ordner = Abenteuername,
  `data.source.item_id` verhindert Doppelte, NSC → handout mit `data.npc`) und `import_shared_adventure(code)`.
  Bilder im Bucket `workshop` (Ordner = User-ID; werden beim Löschen bewusst nicht entfernt, da Runden sie nutzen).
  Seiten `WorkshopPage.jsx`, `AdventurePage.jsx`, Editor in `src/components/workshop/`.
- Feedback (Migration 009): Tabellen `feedback`, `app_admins` (Betreiber; erster `claim_app_admin()` gewinnt), `app_settings`
  (`ntfy_topic`, nur Betreiber). Trigger `notify_new_feedback` → `send_push` → `pg_net` POST an ntfy.sh (Fehler werden geschluckt).
  Bilder im Bucket `feedback`. Komponenten `src/components/feedback/`, Seite `FeedbackPage.jsx`.
- `src/data/levels.js` – Klassenfähigkeiten Stufe 2–20 und Stufen mit Attributserhöhung
- `src/lib/avatars.js` – Bild verkleinern + in Storage-Bucket `avatars` hochladen (Pfad beginnt mit der User-ID)
- `wrangler.jsonc` – Veröffentlichung über **Cloudflare** (Workers Builds: `npm run build` → `npx wrangler deploy`, Ordner `dist`).
  `netlify.toml` ist nur noch ein Überbleibsel (Netlify-Kontingent war aufgebraucht).
- Pro fertigem Feature **einmal** nach `main` pushen (jeder Push = ein Build), Kleinkram sammeln.
- `supabase/migrations/NNN_name.sql` – nummerierte, **idempotente** SQL-Skripte, die der Nutzer selbst im Supabase SQL Editor ausführt.
  Neue Änderungen = neue Datei, alte nie umschreiben. Nach dem Pushen dem Nutzer sagen, welche Datei er ausführen muss.

## Datenmodell & Regeln
- Tabelle `characters`: ein Charakter pro Spieler und Runde; Kernfelder als Spalten, alles Weitere in `data` (jsonb).
  Lesbar **nur für Besitzer und Spielleiter**. `hp_max` ist ein Cache (App schreibt den berechneten Wert) für den Lebensbalken.
- Tabelle `party_cards`: öffentliche Gruppenkarte je Charakter (Name, Bild, Stufe, `hp_percent`, `conditions`, `public_notes`),
  lesbar für alle Mitglieder, wird **nur per Trigger** aus `characters` befüllt – nie direkt schreiben.
- `data.levelUps` = Liste der Aufstiege `{ level, hpRoll (null = Durchschnitt), asi?: { dex: 1, … }, date }`;
  fließt in `deriveCharacter` ein (TP, Attribute). Spieler steigen nur über den Assistenten auf;
  der Spielleiter darf die Stufe im Bearbeiten-Dialog direkt setzen (spätere `levelUps` werden dann verworfen).
- `data.notes` = öffentliche Notizen (landen in der Gruppenkarte), `data.privateNotes` = nur Besitzer + Spielleiter.
- Tabellen `library_items` (type: item/map/handout/effect, `visibility` hidden/all, `folder`, `data`) und
  `library_assignments` (Eintrag ↔ Spieler). Nur der Spielleiter schreibt. Bilder im Bucket `library`, Ordner = game_id.
  Die Bibliotheksseite sendet nach Änderungen ein Broadcast `changed` auf Kanal `library-<gameId>`, damit Spieler neu laden.
- Tabelle `game_log` (Protokoll, z. B. `item_used`), lesbar für Spielleiter + eigene Einträge, geschrieben nur per RPC.
  RPC `use_library_item(item_id)`: Spieler verbraucht einen eigenen Gegenstand (Zuteilung weg + Protokolleintrag).
  `GameLogNotifier.jsx` zeigt dem Spielleiter neue Einträge an.
- Inventar (Migration 006): `library_assignments.quantity`, Gewicht in `library_items.data.weight` (kg pro Stück),
  `characters.carry_capacity` (Cache, App schreibt Stärke × 7,5 – siehe `src/lib/inventory.js`).
  Tabelle `item_requests` (Fundstücke, status pending/approved/rejected). RPCs: `request_found_item` (prüft Überladung
  serverseitig), `decide_item_request` (nur Spielleiter, legt Eintrag im Ordner „Fundstücke“ an), `give_library_item`
  (erhöht Anzahl), `use_library_item` (zieht 1 ab). `game_log.target_user_id` = Meldung an genau diesen Spieler.
- Benachrichtigungen (Geschenk, Protokoll) nutzen Realtime **und** regelmäßiges Nachschauen als Absicherung;
  Anzeige über `src/lib/useTimedQueue.js` (10 s, feste Ablaufzeit, Ablaufbalken). `GameLogNotifier` sendet
  zusätzlich das Fenster-Ereignis `dnd:game-log`, auf das z. B. die Bibliothek mit Neuladen reagiert.
- `src/lib/images.js` – generisches Verkleinern/Hochladen/Löschen von Bildern (Avatare und Bibliothek nutzen es).
- Würfeln passiert bewusst am echten Tisch – keine Würfelfunktion einbauen, außer der Nutzer wünscht es.
- Rollen gelten **pro Runde**: `game_members.role` ist `'gm'` (Spielleiter, Ersteller) oder `'player'`.
- Zugriff über RLS; Hilfsfunktionen `is_game_member(game_id)` und `is_game_master(game_id)` (security definer) nutzen,
  um Rekursion in Policies zu vermeiden. Schreibvorgänge mit Logik (z. B. Code erzeugen) als `security definer`-RPC.
- Live-Updates: Tabelle zur Publikation `supabase_realtime` hinzufügen; im Client bei Änderungen neu laden.
- Spielinhalte nur aus dem frei lizenzierten **SRD 5.1 (CC-BY-4.0)**, keine geschützten Texte aus Büchern.

## Prüfen vor dem Commit
- `npm run build` und `npm run lint` müssen durchlaufen.
- UI-Texte auf Deutsch, dunkles Fantasy-Design beibehalten, mobil nutzbar (ab 360 px Breite).
