import { createPortal } from 'react-dom'
import GridEditor from './GridEditor'

/** Großes Fenster über der ganzen Seite, um das Raster einer Karte einzustellen (Werkstatt) */
export default function GridOverlay({ title, imageUrl, rooms, grid, onSave, onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-stone-950/95 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="mx-auto max-w-5xl space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="title text-2xl">📐 Raster einstellen</h2>
            <p className="text-sm text-stone-400">{title} – damit weißt du im Spiel genau, wie groß alles ist.</p>
          </div>
          <button type="button" className="btn-ghost" onClick={onClose}>Abbrechen</button>
        </div>
        <GridEditor imageUrl={imageUrl} rooms={rooms} grid={grid} saveLabel="✓ Übernehmen" onSave={onSave} height="h-[60vh] min-h-80" />
      </div>
    </div>,
    document.body
  )
}
