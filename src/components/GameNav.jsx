import { useEffect, useState } from 'react'
import { NavLink } from 'react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

/**
 * Schnellnavigation innerhalb einer Runde: Lobby · Mein Charakter · Karte · Bibliothek
 * (auf allen Seiten einer Runde oben angezeigt)
 */
export default function GameNav({ gameId }) {
  const { profile } = useAuth()
  const [myCharacterId, setMyCharacterId] = useState(null)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('party_cards')
      .select('character_id')
      .eq('game_id', gameId)
      .eq('user_id', profile.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setMyCharacterId(data?.character_id ?? null)
      })
    return () => {
      cancelled = true
    }
  }, [gameId, profile.id])

  const tabs = [
    { to: `/runde/${gameId}`, label: 'Lobby', icon: '🏰', end: true },
    ...(myCharacterId ? [{ to: `/runde/${gameId}/charakter/${myCharacterId}`, label: 'Mein Charakter', icon: '🧝', end: false }] : []),
    { to: `/runde/${gameId}/karte`, label: 'Karte', icon: '🗺️', end: true },
    { to: `/runde/${gameId}/bibliothek`, label: 'Bibliothek', icon: '📚', end: true },
  ]

  return (
    <nav className="flex flex-wrap items-center gap-2" aria-label="Bereiche der Runde">
      <NavLink to="/" className="rounded-full px-3 py-2 text-sm text-stone-500 transition hover:text-amber-200" title="Alle Runden">
        ← Runden
      </NavLink>
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `rounded-full border px-4 py-2 text-sm font-medium transition ${
              isActive
                ? 'border-amber-500 bg-amber-500/15 text-amber-200'
                : 'border-stone-700 bg-stone-950/40 text-stone-300 hover:border-amber-600 hover:text-amber-200'
            }`
          }
        >
          <span aria-hidden>{tab.icon}</span> {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
