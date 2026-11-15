import { useState } from 'react'
import { createPortal } from 'react-dom'
import RoomsEditor from './RoomsEditor'

/** Großes Fenster über der ganzen Seite, um Räume auf einer Karte einzuzeichnen */
export default function RoomsOverlay({ title, imageUrl, rooms: initialRooms, onSave, onClose }) {
  const [rooms, setRooms] = useState(initialRooms ?? [])
  return createPortal(
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-stone-950/95 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="mx-auto max-w-5xl space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="title text-2xl">🏠 Räume einzeichnen</h2>
            <p className="text-sm text-stone-400">{title} – im Spiel deckst du jeden Raum dann mit einem Tipp auf.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Abbrechen</button>
            <button type="button" className="btn-primary" onClick={() => onSave(rooms)}>✓ Übernehmen</button>
          </div>
        </div>
        <RoomsEditor imageUrl={imageUrl} rooms={rooms} onChange={setRooms} height="h-[65vh] min-h-80" />
      </div>
    </div>,
    document.body
  )
}
