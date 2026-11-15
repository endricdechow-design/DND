import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router'
import { supabase } from '../lib/supabase'
import MapCanvas from '../components/map/MapCanvas'

/**
 * Tisch-Bildschirm: zeigt dauerhaft die Karte, die der Spielleiter gerade zeigt –
 * mit Nebel, ohne Menüs, ohne Anmeldung (Zugang über den Code im Link).
 */
export default function TablePage() {
  const { code } = useParams()
  const [state, setState] = useState(undefined) // undefined = lädt, null = Code ungültig
  const [controls, setControls] = useState(true)
  const [banner, setBanner] = useState(null)
  const lastMapId = useRef(null)
  const hideTimer = useRef(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_display_state', { p_code: code })
    if (error) return // z. B. kurz offline → beim nächsten Mal wieder versuchen
    setState(data ?? null)
  }, [code])

  // Laden + regelmäßig nachschauen
  useEffect(() => {
    load()
    const interval = setInterval(load, 4000)
    return () => clearInterval(interval)
  }, [load])

  // Sofort neu laden, wenn der Spielleiter etwas ändert
  const gameId = state?.game_id
  useEffect(() => {
    if (!gameId) return
    const channel = supabase
      .channel(`map-${gameId}`)
      .on('broadcast', { event: 'changed' }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId, load])

  // Neue Karte → Namen kurz einblenden
  const map = state?.map
  const mapId = map?.id
  const mapName = map?.name
  useEffect(() => {
    if (!mapId || mapId === lastMapId.current) return
    lastMapId.current = mapId
    setBanner(mapName)
  }, [mapId, mapName])
  useEffect(() => {
    if (!banner) return
    const t = setTimeout(() => setBanner(null), 5000)
    return () => clearTimeout(t)
  }, [banner])

  // Bildschirm nicht ausgehen lassen (wo der Browser das kann)
  useEffect(() => {
    let lock = null
    const request = async () => {
      try {
        lock = await navigator.wakeLock?.request('screen')
      } catch {
        // nicht erlaubt oder nicht unterstützt
      }
    }
    request()
    const onVisible = () => document.visibilityState === 'visible' && request()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      lock?.release?.()
    }
  }, [])

  // Knöpfe nach ein paar Sekunden ausblenden, bei Bewegung wieder zeigen
  const poke = useCallback(() => {
    setControls(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setControls(false), 4000)
  }, [])
  useEffect(() => {
    poke()
    return () => clearTimeout(hideTimer.current)
  }, [poke])

  const canFullscreen = Boolean(document.documentElement.requestFullscreen)
  const toggleFullscreen = () =>
    document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {})

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#0c0a09] text-stone-200" onPointerMove={poke} onPointerDown={poke}>
      {state === undefined ? (
        <Center>
          <p className="title animate-pulse text-2xl">Die Karte wird entrollt …</p>
        </Center>
      ) : state === null ? (
        <Center>
          <p className="text-5xl">🔒</p>
          <p className="title text-2xl">Dieser Tisch-Code ist ungültig</p>
          <p className="max-w-md text-center text-stone-400">
            Bitte den Spielleiter um den aktuellen Link (Karte → 📺 Tisch-Bildschirm).
          </p>
        </Center>
      ) : map ? (
        <MapCanvas key={map.id} imageUrl={map.image_url} ops={map.fog} fogStyle="opaque" followView={map.view ?? null} className="h-full w-full" />
      ) : (
        <Center>
          <p className="text-6xl">🐉</p>
          <p className="title text-3xl">{state.game_name}</p>
          <p className="animate-pulse text-stone-500">Warte auf die Karte des Spielleiters …</p>
        </Center>
      )}

      {banner && (
        <div className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 rounded-full border border-amber-700/60 bg-stone-950/85 px-6 py-2 font-display text-2xl text-amber-200 shadow-2xl">
          🗺️ {banner}
        </div>
      )}

      {canFullscreen && (
        <button
          type="button"
          onClick={toggleFullscreen}
          className={`absolute bottom-4 right-4 rounded-lg border border-stone-700 bg-stone-950/85 px-4 py-2 text-sm transition-opacity hover:border-amber-500 ${
            controls ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          ⛶ Vollbild
        </button>
      )}
    </div>
  )
}

function Center({ children }) {
  return <div className="flex h-full flex-col items-center justify-center gap-3 p-6">{children}</div>
}
