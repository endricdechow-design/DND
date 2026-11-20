import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useTimedQueue } from '../lib/useTimedQueue'
import { giftLink } from '../lib/notifyTargets'

const TEXT = {
  item: { icon: '🎁', title: 'Du hast etwas erhalten!' },
  effect: { icon: '✨', title: 'Ein Effekt wirkt auf dich!' },
  map: { icon: '🗺️', title: 'Neue Karte für dich!' },
  handout: { icon: '📜', title: 'Neues Handout für dich!' },
}

/**
 * Hört im Hintergrund zu: Teilt der Spielleiter dem eingeloggten Spieler etwas zu,
 * erscheint eine animierte Einblendung – egal auf welcher Seite man gerade ist.
 * Doppelt abgesichert: Live-Verbindung + regelmäßiges Nachschauen (falls die
 * Verbindung z. B. am Handy eingeschlafen ist).
 */
export default function GiftNotifier() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { current, count, push, dismiss, duration } = useTimedQueue(10000)

  useEffect(() => {
    let stopped = false
    const storageKey = `gifts-seen-${profile.id}`
    const shown = new Set() // schon angezeigte Zuteilungen (Eintrag + Zeitpunkt)
    let lastSeen = null // Zeitstempel (vom Server) der neuesten bekannten Zuteilung

    const remember = (createdAt) => {
      if (!lastSeen || createdAt > lastSeen) {
        lastSeen = createdAt
        try {
          localStorage.setItem(storageKey, createdAt)
        } catch {
          // Speichern nicht möglich (z. B. privater Modus) – nicht schlimm
        }
      }
    }

    async function showGift(row) {
      const key = `${row.item_id}|${row.created_at}`
      if (shown.has(key)) return
      shown.add(key)
      remember(row.created_at)
      const { data: item } = await supabase
        .from('library_items')
        .select('id, game_id, type, name, image_url')
        .eq('id', row.item_id)
        .maybeSingle()
      if (!item || stopped) return
      push(key, item)
      navigator.vibrate?.([120, 60, 120]) // kleines Brummen am Handy
    }

    // Absicherung: selbst nachschauen, ob seit dem letzten Mal etwas dazukam
    async function check() {
      if (!lastSeen) return
      const { data } = await supabase
        .from('library_assignments')
        .select('item_id, created_at')
        .eq('user_id', profile.id)
        .gt('created_at', lastSeen)
        .order('created_at')
      for (const row of data ?? []) await showGift(row)
    }

    async function start() {
      let stored = null
      try {
        stored = localStorage.getItem(storageKey)
      } catch {
        stored = null
      }
      if (stored) {
        // Geschenke zeigen, die kamen, während die App geschlossen war
        lastSeen = stored
        await check()
      } else {
        // Erster Start: alles Bisherige gilt als schon gesehen
        const { data } = await supabase
          .from('library_assignments')
          .select('created_at')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(1)
        remember(data?.[0]?.created_at ?? '1970-01-01T00:00:00Z')
      }
    }
    start()

    // 1) Live-Benachrichtigung (sofort)
    const channel = supabase
      .channel(`gifts-${profile.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'library_assignments', filter: `user_id=eq.${profile.id}` },
        ({ new: row }) => showGift(row)
      )
      .subscribe()

    // 2) Alle 10 Sekunden nachschauen und sofort, wenn man zur App zurückkehrt
    const interval = setInterval(check, 10000)
    const onVisible = () => document.visibilityState === 'visible' && check()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)

    return () => {
      stopped = true
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
      supabase.removeChannel(channel)
    }
  }, [profile.id, push])

  if (!current) return null
  const gift = current.value
  const text = TEXT[gift.type] ?? TEXT.item

  async function open() {
    dismiss()
    navigate(await giftLink(gift, profile.id))
  }

  return (
    <div className="above-bottom-nav pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4" role="status" aria-live="polite">
      <div
        key={current.key}
        role="button"
        tabIndex={0}
        onClick={open}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && open()}
        className="gift-toast pointer-events-auto relative w-full max-w-sm cursor-pointer rounded-2xl border-2 border-amber-500 bg-stone-900/95 p-4 backdrop-blur transition hover:border-amber-300"
        title="Antippen zum Öffnen"
      >
        <span className="toast-countdown absolute inset-x-3 bottom-1 h-1 rounded-full bg-amber-400/70" style={{ animationDuration: `${duration}ms` }} />
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
          <button type="button" onClick={(e) => { e.stopPropagation(); dismiss() }} className="self-start rounded-full px-2 text-stone-400 hover:text-stone-100" aria-label="Schließen">
            ✕
          </button>
        </div>

        <span className="btn-primary relative mt-3 w-full">
          {gift.type === 'item' || gift.type === 'effect' ? '🎒 Im Inventar ansehen →' : '📚 In der Bibliothek ansehen →'}
        </span>
        {count > 1 && <p className="relative mt-2 text-center text-xs text-stone-400">+ {count - 1} weitere</p>}
      </div>
    </div>
  )
}
