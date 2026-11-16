// =====================================================================
//  Klassenfähigkeiten ab Stufe 2 und Attributserhöhungen
//  Grundlage: SRD 5.1 (CC-BY-4.0) inkl. der dort enthaltenen Unterklassen.
//  Die Texte sind eigene, verkürzte deutsche Zusammenfassungen.
//  Stufe-1-Fähigkeiten stehen in srd.js bei der jeweiligen Klasse.
// =====================================================================

// Stufen mit Attributserhöhung (+2 auf ein Attribut oder +1 auf zwei)
const ASI_DEFAULT = [4, 8, 12, 16, 19]
const ASI_EXTRA = { fighter: [6, 14], rogue: [10] }

export function asiLevels(classKey) {
  return [...ASI_DEFAULT, ...(ASI_EXTRA[classKey] ?? [])].sort((a, b) => a - b)
}

export const isAsiLevel = (classKey, level) => asiLevels(classKey).includes(level)

// Klassen, die auf (fast) jeder Stufe neue Zauber oder Zauberplätze bekommen
const CASTERS = { bard: 1, cleric: 1, druid: 1, sorcerer: 1, warlock: 1, wizard: 1, paladin: 2, ranger: 2 }
export const getsSpellsAt = (classKey, level) => CASTERS[classKey] !== undefined && level >= CASTERS[classKey]

