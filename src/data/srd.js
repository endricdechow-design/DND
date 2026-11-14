// =====================================================================
//  Regeldaten für Charaktere
//  Grundlage: System Reference Document 5.1 (SRD 5.1) von Wizards of the Coast,
//  lizenziert unter CC-BY-4.0: https://creativecommons.org/licenses/by/4.0/
//  Die Beschreibungen sind eigene, verkürzte deutsche Zusammenfassungen.
// =====================================================================

export const ABILITIES = [
  { key: 'str', short: 'STÄ', name: 'Stärke' },
  { key: 'dex', short: 'GES', name: 'Geschicklichkeit' },
  { key: 'con', short: 'KON', name: 'Konstitution' },
  { key: 'int', short: 'INT', name: 'Intelligenz' },
  { key: 'wis', short: 'WEI', name: 'Weisheit' },
  { key: 'cha', short: 'CHA', name: 'Charisma' },
]

export const SKILLS = [
  { key: 'acrobatics', name: 'Akrobatik', ability: 'dex' },
  { key: 'animal_handling', name: 'Mit Tieren umgehen', ability: 'wis' },
  { key: 'arcana', name: 'Arkane Kunde', ability: 'int' },
  { key: 'athletics', name: 'Athletik', ability: 'str' },
  { key: 'deception', name: 'Täuschen', ability: 'cha' },
  { key: 'history', name: 'Geschichte', ability: 'int' },
  { key: 'insight', name: 'Motiv erkennen', ability: 'wis' },
  { key: 'intimidation', name: 'Einschüchtern', ability: 'cha' },
  { key: 'investigation', name: 'Nachforschungen', ability: 'int' },
  { key: 'medicine', name: 'Heilkunde', ability: 'wis' },
  { key: 'nature', name: 'Naturkunde', ability: 'int' },
  { key: 'perception', name: 'Wahrnehmung', ability: 'wis' },
  { key: 'performance', name: 'Auftreten', ability: 'cha' },
  { key: 'persuasion', name: 'Überzeugen', ability: 'cha' },
  { key: 'religion', name: 'Religion', ability: 'int' },
  { key: 'sleight_of_hand', name: 'Fingerfertigkeit', ability: 'dex' },
  { key: 'stealth', name: 'Heimlichkeit', ability: 'dex' },
  { key: 'survival', name: 'Überlebenskunst', ability: 'wis' },
]

const ALL_SKILLS = SKILLS.map((s) => s.key)

