import { useCallback, useEffect, useState } from 'react'

/**
 * Warteschlange für Meldungen, die nach `duration` ms von selbst verschwinden.
 * Die Ablaufzeit wird als fester Zeitpunkt gespeichert – so verschwindet eine
 * Meldung auch dann zuverlässig, wenn das Fenster zwischendurch im Hintergrund war.
 */
export function useTimedQueue(duration = 10000) {
  const [queue, setQueue] = useState([]) // [{ key, value, expiresAt }]

  const push = useCallback((key, value) => {
    setQueue((list) => (list.some((e) => e.key === key) ? list : [...list, { key, value, expiresAt: null }]))
  }, [])

  const dismiss = useCallback(() => setQueue((list) => list.slice(1)), [])

  const current = queue[0]

  // Ablaufzeit erst starten, wenn die Meldung wirklich angezeigt wird
  useEffect(() => {
    if (!current || current.expiresAt) return
    const expiresAt = Date.now() + duration
    setQueue((list) => list.map((e, i) => (i === 0 ? { ...e, expiresAt } : e)))
  }, [current, duration])

  useEffect(() => {
    if (!current?.expiresAt) return
    const removeIfExpired = () => {
      if (Date.now() >= current.expiresAt) setQueue((list) => (list[0]?.key === current.key ? list.slice(1) : list))
    }
    const timer = setTimeout(removeIfExpired, Math.max(0, current.expiresAt - Date.now()))
    document.addEventListener('visibilitychange', removeIfExpired)
    window.addEventListener('focus', removeIfExpired)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', removeIfExpired)
      window.removeEventListener('focus', removeIfExpired)
    }
  }, [current])

  return { current: current?.expiresAt ? current : null, count: queue.length, push, dismiss, duration }
}
