// Lebensbalken für die Gruppenansicht: aus Prozent wird ein Zustand mit Farbe
export function hpStatus(percent) {
  if (percent === null || percent === undefined) return { label: 'Unbekannt', bar: 'bg-stone-600', text: 'text-stone-400' }
  if (percent <= 0) return { label: 'Bewusstlos', bar: 'bg-red-700', text: 'text-red-300' }
  if (percent <= 25) return { label: 'Schwer verletzt', bar: 'bg-red-600', text: 'text-red-300' }
  if (percent <= 50) return { label: 'Angeschlagen', bar: 'bg-amber-500', text: 'text-amber-300' }
  if (percent < 100) return { label: 'Leicht verletzt', bar: 'bg-lime-500', text: 'text-lime-300' }
  return { label: 'Unverletzt', bar: 'bg-emerald-500', text: 'text-emerald-300' }
}

/** Kurzform "Elf · Magier · Stufe 3" */
export function shortRaceName(name = '') {
  return name.replace(/ \(.*\)/, '')
}

/** Symbol je Klasse (z. B. als Avatar, wenn es kein Bild gibt) */
export const CLASS_ICONS = {
  barbarian: '🪓',
  bard: '🎻',
  cleric: '☀️',
  druid: '🌿',
  fighter: '⚔️',
  monk: '👊',
  paladin: '🛡️',
  ranger: '🏹',
  rogue: '🗡️',
  sorcerer: '🔥',
  warlock: '👁️',
  wizard: '🔮',
}
