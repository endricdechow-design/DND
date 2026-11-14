import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

/**
 * Für Spielleiter: kurze Meldung, wenn in einer ihrer Runden etwas passiert
 * (z. B. "Lyra hat „Heiltrank“ benutzt"). Live + Nachschauen als Absicherung.
 */
export default function GameLogNotifier() {
  const { profile } = useAuth()
  const [messages, setMessages] = useState([])

  useEffect(() => {
    let stopped = false
    const shown = new Set()
    let lastSeen = null

    const show = (row) => {
      if (stopped || shown.has(row.id)) return
      shown.add(row.id)
      if (!lastSeen || row.created_at > lastSeen) lastSeen = row.created_at
      if (row.user_id === profile.id) return // eigene Aktionen nicht melden
      setMessages((list) => [...list, row])
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
  }, [profile.id])

  const message = messages[0]
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessages((list) => list.slice(1)), 8000)
    return () => clearTimeout(timer)
  }, [message])

  if (!message) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[60] flex justify-center px-4" role="status" aria-live="polite">
      <div key={message.id} className="gift-toast pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border-2 border-violet-500 bg-stone-900/95 p-4 backdrop-blur">
        <span className="text-3xl" aria-hidden>🧪</span>
        <p className="min-w-0 flex-1 text-stone-100">{message.text}</p>
        <button type="button" onClick={() => setMessages((list) => list.slice(1))} className="rounded-full px-2 text-stone-400 hover:text-stone-100" aria-label="Schließen">
          ✕
        </button>
      </div>
    </div>
  )
}
