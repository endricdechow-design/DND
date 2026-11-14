# 🐉 Dungeon Lobby

Eine Web-App für unsere Dungeons & Dragons (5e) Runde – gebaut mit Claude.

## Was gibt es schon?

- **Konto:** Registrieren und Anmelden mit E-Mail und Passwort
- **Runden:** Jeder kann eine Runde erstellen und ist dort automatisch **Spielleiter**
- **Einladen:** Jede Runde hat einen 6-stelligen Code, mit dem Spieler beitreten
- **Live-Lobby:** Neue Spieler erscheinen sofort bei allen in der Teilnehmerliste
- Spielleiter können Spieler entfernen und die Runde löschen

## Geplant (in dieser Reihenfolge)

1. ✅ Fundament: Login, Runden, Einladungscode, Live-Lobby
2. ⬜ Charaktere: Erstellung nach SRD 5.1, Werte automatisch berechnet, Avatar-Bild
3. ⬜ Gruppenansicht: Avatar-Köpfe, Klick zeigt Charakterkarte (mit Sichtbarkeitsstufen)
4. ⬜ Würfel: Würfeln mit gemeinsamem Protokoll
5. ⬜ Bibliothek des Spielleiters: Karten, Gegenstände, Effekte – freischalten & zuteilen
6. ⬜ Kampffeld: Raster, Gegner mit Bild, Figuren per Drag & Drop, Initiative
7. ⬜ Extras: Nebel des Krieges, Abenteuer-Tagebuch, Regelhilfen für Anfänger

## Technik

| Was | Womit |
| --- | --- |
| Oberfläche | React + Vite |
| Design | Tailwind CSS (dunkles Fantasy-Design) |
| Datenbank, Login, Live-Updates | Supabase |

## Datenbank einrichten / aktualisieren

Alle Datenbank-Änderungen liegen nummeriert in `supabase/migrations/`.

1. Supabase öffnen → **SQL Editor** → **New query**
2. Inhalt der Datei einfügen → **Run**
3. Bei mehreren Dateien: **der Reihe nach** (001, 002, …)

Jede Datei kann gefahrlos mehrfach ausgeführt werden.

**Einmalig in Supabase:** *Authentication → Sign In / Providers → Email →* „Confirm email“ ausschalten (zum Testen).

## Lokal starten (optional – nur wenn Node.js installiert ist)

```bash
npm install
npm run dev
```

## Mitarbeiten

Wir programmieren mit **Claude Code** (claude.ai/code) direkt auf diesem GitHub-Projekt.

- Pro Feature eine eigene Claude-Sitzung und ein eigener Zweig (Branch)
- Erst testen, dann in `main` übernehmen
- Neue Datenbank-Änderungen immer als **neue** Datei in `supabase/migrations/` (z. B. `002_charaktere.sql`)
