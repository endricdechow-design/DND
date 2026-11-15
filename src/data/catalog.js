// =====================================================================
//  Vorschlagskatalog für die Bibliothek: Waffen, Rüstungen, Ausrüstung,
//  Tränke, magische Gegenstände und Effekte.
//  Grundlage: SRD 5.1 (CC-BY-4.0). Texte sind eigene, verkürzte
//  deutsche Zusammenfassungen. Entfernungen in Metern (1,5 m = 5 Fuß).
// =====================================================================
import { ARMORS } from './srd'

// ---------------------------------------------------------------------
// Waffen: [Name, Schaden, Schadensart, Eigenschaften, Kategorie]
// ---------------------------------------------------------------------
const WEAPONS = [
  // Einfache Nahkampfwaffen
  ['Knüppel', '1W4', 'Wucht', 'Leicht', 'Einfache Nahkampfwaffe'],
  ['Dolch', '1W4', 'Stich', 'Finesse, Leicht, Wurfwaffe (6/18 m)', 'Einfache Nahkampfwaffe'],
  ['Zweihandknüppel', '1W8', 'Wucht', 'Zweihändig', 'Einfache Nahkampfwaffe'],
  ['Handaxt', '1W6', 'Hieb', 'Leicht, Wurfwaffe (6/18 m)', 'Einfache Nahkampfwaffe'],
  ['Wurfspeer', '1W6', 'Stich', 'Wurfwaffe (9/36 m)', 'Einfache Nahkampfwaffe'],
  ['Leichter Hammer', '1W4', 'Wucht', 'Leicht, Wurfwaffe (6/18 m)', 'Einfache Nahkampfwaffe'],
  ['Streitkolben', '1W6', 'Wucht', '–', 'Einfache Nahkampfwaffe'],
  ['Kampfstab', '1W6', 'Wucht', 'Vielseitig (1W8)', 'Einfache Nahkampfwaffe'],
  ['Sichel', '1W4', 'Hieb', 'Leicht', 'Einfache Nahkampfwaffe'],
  ['Speer', '1W6', 'Stich', 'Wurfwaffe (6/18 m), Vielseitig (1W8)', 'Einfache Nahkampfwaffe'],
  // Einfache Fernkampfwaffen
  ['Leichte Armbrust', '1W8', 'Stich', 'Munition (24/96 m), Laden, Zweihändig', 'Einfache Fernkampfwaffe'],
  ['Wurfpfeil', '1W4', 'Stich', 'Finesse, Wurfwaffe (6/18 m)', 'Einfache Fernkampfwaffe'],
  ['Kurzbogen', '1W6', 'Stich', 'Munition (24/96 m), Zweihändig', 'Einfache Fernkampfwaffe'],
  ['Schleuder', '1W4', 'Wucht', 'Munition (9/36 m)', 'Einfache Fernkampfwaffe'],
  // Kriegswaffen Nahkampf
  ['Streitaxt', '1W8', 'Hieb', 'Vielseitig (1W10)', 'Kriegswaffe (Nahkampf)'],
  ['Flegel', '1W8', 'Wucht', '–', 'Kriegswaffe (Nahkampf)'],
  ['Glefe', '1W10', 'Hieb', 'Schwer, Reichweite (+1,5 m), Zweihändig', 'Kriegswaffe (Nahkampf)'],
  ['Zweihandaxt', '1W12', 'Hieb', 'Schwer, Zweihändig', 'Kriegswaffe (Nahkampf)'],
  ['Zweihandschwert', '2W6', 'Hieb', 'Schwer, Zweihändig', 'Kriegswaffe (Nahkampf)'],
  ['Hellebarde', '1W10', 'Hieb', 'Schwer, Reichweite (+1,5 m), Zweihändig', 'Kriegswaffe (Nahkampf)'],
  ['Lanze', '1W12', 'Stich', 'Reichweite (+1,5 m), Besonders (beritten)', 'Kriegswaffe (Nahkampf)'],
  ['Langschwert', '1W8', 'Hieb', 'Vielseitig (1W10)', 'Kriegswaffe (Nahkampf)'],
  ['Zweihandhammer', '2W6', 'Wucht', 'Schwer, Zweihändig', 'Kriegswaffe (Nahkampf)'],
  ['Morgenstern', '1W8', 'Stich', '–', 'Kriegswaffe (Nahkampf)'],
  ['Pike', '1W10', 'Stich', 'Schwer, Reichweite (+1,5 m), Zweihändig', 'Kriegswaffe (Nahkampf)'],
  ['Rapier', '1W8', 'Stich', 'Finesse', 'Kriegswaffe (Nahkampf)'],
  ['Krummsäbel', '1W6', 'Hieb', 'Finesse, Leicht', 'Kriegswaffe (Nahkampf)'],
  ['Kurzschwert', '1W6', 'Stich', 'Finesse, Leicht', 'Kriegswaffe (Nahkampf)'],
  ['Dreizack', '1W6', 'Stich', 'Wurfwaffe (6/18 m), Vielseitig (1W8)', 'Kriegswaffe (Nahkampf)'],
  ['Kriegspicke', '1W8', 'Stich', '–', 'Kriegswaffe (Nahkampf)'],
  ['Kriegshammer', '1W8', 'Wucht', 'Vielseitig (1W10)', 'Kriegswaffe (Nahkampf)'],
  ['Peitsche', '1W4', 'Hieb', 'Finesse, Reichweite (+1,5 m)', 'Kriegswaffe (Nahkampf)'],
  // Kriegswaffen Fernkampf
  ['Blasrohr', '1', 'Stich', 'Munition (7,5/30 m), Laden', 'Kriegswaffe (Fernkampf)'],
  ['Handarmbrust', '1W6', 'Stich', 'Munition (9/36 m), Leicht, Laden', 'Kriegswaffe (Fernkampf)'],
  ['Schwere Armbrust', '1W10', 'Stich', 'Munition (30/120 m), Schwer, Laden, Zweihändig', 'Kriegswaffe (Fernkampf)'],
  ['Langbogen', '1W8', 'Stich', 'Munition (45/180 m), Schwer, Zweihändig', 'Kriegswaffe (Fernkampf)'],
  ['Netz', '–', '–', 'Wurfwaffe (1,5/4,5 m) – fesselt das Ziel (STÄ-Wurf SG 10 zum Befreien)', 'Kriegswaffe (Fernkampf)'],
].map(([name, dice, damageType, properties, category]) => ({
  name,
  type: 'item',
  category: '⚔️ Waffe',
  rarity: 'common',
  stat: dice === '–' ? 'Besonders' : `${dice} ${damageType}`,
  description: `${category}\nSchaden: ${dice === '–' ? 'kein Schaden' : `${dice} ${damageType}`}\nEigenschaften: ${properties}`,
}))

