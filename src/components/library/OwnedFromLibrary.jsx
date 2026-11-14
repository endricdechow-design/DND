import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { supabase } from '../../lib/supabase'
import { libraryType, rarity } from '../../data/library'

// Kompakte Liste: Gegenstände und Effekte, die einem Spieler zugeteilt wurden
export default function OwnedFromLibrary({ gameId, userId }) {
  const [entries, setEntries] = useState([])

  useEffect(() => {
    let cancelled = false
    supabase
      .from('library_assignments')
      .select('library_items(id, type, name, data)')
      .eq('game_id', gameId)
      .eq('user_id', userId)
      .then(({ data }) => {
        if (!cancelled) setEntries((data ?? []).map((row) => row.library_items).filter(Boolean))
      })
    return () => {
      cancelled = true
    }
  }, [gameId, userId])

  const shown = entries.filter((e) => e.type === 'item' || e.type === 'effect')
  if (!shown.length) return null

  return (
    <section className="card">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="title text-xl">🎒 Inventar & Effekte</h2>
        <Link to={`/runde/${gameId}/bibliothek`} className="text-sm text-amber-400 hover:text-amber-300">Zur Bibliothek →</Link>
      </div>
      <ul className="flex flex-wrap gap-2">
        {shown
          .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name, 'de'))
          .map((e) => {
            const r = e.type === 'item' ? rarity(e.data?.rarity) : null
            return (
              <li key={e.id} className={`rounded-full border px-3 py-1.5 text-sm ${e.type === 'effect' ? 'border-sky-800 bg-sky-950/40 text-sky-200' : 'border-stone-700 bg-stone-950/40'}`}>
                {libraryType(e.type).icon} <span className={r?.color ?? ''}>{e.name}</span>
              </li>
            )
          })}
      </ul>
    </section>
  )
}
