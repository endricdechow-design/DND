import { isRoomRevealed } from '../../lib/fog'

/**
 * Liste der vorbereiteten Räume.
 * Im Spiel (onToggle): mit einem Tipp auf-/zudecken. Beim Vorbereiten (onRename/onDelete): bearbeiten.
 */
export default function RoomList({ rooms, ops, onToggle, onRename, onDelete, emptyText }) {
  if (!rooms.length) return <p className="text-sm text-stone-500">{emptyText}</p>
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {rooms.map((room) => {
        const revealed = onToggle && isRoomRevealed(ops, room.id)
        return (
          <li key={room.id} className="flex items-center gap-2 rounded-xl border border-stone-800 bg-stone-950/40 p-2 pl-3">
            <span className="min-w-0 flex-1 truncate text-stone-100">
              {onToggle && <span aria-hidden>{revealed ? '☀️ ' : '🌫️ '}</span>}
              {room.name}
            </span>
            {onToggle && (
              <button
                type="button"
                onClick={() => onToggle(room, !revealed)}
                className={revealed ? 'btn-ghost px-3 py-1.5 text-sm' : 'btn-primary px-3 py-1.5 text-sm'}
              >
                {revealed ? 'Verdecken' : 'Aufdecken'}
              </button>
            )}
            {onRename && (
              <button type="button" className="rounded-lg px-2 py-1.5 text-stone-400 hover:bg-stone-800" title="Umbenennen" onClick={() => onRename(room)}>✏️</button>
            )}
            {onDelete && (
              <button type="button" className="rounded-lg px-2 py-1.5 text-stone-400 hover:bg-red-950/50 hover:text-red-300" title="Löschen" onClick={() => onDelete(room)}>🗑️</button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
