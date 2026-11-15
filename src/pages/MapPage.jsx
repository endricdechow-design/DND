import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { translateError } from '../lib/errors'
import { deleteMap } from '../lib/maps'
import { useCompendium } from '../lib/compendium'
import GameNav from '../components/GameNav'
import GameMasterBanner from '../components/GameMasterBanner'
import Modal from '../components/Modal'
import MapCanvas from '../components/map/MapCanvas'
import MapEditor from '../components/map/MapEditor'
import NewMapDialog from '../components/map/NewMapDialog'
import DisplayDialog from '../components/map/DisplayDialog'

const GM_GUIDE = 'spielleiter:nebelkarte'

export default function MapPage() {
  const { gameId } = useParams()
  return <Maps key={gameId} gameId={gameId} />
}

function Maps({ gameId }) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState(null)
  const [maps, setMaps] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [showDisplay, setShowDisplay] = useState(false)
  const [error, setError] = useState('')
  const channelRef = useRef(null)
  const roleRef = useRef(null)
  const { open: openCompendium } = useCompendium()

  const isGM = role === 'gm'

  const load = useCallback(async () => {
    const [{ data: membership }, { data: rows, error }] = await Promise.all([
      supabase.from('game_members').select('role').eq('game_id', gameId).eq('user_id', profile.id).maybeSingle(),
      supabase.from('battle_maps').select('*').eq('game_id', gameId).order('created_at'),
    ])
    if (!membership) {
      navigate('/', { replace: true })
      return
    }
    if (error) setError(translateError(error.message))
    setRole(membership.role)
    roleRef.current = membership.role
    setMaps(rows ?? [])
  }, [gameId, profile.id, navigate])

  // Laden + live aktualisieren
  useEffect(() => {
    load()
    // Der Spielleiter ist der Einzige, der ändert – live neu laden nur bei Spielern
    // (sonst würde ein Neuladen mitten im Zeichnen kurz alte Stände zeigen)
    const reload = () => roleRef.current !== 'gm' && load()
    const channel = supabase
      .channel(`map-${gameId}`)
      .on('broadcast', { event: 'changed' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'battle_maps', filter: `game_id=eq.${gameId}` }, reload)
      .subscribe()
    channelRef.current = channel
    const interval = setInterval(reload, 15000)
    const onVisible = () => document.visibilityState === 'visible' && load()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [gameId, load])

  // Spielleiter: Anleitung beim allerersten Besuch automatisch zeigen
  useEffect(() => {
    if (role !== 'gm') return
    try {
      if (localStorage.getItem('dnd:map-guide-seen')) return
      localStorage.setItem('dnd:map-guide-seen', '1')
    } catch {
      return // Speicher nicht verfügbar → lieber nicht jedes Mal öffnen
    }
    openCompendium(GM_GUIDE)
  }, [role, openCompendium])

  const notifyChanged = () => channelRef.current?.send({ type: 'broadcast', event: 'changed', payload: {} })

  if (!maps || !role) return <p className="title animate-pulse text-center text-xl">Entrolle die Karte …</p>

  // ---------------- Spieler ----------------
  if (!isGM) {
    const map = maps.find((m) => m.active)
    return (
      <div className="space-y-6">
        <GameNav gameId={gameId} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="title text-3xl">🗺️ {map ? map.name : 'Karte'}</h1>
          <button type="button" className="btn-ghost px-3 py-2 text-sm" onClick={() => openCompendium('einstieg:karte')}>❓ Hilfe</button>
        </div>
        {error && <p className="alert-error">{error}</p>}
        {map ? (
          <MapCanvas key={map.id} imageUrl={map.image_url} ops={map.fog} fogStyle="opaque" className="h-[70vh] min-h-80 rounded-2xl border border-stone-800" />
        ) : (
          <p className="card text-center text-stone-400">🌫️ Der Spielleiter zeigt gerade keine Karte. Sobald er eine zeigt, erscheint sie hier von selbst.</p>
        )}
      </div>
    )
  }

  // ---------------- Spielleiter ----------------
  const selected = maps.find((m) => m.id === selectedId) ?? maps.find((m) => m.active) ?? maps[0]

  async function update(map, patch) {
    setMaps((list) => list.map((m) => (m.id === map.id ? { ...m, ...patch } : m)))
    const { error } = await supabase.from('battle_maps').update(patch).eq('id', map.id)
    if (error) {
      setError(translateError(error.message))
      await load()
    } else {
      setError('')
    }
    notifyChanged()
  }

  async function show(map, active) {
    setMaps((list) => list.map((m) => ({ ...m, active: active ? m.id === map.id : false })))
    const { error } = await supabase.rpc('show_battle_map', { p_game_id: gameId, p_map_id: active ? map.id : null })
    if (error) setError(translateError(error.message))
    await load()
    notifyChanged()
  }

  async function remove(map) {
    if (!confirm(`Karte „${map.name}“ löschen? Der aufgedeckte Nebel geht dabei verloren.`)) return
    try {
      await deleteMap(map)
      setSelectedId(null)
      await load()
      notifyChanged()
    } catch (err) {
      setError(translateError(err.message))
    }
  }

  return (
    <div className="space-y-6">
      <GameNav gameId={gameId} />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="title text-3xl">🗺️ Karte</h1>
          <p className="text-stone-400">Karten mit Nebel – du deckst auf, was die Gruppe sieht.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-ghost" onClick={() => openCompendium(GM_GUIDE)}>❓ So funktioniert's</button>
          <button type="button" className="btn-secondary" onClick={() => setShowDisplay(true)}>📺 Tisch-Bildschirm</button>
          <button type="button" className="btn-primary" onClick={() => setCreating(true)}>＋ Neue Karte</button>
        </div>
      </div>

      <GameMasterBanner>
        Du siehst die ganze Karte, der Nebel ist für dich nur abgedunkelt. Die Spieler (und der Tisch-Bildschirm) sehen nur, was du aufdeckst –
        und nur die Karte, die du gerade <b>zeigst</b>.
      </GameMasterBanner>

      {error && <p className="alert-error">{error}</p>}

      {maps.length === 0 ? (
        <p className="card text-center text-stone-400">Noch keine Karten. Leg mit „＋ Neue Karte“ deine erste an – oder nimm eine Karte aus der Bibliothek.</p>
      ) : (
        <>
          {maps.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {maps.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedId(m.id)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    m.id === selected.id ? 'border-amber-500 bg-amber-500/15 text-amber-200' : 'border-stone-700 text-stone-300 hover:border-amber-600'
                  }`}
                >
                  {m.active && <span title="Wird gezeigt">👁️ </span>}
                  {m.name}
                </button>
              ))}
            </div>
          )}
          <MapEditor
            key={selected.id}
            map={selected}
            onUpdate={(patch) => update(selected, patch)}
            onShow={(active) => show(selected, active)}
            onDelete={() => remove(selected)}
          />
        </>
      )}

      {creating && (
        <Modal onClose={() => setCreating(false)}>
          <NewMapDialog
            gameId={gameId}
            onCreated={async (map) => {
              setCreating(false)
              setSelectedId(map.id)
              await load()
            }}
          />
        </Modal>
      )}
      {showDisplay && (
        <Modal onClose={() => setShowDisplay(false)}>
          <DisplayDialog gameId={gameId} />
        </Modal>
      )}
    </div>
  )
}