export const CLASS_LEVELS = {
  barbarian: {
    2: [['Tollkühner Angriff', 'Vorteil auf STÄ-Nahkampfangriffe – dafür haben Angriffe gegen dich Vorteil.'], ['Gefahrensinn', 'Vorteil auf GES-Rettungswürfe gegen Effekte, die du sehen kannst.']],
    3: [['Pfad des Berserkers: Raserei', 'Im Kampfrausch ein zusätzlicher Nahkampfangriff als Bonusaktion; danach eine Stufe Erschöpfung.']],
    5: [['Zusatzangriff', 'Zwei Angriffe pro Angriffsaktion.'], ['Schnelle Bewegung', '+3 m Bewegung, solange du keine schwere Rüstung trägst.']],
    6: [['Hirnloser Zorn', 'Im Kampfrausch kannst du nicht bezaubert oder verängstigt werden.']],
    7: [['Wilder Instinkt', 'Vorteil auf Initiative; du handelst trotz Überraschung, wenn du in Kampfrausch gehst.']],
    9: [['Brutaler kritischer Treffer', 'Bei kritischen Nahkampftreffern 1 zusätzlicher Schadenswürfel.']],
    10: [['Einschüchternde Präsenz', 'Als Aktion eine Kreatur in der Nähe verängstigen.']],
    11: [['Unerbittlicher Zorn', 'Fällst du im Kampfrausch auf 0 TP, bleibst du mit KON-Rettungswurf (SG 10, steigt jedes Mal) auf 1 TP.']],
    13: [['Brutaler kritischer Treffer', 'Jetzt 2 zusätzliche Schadenswürfel.']],
    14: [['Vergeltung', 'Als Reaktion zurückschlagen, wenn dich eine Kreatur in der Nähe verletzt.']],
    15: [['Anhaltender Kampfrausch', 'Dein Kampfrausch endet nur, wenn du bewusstlos wirst oder ihn beendest.']],
    17: [['Brutaler kritischer Treffer', 'Jetzt 3 zusätzliche Schadenswürfel.']],
    18: [['Unbezwingbare Kraft', 'STÄ-Würfe sind mindestens so hoch wie dein Stärkewert.']],
    20: [['Urgewaltiger Champion', 'Stärke und Konstitution +4 (Maximum 24) – bitte mit dem Spielleiter eintragen.']],
  },
  bard: {
    2: [['Alleskönner', 'Halber Übungsbonus auf Attributswürfe ohne Übung.'], ['Lied der Erholung', 'Verbündete heilen bei einer kurzen Rast zusätzlich 1W6 TP.']],
    3: [['Schule des Wissens', 'Drei zusätzliche Fertigkeiten; „Schneidende Worte“: Inspiration gegen Gegner einsetzen.'], ['Expertise', 'Doppelter Übungsbonus in zwei Fertigkeiten.']],
    5: [['Bardische Inspiration W8', 'Dein Inspirationswürfel wird größer.'], ['Quell der Inspiration', 'Inspiration kehrt schon nach einer kurzen Rast zurück.']],
    6: [['Gegenlied', 'Verbündete in der Nähe haben Vorteil gegen Bezauberung und Verängstigung.'], ['Zusätzliche magische Geheimnisse', 'Zwei Zauber aus beliebigen Zauberlisten lernen.']],
    9: [['Lied der Erholung W8', 'Mehr Heilung bei kurzen Rasten.']],
    10: [['Bardische Inspiration W10', 'Dein Inspirationswürfel wird größer.'], ['Expertise', 'Zwei weitere Fertigkeiten mit doppeltem Übungsbonus.'], ['Magische Geheimnisse', 'Zwei Zauber aus beliebigen Zauberlisten lernen.']],
    13: [['Lied der Erholung W10', 'Mehr Heilung bei kurzen Rasten.']],
    14: [['Magische Geheimnisse', 'Zwei weitere Zauber aus beliebigen Listen.'], ['Unvergleichliches Können', 'Eigene Inspiration auf Attributswürfe nutzen.']],
    15: [['Bardische Inspiration W12', 'Dein Inspirationswürfel wird größer.']],
    17: [['Lied der Erholung W12', 'Mehr Heilung bei kurzen Rasten.']],
    18: [['Magische Geheimnisse', 'Zwei weitere Zauber aus beliebigen Listen.']],
    20: [['Überlegene Inspiration', 'Hast du keine Inspiration mehr, bekommst du bei Initiative eine zurück.']],
  },
  cleric: {
    2: [['Göttliche Macht fokussieren', '1× pro Rast: Untote vertreiben oder „Leben bewahren“ (5 × Stufe TP auf Verbündete verteilen).']],
    5: [['Untote zerstören (HG ½)', 'Vertriebene schwache Untote werden sofort zerstört.']],
    6: [['Göttliche Macht 2× pro Rast', 'Du kannst sie öfter nutzen.'], ['Gesegneter Heiler', 'Heilst du andere mit Zaubern, heilst du dich selbst mit.']],
    8: [['Untote zerstören (HG 1)', 'Stärkere Untote werden zerstört.'], ['Göttlicher Schlag', 'Einmal pro Zug +1W8 gleißender Schaden mit Waffen.']],
    10: [['Göttliches Eingreifen', 'Bitte deine Gottheit um Hilfe – Chance in % = deine Stufe.']],
    11: [['Untote zerstören (HG 2)', 'Stärkere Untote werden zerstört.']],
    14: [['Untote zerstören (HG 3)', 'Stärkere Untote werden zerstört.'], ['Göttlicher Schlag 2W8', 'Mehr gleißender Schaden.']],
    17: [['Untote zerstören (HG 4)', 'Stärkere Untote werden zerstört.'], ['Höchste Heilung', 'Heilwürfel zählen immer mit dem Höchstwert.']],
    18: [['Göttliche Macht 3× pro Rast', 'Du kannst sie noch öfter nutzen.']],
    20: [['Göttliches Eingreifen gelingt', 'Deine Gottheit hilft dir automatisch.']],
  },
  druid: {
    2: [['Tiergestalt', 'Verwandle dich in Tiere (bis HG ¼, kein Fliegen/Schwimmen), 2× pro kurzer Rast.'], ['Zirkel des Landes', 'Ein zusätzlicher Zaubertrick; „Natürliche Erholung“: Zauberplätze bei kurzer Rast zurück.']],
    3: [['Zirkelzauber', 'Zusätzliche, immer vorbereitete Zauber passend zu deinem Gelände.']],
    4: [['Bessere Tiergestalt', 'Tiere bis HG ½, jetzt auch schwimmend.']],
    6: [['Schritt des Landes', 'Nichtmagisches schwieriges Gelände bremst dich nicht.']],
    8: [['Bessere Tiergestalt', 'Tiere bis HG 1, jetzt auch fliegend.']],
    10: [['Schutz der Natur', 'Immun gegen Gift und Krankheit; Elementare und Feenwesen können dich nicht bezaubern oder verängstigen.']],
    14: [['Zuflucht der Natur', 'Tiere und Pflanzen zögern, dich anzugreifen.']],
    18: [['Zeitloser Körper', 'Du alterst nur noch sehr langsam.'], ['Tierzauber', 'Du kannst in Tiergestalt zaubern.']],
    20: [['Erzdruide', 'Unbegrenzt oft Tiergestalt annehmen.']],
  },
  fighter: {
    2: [['Tatendrang', 'Einmal pro Rast eine zusätzliche Aktion in deinem Zug.']],
    3: [['Champion: Verbesserter kritischer Treffer', 'Deine Waffenangriffe sind schon bei 19–20 kritisch.']],
    5: [['Zusatzangriff', 'Zwei Angriffe pro Angriffsaktion.']],
    7: [['Bemerkenswerter Athlet', 'Halber Übungsbonus auf STÄ-, GES- und KON-Würfe ohne Übung; weiter springen.']],
    9: [['Unbeugsam', 'Einen misslungenen Rettungswurf wiederholen (1× pro langer Rast).']],
    10: [['Zusätzlicher Kampfstil', 'Wähle einen zweiten Kampfstil.']],
    11: [['Zusatzangriff (3)', 'Drei Angriffe pro Angriffsaktion.']],
    13: [['Unbeugsam (2×)', 'Zwei Wiederholungen pro langer Rast.']],
    15: [['Überlegener kritischer Treffer', 'Kritisch schon bei 18–20.']],
    17: [['Tatendrang (2×)', 'Zwei zusätzliche Aktionen pro Rast.'], ['Unbeugsam (3×)', 'Drei Wiederholungen pro langer Rast.']],
    18: [['Überlebender', 'Unter halben TP heilst du jede Runde 5 + KON-Mod TP.']],
    20: [['Zusatzangriff (4)', 'Vier Angriffe pro Angriffsaktion.']],
  },
  monk: {
    2: [['Ki', 'Ki-Punkte (= Stufe) für Schlaghagel, Geduldige Verteidigung und Schritt des Windes.'], ['Ungerüstete Bewegung', '+3 m Bewegung ohne Rüstung und Schild.']],
    3: [['Weg der offenen Hand', 'Schlaghagel kann Gegner umwerfen, wegstoßen oder ihre Reaktion verhindern.'], ['Geschosse abwehren', 'Fernkampfschaden per Reaktion verringern.']],
    4: [['Langsamer Fall', 'Fallschaden per Reaktion verringern.']],
    5: [['Zusatzangriff', 'Zwei Angriffe pro Angriffsaktion.'], ['Betäubender Schlag', 'Ki ausgeben, um ein getroffenes Ziel zu betäuben.']],
    6: [['Ki-verstärkte Schläge', 'Waffenlose Schläge gelten als magisch.'], ['Ganzheit des Körpers', 'Heile dich um 3 × Stufe TP (1× pro langer Rast).']],
    7: [['Entrinnen', 'Kein Schaden bei gelungenem GES-Rettungswurf gegen Flächeneffekte.'], ['Geistige Ruhe', 'Bezauberung oder Verängstigung auf dir beenden.']],
    9: [['Verbesserte Bewegung', 'Über senkrechte Wände und Wasser laufen.']],
    10: [['Reinheit des Körpers', 'Immun gegen Krankheit und Gift.']],
    11: [['Innere Ruhe', 'Nach einer langen Rast wirkt „Heiligtum“ auf dich.']],
    13: [['Zunge von Sonne und Mond', 'Du verstehst alle Sprachen und wirst von allen verstanden.']],
    14: [['Diamantseele', 'Geübt in allen Rettungswürfen; Ki für Wiederholungen.']],
    15: [['Zeitloser Körper', 'Du brauchst kaum Essen und Wasser und alterst langsam.']],
    17: [['Bebende Handfläche', 'Tödliche Vibrationen in ein Ziel schicken.']],
    18: [['Leerer Körper', 'Mit Ki unsichtbar werden.']],
    20: [['Vollkommenes Selbst', 'Bei Initiative ohne Ki bekommst du 4 Ki zurück.']],
  },
  paladin: {
    2: [['Kampfstil', 'Wähle eine Kampfspezialisierung.'], ['Zauberwirken', 'Du wirkst Paladinzauber mit Charisma.'], ['Göttliches Niederstrecken', 'Zauberplatz ausgeben: +2W8 gleißender Schaden bei einem Treffer.']],
    3: [['Göttliche Gesundheit', 'Immun gegen Krankheiten.'], ['Eid der Hingabe', '„Heilige Waffe“ und „Unheilige vertreiben“ über Göttliche Macht.']],
    5: [['Zusatzangriff', 'Zwei Angriffe pro Angriffsaktion.']],
    6: [['Aura des Schutzes', 'Du und Verbündete in 3 m addieren deinen CHA-Mod zu Rettungswürfen.']],
    7: [['Aura der Hingabe', 'Verbündete in 3 m können nicht bezaubert werden.']],
    10: [['Aura des Mutes', 'Verbündete in 3 m können nicht verängstigt werden.']],
    11: [['Verbessertes Niederstrecken', 'Jeder Nahkampftreffer macht +1W8 gleißenden Schaden.']],
    14: [['Reinigende Berührung', 'Zauber auf dir oder Verbündeten beenden.']],
    15: [['Reinheit des Geistes', 'Dauerhafter Schutz vor Gut und Böse.']],
    18: [['Größere Auren', 'Deine Auren reichen 9 m weit.']],
    20: [['Heiliger Nimbus', 'Strahlende Aura, die Feinden Schaden zufügt.']],
  },
  ranger: {
    2: [['Kampfstil', 'Wähle eine Kampfspezialisierung.'], ['Zauberwirken', 'Du wirkst Waldläuferzauber mit Weisheit.']],
    3: [['Jäger: Beute des Jägers', 'z. B. Kolosstöter (+1W8 gegen Verletzte) oder Riesentöter.'], ['Urtümliches Bewusstsein', 'Bestimmte Kreaturarten in der Umgebung spüren.']],
    5: [['Zusatzangriff', 'Zwei Angriffe pro Angriffsaktion.']],
    6: [['Erweiterte Kenntnisse', 'Ein weiterer Erzfeind und ein weiteres bevorzugtes Gelände.']],
    7: [['Defensive Taktik', 'z. B. Vorteil gegen Verängstigung oder Schutz vor Mehrfachangriffen.']],
    8: [['Schritt des Landes', 'Nichtmagisches schwieriges Gelände bremst dich nicht.']],
    10: [['Tarnung in der Natur', '+10 auf Heimlichkeit, wenn du dich gut tarnst.']],
    11: [['Mehrfachangriff', 'Salve (viele Fernkampfziele) oder Wirbelangriff (alle Nahkampfziele).']],
    14: [['Verschwinden', 'Verstecken als Bonusaktion; nicht durch Magie aufspürbar.']],
    15: [['Überlegene Verteidigung', 'z. B. Entrinnen oder Ausweichen per Reaktion.']],
    18: [['Wilde Sinne', 'Unsichtbare Kreaturen in 9 m wahrnehmen.']],
    20: [['Feindvernichter', 'Einmal pro Zug +WEI-Mod auf Angriff oder Schaden gegen Erzfeinde.']],
  },
  rogue: {
    2: [['Raffinierte Aktion', 'Spurt, Rückzug oder Verstecken als Bonusaktion.']],
    3: [['Dieb: Schnelle Hände', 'Gegenstände benutzen oder stehlen als Bonusaktion.'], ['Fassadenkletterer', 'Schneller klettern und weiter springen.']],
    5: [['Unglaubliches Ausweichen', 'Schaden eines Angriffs per Reaktion halbieren.']],
    6: [['Expertise', 'Zwei weitere Fertigkeiten mit doppeltem Übungsbonus.']],
    7: [['Entrinnen', 'Kein Schaden bei gelungenem GES-Rettungswurf gegen Flächeneffekte.']],
    9: [['Überlegene Heimlichkeit', 'Vorteil auf Heimlichkeit, wenn du dich langsam bewegst.']],
    11: [['Verlässliches Talent', 'Würfe in geübten Fertigkeiten zählen mindestens als 10.']],
    13: [['Magische Gegenstände benutzen', 'Du ignorierst Klassen- und Volksvorgaben magischer Gegenstände.']],
    14: [['Blindgespür', 'Versteckte und unsichtbare Kreaturen in 3 m spüren.']],
    15: [['Schlüpfriger Geist', 'Geübt in WEI-Rettungswürfen.']],
    17: [['Diebesreflexe', 'Zwei Züge in der ersten Kampfrunde.']],
    18: [['Schwer zu fassen', 'Angriffe gegen dich haben nie Vorteil.']],
    20: [['Glückstreffer', 'Einen verfehlten Angriff in einen Treffer verwandeln (1× pro Rast).']],
  },
  sorcerer: {
    2: [['Quelle der Magie', 'Zaubereipunkte (= Stufe) in Zauberplätze umwandeln und umgekehrt.']],
    3: [['Metamagie', 'Zwei Möglichkeiten, Zauber zu verändern (z. B. verlängern oder verdoppeln).']],
    6: [['Elementare Affinität', '+CHA-Mod Schaden bei Zaubern deines Drachenelements.']],
    10: [['Metamagie', 'Eine weitere Metamagie-Option.']],
    14: [['Drachenschwingen', 'Flügel ausbreiten und fliegen.']],
    17: [['Metamagie', 'Eine weitere Metamagie-Option.']],
    18: [['Drachenpräsenz', 'Eine Aura der Ehrfurcht oder Angst ausstrahlen.']],
    20: [['Zaubereiwiederherstellung', '4 Zaubereipunkte bei jeder kurzen Rast zurück.']],
  },
  warlock: {
    2: [['Schauerliche Anrufungen', 'Zwei magische Zusatzfähigkeiten; später kommen weitere dazu.']],
    3: [['Paktgabe', 'Wähle Paktklinge, Paktkette (Vertrauter) oder Paktfoliant.']],
    6: [['Glück des Dunklen', '1W10 auf einen Attributs- oder Rettungswurf addieren (1× pro Rast).']],
    10: [['Unholdische Widerstandskraft', 'Resistenz gegen eine Schadensart deiner Wahl.']],
    11: [['Mystisches Arkanum (6. Grad)', 'Ein Zauber des 6. Grades 1× pro langer Rast.']],
    13: [['Mystisches Arkanum (7. Grad)', 'Ein Zauber des 7. Grades 1× pro langer Rast.']],
    14: [['Durch die Hölle schleudern', 'Ein getroffenes Ziel kurz in die Niederen Ebenen schicken.']],
    15: [['Mystisches Arkanum (8. Grad)', 'Ein Zauber des 8. Grades 1× pro langer Rast.']],
    17: [['Mystisches Arkanum (9. Grad)', 'Ein Zauber des 9. Grades 1× pro langer Rast.']],
    20: [['Unheimlicher Meister', 'Paktmagie-Plätze durch eine Minute Bitten zurückholen.']],
  },
  wizard: {
    2: [['Schule der Hervorrufung', 'Hervorrufungszauber günstiger kopieren; „Zauber formen“: Verbündete verschonen.']],
    6: [['Mächtiger Zaubertrick', 'Halber Zaubertrick-Schaden auch bei gelungenem Rettungswurf.']],
    10: [['Verstärkte Hervorrufung', '+INT-Mod auf den Schaden von Hervorrufungszaubern.']],
    14: [['Überladen', 'Zauber mit maximalem Schaden wirken (riskant bei Wiederholung).']],
    18: [['Zaubermeisterschaft', 'Je ein Zauber des 1. und 2. Grades beliebig oft.']],
    20: [['Signaturzauber', 'Zwei Zauber des 3. Grades je 1× pro kurzer Rast gratis.']],
  },
}

