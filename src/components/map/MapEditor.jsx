import { useRef, useState } from 'react'
import { BRUSH_SIZES, roomShape } from '../../lib/fog'
import MapCanvas from './MapCanvas'
import MapToolbar from './MapToolbar'
import RoomList from './RoomList'
import RoomsEditor from './RoomsEditor'
import GridEditor from './GridEditor'
import { hasGrid, normalizeGrid } from '../../lib/grid'
import NameDialog from '../NameDialog'
import { ask } from '../../lib/confirm'

/**
 * Spielleiter: Nebel aufdecken/verdecken, Räume vorbereiten, Tisch-Bildschirm lenken.
 * onUpdate(patch) speichert Änderungen an der Karte (fog, rooms, view, name).
 */
export default function MapEditor({ map, onUpdate, onShow, onDelete }) {
  const [tab, setTab] = useState('fog') // 'fog' | 'rooms'
  const [tool, setTool] = useState('rect')
  const [brush, setBrush] = useState(BRUSH_SIZES[1].r)
  const [mode, setMode] = useState('reveal') // aufdecken oder verdecken
  const [playerView, setPlayerView] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const viewRef = useRef(null)

  const fog = map.fog ?? []
  const gridOrNull = hasGrid(map.grid) ? normalizeGrid(map.grid) : null
  const rooms = map.rooms ?? []
  const addOp = (op) => onUpdate({ fog: [...fog, op] })

  return (
    <section className="card space-y-4">
      {/* Kopf: Name + Zeigen */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <button type="button" onClick={() => setRenaming(true)} className="title truncate text-left text-2xl hover:text-amber-100" title="Umbenennen">
            {map.name} <span className="text-base text-stone-600">✏️</span>
          </button>
          <p className={`text-sm ${map.active ? 'text-green-300' : 'text-stone-500'}`}>
            {map.active ? '👁️ Die Spieler sehen diese Karte gerade.' : '🔒 Die Spieler sehen diese Karte noch nicht.'}
          </p>
        </div>
        <button type="button" className={map.active ? 'btn-secondary' : 'btn-primary'} onClick={() => onShow(!map.active)}>
          {map.active ? '🙈 Nicht mehr zeigen' : '👁️ Den Spielern zeigen'}
        </button>
      </div>

      <div className="flex gap-2 border-b border-stone-800">
        {[
          ['fog', '🌫️ Nebel'],
          ['rooms', `🏠 Räume (${rooms.length})`],
          ['grid', '📐 Raster'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${tab === key ? 'border-amber-500 text-amber-200' : 'border-transparent text-stone-400 hover:text-stone-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'grid' ? (
        <GridEditor imageUrl={map.image_url} rooms={rooms} grid={map.grid} onSave={(grid) => onUpdate({ grid })} />
      ) : tab === 'rooms' ? (
        <RoomsEditor imageUrl={map.image_url} rooms={rooms} grid={gridOrNull} onChange={(next) => onUpdate({ rooms: next })} />
      ) : (
        <>
          <MapToolbar tool={tool} setTool={setTool} brush={brush} setBrush={setBrush}>
            <div className="flex overflow-hidden rounded-lg border border-stone-700">
              {[
                ['reveal', '☀️ Aufdecken'],
                ['hide', '🌫️ Verdecken'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMode(key)}
                  className={`px-3 py-2 text-sm ${mode === key ? (key === 'reveal' ? 'bg-amber-500/20 text-amber-200' : 'bg-sky-500/20 text-sky-200') : 'text-stone-400 hover:bg-stone-800'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button type="button" className="btn-ghost px-3 py-2 text-sm" disabled={!fog.length} onClick={() => onUpdate({ fog: fog.slice(0, -1) })}>
              ↶ Rückgängig
            </button>
          </MapToolbar>

          <MapCanvas
            imageUrl={map.image_url}
            grid={gridOrNull}
            ops={fog}
            rooms={rooms}
            showRooms={!playerView}
            fogStyle={playerView ? 'opaque' : 'gm'}
            tool={playerView ? 'move' : tool}
            brushR={brush}
            onShape={(shape) => addOp({ ...shape, mode })}
            viewRef={viewRef}
            className="h-[65vh] min-h-80 rounded-xl border border-stone-800"
          />

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-stone-700 px-3 py-2 text-sm text-stone-300">
              <input type="checkbox" checked={playerView} onChange={(e) => setPlayerView(e.target.checked)} className="accent-amber-500" />
              👁️ So sehen es die Spieler
            </label>
            <button type="button" className="btn-ghost px-3 py-2 text-sm" onClick={async () => (await ask('Wirklich die ganze Karte aufdecken? Die Spieler sehen dann sofort alles.', { confirmLabel: '☀️ Aufdecken' })) && addOp({ t: 'all', mode: 'reveal' })}>☀️ Alles aufdecken</button>
            <button type="button" className="btn-ghost px-3 py-2 text-sm" onClick={async () => (await ask('Die ganze Karte wieder in Nebel hüllen?', { confirmLabel: '🌫️ Verdecken' })) && onUpdate({ fog: [] })}>
              🌫️ Alles verdecken
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-stone-800 bg-stone-950/40 p-3">
            <span className="text-sm text-stone-400">📺 Tisch-Bildschirm:</span>
            <button type="button" className="btn-secondary px-3 py-1.5 text-sm" onClick={() => onUpdate({ view: viewRef.current?.() ?? null })}>
              Hierhin schauen
            </button>
            <button type="button" className="btn-ghost px-3 py-1.5 text-sm" disabled={!map.view} onClick={() => onUpdate({ view: null })}>
              Ganze Karte
            </button>
            <span className="text-xs text-stone-500">Zoome deine Ansicht auf den gewünschten Ausschnitt und tippe „Hierhin schauen“.</span>
          </div>

          <div>
            <h3 className="title mb-2 text-lg">🏠 Räume</h3>
            <RoomList
              rooms={rooms}
              ops={fog}
              onToggle={(room, reveal) => addOp({ ...roomShape(room), mode: reveal ? 'reveal' : 'hide', room: room.id })}
              emptyText="Tipp: Unter „Räume vorbereiten“ kannst du Räume einzeichnen – dann deckst du sie im Spiel mit einem Tipp auf."
            />
          </div>
        </>
      )}

      <div className="flex justify-end border-t border-stone-800 pt-4">
        <button type="button" className="btn-danger" onClick={onDelete}>Karte löschen</button>
      </div>

      {renaming && (
        <NameDialog
          title="Karte umbenennen"
          initial={map.name}
          onClose={() => setRenaming(false)}
          onSave={(name) => {
            onUpdate({ name })
            setRenaming(false)
          }}
        />
      )}
    </section>
  )
}