// ---------------------------------------------------------------------
// Rüstungen (aus srd.js) + Schild
// ---------------------------------------------------------------------
const ARMOR_ITEMS = [
  ...ARMORS.filter((a) => a.key !== 'none').map((a) => {
    const name = a.name.replace(/ \(.*\)/, '')
    const kind = { light: 'Leichte Rüstung', medium: 'Mittelschwere Rüstung', heavy: 'Schwere Rüstung' }[a.type]
    const dex = a.dexMax === null ? ' + GES-Mod' : a.dexMax > 0 ? ` + GES-Mod (max. ${a.dexMax})` : ''
    return {
      name,
      type: 'item',
      category: '🛡️ Rüstung',
      rarity: 'common',
      stat: `RK ${a.base}${dex ? '+' : ''}`,
      description: `${kind}\nRüstungsklasse: ${a.base}${dex}`,
    }
  }),
  { name: 'Schild', type: 'item', category: '🛡️ Rüstung', rarity: 'common', stat: '+2 RK', description: 'Schild\nRüstungsklasse +2, solange du ihn in einer Hand trägst.' },
]

// ---------------------------------------------------------------------
// Abenteurerausrüstung
// ---------------------------------------------------------------------
const GEAR = [
  ['Seil (15 m)', 'Hanfseil, 15 m lang. Hält einiges aus.'],
  ['Fackel', 'Brennt 1 Stunde: 6 m helles Licht, weitere 6 m dämmriges Licht.'],
  ['Kapuzenlaterne', 'Brennt mit 1 Flasche Öl 6 Stunden: 9 m helles Licht, weitere 9 m dämmriges Licht.'],
  ['Öl (Flasche)', 'Brennstoff für Laternen – oder werfen und anzünden: 5 Feuerschaden.'],
  ['Rationen (1 Tag)', 'Haltbare Verpflegung für einen Tag.'],
  ['Wasserschlauch', 'Fasst etwa 2 Liter.'],
  ['Rucksack', 'Fasst etwa 15 kg Ausrüstung.'],
  ['Schlafsack', 'Für die Nacht unter freiem Himmel.'],
  ['Zunderkästchen', 'Feuerstein und Zunder – entzündet eine Fackel als Aktion.'],
  ['Brechstange', 'Vorteil auf Stärkewürfe, wenn die Hebelwirkung hilft.'],
  ['Enterhaken', 'Haken zum Werfen und Klettern (mit Seil).'],
  ['Heilerausrüstung', '10 Anwendungen: Stabilisiert eine Kreatur mit 0 TP ohne Heilkunde-Wurf.'],
  ['Weihwasser (Phiole)', 'Werfen: 2W6 gleißender Schaden gegen Unholde und Untote.'],
  ['Säure (Phiole)', 'Werfen: 2W6 Säureschaden.'],
  ['Alchemistenfeuer', 'Werfen: Ziel brennt, 1W4 Feuerschaden zu Beginn jedes Zuges (löschen mit GES-Wurf SG 10).'],
  ['Gegengift (Phiole)', 'Eine Stunde lang Vorteil bei Rettungswürfen gegen Gift.'],
  ['Krähenfüße (Beutel)', 'Bedeckt 1,5 × 1,5 m: Wer hineintritt, nimmt 1 Stichschaden und wird langsamer.'],
  ['Kugellager (Beutel)', 'Bedeckt 3 × 3 m: GES-Rettungswurf SG 10, sonst liegend.'],
  ['Jagdfalle', 'Schnappt zu: 1W4 Stichschaden, Ziel ist festgehalten (STÄ-Wurf SG 13).'],
  ['Diebeswerkzeug', 'Dietriche und Feilen zum Öffnen von Schlössern und Entschärfen von Fallen.'],
  ['Spiegel (Stahl)', 'Kleiner Handspiegel – praktisch, um um Ecken zu schauen.'],
  ['Fernrohr', 'Gegenstände erscheinen doppelt so groß.'],
  ['Kletterhaken (10)', 'Eiserne Haken für Felswände.'],
  ['Pfeile (20)', 'Munition für Bögen.'],
  ['Armbrustbolzen (20)', 'Munition für Armbrüste.'],
  ['Goldmünzen', 'Eine Handvoll Goldmünzen (GM).'],
].map(([name, description]) => ({ name, type: 'item', category: '🎒 Ausrüstung', rarity: 'common', stat: '', description }))

