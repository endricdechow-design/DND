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
export const BRUSH_SIZES = [
  { key: 's', label: 'S', r: 0.012 },
  { key: 'm', label: 'M', r: 0.025 },
  { key: 'l', label: 'L', r: 0.05 },
]

/** Zeichenwerkzeuge der Karte */
export const TOOLS = [
  { key: 'move', icon: '✋', label: 'Bewegen' },
  { key: 'rect', icon: '▭', label: 'Rechteck' },
  { key: 'poly', icon: '⬠', label: 'Vieleck' },
  { key: 'brush', icon: '🖌️', label: 'Pinsel' },
]

const round = (n) => Math.round(n * 10000) / 10000
export const roundPoint = ([x, y]) => [round(x), round(y)]

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
 */
export function renderFog(canvas, ops, { margin = 0, color = FOG_COLOR } = {}) {
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