// ---------------------------------------------------------------------
// Völker
//  bonuses: feste Attributsboni
//  choose:  zusätzliche frei wählbare Boni / Fertigkeiten
//  speed:   Bewegungsrate in Metern
// ---------------------------------------------------------------------
export const RACES = [
  {
    key: 'human',
    name: 'Mensch',
    icon: '🧑',
    blurb: 'Vielseitig und ehrgeizig – gut in allem.',
    bonuses: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
    speed: 9,
    traits: [['Vielseitig', '+1 auf alle sechs Attribute.'], ['Sprachen', 'Gemeinsprache und eine weitere Sprache deiner Wahl.']],
  },
  {
    key: 'dwarf',
    name: 'Zwerg (Hügelzwerg)',
    icon: '🧔',
    blurb: 'Zäh, stur und unglaublich widerstandsfähig.',
    bonuses: { con: 2, wis: 1 },
    speed: 7.5,
    hpPerLevel: 1,
    traits: [
      ['Dunkelsicht', 'Du siehst im Dunkeln bis 18 m weit (nur Graustufen).'],
      ['Zwergische Widerstandskraft', 'Vorteil bei Rettungswürfen gegen Gift, Resistenz gegen Giftschaden.'],
      ['Zwergische Zähigkeit', '+1 Trefferpunkt pro Stufe (schon eingerechnet).'],
      ['Schwere Rüstung', 'Schwere Rüstung verlangsamt dich nicht.'],
    ],
  },
  {
    key: 'elf',
    name: 'Elf (Hochelf)',
    icon: '🧝',
    blurb: 'Anmutig, scharfsinnig und magiebegabt.',
    bonuses: { dex: 2, int: 1 },
    speed: 9,
    skills: ['perception'],
    traits: [
      ['Dunkelsicht', 'Du siehst im Dunkeln bis 18 m weit.'],
      ['Scharfe Sinne', 'Geübt in Wahrnehmung (schon eingerechnet).'],
      ['Feenblut', 'Vorteil gegen Bezauberung; Magie kann dich nicht einschläfern.'],
      ['Trance', 'Statt 8 Stunden Schlaf reichen dir 4 Stunden Meditation.'],
      ['Zaubertrick', 'Du kennst einen Zaubertrick aus der Magier-Liste (Intelligenz).'],
    ],
  },
  {
    key: 'halfling',
    name: 'Halbling (Leichtfuß)',
    icon: '🧒',
    blurb: 'Klein, mutig und erstaunlich vom Glück verfolgt.',
    bonuses: { dex: 2, cha: 1 },
    speed: 7.5,
    traits: [
      ['Glückspilz', 'Würfelst du eine 1 mit dem W20, darfst du neu würfeln.'],
      ['Tapfer', 'Vorteil bei Rettungswürfen gegen Furcht.'],
      ['Halblingsgewandtheit', 'Du kannst dich durch den Platz größerer Kreaturen bewegen.'],
      ['Unauffällig', 'Du kannst dich hinter größeren Kreaturen verstecken.'],
    ],
  },
  {
    key: 'dragonborn',
    name: 'Drachenblütiger',
    icon: '🐲',
    blurb: 'Stolze Nachfahren der Drachen mit Odemwaffe.',
    bonuses: { str: 2, cha: 1 },
    speed: 9,
    chooseAncestry: true,
    traits: [
      ['Drachenabstammung', 'Deine Drachenart bestimmt Schadensart von Odemwaffe und Resistenz.'],
      ['Odemwaffe', 'Als Aktion stößt du Energie aus (1× pro kurzer oder langer Rast).'],
      ['Schadensresistenz', 'Resistenz gegen die Schadensart deiner Abstammung.'],
    ],
  },
  {
    key: 'gnome',
    name: 'Gnom (Felsengnom)',
    icon: '🧙',
    blurb: 'Neugierige Tüftler mit wachem Verstand.',
    bonuses: { int: 2, con: 1 },
    speed: 7.5,
    traits: [
      ['Dunkelsicht', 'Du siehst im Dunkeln bis 18 m weit.'],
      ['Gnomische Gerissenheit', 'Vorteil bei INT-, WEI- und CHA-Rettungswürfen gegen Magie.'],
      ['Tüftler', 'Du kannst kleine mechanische Spielereien bauen.'],
    ],
  },
  {
    key: 'half_elf',
    name: 'Halbelf',
    icon: '🧝‍♂️',
    blurb: 'Zwischen zwei Welten – charmant und anpassungsfähig.',
    bonuses: { cha: 2 },
    chooseAbilities: { count: 2, amount: 1, exclude: ['cha'] },
    chooseSkills: 2,
    speed: 9,
    traits: [
      ['Dunkelsicht', 'Du siehst im Dunkeln bis 18 m weit.'],
      ['Feenblut', 'Vorteil gegen Bezauberung; Magie kann dich nicht einschläfern.'],
      ['Vielseitig', 'Zwei zusätzliche Fertigkeiten deiner Wahl.'],
    ],
  },
  {
    key: 'half_orc',
    name: 'Halbork',
    icon: '👹',
    blurb: 'Stark, furchteinflößend und kaum kleinzukriegen.',
    bonuses: { str: 2, con: 1 },
    speed: 9,
    skills: ['intimidation'],
    traits: [
      ['Dunkelsicht', 'Du siehst im Dunkeln bis 18 m weit.'],
      ['Bedrohlich', 'Geübt in Einschüchtern (schon eingerechnet).'],
      ['Unerbittliche Ausdauer', 'Fällst du auf 0 TP, bleibst du stattdessen mit 1 TP stehen (1× pro langer Rast).'],
      ['Wilde Angriffe', 'Bei einem kritischen Nahkampftreffer würfelst du einen Schadenswürfel zusätzlich.'],
    ],
  },
  {
    key: 'tiefling',
    name: 'Tiefling',
    icon: '😈',
    blurb: 'Mit höllischem Erbe – misstrauisch beäugt, aber charismatisch.',
    bonuses: { cha: 2, int: 1 },
    speed: 9,
    traits: [
      ['Dunkelsicht', 'Du siehst im Dunkeln bis 18 m weit.'],
      ['Höllische Resistenz', 'Resistenz gegen Feuerschaden.'],
      ['Teuflisches Erbe', 'Du kennst den Zaubertrick Thaumaturgie; ab Stufe 3 und 5 kommen Zauber dazu.'],
    ],
  },
]

