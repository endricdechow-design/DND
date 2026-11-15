// =====================================================================
//  Kompendium: alle Einträge an einem Ort + Suche
// =====================================================================
import { RULES, RULE_CATEGORIES } from './rules'
import { MONSTERS } from './monsters'
import { SPELLS } from '../spells'
import { CATALOG } from '../catalog'
import { CONDITIONS } from '../conditions'
import { CLASSES, RACES, SKILLS, abilityShort } from '../srd'

export const CATEGORIES = {
  ...RULE_CATEGORIES,
  zustaende: { name: 'Zustände', icon: '🤢' },
  fertigkeiten: { name: 'Fertigkeiten', icon: '🎯' },
  zauber: { name: 'Zauber', icon: '✨' },
  gegenstaende: { name: 'Gegenstände', icon: '🎒' },
  voelker: { name: 'Völker', icon: '🧝' },
  klassen: { name: 'Klassen', icon: '⚔️' },
  monster: { name: 'Monster', icon: '🐉' },
  hausregeln: { name: 'Hausregeln eurer Runden', icon: '🏠' },
}

// Reihenfolge der Kategorien auf der Übersicht
export const CATEGORY_ORDER = [
  'einstieg', 'grundregeln', 'kampf', 'aktionen', 'bewegung', 'zustaende', 'fertigkeiten',
  'magie', 'zauber', 'ausruestung', 'gegenstaende', 'voelker', 'klassen', 'monster', 'glossar', 'spielleiter',
]

// ------------------------- Zustände -------------------------
const CONDITION_ALIASES = {
  blinded: 'blinded, blind', charmed: 'charmed, bezaubert', deafened: 'deafened, taub', exhaustion: 'exhaustion, erschöpft, erschöpfung',
  frightened: 'frightened, angst, verängstigt', grappled: 'grappled, gepackt, festgehalten', incapacitated: 'incapacitated, kampfunfähig',
  invisible: 'invisible, unsichtbar', paralyzed: 'paralyzed, gelähmt', petrified: 'petrified, versteinert', poisoned: 'poisoned, vergiftet, gift',
  prone: 'prone, liegend, am boden, umgeworfen', restrained: 'restrained, festgesetzt, gefesselt', stunned: 'stunned, betäubt', unconscious: 'unconscious, bewusstlos',
}
const EXHAUSTION_TABLE = '| Stufe | Wirkung |\n| 1 | Nachteil auf Attributswürfe |\n| 2 | Bewegungsrate halbiert |\n| 3 | Nachteil auf Angriffe und Rettungswürfe |\n| 4 | Maximale TP halbiert |\n| 5 | Bewegungsrate 0 |\n| 6 | Tod |\n\nDie Wirkungen addieren sich. Eine lange Rast (mit Essen und Trinken) senkt die Erschöpfung um eine Stufe.'
const CONDITION_ENTRIES = CONDITIONS.map((c) => ({
  id: `zustaende:${c.key}`,
  kind: 'rule',
  category: 'zustaende',
  title: `${c.icon} ${c.name}`,
  aliases: CONDITION_ALIASES[c.key] ?? '',
  summary: c.text,
  body: c.key === 'exhaustion' ? EXHAUSTION_TABLE : '',
  example: '',
  related: ['grundregeln:vorteil'],
}))

// ------------------------- Fertigkeiten -------------------------
const SKILL_INFO = {
  acrobatics: ['acrobatics', 'Auf den Beinen bleiben, balancieren, Saltos, sich aus einem Griff winden.'],
  animal_handling: ['animal handling', 'Ein Tier beruhigen, ein Pferd lenken, die Absicht eines Tieres erkennen.'],
  arcana: ['arcana', 'Wissen über Zauber, magische Gegenstände, Symbole, Ebenen und magische Traditionen.'],
  athletics: ['athletics', 'Klettern, Springen, Schwimmen, Ringen und Stoßen – alles, was rohe Kraft braucht.'],
  deception: ['deception, lügen, bluffen', 'Überzeugend lügen, sich verkleiden, jemanden in die Irre führen.'],
  history: ['history', 'Wissen über Ereignisse, Herrscher, Kriege, alte Völker und Legenden.'],
  insight: ['insight, lüge erkennen', 'Erkennen, ob jemand lügt oder was er wirklich will.'],
  intimidation: ['intimidation, drohen', 'Jemanden durch Drohungen, Gewalt oder Ausstrahlung einschüchtern.'],
  investigation: ['investigation, untersuchen', 'Hinweise finden und daraus Schlüsse ziehen: Fallen, Geheimtüren, Spuren deuten.'],
  medicine: ['medicine, heilen, stabilisieren', 'Einen Sterbenden stabilisieren oder eine Krankheit erkennen.'],
  nature: ['nature', 'Wissen über Gelände, Pflanzen, Tiere und Wetter.'],
  perception: ['perception, bemerken, sehen, hören', 'Etwas bemerken: Geräusche, versteckte Gegner, Hinweise in der Umgebung.'],
  performance: ['performance, musik, schauspielern', 'Musik, Tanz, Schauspiel oder Geschichtenerzählen vor Publikum.'],
  persuasion: ['persuasion, diplomatie, überreden', 'Andere mit Freundlichkeit und guten Argumenten überzeugen.'],
  religion: ['religion, götter', 'Wissen über Gottheiten, Riten, Gebete, heilige Symbole und Kulte.'],
  sleight_of_hand: ['sleight of hand, taschendiebstahl', 'Taschendiebstahl, Gegenstände verstecken, Taschenspielertricks.'],
  stealth: ['stealth, schleichen, verstecken', 'Ungesehen und ungehört bleiben, an Wachen vorbeischleichen.'],
  survival: ['survival, spuren lesen, jagen', 'Spuren lesen, jagen, den Weg finden, Wetter vorhersagen.'],
}
const SKILL_ENTRIES = [
  {
    id: 'fertigkeiten:uebersicht', kind: 'rule', category: 'fertigkeiten', title: 'Fertigkeiten – Überblick', aliases: 'skills, fertigkeiten',
    summary: '18 Fertigkeiten, jede gehört zu einem Attribut. Bist du geübt, addierst du deinen Übungsbonus.',
    body: SKILLS.map((s) => `- ${s.name} (${abilityShort(s.ability)})`).join('\n'), example: '', related: ['grundregeln:attributswurf', 'grundregeln:uebungsbonus'],
  },
  ...SKILLS.map((s) => ({
    id: `fertigkeiten:${s.key}`, kind: 'rule', category: 'fertigkeiten', title: `${s.name} (${abilityShort(s.ability)})`,
    aliases: SKILL_INFO[s.key]?.[0] ?? '', summary: SKILL_INFO[s.key]?.[1] ?? '', body: '', example: '',
    related: ['fertigkeiten:uebersicht', 'grundregeln:attributswurf'],
  })),
]

