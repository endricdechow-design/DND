import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { FOG_COLOR, isRoomRevealed, renderFog, roundPoint, shapeCenter } from '../../lib/fog'

const FOG_RES = 1600 // Auflösung des Nebels (Pixel Breite) – reicht für weiche Kanten
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

/**
 * Zeigt eine Karte mit Nebel. Zoomen (2 Finger / Mausrad / Knöpfe), Verschieben,
 * und – wenn `tool` gesetzt ist – Formen zeichnen.
 *
 * fogStyle: 'opaque' (Spieler/Tisch: Nebel deckt alles) | 'gm' (Nebel halb durchsichtig) | 'none'
 * tool: 'move' | 'rect' | 'poly' | 'brush'
 * onShape(shape): fertig gezeichnete Form (siehe lib/fog.js)
 * followView: wenn gesetzt (auch null), steuert der Spielleiter den Blick (Tisch-Bildschirm)
 * viewRef: bekommt eine Funktion, die den aktuellen Blick { cx, cy, zoom } liefert
 */
export default function MapCanvas({
  imageUrl,
  ops = [],
  rooms = [],
  showRooms = false,
  fogStyle = 'opaque',
  tool = 'move',
  brushR = 0.025,
  onShape,
  followView,
  viewRef,
  className = '',
}) {
  const controlled = followView !== undefined
  const boxRef = useRef(null)
  const fogA = useRef(null)
  const fogB = useRef(null)
  const [img, setImg] = useState(null) // { nw, nh }
  const [box, setBox] = useState(null) // { cw, ch }
  const [view, setView] = useState(null) // { s, tx, ty }
  const [ready, setReady] = useState(false)
  const [draft, setDraft] = useState(null) // Form, die gerade gezeichnet wird
  const [animate, setAnimate] = useState(false)
  const gesture = useRef({ pointers: new Map() })

  // Größe des Kartenbereichs beobachten
  useLayoutEffect(() => {
    const el = boxRef.current
    const measure = () => setBox({ cw: el.clientWidth, ch: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const fitScale = img && box ? Math.min(box.cw / img.nw, box.ch / img.nh) : 1

  const viewFor = useCallback(
    (target) => {
      if (!img || !box) return null
      const s = fitScale * (target?.zoom ?? 1)
      const cx = target?.cx ?? 0.5
      const cy = target?.cy ?? 0.5
      return { s, tx: box.cw / 2 - cx * img.nw * s, ty: box.ch / 2 - cy * img.nh * s }
    },
    [img, box, fitScale]
  )

  // Anfangsblick / Blick vom Spielleiter übernehmen / bei Größenänderung anpassen
  const followKey = controlled ? JSON.stringify(followView) : 'free'
  useEffect(() => {
    if (!img || !box) return
    if (controlled) {
      setAnimate(true)
      setView(viewFor(followView))
    } else {
      setView((v) => v ?? viewFor(null))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img, box, followKey])

  // Aktuellen Blick nach außen geben (für „Tisch-Bildschirm hierhin“)
  useEffect(() => {
    if (!viewRef) return
    viewRef.current = () => {
      if (!view || !img || !box) return null
      const s = view.s
      return {
        cx: Math.round(((box.cw / 2 - view.tx) / (s * img.nw)) * 1000) / 1000,
        cy: Math.round(((box.ch / 2 - view.ty) / (s * img.nh)) * 1000) / 1000,
        zoom: Math.round((s / fitScale) * 100) / 100,
      }
    }
  }, [viewRef, view, img, box, fitScale])

  // Nebel malen (bei Spielern mit sanftem Auflösen)
  const fogW = img ? Math.min(FOG_RES, img.nw) : 0
  const fogH = img ? Math.round((fogW * img.nh) / img.nw) : 0
  const margin = Math.round(fogW * 0.03)
  const opsKey = JSON.stringify(ops)
  useEffect(() => {
    const a = fogA.current
    if (!a || !img) return
    const b = fogB.current
    const fade = fogStyle === 'opaque' && ready && b
    if (fade) {
      const ctx = b.getContext('2d')
      ctx.clearRect(0, 0, b.width, b.height)
      ctx.drawImage(a, 0, 0)
      b.style.transition = 'none'
      b.style.opacity = '1'
    }
    renderFog(a, ops, { margin, color: FOG_COLOR })
    if (fade) {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          b.style.transition = 'opacity 1.2s ease'
          b.style.opacity = '0'
        })
      )
    }
    setReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opsKey, img, fogStyle, margin])

  // ---- Zeigen → Bildkoordinaten ----
  const toImage = (clientX, clientY) => {
    const rect = boxRef.current.getBoundingClientRect()
    return [clamp((clientX - rect.left - view.tx) / view.s / img.nw, 0, 1), clamp((clientY - rect.top - view.ty) / view.s / img.nh, 0, 1)]
  }

  const zoomAt = useCallback(
    (factor, px, py) => {
      setAnimate(false)
      setView((v) => {
        if (!v) return v
        const s = clamp(v.s * factor, fitScale * 0.5, fitScale * 10)
        const k = s / v.s
        return { s, tx: px - (px - v.tx) * k, ty: py - (py - v.ty) * k }
      })
    },
    [fitScale]
  )

  // Mausrad (muss „nicht passiv“ sein, damit die Seite nicht scrollt)
  useEffect(() => {
    const el = boxRef.current
    if (controlled) return
    const onWheel = (e) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - rect.left, e.clientY - rect.top)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [controlled, zoomAt])

  const drawing = !controlled && tool !== 'move' && onShape

  function onPointerDown(e) {
    if (controlled || !view || !img) return
    const g = gesture.current
    e.currentTarget.setPointerCapture(e.pointerId)
    g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    g.moved = false
    g.startX = e.clientX
    g.startY = e.clientY
    setAnimate(false)
    if (g.pointers.size === 2) {
      // Zwei Finger: Zoomen + Verschieben, angefangenes Rechteck/Pinsel verwerfen
      if (draft?.t !== 'poly') setDraft(null)
      g.mode = 'pinch'
      const [p1, p2] = [...g.pointers.values()]
      g.pinch = { dist: Math.hypot(p1.x - p2.x, p1.y - p2.y), mx: (p1.x + p2.x) / 2, my: (p1.y + p2.y) / 2, view }
      return
    }
    if (g.pointers.size > 2) return
    if (drawing && tool === 'rect') {
      g.mode = 'draw'
      const p = toImage(e.clientX, e.clientY)
      setDraft({ t: 'rect', start: p, end: p })
    } else if (drawing && tool === 'brush') {
      g.mode = 'draw'
      setDraft({ t: 'brush', r: brushR, pts: [roundPoint(toImage(e.clientX, e.clientY))] })
    } else {
      g.mode = 'pan'
      g.pan = { x: e.clientX, y: e.clientY, view }
    }
  }

  function onPointerMove(e) {
    const g = gesture.current
    if (!g.pointers.has(e.pointerId)) return
    g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (Math.hypot(e.clientX - g.startX, e.clientY - g.startY) > 6) g.moved = true
    if (g.mode === 'pinch' && g.pointers.size >= 2) {
      const [p1, p2] = [...g.pointers.values()]
      const { pinch } = g
      const rect = boxRef.current.getBoundingClientRect()
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y)
      const s = clamp((pinch.view.s * dist) / pinch.dist, fitScale * 0.5, fitScale * 10)
      const sx = pinch.mx - rect.left
      const sy = pinch.my - rect.top
      const mx = (p1.x + p2.x) / 2 - rect.left
      const my = (p1.y + p2.y) / 2 - rect.top
      const px = (sx - pinch.view.tx) / pinch.view.s
      const py = (sy - pinch.view.ty) / pinch.view.s
      setView({ s, tx: mx - px * s, ty: my - py * s })
    } else if (g.mode === 'pan') {
      setView({ ...g.pan.view, tx: g.pan.view.tx + e.clientX - g.pan.x, ty: g.pan.view.ty + e.clientY - g.pan.y })
    } else if (g.mode === 'draw') {
      const p = toImage(e.clientX, e.clientY)
      setDraft((d) => {
        if (!d) return d
        if (d.t === 'rect') return { ...d, end: p }
        const last = d.pts[d.pts.length - 1]
        const minStep = d.r / 3
        if (Math.hypot((p[0] - last[0]) * img.nw, (p[1] - last[1]) * img.nh) < minStep * img.nw) return d
        return { ...d, pts: [...d.pts, roundPoint(p)] }
      })
    }
  }

  function onPointerUp(e) {
    const g = gesture.current
    if (!g.pointers.has(e.pointerId)) return
    g.pointers.delete(e.pointerId)
    if (g.mode === 'pinch') {
      if (g.pointers.size === 0) g.mode = null
      g.moved = true
      return
    }
    if (g.mode === 'draw' && draft) {
      if (draft.t === 'rect') {
        const [x1, y1] = draft.start
        const [x2, y2] = draft.end
        const shape = { t: 'rect', ...rnd({ x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) }) }
        if (shape.w > 0.004 && shape.h > 0.004) onShape(shape)
      } else if (draft.t === 'brush') {
        onShape({ t: 'brush', r: draft.r, pts: draft.pts })
      }
      setDraft(null)
    } else if (g.mode === 'pan' && !g.moved && drawing && tool === 'poly') {
      // Vieleck: jeder Tipp setzt eine Ecke, Tipp auf die erste Ecke schließt
      const p = roundPoint(toImage(e.clientX, e.clientY))
      const pts = draft?.t === 'poly' ? draft.pts : []
      if (pts.length >= 3) {
        const [fx, fy] = pts[0]
        const dx = (p[0] - fx) * img.nw * view.s
        const dy = (p[1] - fy) * img.nh * view.s
        if (Math.hypot(dx, dy) < 16) return finishPoly(pts)
      }
      setDraft({ t: 'poly', pts: [...pts, p] })
    }
    if (g.pointers.size === 0) g.mode = null
  }

  function finishPoly(pts = draft?.pts) {
    if (pts?.length >= 3) onShape({ t: 'poly', pts })
    setDraft(null)
  }

  // Werkzeug gewechselt → angefangenes Vieleck verwerfen
  useEffect(() => setDraft(null), [tool])

  const center = () => (box ? [box.cw / 2, box.ch / 2] : [0, 0])

  return (
    <div
      ref={boxRef}
      className={`relative select-none overflow-hidden ${className}`}
      style={{ background: FOG_COLOR, touchAction: 'none', cursor: controlled ? 'default' : drawing ? 'crosshair' : 'grab' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {!ready && <p className="absolute inset-0 flex items-center justify-center text-stone-500">Lade Karte …</p>}
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          width: img?.nw ?? 0,
          height: img?.nh ?? 0,
          transform: view ? `translate(${view.tx}px, ${view.ty}px) scale(${view.s})` : 'scale(0)',
          transition: animate ? 'transform 0.9s ease' : 'none',
          opacity: ready ? 1 : 0,
          willChange: 'transform',
        }}
      >
        <img
          src={imageUrl}
          alt=""
          draggable={false}
          className="pointer-events-none block h-full w-full max-w-none"
          onLoad={(e) => {
            setReady(false)
            setImg({ nw: e.currentTarget.naturalWidth, nh: e.currentTarget.naturalHeight })
          }}
        />
        {img &&
          [fogA, fogB].map((ref, i) => {
            const k = img.nw / fogW
            return (
              <canvas
                key={i}
                ref={ref}
                width={fogW + margin * 2}
                height={fogH + margin * 2}
                className="pointer-events-none absolute"
                style={{
                  left: -margin * k,
                  top: -margin * k,
                  width: (fogW + margin * 2) * k,
                  height: (fogH + margin * 2) * k,
                  opacity: i === 1 || fogStyle === 'none' ? 0 : fogStyle === 'gm' ? 0.55 : 1,
                  filter: fogStyle === 'opaque' ? `blur(${Math.max(2, img.nw * 0.004)}px)` : 'none',
                }}
              />
            )
          })}
        {img && (
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${img.nw} ${img.nh}`}>
            {showRooms && rooms.map((room) => <RoomOutline key={room.id} room={room} img={img} revealed={isRoomRevealed(ops, room.id)} />)}
            {draft && <DraftShape draft={draft} img={img} />}
          </svg>
        )}
      </div>

      {!controlled && view && (
        <div className="absolute bottom-2 right-2 flex flex-col gap-1" onPointerDown={(e) => e.stopPropagation()}>
          <MapButton label="Hineinzoomen" onClick={() => zoomAt(1.4, ...center())}>＋</MapButton>
          <MapButton label="Herauszoomen" onClick={() => zoomAt(1 / 1.4, ...center())}>－</MapButton>
          <MapButton label="Ganze Karte" onClick={() => { setAnimate(true); setView(viewFor(null)) }}>⤢</MapButton>
        </div>
      )}

      {draft?.t === 'poly' && (
        <div className="absolute left-1/2 top-2 flex -translate-x-1/2 gap-2" onPointerDown={(e) => e.stopPropagation()}>
          <button type="button" className="btn-primary px-3 py-1.5 text-sm" disabled={draft.pts.length < 3} onClick={() => finishPoly()}>
            ✓ Fertig ({draft.pts.length} Ecken)
          </button>
          <button type="button" className="btn-secondary px-3 py-1.5 text-sm" onClick={() => setDraft(null)}>✕</button>
        </div>
      )}
    </div>
  )
}

const rnd = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Math.round(v * 10000) / 10000]))

function MapButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-700 bg-stone-950/85 text-lg text-stone-200 shadow-lg hover:border-amber-500"
    >
      {children}
    </button>
  )
}

const ptsAttr = (pts, img) => pts.map(([x, y]) => `${x * img.nw},${y * img.nh}`).join(' ')

function RoomOutline({ room, img, revealed }) {
  const color = revealed ? '#4ade80' : '#f59e0b'
  const [cx, cy] = shapeCenter(room)
  const fontSize = Math.max(14, img.nw * 0.016)
  const common = { fill: revealed ? 'rgba(74,222,128,0.06)' : 'rgba(245,158,11,0.08)', stroke: color, strokeWidth: 2, strokeDasharray: '8 6', vectorEffect: 'non-scaling-stroke' }
  return (
    <g>
      {room.t === 'rect' ? (
        <rect x={room.x * img.nw} y={room.y * img.nh} width={room.w * img.nw} height={room.h * img.nh} {...common} />
      ) : (
        <polygon points={ptsAttr(room.pts, img)} {...common} />
      )}
      <text
        x={cx * img.nw}
        y={cy * img.nh}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fontSize}
        fontWeight="700"
        fill={color}
        stroke="#0c0a09"
        strokeWidth={fontSize / 5}
        paintOrder="stroke"
      >
        {room.name}
      </text>
    </g>
  )
}

function DraftShape({ draft, img }) {
  const style = { fill: 'rgba(251,191,36,0.18)', stroke: '#fbbf24', strokeWidth: 2, vectorEffect: 'non-scaling-stroke' }
  if (draft.t === 'rect') {
    const [x1, y1] = draft.start
    const [x2, y2] = draft.end
    return (
      <rect x={Math.min(x1, x2) * img.nw} y={Math.min(y1, y2) * img.nh} width={Math.abs(x2 - x1) * img.nw} height={Math.abs(y2 - y1) * img.nh} {...style} />
    )
  }
  if (draft.t === 'brush') {
    return (
      <polyline points={ptsAttr(draft.pts, img)} fill="none" stroke="rgba(251,191,36,0.45)" strokeWidth={draft.r * 2 * img.nw} strokeLinecap="round" strokeLinejoin="round" />
    )
  }
  return (
    <g>
      <polyline points={ptsAttr(draft.pts, img)} {...style} />
      {draft.pts.map(([x, y], i) => (
        <circle key={i} cx={x * img.nw} cy={y * img.nh} r={Math.max(4, img.nw * 0.004)} fill={i === 0 ? '#fbbf24' : '#fde68a'} stroke="#0c0a09" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      ))}
    </g>
  )
}