export const DRAGON_ANCESTRIES = [
  { key: 'black', name: 'Schwarz', damage: 'Säure', area: '1,5 × 9 m Linie', save: 'dex' },
  { key: 'blue', name: 'Blau', damage: 'Blitz', area: '1,5 × 9 m Linie', save: 'dex' },
  { key: 'brass', name: 'Messing', damage: 'Feuer', area: '1,5 × 9 m Linie', save: 'dex' },
  { key: 'bronze', name: 'Bronze', damage: 'Blitz', area: '1,5 × 9 m Linie', save: 'dex' },
  { key: 'copper', name: 'Kupfer', damage: 'Säure', area: '1,5 × 9 m Linie', save: 'dex' },
  { key: 'gold', name: 'Gold', damage: 'Feuer', area: '4,5 m Kegel', save: 'dex' },
  { key: 'green', name: 'Grün', damage: 'Gift', area: '4,5 m Kegel', save: 'con' },
  { key: 'red', name: 'Rot', damage: 'Feuer', area: '4,5 m Kegel', save: 'dex' },
  { key: 'silver', name: 'Silber', damage: 'Kälte', area: '4,5 m Kegel', save: 'con' },
  { key: 'white', name: 'Weiß', damage: 'Kälte', area: '4,5 m Kegel', save: 'con' },
]

