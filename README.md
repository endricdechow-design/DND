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
- **Zauber:** 164 SRD-Zauber (Zaubertricks bis Grad 3) mit deutscher Kurzbeschreibung
  - Zauberplätze zum Abhaken (Paktmagie beim Hexenmeister), „✨ Wirken“ mit Wahl des Platzes, Lange/Kurze Rast
  - Zaubertricks, bekannte bzw. vorbereitete Zauber, Zauberbuch für Magier – Zähler als Hinweis
- **📖 Kompendium:** Suche über alles (auch englische Begriffe wie „AC“) – Regeln, Kampf, Aktionen, Zustände,
  Fertigkeiten, Magie, Zauber, Gegenstände, Völker, Klassen, 37 Monster mit Werten, Glossar und Spielleiter-Tipps
  - ⓘ-Symbole in der App öffnen direkt die passende Erklärung; Favoriten und „zuletzt angesehen“
  - **Hausregeln:** Spielleiter schreiben eigene Regeln für ihre Runde, die Spieler finden sie im Kompendium
- **🛠️ Spielleiter-Werkstatt:** Abenteuer unabhängig von einer Runde vorbereiten (Gegenstände, Karten, Handouts,
  Effekte, NSCs), mit einem Klick versteckt in eine Runde laden („erneut laden“ bringt nur Neues), per Teilen-Code kopieren
- **💬 Feedback:** Knopf unten rechts auf jeder Seite (Kategorie, Text, Screenshot, Seite wird mitgeschickt).
  Der Betreiber sieht alles unter /feedback und bekommt Push-Nachrichten über die App ntfy
- **Lobby:** oben dein Held (Bild, Stufe, Lebensbalken, Zustände), darunter die Gefährten als Kacheln; Klick öffnet die Charakterkarte
  - Mitspieler sehen nur Name, Bild, Volk, Klasse, Stufe, Gesundheit, Zustände und öffentliche Notizen
  - Den vollen Bogen und die privaten Notizen sehen nur der Spieler selbst und der Spielleiter
  - 15 Zustände aus dem SRD (z. B. vergiftet, liegend) – setzbar von Spieler und Spielleiter
- **Bibliothek des Spielleiters:** Gegenstände, Karten, Handouts und Effekte mit Bild, Beschreibung und Ordnern
  - Einträge sind versteckt, für alle freigeschaltet oder einzelnen Spielern zugeteilt (Inventar / Effekte)
  - **Vorschläge beim Tippen** aus dem SRD: Waffen, Rüstungen, Ausrüstung, Tränke, magische Gegenstände
    und Effekte – mit Werten, Seltenheit und Dauer
  - Spieler sehen nur, was für sie freigeschaltet ist – live, ohne Neuladen
  - „🎁 Geben“ direkt an der Kachel oder auf dem Charakterbogen – mit Sicherheitsfrage
  - Spieler bekommen eine animierte Einblendung, wenn sie etwas erhalten
  - Spieler können Gegenstände **benutzen** (verbrauchen) – der Spielleiter bekommt eine Meldung
- **Inventar:** Anzahl (z. B. 3 Heiltränke), Gewicht in kg, Traglast = Stärke × 7,5 kg
  - Spieler melden **Fundstücke** selbst („🔍 Etwas gefunden“), der Spielleiter prüft, passt an und bestätigt
  - Wer überladen ist, kann nichts mehr aufsammeln (der Spielleiter kann trotzdem etwas geben)
- **Meine Helden:** beliebig viele Charaktere auch ohne Runde erstellen und in eine Runde mitbringen (ein Held pro Runde,
  ein Held immer nur in einer Runde; verlässt man die Runde, kehrt er zurück)
- **Erfahrungspunkte:** Der Spielleiter verteilt EP (jeder bekommt X oder aufteilen); „Stufe aufsteigen“ ist gesperrt,
  bis genug EP da sind (SRD-Tabelle)
- **Nebelkarte:** Der Spielleiter lädt eine Karte hoch, die Spieler sehen nur, was er aufdeckt (Nebel des Krieges)
  - Werkzeuge: Rechteck, Vieleck, Pinsel, Verdecken, Rückgängig, alles auf-/zudecken
  - Räume vorbereiten (auch schon in der Werkstatt) und im Spiel mit einem Tipp aufdecken
  - Live bei allen Spielern, mit sanftem Auflösen des Nebels; zoomen mit zwei Fingern oder Mausrad
- **Tisch-Bildschirm:** Fernseher/Laptop/Tablet zeigt per Code-Link dauerhaft die Karte – ohne Anmeldung,
  der Spielleiter lenkt den Blick („Hierhin schauen“)
- **Schnellnavigation** in jeder Runde: Lobby · Mein Charakter · Karte · Bibliothek

## Geplant (in dieser Reihenfolge)

1. ✅ Fundament: Login, Runden, Einladungscode, Live-Lobby
2. ✅ Charaktere: Erstellung nach SRD 5.1, Werte automatisch berechnet, Avatar-Bild
3. ✅ Gruppenansicht: Avatar-Köpfe, Klick zeigt Charakterkarte (mit Sichtbarkeitsstufen)
4. ✅ Bibliothek des Spielleiters: Karten, Gegenstände, Effekte – freischalten & zuteilen
5. ✅ Nebelkarte + Tisch-Bildschirm (Kampffeld Etappe 1)
6. ⬜ Kampffeld Etappe 2: Spielfiguren per Drag & Drop, Raster
7. ⬜ Kampffeld Etappe 3: Initiative, Lebensbalken an Figuren, Begegnungen aus der Werkstatt
8. ⬜ Extras: Abenteuer-Tagebuch

*Gewürfelt wird bewusst weiter mit echten Würfeln am Tisch.*

## Offene Punkte

- ⬜ Zauber der Grade 4–9 ergänzen (sobald die Charaktere höhere Stufen erreichen)
- ⬜ Werkstatt Etappe 2: Szenen und Begegnungen mit Schwierigkeitsrechner, „Szene starten“
- ⬜ Kampffeld Etappe 2 und 3 (Figuren, Raster, Initiative)
- ⬜ Hausregeln: Schritt nach „Runde erstellen“ mit Vorlagen zum Ankreuzen, eigener Punkt in der Runden-Navigation

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
