// Arten von Bibliothekseinträgen
export const LIBRARY_TYPES = [
  { key: 'item', name: 'Gegenstand', plural: 'Gegenstände', icon: '🗡️', assignLabel: 'Ins Inventar legen von', mine: '🎒 Dein Inventar' },
  { key: 'map', name: 'Karte', plural: 'Karten', icon: '🗺️', assignLabel: 'Nur diesen Spielern zeigen', mine: '🗺️ Deine Karten' },
  { key: 'handout', name: 'Handout', plural: 'Handouts', icon: '📜', assignLabel: 'Nur diesen Spielern zeigen', mine: '📜 Deine Handouts' },
  { key: 'effect', name: 'Effekt', plural: 'Effekte', icon: '✨', assignLabel: 'Wirkt auf', mine: '✨ Effekte auf dir' },
]

export const libraryType = (key) => LIBRARY_TYPES.find((t) => t.key === key) ?? LIBRARY_TYPES[0]

// Seltenheit von Gegenständen (SRD)
export const RARITIES = [
  { key: 'common', name: 'Gewöhnlich', color: 'text-stone-300' },
  { key: 'uncommon', name: 'Ungewöhnlich', color: 'text-emerald-300' },
  { key: 'rare', name: 'Selten', color: 'text-sky-300' },
  { key: 'very_rare', name: 'Sehr selten', color: 'text-violet-300' },
  { key: 'legendary', name: 'Legendär', color: 'text-amber-300' },
  { key: 'artifact', name: 'Artefakt', color: 'text-red-300' },
]

export const rarity = (key) => RARITIES.find((r) => r.key === key)

// Karten brauchen mehr Pixel als Gegenstandsbilder
export const imageSizeFor = (type) => (type === 'map' ? 2400 : 1200)