// ---------------------------------------------------------------------
// Klassen
//  hitDie: Trefferwürfel, saves: geübte Rettungswürfe
//  skillChoices: Anzahl + Auswahlliste, primary: wichtigstes Attribut
//  unarmored: Attribut, das ohne Rüstung zur RK addiert wird
// ---------------------------------------------------------------------
export const CLASSES = [
  {
    key: 'barbarian', name: 'Barbar', icon: '🪓', hitDie: 12, saves: ['str', 'con'], primary: ['str'],
    blurb: 'Wilder Krieger, der im Kampfrausch kaum zu stoppen ist.',
    skillChoices: { count: 2, from: ['animal_handling', 'athletics', 'intimidation', 'nature', 'perception', 'survival'] },
    unarmored: 'con',
    features: [['Kampfrausch', '2× pro langer Rast: Bonusschaden und Resistenz gegen Waffenschaden.'], ['Ungerüstete Verteidigung', 'Ohne Rüstung: RK = 10 + GES + KON (schon eingerechnet).']],
  },
  {
    key: 'bard', name: 'Barde', icon: '🎻', hitDie: 8, saves: ['dex', 'cha'], primary: ['cha'],
    blurb: 'Musikalischer Zauberkundiger, der die Gruppe inspiriert.',
    skillChoices: { count: 3, from: ALL_SKILLS },
    spellcasting: 'cha',
    features: [['Zauberwirken', 'Du wirkst Bardenzauber mit Charisma.'], ['Bardische Inspiration', 'Gib Verbündeten einen Bonuswürfel (W6), CHA-Mod-mal pro langer Rast.']],
  },
  {
    key: 'cleric', name: 'Kleriker', icon: '✨', hitDie: 8, saves: ['wis', 'cha'], primary: ['wis'],
    blurb: 'Diener einer Gottheit – Heiler und Beschützer.',
    skillChoices: { count: 2, from: ['history', 'insight', 'medicine', 'persuasion', 'religion'] },
    spellcasting: 'wis',
    features: [['Zauberwirken', 'Du wirkst Klerikerzauber mit Weisheit.'], ['Göttliche Domäne', 'Im SRD: Domäne des Lebens – starke Heilzauber.']],
  },
  {
    key: 'druid', name: 'Druide', icon: '🌿', hitDie: 8, saves: ['int', 'wis'], primary: ['wis'],
    blurb: 'Hüter der Natur, der später Tiergestalt annimmt.',
    skillChoices: { count: 2, from: ['arcana', 'animal_handling', 'insight', 'medicine', 'nature', 'perception', 'religion', 'survival'] },
    spellcasting: 'wis',
    features: [['Druidisch', 'Du kennst die Geheimsprache der Druiden.'], ['Zauberwirken', 'Du wirkst Druidenzauber mit Weisheit.']],
  },
  {
    key: 'fighter', name: 'Kämpfer', icon: '⚔️', hitDie: 10, saves: ['str', 'con'], primary: ['str', 'dex'],
    blurb: 'Meister aller Waffen und Rüstungen – ideal für Einsteiger.',
    skillChoices: { count: 2, from: ['acrobatics', 'animal_handling', 'athletics', 'history', 'insight', 'intimidation', 'perception', 'survival'] },
    features: [['Kampfstil', 'Wähle eine Spezialisierung, z. B. Bogenschießen oder Verteidigung.'], ['Durchschnaufen', 'Bonusaktion: heile 1W10 + Stufe TP (1× pro kurzer Rast).']],
  },
  {
    key: 'monk', name: 'Mönch', icon: '🥋', hitDie: 8, saves: ['str', 'dex'], primary: ['dex', 'wis'],
    blurb: 'Flinker Kampfkünstler, der mit bloßen Händen kämpft.',
    skillChoices: { count: 2, from: ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth'] },
    unarmored: 'wis', unarmoredNoShield: true,
    features: [['Ungerüstete Verteidigung', 'Ohne Rüstung und Schild: RK = 10 + GES + WEI (schon eingerechnet).'], ['Kampfkunst', 'Waffenlose Schläge mit GES, zusätzlicher Schlag als Bonusaktion.']],
  },
  {
    key: 'paladin', name: 'Paladin', icon: '🛡️', hitDie: 10, saves: ['wis', 'cha'], primary: ['str', 'cha'],
    blurb: 'Heiliger Krieger, gebunden an einen Eid.',
    skillChoices: { count: 2, from: ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion'] },
    features: [['Göttliches Gespür', 'Spüre Untote, Unholde und Himmlische in der Nähe.'], ['Handauflegen', 'Heilpool von 5 × Stufe Trefferpunkten pro langer Rast.']],
  },
  {
    key: 'ranger', name: 'Waldläufer', icon: '🏹', hitDie: 10, saves: ['str', 'dex'], primary: ['dex', 'wis'],
    blurb: 'Fährtenleser und Jäger der Wildnis.',
    skillChoices: { count: 3, from: ['animal_handling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'] },
    features: [['Erzfeind', 'Vorteil beim Aufspüren einer gewählten Gegnerart.'], ['Erfahrener Entdecker', 'In deinem bevorzugten Gelände bist du kaum zu stoppen.']],
  },
  {
    key: 'rogue', name: 'Schurke', icon: '🗡️', hitDie: 8, saves: ['dex', 'int'], primary: ['dex'],
    blurb: 'Geschickter Schleicher mit gemeinem Hinterhalt.',
    skillChoices: { count: 4, from: ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'performance', 'persuasion', 'sleight_of_hand', 'stealth'] },
    features: [['Expertise', 'Doppelter Übungsbonus in zwei Fertigkeiten deiner Wahl.'], ['Hinterhältiger Angriff', '+1W6 Schaden, wenn du Vorteil hast oder ein Verbündeter neben dem Ziel steht.'], ['Diebessprache', 'Geheime Zeichen und Codewörter der Unterwelt.']],
  },
  {
    key: 'sorcerer', name: 'Zauberer', icon: '🔥', hitDie: 6, saves: ['con', 'cha'], primary: ['cha'],
    blurb: 'Die Magie liegt dir im Blut.',
    skillChoices: { count: 2, from: ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion'] },
    spellcasting: 'cha',
    features: [['Zauberwirken', 'Du wirkst Zaubererzauber mit Charisma.'], ['Zauberursprung', 'Im SRD: Drachenblutlinie – zähere Haut und Drachenmagie.']],
  },
  {
    key: 'warlock', name: 'Hexenmeister', icon: '👁️', hitDie: 8, saves: ['wis', 'cha'], primary: ['cha'],
    blurb: 'Hat einen Pakt mit einem mächtigen Wesen geschlossen.',
    skillChoices: { count: 2, from: ['arcana', 'deception', 'history', 'intimidation', 'investigation', 'nature', 'religion'] },
    spellcasting: 'cha',
    features: [['Schutzpatron', 'Im SRD: Der Unhold – ein Wesen aus den Niederen Ebenen.'], ['Paktmagie', 'Wenige, aber starke Zauber; Plätze kehren nach kurzer Rast zurück.']],
  },
  {
    key: 'wizard', name: 'Magier', icon: '📖', hitDie: 6, saves: ['int', 'wis'], primary: ['int'],
    blurb: 'Gelehrter der arkanen Künste mit dickem Zauberbuch.',
    skillChoices: { count: 2, from: ['arcana', 'history', 'insight', 'investigation', 'medicine', 'religion'] },
    spellcasting: 'int',
    features: [['Zauberwirken', 'Du wirkst Magierzauber mit Intelligenz aus deinem Zauberbuch.'], ['Arkane Erholung', 'Einmal am Tag nach einer kurzen Rast verbrauchte Zauberplätze zurückholen.']],
  },
]

// ---------------------------------------------------------------------
// Hintergründe – das SRD enthält nur den Akolythen; alles andere ist "eigener Hintergrund"
// ---------------------------------------------------------------------
export const BACKGROUNDS = [
  {
    key: 'acolyte',
    name: 'Akolyth',
    blurb: 'Du hast dein Leben im Dienst eines Tempels verbracht.',
    skills: ['insight', 'religion'],
    feature: ['Schutz der Gläubigen', 'Tempel deines Glaubens gewähren dir und deinen Gefährten Hilfe und Unterkunft.'],
  },
  {
    key: 'custom',
    name: 'Eigener Hintergrund',
    blurb: 'Denk dir deine Vorgeschichte selbst aus und wähle zwei passende Fertigkeiten.',
    chooseSkills: 2,
  },
]

export const ALIGNMENTS = [
  'Rechtschaffen gut', 'Neutral gut', 'Chaotisch gut',
  'Rechtschaffen neutral', 'Neutral', 'Chaotisch neutral',
  'Rechtschaffen böse', 'Neutral böse', 'Chaotisch böse',
]

// ---------------------------------------------------------------------
// Rüstungen: base = Grund-RK, dexMax = höchstens so viel GES zählt (null = unbegrenzt)
// ---------------------------------------------------------------------
export const ARMORS = [
  { key: 'none', name: 'Keine Rüstung', base: 10, dexMax: null, type: 'none' },
  { key: 'padded', name: 'Gepolsterte Rüstung (leicht)', base: 11, dexMax: null, type: 'light' },
  { key: 'leather', name: 'Lederrüstung (leicht)', base: 11, dexMax: null, type: 'light' },
  { key: 'studded', name: 'Beschlagenes Leder (leicht)', base: 12, dexMax: null, type: 'light' },
  { key: 'hide', name: 'Fellrüstung (mittel)', base: 12, dexMax: 2, type: 'medium' },
  { key: 'chain_shirt', name: 'Kettenhemd (mittel)', base: 13, dexMax: 2, type: 'medium' },
  { key: 'scale', name: 'Schuppenpanzer (mittel)', base: 14, dexMax: 2, type: 'medium' },
  { key: 'breastplate', name: 'Brustplatte (mittel)', base: 14, dexMax: 2, type: 'medium' },
  { key: 'half_plate', name: 'Halbplatte (mittel)', base: 15, dexMax: 2, type: 'medium' },
  { key: 'ring_mail', name: 'Ringpanzer (schwer)', base: 14, dexMax: 0, type: 'heavy' },
  { key: 'chain_mail', name: 'Kettenpanzer (schwer)', base: 16, dexMax: 0, type: 'heavy' },
  { key: 'splint', name: 'Schienenpanzer (schwer)', base: 17, dexMax: 0, type: 'heavy' },
  { key: 'plate', name: 'Plattenpanzer (schwer)', base: 18, dexMax: 0, type: 'heavy' },
]

// ---------------------------------------------------------------------
// Attributswerte festlegen
// ---------------------------------------------------------------------
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8]
export const POINT_BUY_BUDGET = 27
export const POINT_BUY_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 }

// Kleine Helfer zum Nachschlagen
export const byKey = (list, key) => list.find((item) => item.key === key)
export const skillName = (key) => byKey(SKILLS, key)?.name ?? key
export const abilityShort = (key) => byKey(ABILITIES, key)?.short ?? key
