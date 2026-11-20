/**
 * Nebel des Krieges – alle Formen sind relativ zum Bild gespeichert (0 … 1),
 * damit sie bei jeder Bildgröße passen.
 *
 * Form (shape):
 *   { t: 'rect', x, y, w, h }
 *   { t: 'poly', pts: [[x, y], …] }
 *   { t: 'brush', r, pts: [[x, y], …] }   r = Pinselradius relativ zur Bildbreite
 *   { t: 'all' }
 * Nebel-Schritt (op) = Form + mode ('reveal' | 'hide'), optional room (ID eines Raums)
 * Raum = Form (rect/poly) + id + name
 */

export const FOG_COLOR = '#0c0a09'
const FOG_BASE = '#1c1917' // Grundfarbe der Nebel-Textur
export const BRUSH_SIZES = [
  { key: 's', label: 'S', r: 0.012 },
  { key: 'm', label: 'M', r: 0.025 },
  { key: 'l', label: 'L', r: 0.05 },
]

// ---------------------------------------------------------------------
// Nebel-Textur: weiche graue Wolken, nahtlos kachelbar, für alle gleich
// ---------------------------------------------------------------------
export const CLOUD_TILE = 512
let cloudCache = null

/** Liefert { canvas, url } der Wolken-Kachel (wird nur einmal erzeugt) */
export function cloudTexture() {
  if (cloudCache) return cloudCache
  const size = CLOUD_TILE
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = FOG_BASE
  ctx.fillRect(0, 0, size, size)
  // Fester Zufall, damit der Nebel auf allen Geräten gleich aussieht
  let seed = 7
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
  const blobs = [
    { n: 70, r: [0.12, 0.3], color: [87, 83, 78], a: [0.1, 0.22] }, // große helle Schwaden
    { n: 60, r: [0.05, 0.14], color: [120, 113, 108], a: [0.08, 0.18] }, // kleinere hellere Wölkchen
    { n: 40, r: [0.08, 0.22], color: [0, 0, 0], a: [0.15, 0.3] }, // dunkle Löcher für Tiefe
  ]
  for (const { n, r, color, a } of blobs) {
    for (let i = 0; i < n; i++) {
      const x = rand() * size
      const y = rand() * size
      const radius = (r[0] + rand() * (r[1] - r[0])) * size
      const alpha = a[0] + rand() * (a[1] - a[0])
      // an den Rändern gespiegelt zeichnen → nahtlose Kachel
      for (const dx of [-size, 0, size]) {
        for (const dy of [-size, 0, size]) {
          const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, radius)
          g.addColorStop(0, `rgba(${color.join(',')},${alpha})`)
          g.addColorStop(1, `rgba(${color.join(',')},0)`)
          ctx.fillStyle = g
          ctx.fillRect(x + dx - radius, y + dy - radius, radius * 2, radius * 2)
        }
      }
    }
  }
  cloudCache = { canvas, url: canvas.toDataURL('image/png') }
  return cloudCache
}

/** Zeichenwerkzeuge der Karte */
export const TOOLS = [
  { key: 'move', icon: '✋', label: 'Bewegen' },
  { key: 'rect', icon: '▭', label: 'Rechteck' },
  { key: 'poly', icon: '⬠', label: 'Vieleck' },
  { key: 'brush', icon: '🖌️', label: 'Pinsel' },
]

// 3 Nachkommastellen = auf ~2 Pixel genau (reicht für weichen Nebel, spart Speicher)
const round = (n) => Math.round(n * 1000) / 1000
export const roundPoint = ([x, y]) => [round(x), round(y)]

/**
 * Pinselstrich vereinfachen (Ramer-Douglas-Peucker): Punkte, die kaum von einer
 * geraden Linie abweichen, fallen weg. tolerance relativ zur Bildbreite.
 */
export function simplifyStroke(pts, tolerance) {
  if (pts.length < 3) return pts
  const distToSegment = ([px, py], [ax, ay], [bx, by]) => {
    const dx = bx - ax
    const dy = by - ay
    const len = dx * dx + dy * dy
    const t = len ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len)) : 0
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
  }
  const keep = new Array(pts.length).fill(false)
  keep[0] = keep[pts.length - 1] = true
  const stack = [[0, pts.length - 1]]
  while (stack.length) {
    const [a, b] = stack.pop()
    let max = 0
    let index = -1
    for (let i = a + 1; i < b; i++) {
      const d = distToSegment(pts[i], pts[a], pts[b])
      if (d > max) {
        max = d
        index = i
      }
    }
    if (max > tolerance && index !== -1) {
      keep[index] = true
      stack.push([a, index], [index, b])
    }
  }
  return pts.filter((_, i) => keep[i])
}

