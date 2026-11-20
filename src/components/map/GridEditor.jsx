import { useEffect, useState } from 'react'
import { GRID_TYPES, gridFromCell, gridFromCellsAcross, normalizeGrid } from '../../lib/grid'
import MapCanvas from './MapCanvas'

const METER_OPTIONS = [1.5, 3, 5, 15, 30, 100]
const fmt = (n) => (Math.round(n * 10) / 10).toLocaleString('de-DE')

/**
 * Raster einer Karte einstellen: Art der Karte, „Ein Feld markieren“ oder
 * „Anzahl Felder“, Feinregler. Vorschau live auf der Karte.
 */
export default function GridEditor({ imageUrl, rooms = [], grid, onSave, saveLabel = '💾 Raster speichern', height = 'h-[60vh] min-h-80' }) {
  const [draft, setDraft] = useState(() => normalizeGrid(grid))
  const [marking, setMarking] = useState(false)
  const [cells, setCells] = useState('')
  const [img, setImg] = useState(null) // { nw, nh } für Größenangaben
  const [saved, setSaved] = useState(false)
  const [pendingRect, setPendingRect] = useState(null) // markiertes Rechteck, wartet auf „wie viele Kästchen?“
  const [count, setCount] = useState('1')

  useEffect(() => {
    const image = new Image()
    image.onload = () => setImg({ nw: image.naturalWidth, nh: image.naturalHeight })
    image.src = imageUrl
  }, [imageUrl])

  const change = (patch) => {
    setSaved(false)
    setDraft((g) => ({ ...g, ...patch }))
  }
  const type = GRID_TYPES.find((t) => t.key === draft.type) ?? GRID_TYPES[0]
  const noGrid = draft.type === 'world'
  const across = 1 / draft.size
  const down = img ? img.nh / (draft.size * img.nw) : null
  const step = draft.size / 20 // Feinschritt: 1/20 Feld

  return (
    <div className="space-y-4">
      {/* Art der Karte */}
      <div>
        <p className="label">Was für eine Karte ist das?</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {GRID_TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => change({ type: t.key, meters: t.meters ?? draft.meters })}
              className={`rounded-xl border px-2 py-2 text-sm transition ${draft.type === t.key ? 'border-amber-500 bg-amber-500/10 text-amber-200' : 'border-stone-700 text-stone-300 hover:border-stone-500'}`}
            >
              <span aria-hidden>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-stone-500">{type.hint}</p>
      </div>

      {!noGrid && (
        <>
          {/* Zwei Wege zum Raster */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className={`rounded-xl border p-3 ${marking ? 'border-amber-500 bg-amber-500/10' : 'border-stone-800 bg-stone-950/40'}`}>
              <p className="font-semibold text-stone-100">A) Kästchen markieren</p>
              <p className="mb-2 text-xs text-stone-400">
                Für Karten mit aufgedruckten Kästchen: zoome hinein und zieh ein Rechteck genau an den Linien entlang – über ein
                Kästchen oder, <b>noch genauer</b>, über mehrere nebeneinander.
              </p>
              <button type="button" className={marking ? 'btn-primary px-3 py-1.5 text-sm' : 'btn-secondary px-3 py-1.5 text-sm'} onClick={() => setMarking(!marking)}>
                {marking ? '✋ Markieren beenden' : '▭ Kästchen markieren'}
              </button>
            </div>
            <form
              className="rounded-xl border border-stone-800 bg-stone-950/40 p-3"
              onSubmit={(e) => {
                e.preventDefault()
                const n = Number(cells.replace(',', '.'))
                if (n >= 2 && n <= 300) {
                  setSaved(false)
                  setDraft((g) => gridFromCellsAcross(n, g))
                }
              }}
            >
              <p className="font-semibold text-stone-100">B) Größe angeben</p>
              <p className="mb-2 text-xs text-stone-400">Für Karten ohne Kästchen: Wie viele Felder ist die Karte breit?</p>
              <div className="flex flex-wrap items-center gap-2">
                <input className="input w-24 py-1.5" inputMode="decimal" value={cells} onChange={(e) => setCells(e.target.value.replace(/[^0-9.,]/g, ''))} placeholder="z. B. 20" />
                <span className="text-sm text-stone-400">Felder</span>
                <button type="submit" className="btn-secondary px-3 py-1.5 text-sm" disabled={!cells}>Übernehmen</button>
              </div>
              {draft.meters && (
                <p className="mt-1 text-xs text-stone-500">Tipp: Ist die Karte 30 m breit, sind das {fmt(30 / draft.meters)} Felder à {fmt(draft.meters)} m.</p>
              )}
            </form>
          </div>

          {marking && !pendingRect && <p className="alert-info">Zieh jetzt auf der Karte ein Rechteck genau an den Kästchen-Linien entlang. Zwei Finger zoomen und verschieben weiterhin.</p>}
      {pendingRect && (
        <form
          className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-600 bg-amber-500/10 p-3"
          onSubmit={(e) => {
            e.preventDefault()
            const next = gridFromCell(pendingRect, img.nw, img.nh, draft, Number(count) || 1)
            if (next) {
              setSaved(false)
              setDraft(next)
            }
            setPendingRect(null)
            setMarking(false)
          }}
        >
          <span className="text-sm text-amber-100">Wie viele Kästchen breit ist dein Rechteck?</span>
          <input className="input w-20 py-1.5 text-center" inputMode="numeric" value={count} autoFocus onChange={(e) => setCount(e.target.value.replace(/[^0-9]/g, ''))} />
          <button type="submit" className="btn-primary px-3 py-1.5 text-sm" disabled={!Number(count)}>✓ Raster anlegen</button>
          <button type="button" className="btn-ghost px-3 py-1.5 text-sm" onClick={() => setPendingRect(null)}>Nochmal</button>
        </form>
      )}
        </>
      )}

      <MapCanvas
        imageUrl={imageUrl}
        rooms={rooms}
        showRooms
        fogStyle="none"
        grid={noGrid ? null : draft}
        gridAlways
        tool={marking ? 'rect' : 'move'}
        onShape={(rect) => {
          if (!img) return
          setPendingRect(rect)
          // Vorschlag: so viele Kästchen, wie mit der bisherigen Feldgröße hineinpassen
          setCount(String(Math.max(1, Math.round(rect.w / draft.size))))
        }}
        className={`rounded-xl border border-stone-800 ${height}`}
      />

      {!noGrid && (
        <div className="space-y-3 rounded-xl border border-stone-800 bg-stone-950/40 p-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-sm text-stone-300">🔍 Feinregler:</span>
            <Nudge label="Felder kleiner" onClick={() => change({ size: Math.max(0.004, draft.size * 0.99) })}>－</Nudge>
            <span className="text-sm tabular-nums text-stone-400">{fmt(across)} Felder breit</span>
            <Nudge label="Felder größer" onClick={() => change({ size: Math.min(0.5, draft.size * 1.01) })}>＋</Nudge>
            <span className="hidden h-5 w-px bg-stone-700 sm:block" />
            <Nudge label="Raster nach links" onClick={() => change({ ox: (draft.ox - step + draft.size) % draft.size })}>←</Nudge>
            <Nudge label="Raster nach rechts" onClick={() => change({ ox: (draft.ox + step) % draft.size })}>→</Nudge>
            <Nudge label="Raster nach oben" onClick={() => change({ oy: (draft.oy - step + draft.size) % draft.size })}>↑</Nudge>
            <Nudge label="Raster nach unten" onClick={() => change({ oy: (draft.oy + step) % draft.size })}>↓</Nudge>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <label className="flex items-center gap-2 text-sm text-stone-300">
              📏 1 Feld =
              <select className="input w-auto py-1.5" value={draft.meters ?? 1.5} onChange={(e) => change({ meters: Number(e.target.value) })}>
                {METER_OPTIONS.map((m) => <option key={m} value={m}>{fmt(m)} m</option>)}
              </select>
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-300">
              <input type="checkbox" className="accent-amber-500" checked={draft.show} onChange={(e) => change({ show: e.target.checked })} />
              Spieler & Tisch-Bildschirm sehen das Raster
            </label>
          </div>
          {img && draft.meters && (
            <p className="text-sm text-amber-200">
              📐 Die ganze Karte ist etwa <b>{fmt(across * draft.meters)} × {fmt(down * draft.meters)} m</b> groß ({fmt(across)} × {fmt(down)} Felder).
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3">
        {saved && <span className="text-sm text-emerald-300">✓ Gespeichert</span>}
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            onSave(draft)
            setSaved(true)
          }}
        >
          {saveLabel}
        </button>
      </div>
    </div>
  )
}

function Nudge({ label, onClick, children }) {
  return (
    <button type="button" onClick={onClick} title={label} aria-label={label} className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-700 text-stone-200 hover:border-amber-500">
      {children}
    </button>
  )
}
