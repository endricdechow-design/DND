/**
 * Raster auf Karten. Gespeichert relativ zur Bildbreite, damit es bei jeder Bildgröße passt:
 *   { type, size, ox, oy, meters, show }
 *   size = Kantenlänge eines Feldes als Anteil der Bildbreite (z. B. 0.04 = 25 Felder breit)
 *   ox/oy = Verschiebung des Rasters (Anteil der Bildbreite, 0 … size)
 *   meters = wie viele Meter ein Feld in echt sind
 *   show = Spieler und Tisch-Bildschirm sehen das Raster
 */
export const GRID_TYPES = [
  { key: 'combat', icon: '⚔️', label: 'Kampf / Dungeon', meters: 1.5, hint: '1 Feld = 1,5 m – hier bewegen sich später die Figuren.' },
  { key: 'building', icon: '🏰', label: 'Gebäude / Burg', meters: 1.5, hint: 'Wie Kampf, für Häuser, Burgen und Tempel.' },
  { key: 'town', icon: '🏘️', label: 'Stadt / Gelände', meters: 30, hint: 'Grobes Raster zur Orientierung, z. B. 1 Feld = 30 m.' },
  { key: 'world', icon: '🗺️', label: 'Weltkarte', meters: null, hint: 'Kein Raster.' },
]

export const DEFAULT_GRID = { type: 'combat', size: 1 / 24, ox: 0, oy: 0, meters: 1.5, show: true }

/** Gespeichertes Raster mit Standardwerten auffüllen (alte Karten haben keins) */
export const normalizeGrid = (grid) => ({ ...DEFAULT_GRID, ...(grid ?? {}) })

export const hasGrid = (grid) => normalizeGrid(grid).type !== 'world'

/** Raster für Spieler/Tisch: nur wenn vorhanden und freigegeben */
export function playerGrid(grid) {
  const g = normalizeGrid(grid)
  return g.type !== 'world' && g.show ? g : null
}

/**
 * Raster aus markierten Kästchen (Rechteck in Bildanteilen x/y/w/h) berechnen.
 * nw/nh = Bildgröße in Pixeln, cellsAcross = wie viele Kästchen das Rechteck breit ist.
 */
export function gridFromCell(rect, nw, nh, base, cellsAcross = 1) {
  // Mehrere Kästchen markiert → Breite durch Anzahl teilen (genauer als ein einzelnes Kästchen)
  const cell = (rect.w * nw) / Math.max(1, cellsAcross)
  if (cell < 4) return null
  const mod = (v) => ((v % cell) + cell) % cell
  return { ...normalizeGrid(base), size: cell / nw, ox: mod(rect.x * nw) / nw, oy: mod(rect.y * nh) / nw }
}

/** Raster aus „Die Karte ist N Felder breit“ */
export const gridFromCellsAcross = (cells, base) => ({ ...normalizeGrid(base), size: 1 / cells, ox: 0, oy: 0 })

/** Wie sichtbar ist das Raster bei dieser Zoomstufe? (0 = aus, 1 = voll) – blendet beim Herauszoomen aus */
export function gridOpacity(cellOnScreenPx) {
  return Math.max(0, Math.min(1, (cellOnScreenPx - 12) / 14))
}

const fmt = (n) => (Math.round(n * 10) / 10).toLocaleString('de-DE')

/** Größe eines Raums in Metern, z. B. „9 × 6 m“ (Vielecke: Umriss, mit „ca.“) */
export function roomSizeLabel(room, grid, nw, nh) {
  const g = normalizeGrid(grid)
  if (!g.meters || g.type === 'world') return null
  const cellPx = g.size * nw
  let w
  let h
  if (room.t === 'rect') {
    w = room.w * nw
    h = room.h * nh
  } else {
    const xs = room.pts.map((p) => p[0] * nw)
    const ys = room.pts.map((p) => p[1] * nh)
    w = Math.max(...xs) - Math.min(...xs)
    h = Math.max(...ys) - Math.min(...ys)
  }
  const mw = (w / cellPx) * g.meters
  const mh = (h / cellPx) * g.meters
  return `${room.t === 'rect' ? '' : 'ca. '}${fmt(mw)} × ${fmt(mh)} m`
}