/** Zeichnet eine Form in Pixelkoordinaten (w × h, versetzt um ox/oy) */
function traceShape(ctx, shape, w, h, ox, oy) {
  if (shape.t === 'all') {
    ctx.fillRect(-1e5, -1e5, 2e5, 2e5)
  } else if (shape.t === 'rect') {
    ctx.fillRect(ox + shape.x * w, oy + shape.y * h, shape.w * w, shape.h * h)
  } else if (shape.t === 'poly' && shape.pts?.length > 2) {
    ctx.beginPath()
    shape.pts.forEach(([x, y], i) => (i ? ctx.lineTo(ox + x * w, oy + y * h) : ctx.moveTo(ox + x * w, oy + y * h)))
    ctx.closePath()
    ctx.fill()
  } else if (shape.t === 'brush' && shape.pts?.length) {
    const r = shape.r * w
    ctx.lineWidth = r * 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    const [fx, fy] = shape.pts[0]
    ctx.moveTo(ox + fx * w, oy + fy * h)
    if (shape.pts.length === 1) ctx.lineTo(ox + fx * w + 0.01, oy + fy * h)
    shape.pts.slice(1).forEach(([x, y]) => ctx.lineTo(ox + x * w, oy + y * h))
    ctx.stroke()
  }
}

/**
 * Malt den Nebel auf ein Canvas. Das Bild sitzt mit Rand `margin` (Pixel) im Canvas,
 * der Rand ist immer neblig (damit weiche Kanten am Bildrand nicht durchscheinen).
 * textured: graue Wolken-Textur statt einfarbig.
 */
export function renderFog(canvas, ops, { margin = 0, color = FOG_COLOR, textured = true } = {}) {
  const ctx = canvas.getContext('2d')
  const w = canvas.width - margin * 2
  const h = canvas.height - margin * 2
  ctx.globalCompositeOperation = 'source-over'
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = color
  ctx.strokeStyle = color
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  for (const op of ops ?? []) {
    ctx.globalCompositeOperation = op.mode === 'hide' ? 'source-over' : 'destination-out'
    ctx.save()
    // Aufdecken nie über den Bildrand hinaus
    ctx.beginPath()
    ctx.rect(margin, margin, w, h)
    ctx.clip()
    traceShape(ctx, op, w, h, margin, margin)
    ctx.restore()
  }
  // Wolken nur dort hinein malen, wo Nebel ist
  if (textured && typeof document !== 'undefined') {
    const tile = cloudTexture().canvas
    const pattern = ctx.createPattern(tile, 'repeat')
    const scale = Math.max(0.5, canvas.width / 2400)
    pattern.setTransform?.(new DOMMatrix().scale(scale))
    ctx.globalCompositeOperation = 'source-atop'
    ctx.fillStyle = pattern
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.globalCompositeOperation = 'source-over'
}

/** Ist ein Raum gerade aufgedeckt? (letzter Schritt zu diesem Raum entscheidet) */
export function isRoomRevealed(ops, roomId) {
  for (let i = (ops?.length ?? 0) - 1; i >= 0; i--) {
    const op = ops[i]
    if (op.room === roomId) return op.mode === 'reveal'
    if (op.t === 'all') return op.mode === 'reveal'
  }
  return false
}

/** Mittelpunkt einer Form (für Beschriftungen) */
export function shapeCenter(shape) {
  if (shape.t === 'rect') return [shape.x + shape.w / 2, shape.y + shape.h / 2]
  const pts = shape.pts ?? []
  if (!pts.length) return [0.5, 0.5]
  return [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length]
}

/** Nur die reine Form eines Raums (ohne Name/ID) */
export const roomShape = (room) =>
  room.t === 'rect' ? { t: 'rect', x: room.x, y: room.y, w: room.w, h: room.h } : { t: 'poly', pts: room.pts }