// ---------------------------------------------------------------------
// Tränke und magische Gegenstände: [Name, Seltenheit, Kurzwert, Beschreibung]
// ---------------------------------------------------------------------
const POTIONS = [
  ['Heiltrank', 'common', '2W4+2 TP', 'Heilt 2W4 + 2 Trefferpunkte.'],
  ['Großer Heiltrank', 'uncommon', '4W4+4 TP', 'Heilt 4W4 + 4 Trefferpunkte.'],
  ['Überlegener Heiltrank', 'rare', '8W4+8 TP', 'Heilt 8W4 + 8 Trefferpunkte.'],
  ['Höchster Heiltrank', 'very_rare', '10W4+20 TP', 'Heilt 10W4 + 20 Trefferpunkte.'],
  ['Trank der Hügelriesenstärke', 'uncommon', 'STÄ 21', 'Deine Stärke beträgt 1 Stunde lang 21.'],
  ['Trank des Wasseratmens', 'uncommon', '1 Std.', 'Du kannst 1 Stunde lang unter Wasser atmen.'],
  ['Trank des Widerstands', 'uncommon', '1 Std.', 'Eine Stunde lang Resistenz gegen eine bestimmte Schadensart.'],
  ['Trank des Kletterns', 'common', '1 Std.', 'Eine Stunde lang Klettergeschwindigkeit und Vorteil auf Klettern.'],
  ['Trank der Unsichtbarkeit', 'very_rare', '1 Std.', 'Du wirst 1 Stunde lang unsichtbar (endet bei Angriff oder Zauber).'],
  ['Trank des Fliegens', 'very_rare', '18 m Flug', 'Eine Stunde lang Fluggeschwindigkeit von 18 m.'],
  ['Trank der Eile', 'very_rare', 'Hast', 'Eine Minute lang die Wirkung des Zaubers Hast (ohne Konzentration).'],
].map(([name, rarity, stat, description]) => ({ name, type: 'item', category: '🧪 Trank', rarity, stat, description }))

