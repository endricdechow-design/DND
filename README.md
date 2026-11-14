# 🐉 Dungeon Lobby

Eine Web-App für unsere Dungeons & Dragons (5e) Runde – gebaut mit Claude.

## Was gibt es schon?

- **Konto:** Registrieren und Anmelden mit E-Mail und Passwort
- **Runden:** Jeder kann eine Runde erstellen und ist dort automatisch **Spielleiter**
- **Einladen:** Jede Runde hat einen 6-stelligen Code, mit dem Spieler beitreten
- **Live-Lobby:** Neue Spieler erscheinen sofort bei allen in der Teilnehmerliste
- Spielleiter können Spieler entfernen und die Runde löschen
- **Charaktere:** Geführte Erschaffung (Volk → Klasse → Attribute → Fertigkeiten → Details) nach SRD 5.1
  - Werte werden automatisch berechnet: Modifikatoren, TP, RK, Initiative, Übungsbonus, Rettungswürfe, Fertigkeiten
  - Avatar-Bild hochladen (wird automatisch verkleinert)
  - Charakterbogen mit Schaden/Heilen/temporären TP, Langer Rast und Notizen
  - **Stufenaufstieg-Assistent:** gewürfelte oder durchschnittliche TP, Attributserhöhungen,
    Übersicht der neuen Klassenfähigkeiten (Stufe 2–20), Stufenverlauf mit „rückgängig“
  - Der Spielleiter kann alle Charaktere seiner Runde bearbeiten; Änderungen erscheinen live
- **Gruppenansicht:** Avatar-Leiste mit Lebensbalken und Zuständen; Klick öffnet die Charakterkarte
  - Mitspieler sehen nur Name, Bild, Volk, Klasse, Stufe, Gesundheit, Zustände und öffentliche Notizen
  - Den vollen Bogen und die privaten Notizen sehen nur der Spieler selbst und der Spielleiter
  - 15 Zustände aus dem SRD (z. B. vergiftet, liegend) – setzbar von Spieler und Spielleiter
- **Bibliothek des Spielleiters:** Gegenstände, Karten, Handouts und Effekte mit Bild, Beschreibung und Ordnern
  - Einträge sind versteckt, für alle freigeschaltet oder einzelnen Spielern zugeteilt (Inventar / Effekte)
  - Spieler sehen nur, was für sie freigeschaltet ist – live, ohne Neuladen
  - „🎁 Geben“ direkt an der Kachel oder auf dem Charakterbogen – mit Sicherheitsfrage
  - Spieler bekommen eine animierte Einblendung, wenn sie etwas erhalten
  - Spieler können Gegenstände **benutzen** (verbrauchen) – der Spielleiter bekommt eine Meldung
- **Schnellnavigation** in jeder Runde: Lobby · Mein Charakter · Bibliothek

## Geplant (in dieser Reihenfolge)

1. ✅ Fundament: Login, Runden, Einladungscode, Live-Lobby
2. ✅ Charaktere: Erstellung nach SRD 5.1, Werte automatisch berechnet, Avatar-Bild
3. ✅ Gruppenansicht: Avatar-Köpfe, Klick zeigt Charakterkarte (mit Sichtbarkeitsstufen)
4. ✅ Bibliothek des Spielleiters: Karten, Gegenstände, Effekte – freischalten & zuteilen
5. ⬜ Kampffeld: Raster, Gegner mit Bild, Figuren per Drag & Drop, Initiative
6. ⬜ Extras: Nebel des Krieges, Abenteuer-Tagebuch, Regelhilfen für Anfänger

*Gewürfelt wird bewusst weiter mit echten Würfeln am Tisch.*

## Lizenz der Regelinhalte

Die Spielregeln basieren auf dem *System Reference Document 5.1* von Wizards of the Coast LLC,
lizenziert unter [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/). Die Texte in der App sind
eigene, verkürzte deutsche Zusammenfassungen.

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
