import { useState } from 'react'
import MapCanvas from './MapCanvas'
import MapToolbar from './MapToolbar'
import { TOOLS } from '../../lib/fog'
import RoomList from './RoomList'
import NameDialog from '../NameDialog'
import { ask } from '../../lib/confirm'

const ROOM_TOOLS = TOOLS.filter((t) => t.key !== 'brush')

/**
 * Räume auf einer Karte einzeichnen und benennen (ohne Nebel).
 * Wird in der Werkstatt und im Karten-Editor der Runde benutzt.
 */
export default function RoomsEditor({ imageUrl, rooms, onChange, height = 'h-[60vh] min-h-80' }) {
  const [tool, setTool] = useState('rect')
  const [pending, setPending] = useState(null) // neu gezeichnete Form, wartet auf Namen
  const [renaming, setRenaming] = useState(null)

  return (
    <div className="space-y-3">
      <MapToolbar tool={tool} setTool={setTool} tools={ROOM_TOOLS} />
      <MapCanvas
        imageUrl={imageUrl}
        rooms={rooms}
        showRooms
        fogStyle="none"
        tool={tool}
        onShape={(shape) => setPending(shape)}
        className={`rounded-xl border border-stone-800 ${height}`}
      />
      <RoomList
        rooms={rooms}
        onRename={setRenaming}
        onDelete={async (room) => (await ask(`Raum „${room.name}“ löschen?`)) && onChange(rooms.filter((r) => r.id !== room.id))}
        emptyText="Noch keine Räume. Zeichne mit ▭ oder ⬠ einen Bereich ein und gib ihm einen Namen."
      />

      {pending && (
        <NameDialog
          title="Wie heißt dieser Raum?"
          placeholder={`z. B. Raum ${rooms.length + 1}, Wachstube, Höhle …`}
          initial={`Raum ${rooms.length + 1}`}
          onClose={() => setPending(null)}
          onSave={(name) => {
            onChange([...rooms, { id: crypto.randomUUID().slice(0, 8), name, ...pending }])
            setPending(null)
          }}
        />
      )}
      {renaming && (
        <NameDialog
          title="Raum umbenennen"
          initial={renaming.name}
          onClose={() => setRenaming(null)}
          onSave={(name) => {
            onChange(rooms.map((r) => (r.id === renaming.id ? { ...r, name } : r)))
            setRenaming(null)
          }}
        />
      )}
    </div>
  )
}