const MAGIC_ITEMS = [
  ['Waffe +1', 'uncommon', '+1', 'Magische Waffe: +1 auf Angriffs- und Schadenswürfe.'],
  ['Waffe +2', 'rare', '+2', 'Magische Waffe: +2 auf Angriffs- und Schadenswürfe.'],
  ['Waffe +3', 'very_rare', '+3', 'Magische Waffe: +3 auf Angriffs- und Schadenswürfe.'],
  ['Rüstung +1', 'rare', '+1 RK', 'Magische Rüstung: +1 auf die Rüstungsklasse.'],
  ['Schild +1', 'uncommon', '+1 RK', 'Magischer Schild: zusätzlich +1 auf die Rüstungsklasse.'],
  ['Flammenzunge', 'rare', '+2W6 Feuer', 'Schwert (Einstimmung): Auf Befehl lodert die Klinge – +2W6 Feuerschaden und Licht.'],
  ['Frostbrand', 'very_rare', '+1W6 Kälte', 'Schwert (Einstimmung): +1W6 Kälteschaden, Resistenz gegen Feuer, löscht Flammen.'],
  ['Umhang des Schutzes', 'uncommon', '+1 RK/RW', 'Einstimmung: +1 auf Rüstungsklasse und Rettungswürfe.'],
  ['Ring des Schutzes', 'rare', '+1 RK/RW', 'Einstimmung: +1 auf Rüstungsklasse und Rettungswürfe.'],
  ['Stiefel der Elfen', 'uncommon', 'lautlos', 'Deine Schritte machen kein Geräusch – Vorteil auf Heimlichkeit beim Schleichen.'],
  ['Umhang der Elfen', 'uncommon', 'Heimlichkeit', 'Einstimmung: Vorteil auf Heimlichkeit, andere haben Nachteil, dich zu entdecken.'],
  ['Nimmervoller Beutel', 'uncommon', '250 kg', 'Innen viel größer als außen: fasst bis zu 250 kg, wiegt immer 7,5 kg.'],
  ['Seil des Kletterns', 'uncommon', '18 m', 'Magisches Seil, das sich auf Befehl bewegt, verknotet und befestigt.'],
  ['Brille der Nacht', 'uncommon', 'Dunkelsicht', 'Dunkelsicht bis 18 m (oder +18 m, wenn du schon Dunkelsicht hast).'],
  ['Handschuhe der Ogerkraft', 'uncommon', 'STÄ 19', 'Einstimmung: Deine Stärke beträgt 19.'],
  ['Stirnband des Intellekts', 'uncommon', 'INT 19', 'Einstimmung: Deine Intelligenz beträgt 19.'],
  ['Amulett der Gesundheit', 'rare', 'KON 19', 'Einstimmung: Deine Konstitution beträgt 19.'],
  ['Zauberstab der Geschosse', 'uncommon', '7 Ladungen', 'Wirkt Magisches Geschoss; erhält täglich 1W6+1 Ladungen zurück.'],
  ['Sendsteine', 'uncommon', 'Paar', 'Zwei Steine: Wer einen hält, kann dem Träger des anderen 1× pro Tag eine Nachricht senden.'],
  ['Immerbrennende Fackel', 'common', 'Licht', 'Brennt ewig, ohne Hitze und ohne Rauch.'],
  ['Zauberschriftrolle', 'common', 'Zauber', 'Enthält einen Zauber, den man einmal vorlesen kann (Grad nach Absprache).'],
].map(([name, rarity, stat, description]) => ({ name, type: 'item', category: '✨ Magischer Gegenstand', rarity, stat, description }))

