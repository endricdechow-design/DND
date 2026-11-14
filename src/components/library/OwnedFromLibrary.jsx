import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { libraryType, rarity } from '../../data/library'
import Modal from '../Modal'
import GiveDialog from './GiveDialog'
import LibraryViewer from './LibraryViewer'

/**
 * Inventar & Effekte eines Spielers auf dem Charakterbogen (live).
 * player: { user_id, label, short } – für den "Geben"-Knopf des Spielleiters
 */
export default function OwnedFromLibrary({ gameId, player, canGive }) {
  const [entries, setEntries] = useState([])
  const [giving, setGiving] = useState(false)
  const [viewing, setViewing] = useState(null)
  const { profile } = useAuth()
  const isMine = profile.id === player.user_id

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('library_assignments')
      .select('library_items(*)')
      .eq('game_id', gameId)
      .eq('user_id', player.user_id)
    setEntries((data ?? []).map((row) => row.library_items).filter(Boolean))
  }, [gameId, player.user_id])

  useEffect(() => {
    load()
    const channel = supabase
      .channel(`owned-${player.user_id}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'library_assignments', filter: `user_id=eq.${player.user_id}` }, load)
      .subscribe()
    // Absicherung, falls die Live-Verbindung eingeschlafen ist
    const interval = setInterval(load, 15000)
    const onVisible = () => document.visibilityState === 'visible' && load()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      supabase.removeChannel(channel)
    }
  }, [load, player.user_id])

  if (!entries.length && !canGive) return null

  const sorted = [...entries].sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name, 'de'))

  return (
    <section className="card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="title text-xl">🎒 Inventar & Effekte</h2>
        <div className="flex items-center gap-3">
          {canGive && (
            <button type="button" className="btn-secondary px-3 py-1.5 text-sm" onClick={() => setGiving(true)}>
              🎁 Aus der Bibliothek geben
            </button>
          )}
          <Link to={`/runde/${gameId}/bibliothek`} className="text-sm text-amber-400 hover:text-amber-300">Bibliothek →</Link>
        </div>
      </div>

      {sorted.length ? (
        <ul className="flex flex-wrap gap-2">
          {sorted.map((e) => {
            const r = e.type === 'item' ? rarity(e.data?.rarity) : null
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setViewing(e)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition hover:border-amber-500 ${
                    e.type === 'effect' ? 'border-sky-800 bg-sky-950/40 text-sky-200' : 'border-stone-700 bg-stone-950/40'
                  }`}
                >
                  {libraryType(e.type).icon} <span className={r?.color ?? ''}>{e.name}</span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-stone-500">Noch nichts im Inventar.</p>
      )}

      {giving && (
        <Modal onClose={() => setGiving(false)}>
          <GiveDialog gameId={gameId} player={player} onGiven={load} onClose={() => setGiving(false)} />
        </Modal>
      )}
      {viewing && (
        <Modal onClose={() => setViewing(null)}>
          <LibraryViewer
            item={viewing}
            canUse={isMine}
            onUsed={() => {
              setViewing(null)
              load()
            }}
          />
        </Modal>
      )}
    </section>
  )
}
