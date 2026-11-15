import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { libraryType, rarity } from '../../data/library'
import { formatKg, itemWeight, totalWeight } from '../../lib/inventory'
import Modal from '../Modal'
import InfoTip from '../compendium/InfoTip'
import GiveDialog from './GiveDialog'
import LibraryViewer from './LibraryViewer'
import FoundItemDialog from './FoundItemDialog'

/**
 * Inventar & Effekte eines Spielers auf dem Charakterbogen (live).
 * player:   { user_id, label, short } – für den "Geben"-Knopf des Spielleiters
 * canGive:  Spielleiter darf geben
 * capacity: Traglast in kg
 * gameIdForFound: gesetzt, wenn der eigene Bogen angezeigt wird ("Gefunden"-Knopf)
 */
export default function OwnedFromLibrary({ gameId, player, canGive, capacity, gameIdForFound }) {
  const [entries, setEntries] = useState([]) // [{ item, quantity }]
  const [pending, setPending] = useState([])
  const [dialog, setDialog] = useState(null) // 'give' | 'found' | { view: entry }
  const { profile } = useAuth()
  const isMine = profile.id === player.user_id

  const load = useCallback(async () => {
    const [{ data }, { data: requests }] = await Promise.all([
      supabase.from('library_assignments').select('quantity, library_items(*)').eq('game_id', gameId).eq('user_id', player.user_id),
      supabase.from('item_requests').select('id, name, quantity, data').eq('game_id', gameId).eq('user_id', player.user_id).eq('status', 'pending'),
    ])
    setEntries((data ?? []).filter((row) => row.library_items).map((row) => ({ item: row.library_items, quantity: row.quantity ?? 1 })))
    setPending(requests ?? [])
  }, [gameId, player.user_id])

  useEffect(() => {
    load()
    const channel = supabase
      .channel(`owned-${player.user_id}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'library_assignments', filter: `user_id=eq.${player.user_id}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'item_requests', filter: `user_id=eq.${player.user_id}` }, load)
      .subscribe()
    // Absicherung, falls die Live-Verbindung eingeschlafen ist
    const interval = setInterval(load, 15000)
    const onVisible = () => document.visibilityState === 'visible' && load()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('dnd:game-log', load)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('dnd:game-log', load)
      supabase.removeChannel(channel)
    }
  }, [load, player.user_id])

  const shown = entries
    .filter((e) => e.item.type === 'item' || e.item.type === 'effect')
    .sort((a, b) => a.item.type.localeCompare(b.item.type) || a.item.name.localeCompare(b.item.name, 'de'))
  const carried = totalWeight(entries.filter((e) => e.item.type === 'item'))
  const pendingWeight = pending.reduce((sum, r) => sum + itemWeight(r) * r.quantity, 0)
  const loadWithPending = carried + pendingWeight
  const overloaded = capacity != null && loadWithPending > capacity
  const percent = capacity ? Math.min(100, Math.round((loadWithPending / capacity) * 100)) : 0

  if (!shown.length && !pending.length && !canGive && !gameIdForFound) return null

  return (
    <section className="card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="title text-xl">🎒 Inventar & Effekte</h2>
        <div className="flex flex-wrap items-center gap-3">
          {gameIdForFound && (
            <button type="button" className="btn-secondary px-3 py-1.5 text-sm" onClick={() => setDialog('found')}>
              ＋ Gefunden
            </button>
          )}
          {canGive && (
            <button type="button" className="btn-secondary px-3 py-1.5 text-sm" onClick={() => setDialog('give')}>
              🎁 Aus der Bibliothek geben
            </button>
          )}
          <Link to={`/runde/${gameId}/bibliothek`} className="text-sm text-amber-400 hover:text-amber-300">Bibliothek →</Link>
        </div>
      </div>

      {/* Traglast */}
      {capacity != null && (
        <div>
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span className="text-stone-400">⚖️ Traglast<InfoTip id="grundregeln:traglast" /></span>
            <span className={overloaded ? 'font-semibold text-red-300' : 'text-stone-300'}>
              {formatKg(loadWithPending)} / {formatKg(capacity)}
              {pendingWeight > 0 && <span className="text-stone-500"> (inkl. {formatKg(pendingWeight)} wartend)</span>}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-stone-800">
            <div className={`h-full ${overloaded ? 'bg-red-600' : percent > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${percent}%` }} />
          </div>
          {overloaded && <p className="mt-1 text-xs text-red-300">Überladen – Bewegung eingeschränkt, du kannst nichts mehr aufsammeln.</p>}
        </div>
      )}

      {shown.length ? (
        <ul className="flex flex-wrap gap-2">
          {shown.map(({ item, quantity }) => {
            const r = item.type === 'item' ? rarity(item.data?.rarity) : null
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setDialog({ view: { item, quantity } })}
                  className={`rounded-full border px-3 py-1.5 text-sm transition hover:border-amber-500 ${
                    item.type === 'effect' ? 'border-sky-800 bg-sky-950/40 text-sky-200' : 'border-stone-700 bg-stone-950/40'
                  }`}
                >
                  {libraryType(item.type).icon} <span className={r?.color ?? ''}>{item.name}</span>
                  {quantity > 1 && <span className="ml-1 text-amber-300">×{quantity}</span>}
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-stone-500">Noch nichts im Inventar.</p>
      )}

      {pending.length > 0 && (
        <div>
          <p className="mb-2 text-xs text-stone-500">Wartet auf Bestätigung durch den Spielleiter:</p>
          <ul className="flex flex-wrap gap-2">
            {pending.map((r) => (
              <li key={r.id} className="rounded-full border border-dashed border-amber-800 px-3 py-1.5 text-sm text-stone-400">
                ⏳ {r.name}{r.quantity > 1 ? ` ×${r.quantity}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      {dialog === 'give' && (
        <Modal onClose={() => setDialog(null)}>
          <GiveDialog gameId={gameId} player={player} onGiven={load} onClose={() => setDialog(null)} />
        </Modal>
      )}
      {dialog === 'found' && (
        <Modal onClose={() => setDialog(null)}>
          <FoundItemDialog gameId={gameIdForFound} load={loadWithPending} capacity={capacity} onSent={load} onClose={() => setDialog(null)} />
        </Modal>
      )}
      {dialog?.view && (
        <Modal onClose={() => setDialog(null)}>
          <LibraryViewer
            item={dialog.view.item}
            quantity={dialog.view.quantity}
            canUse={isMine}
            onUsed={() => {
              setDialog(null)
              load()
            }}
          />
        </Modal>
      )}
    </section>
  )
}