// ---------------------------------------------------------------------
// Effekte (für die Art "Effekt"): [Name, Dauer, Kurzwert, Beschreibung]
// ---------------------------------------------------------------------
const EFFECTS = [
  ['Segen', '1 Minute (Konzentration)', '+1W4', '+1W4 auf Angriffswürfe und Rettungswürfe.'],
  ['Unheil', '1 Minute (Konzentration)', '−1W4', '−1W4 auf Angriffswürfe und Rettungswürfe.'],
  ['Hast', '1 Minute (Konzentration)', '+2 RK', '+2 RK, doppelte Bewegung, Vorteil auf GES-Rettungswürfe, eine zusätzliche Aktion. Danach eine Runde erschöpft.'],
  ['Verlangsamen', '1 Minute (Konzentration)', '−2 RK', '−2 RK und auf GES-Rettungswürfe, halbe Bewegung, keine Reaktionen, nur Aktion oder Bonusaktion.'],
  ['Schild des Glaubens', '10 Minuten (Konzentration)', '+2 RK', '+2 auf die Rüstungsklasse.'],
  ['Magierrüstung', '8 Stunden', 'RK 13+GES', 'Ohne Rüstung beträgt deine RK 13 + GES-Modifikator.'],
  ['Hilfe', '8 Stunden', '+5 max. TP', 'Maximale und aktuelle Trefferpunkte steigen um 5.'],
  ['Heldenmut', '1 Minute (Konzentration)', 'furchtlos', 'Immun gegen Verängstigung; zu Beginn jedes Zuges temporäre TP in Höhe des Zaubermodifikators.'],
  ['Unsichtbarkeit', '1 Stunde (Konzentration)', 'unsichtbar', 'Unsichtbar, bis du angreifst oder zauberst.'],
  ['Fliegen', '10 Minuten (Konzentration)', '18 m Flug', 'Fluggeschwindigkeit von 18 m.'],
  ['Dunkelsicht', '8 Stunden', '18 m', 'Du siehst im Dunkeln bis 18 m weit.'],
  ['Schutz vor Gift', '1 Stunde', 'Giftschutz', 'Vorteil gegen Vergiftung, Resistenz gegen Giftschaden.'],
  ['Schutz vor Gut und Böse', '10 Minuten (Konzentration)', 'Schutz', 'Bestimmte Kreaturen (Unholde, Untote …) haben Nachteil bei Angriffen gegen dich.'],
  ['Vergrößern', '1 Minute (Konzentration)', '+1W4 Schaden', 'Doppelte Größe, Vorteil auf STÄ-Würfe, Waffen machen +1W4 Schaden.'],
  ['Verkleinern', '1 Minute (Konzentration)', '−1W4 Schaden', 'Halbe Größe, Nachteil auf STÄ-Würfe, Waffen machen −1W4 Schaden.'],
  ['Inspiration', 'bis eingesetzt', 'Vorteil', 'Einmal Vorteil auf einen Angriffs-, Rettungs- oder Attributswurf deiner Wahl.'],
  ['Bardische Inspiration', '10 Minuten', '+W6', 'Einmal einen Bonuswürfel zu einem Wurf addieren.'],
  ['Fluch', 'bis aufgehoben', 'verflucht', 'Der Spielleiter bestimmt die Wirkung – z. B. Nachteil auf bestimmte Würfe.'],
  ['Krankheit', 'bis geheilt', 'krank', 'Der Spielleiter bestimmt die Wirkung – z. B. Erschöpfung oder Nachteil.'],
].map(([name, duration, stat, description]) => ({ name, type: 'effect', category: '🌟 Effekt', duration, stat, description }))