// ------------------------- Zauber, Gegenstände, Völker, Klassen -------------------------
const SPELL_ENTRIES = SPELLS.map((s) => ({
  id: `zauber:${s.key}`, kind: 'spell', category: 'zauber', title: s.name,
  aliases: `${s.school}, ${s.level === 0 ? 'zaubertrick' : `grad ${s.level}`}`,
  summary: `${s.level === 0 ? 'Zaubertrick' : `Grad ${s.level}`} · ${s.school} – ${s.text}`, spell: s,
}))

const ITEM_ENTRIES = CATALOG.map((e) => ({
  id: `gegenstaende:${e.name}`, kind: 'item', category: 'gegenstaende', title: e.name,
  aliases: e.category, summary: `${e.category}${e.stat ? ` · ${e.stat}` : ''} – ${e.description.split('\n')[0]}`, item: e,
}))

const RACE_ENTRIES = RACES.map((r) => ({
  id: `voelker:${r.key}`, kind: 'race', category: 'voelker', title: `${r.icon} ${r.name}`, aliases: 'volk, rasse, race',
  summary: r.blurb, race: r,
}))

const CLASS_ENTRIES = CLASSES.map((c) => ({
  id: `klassen:${c.key}`, kind: 'class', category: 'klassen', title: `${c.icon} ${c.name}`, aliases: 'klasse, class',
  summary: c.blurb, cls: c,
}))

export const ENTRIES = [...RULES, ...CONDITION_ENTRIES, ...SKILL_ENTRIES, ...SPELL_ENTRIES, ...ITEM_ENTRIES, ...RACE_ENTRIES, ...CLASS_ENTRIES, ...MONSTERS]
const BY_ID = Object.fromEntries(ENTRIES.map((e) => [e.id, e]))

/** Hausregeln aus der Datenbank → Einträge */
export const houseRuleEntry = (rule) => ({
  id: `hausregeln:${rule.id}`, kind: 'house', category: 'hausregeln', title: rule.title, aliases: 'hausregel',
  summary: rule.body.split('\n')[0].slice(0, 160), body: rule.body, gameName: rule.games?.name, rule,
})

export const entryById = (id, houseRules = []) => BY_ID[id] ?? houseRules.map(houseRuleEntry).find((e) => e.id === id) ?? null

// ------------------------- Suche -------------------------
const normalize = (t = '') => t.toLowerCase().replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
const stripIcon = (t) => t.replace(/^[^\p{L}\d]+/u, '')

/**
 * Durchsucht alle Einträge (und Hausregeln).
 * Treffer im Titel zuerst, dann Suchbegriffe (auch englisch), dann Text.
 */
export function searchCompendium(query, houseRules = [], limit = 60) {
  const q = normalize(query.trim())
  if (!q) return []
  const all = [...houseRules.map(houseRuleEntry), ...ENTRIES]
  const results = []
  for (const e of all) {
    const title = normalize(stripIcon(e.title))
    const aliases = normalize(e.aliases ?? '')
    const aliasList = aliases.split(/,\s*/)
    let score = null
    if (title === q || aliasList.includes(q)) score = -1 // exakter Treffer, z. B. "AC" → Rüstungsklasse
    else if (title.startsWith(q)) score = 0
    else if (title.split(/[\s()/,-]+/).some((w) => w.startsWith(q))) score = 1
    else if (aliasList.some((a) => a.startsWith(q))) score = 2
    else if (q.length >= 2 && (title.includes(q) || aliases.includes(q))) score = 3
    else if (q.length >= 3 && normalize(`${e.summary} ${e.body ?? ''}`).includes(q)) score = 4
    if (score !== null) {
      // Regeln und Hausregeln leicht bevorzugen
      const bonus = e.kind === 'house' ? -0.6 : e.kind === 'rule' ? -0.3 : 0
      results.push({ e, score: score + bonus })
    }
  }
  return results
    .sort((a, b) => a.score - b.score || a.e.title.localeCompare(b.e.title, 'de'))
    .slice(0, limit)
    .map((r) => r.e)
}

export const entriesInCategory = (category, houseRules = []) =>
  category === 'hausregeln' ? houseRules.map(houseRuleEntry) : ENTRIES.filter((e) => e.category === category)
