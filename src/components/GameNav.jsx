import { useEffect, useState } from 'react'
import { NavLink } from 'react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

/**
 * Schnellnavigation innerhalb einer Runde: Lobby · Mein Charakter · Karte · Bibliothek
 * Am PC oben auf der Seite, am Handy als feste Leiste am unteren Rand (wie bei einer App).
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

  // Am Handy: unten liegende Leiste – schwebende Knöpfe rutschen darüber
  useEffect(() => {
    document.body.dataset.bottomNav = '1'
    return () => {
      delete document.body.dataset.bottomNav
    }
  }, [])

  const tabs = [
    { to: `/runde/${gameId}`, label: 'Lobby', icon: '🏰', end: true },
    ...(myCharacterId ? [{ to: `/runde/${gameId}/charakter/${myCharacterId}`, label: 'Mein Charakter', short: 'Held', icon: '🧝', end: false }] : []),
    { to: `/runde/${gameId}/karte`, label: 'Karte', icon: '🗺️', end: true },
    { to: `/runde/${gameId}/bibliothek`, label: 'Bibliothek', icon: '📚', end: true },
  ]

  return (
    <>
      {/* PC / Tablet: oben */}
      <nav className="hidden flex-wrap items-center gap-2 sm:flex" aria-label="Bereiche der Runde">
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

      {/* Handy: feste Leiste unten */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-amber-900/40 bg-stone-950/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgb(0_0_0/0.5)] backdrop-blur sm:hidden"
        aria-label="Bereiche der Runde"
      >
        <div className="mx-auto flex max-w-md">
          {[{ to: '/', label: 'Runden', icon: '🏠', end: true }, ...tabs].map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 px-1 pb-2 pt-2 text-[11px] font-medium transition ${
                  isActive ? 'text-amber-300' : 'text-stone-500 active:text-stone-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`flex h-8 w-12 items-center justify-center rounded-full text-xl transition ${isActive ? 'bg-amber-500/20' : ''}`} aria-hidden>
                    {tab.icon}
                  </span>
                  <span className="truncate">{tab.short ?? tab.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  )
}