/** Fähigkeiten, die genau auf dieser Stufe dazukommen */
export const featuresAtLevel = (classKey, level) => CLASS_LEVELS[classKey]?.[level] ?? []

/** Alle Fähigkeiten von Stufe 2 bis zur aktuellen Stufe (mit Stufenangabe) */
export function featuresUpTo(classKey, level) {
  const result = []
  for (let lvl = 2; lvl <= level; lvl++) {
    for (const [name, text] of featuresAtLevel(classKey, lvl)) result.push([`${name} (St. ${lvl})`, text])
  }
  return result
}

// ---------------------------------------------------------------------
// Erfahrungspunkte (SRD): benötigte EP je Stufe – gleiche Tabelle wie in der Datenbank
// ---------------------------------------------------------------------
export const XP_TABLE = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
  85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000]

/** EP, die man für eine Stufe braucht (Stufe 1 = 0) */
export const xpForLevel = (level) => XP_TABLE[Math.min(Math.max(level, 1), 20) - 1]

/**
 * Fortschritt zur nächsten Stufe:
 * { xp, current, next, nextLevel, percent, missing, canLevelUp }
 */
export function xpProgress(xp = 0, level = 1) {
  if (level >= 20) return { xp, current: xpForLevel(20), next: null, percent: 100, missing: 0, canLevelUp: false }
  const current = xpForLevel(level)
  const next = xpForLevel(level + 1)
  const percent = Math.max(0, Math.min(100, Math.round(((xp - current) / (next - current)) * 100)))
  return { xp, current, next, nextLevel: level + 1, percent, missing: Math.max(0, next - xp), canLevelUp: xp >= next }
}

/** 12500 → "12.500" */
export const formatXp = (n) => (n ?? 0).toLocaleString('de-DE')