// ---------------------------------------------------------------------
// Gewichte in kg (SRD-Pfund ÷ 2, gerundet)
// ---------------------------------------------------------------------
const WEIGHTS = {
  // Waffen
  'Knüppel': 1, 'Dolch': 0.5, 'Zweihandknüppel': 5, 'Handaxt': 1, 'Wurfspeer': 1, 'Leichter Hammer': 1,
  'Streitkolben': 2, 'Kampfstab': 2, 'Sichel': 1, 'Speer': 1.5, 'Leichte Armbrust': 2.5, 'Wurfpfeil': 0.1,
  'Kurzbogen': 1, 'Schleuder': 0, 'Streitaxt': 2, 'Flegel': 1, 'Glefe': 3, 'Zweihandaxt': 3.5,
  'Zweihandschwert': 3, 'Hellebarde': 3, 'Lanze': 3, 'Langschwert': 1.5, 'Zweihandhammer': 5, 'Morgenstern': 2,
  'Pike': 9, 'Rapier': 1, 'Krummsäbel': 1.5, 'Kurzschwert': 1, 'Dreizack': 2, 'Kriegspicke': 1,
  'Kriegshammer': 1, 'Peitsche': 1.5, 'Blasrohr': 0.5, 'Handarmbrust': 1.5, 'Schwere Armbrust': 9,
  'Langbogen': 1, 'Netz': 1.5,
  // Rüstungen
  'Gepolsterte Rüstung': 4, 'Lederrüstung': 5, 'Beschlagenes Leder': 6.5, 'Fellrüstung': 6, 'Kettenhemd': 10,
  'Schuppenpanzer': 22.5, 'Brustplatte': 10, 'Halbplatte': 20, 'Ringpanzer': 20, 'Kettenpanzer': 27.5,
  'Schienenpanzer': 30, 'Plattenpanzer': 32.5, 'Schild': 3,
  // Ausrüstung
  'Seil (15 m)': 5, 'Fackel': 0.5, 'Kapuzenlaterne': 1, 'Öl (Flasche)': 0.5, 'Rationen (1 Tag)': 1,
  'Wasserschlauch': 2.5, 'Rucksack': 2.5, 'Schlafsack': 3.5, 'Zunderkästchen': 0.5, 'Brechstange': 2.5,
  'Enterhaken': 2, 'Heilerausrüstung': 1.5, 'Weihwasser (Phiole)': 0.5, 'Säure (Phiole)': 0.5,
  'Alchemistenfeuer': 0.5, 'Gegengift (Phiole)': 0, 'Krähenfüße (Beutel)': 1, 'Kugellager (Beutel)': 1,
  'Jagdfalle': 12.5, 'Diebeswerkzeug': 0.5, 'Spiegel (Stahl)': 0.25, 'Fernrohr': 0.5, 'Kletterhaken (10)': 1.25,
  'Pfeile (20)': 0.5, 'Armbrustbolzen (20)': 0.75, 'Goldmünzen': 0,
  // Tränke und Magisches
  'Heiltrank': 0.25, 'Großer Heiltrank': 0.25, 'Überlegener Heiltrank': 0.25, 'Höchster Heiltrank': 0.25,
  'Trank der Hügelriesenstärke': 0.25, 'Trank des Wasseratmens': 0.25, 'Trank des Widerstands': 0.25,
  'Trank des Kletterns': 0.25, 'Trank der Unsichtbarkeit': 0.25, 'Trank des Fliegens': 0.25, 'Trank der Eile': 0.25,
  'Umhang des Schutzes': 0.5, 'Ring des Schutzes': 0, 'Stiefel der Elfen': 0.5, 'Umhang der Elfen': 0.5,
  'Nimmervoller Beutel': 7.5, 'Seil des Kletterns': 1.5, 'Brille der Nacht': 0, 'Handschuhe der Ogerkraft': 0.5,
  'Stirnband des Intellekts': 0, 'Amulett der Gesundheit': 0, 'Zauberstab der Geschosse': 0.5, 'Sendsteine': 0,
  'Immerbrennende Fackel': 0.5, 'Zauberschriftrolle': 0, 'Flammenzunge': 1.5, 'Frostbrand': 1.5,
}

export const CATALOG = [...WEAPONS, ...ARMOR_ITEMS, ...GEAR, ...POTIONS, ...MAGIC_ITEMS, ...EFFECTS].map((entry) =>
  entry.type === 'item' && WEIGHTS[entry.name] !== undefined ? { ...entry, weight: WEIGHTS[entry.name] } : entry
)

// Für die Suche: Groß-/Kleinschreibung und Umlaute egal
const normalize = (text) =>
  text.toLowerCase().replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')

/**
 * Passende Vorschläge zu einer Eingabe.
 * Treffer am Wortanfang zuerst, dann Treffer irgendwo im Namen, dann in der Kategorie.
 */
export function searchCatalog(type, query, limit = 8) {
  const q = normalize(query.trim())
  if (!q || (type !== 'item' && type !== 'effect')) return []
  const scored = []
  for (const entry of CATALOG) {
    if (entry.type !== type) continue
    const name = normalize(entry.name)
    let score = -1
    if (name.startsWith(q)) score = 0
    else if (name.split(/[\s-]+/).some((word) => word.startsWith(q))) score = 1
    // Bei nur einem Buchstaben nur Wortanfänge – sonst wird die Liste zu lang
    else if (q.length >= 2 && name.includes(q)) score = 2
    else if (q.length >= 3 && normalize(entry.category).includes(q)) score = 3
    if (score >= 0) scored.push({ entry, score })
  }
  return scored
    .sort((a, b) => a.score - b.score || a.entry.name.localeCompare(b.entry.name, 'de'))
    .slice(0, limit)
    .map((s) => s.entry)
}
