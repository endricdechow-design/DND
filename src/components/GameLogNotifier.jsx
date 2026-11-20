import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useTimedQueue } from '../lib/useTimedQueue'
import { logLink } from '../lib/notifyTargets'

/**
 * Kurze Meldungen aus dem Protokoll: für Spielleiter, wenn Spieler etwas tun
 * (benutzt, gefunden), für Spieler, wenn sich eine Meldung an sie richtet
 * (z. B. Fund abgelehnt). Live + Nachschauen als Absicherung.
 */
const ICONS = { item_used: '🧪', item_found: '🔍', item_rejected: '❌', xp_awarded: '✨' }

export default function GameLogNotifier() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { current, push, dismiss, duration } = useTimedQueue(10000)

  useEffect(() => {
    let stopped = false
    const shown = new Set()
    let lastSeen = null

    const show = (row) => {
      if (stopped || shown.has(row.id)) return
      shown.add(row.id)
      if (!lastSeen || row.created_at > lastSeen) lastSeen = row.created_at
      // Andere Seiten (z. B. Bibliothek) informieren, damit sie neu laden
      window.dispatchEvent(new CustomEvent('dnd:game-log', { detail: row }))
      // Eigene Aktionen nicht melden – außer die Meldung richtet sich ausdrücklich an mich
      if (row.user_id === profile.id && row.target_user_id !== profile.id) return
      if (row.target_user_id && row.target_user_id !== profile.id) return
      push(row.id, row)
    }

    async function check() {
      if (!lastSeen) return
      const { data } = await supabase.from('game_log').select('*').gt('created_at', lastSeen).order('created_at')
      for (const row of data ?? []) show(row)
    }

    async function start() {
      const { data } = await supabase.from('game_log').select('created_at').order('created_at', { ascending: false }).limit(1)
      lastSeen = data?.[0]?.created_at ?? '1970-01-01T00:00:00Z'
    }
    start()

    const channel = supabase
      .channel(`gamelog-${profile.id}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_log' }, ({ new: row }) => show(row))
      .subscribe()
    const interval = setInterval(check, 15000)
    const onVisible = () => document.visibilityState === 'visible' && check()
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      stopped = true
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      supabase.removeChannel(channel)
    }
  }, [profile.id, push])

  if (!current) return null
  const message = current.value

  async function open() {
    dismiss()
    navigate(await logLink(message, profile.id))
  }
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[60] flex justify-center px-4" role="status" aria-live="polite">
      <div
        key={current.key}
        role="button"
        tabIndex={0}
        onClick={open}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && open()}
        title="Antippen zum Öffnen"
        className="gift-toast pointer-events-auto relative flex w-full max-w-sm cursor-pointer items-center gap-3 overflow-hidden rounded-2xl border-2 border-violet-500 bg-stone-900/95 p-4 backdrop-blur transition hover:border-violet-300"
      >
        <span className="toast-countdown absolute inset-x-0 bottom-0 h-1 bg-violet-400/70" style={{ animationDuration: `${duration}ms` }} />
        <span className="text-3xl" aria-hidden>{ICONS[message.kind] ?? '📜'}</span>
        <div className="min-w-0 flex-1">
          <p className="text-stone-100">{message.text}</p>
          <p className="mt-1 text-xs text-violet-300">Antippen zum Öffnen →</p>
        </div>
        <button type="button" onClick={(e) => { e.stopPropagation(); dismiss() }} className="rounded-full px-2 text-stone-400 hover:text-stone-100" aria-label="Schließen">
          ✕
        </button>
      </div>
    </div>
  )
}
