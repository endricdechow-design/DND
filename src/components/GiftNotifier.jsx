import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

const TEXT = {
  item: { icon: '🎁', title: 'Du hast etwas erhalten!' },
  effect: { icon: '✨', title: 'Ein Effekt wirkt auf dich!' },
  map: { icon: '🗺️', title: 'Neue Karte für dich!' },
  handout: { icon: '📜', title: 'Neues Handout für dich!' },
}

/**
 * Hört im Hintergrund zu: Teilt der Spielleiter dem eingeloggten Spieler etwas zu,
 * erscheint eine animierte Einblendung – egal auf welcher Seite man gerade ist.
 */
export default function GiftNotifier() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [gifts, setGifts] = useState([]) // Warteschlange, die erste wird angezeigt

  useEffect(() => {
    const channel = supabase
      .channel(`gifts-${profile.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'library_assignments', filter: `user_id=eq.${profile.id}` },
        async ({ new: row }) => {
          const { data: item } = await supabase
            .from('library_items')
            .select('id, game_id, type, name, image_url')
            .eq('id', row.item_id)
            .maybeSingle()
          if (!item) return
          setGifts((list) => [...list, item])
          navigator.vibrate?.([120, 60, 120]) // kleines Brummen am Handy
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile.id])

  const gift = gifts[0]

  // Nach 10 Sekunden automatisch ausblenden
  useEffect(() => {
    if (!gift) return
    const timer = setTimeout(() => setGifts((list) => list.slice(1)), 10000)
    return () => clearTimeout(timer)
  }, [gift])

  if (!gift) return null
  const text = TEXT[gift.type] ?? TEXT.item
  const dismiss = () => setGifts((list) => list.slice(1))

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4" role="status" aria-live="polite">
      <div key={gift.id} className="gift-toast pointer-events-auto relative w-full max-w-sm rounded-2xl border-2 border-amber-500 bg-stone-900/95 p-4 backdrop-blur">
        {/* Funkeln */}
        {[8, 24, 42, 60, 76, 90].map((left, i) => (
          <span
            key={left}
            className="gift-sparkle pointer-events-none absolute -top-3 text-lg"
            style={{ left: `${left}%`, animationDelay: `${i * 0.25}s` }}
            aria-hidden
          >
            {i % 2 ? '✨' : '⭐'}
          </span>
        ))}

        <div className="relative flex items-center gap-4">
          {gift.image_url ? (
            <img src={gift.image_url} alt="" className="gift-icon h-16 w-16 shrink-0 rounded-xl object-cover ring-2 ring-amber-400" />
          ) : (
            <span className="gift-icon shrink-0 text-5xl" aria-hidden>{text.icon}</span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-300">{text.title}</p>
            <p className="title truncate text-xl">{gift.name}</p>
          </div>
          <button type="button" onClick={dismiss} className="self-start rounded-full px-2 text-stone-400 hover:text-stone-100" aria-label="Schließen">
            ✕
          </button>
        </div>

        <button
          type="button"
          className="btn-primary relative mt-3 w-full"
          onClick={() => {
            dismiss()
            navigate(`/runde/${gift.game_id}/bibliothek`)
          }}
        >
          Ansehen →
        </button>
        {gifts.length > 1 && <p className="relative mt-2 text-center text-xs text-stone-400">+ {gifts.length - 1} weitere</p>}
      </div>
    </div>
  )
}
