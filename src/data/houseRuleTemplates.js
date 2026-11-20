// =====================================================================
//  Vorlagen für Hausregeln (eigene Formulierungen, keine Buchtexte).
//  Der Spielleiter kreuzt an, was gelten soll – danach frei bearbeitbar.
// =====================================================================
export const HOUSE_RULE_TEMPLATES = [
  {
    key: 'potion-bonus',
    icon: '🧪',
    title: 'Heiltrank als Bonusaktion',
    body: 'Einen Heiltrank selbst zu trinken kostet nur eine Bonusaktion.\n\n- Einem anderen einen Trank einzuflößen bleibt eine Aktion.',
  },
  {
    key: 'crit-max',
    icon: '💥',
    title: 'Kritische Treffer: Maximum + Wurf',
    body: 'Bei einem kritischen Treffer zählt ein Satz Schadenswürfel automatisch als Höchstwert, der zweite Satz wird normal gewürfelt.\n\n- Beispiel Langschwert (1W8): 8 + 1W8 + Modifikator.',
  },
  {
    key: 'carry',
    icon: '⚖️',
    title: 'Traglast: Stärke × 7,5 kg',
    body: 'Jeder Charakter kann Stärke × 7,5 kg tragen.\n\n- Wer überladen ist, kann nichts mehr aufsammeln.\n- Die App rechnet die Traglast automatisch aus.',
  },
  {
    key: 'hp-roll',
    icon: '❤️',
    title: 'Trefferpunkte beim Aufstieg würfeln',
    body: 'Beim Stufenaufstieg werden die Trefferpunkte am Tisch gewürfelt.\n\n- Würfelt jemand eine 1, darf er einmal neu würfeln.',
  },
  {
    key: 'inspiration',
    icon: '🌟',
    title: 'Inspiration für gutes Rollenspiel',
    body: 'Der Spielleiter vergibt Inspiration für besonders gutes Rollenspiel, lustige Ideen oder mutige Entscheidungen.\n\n- Inspiration kann für Vorteil bei einem Wurf eingetauscht werden.\n- Man kann sie auch einem Mitspieler schenken.',
  },
  {
    key: 'loot-split',
    icon: '💰',
    title: 'Beute wird fair geteilt',
    body: 'Gefundenes Gold wird gleichmäßig unter allen aufgeteilt.\n\n- Magische Gegenstände bekommt, wer am meisten davon hat – im Zweifel entscheidet die Gruppe gemeinsam.',
  },
  {
    key: 'no-pvp',
    icon: '🤝',
    title: 'Kein Kampf gegeneinander',
    body: 'Die Charaktere greifen sich nicht gegenseitig an und bestehlen sich nicht.\n\n- Streit im Rollenspiel ist erlaubt, aber am Ende halten die Gefährten zusammen.',
  },
  {
    key: 'phones',
    icon: '📱',
    title: 'Handy nur für die App',
    body: 'Während des Spielabends nutzen wir das Handy nur für die Dungeon Lobby (Charakterbogen, Karte, Kompendium).\n\n- Pausen sind für alles andere da.',
  },
]
