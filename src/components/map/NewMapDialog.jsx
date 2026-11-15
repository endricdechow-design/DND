import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { translateError } from '../../lib/errors'
import { createMapFromFile, createMapFromLibrary } from '../../lib/maps'

/** Neue Nebelkarte: Bild hochladen oder eine Karte aus der Bibliothek nehmen */
export default function NewMapDialog({ gameId, onCreated }) {
  const [libraryMaps, setLibraryMaps] = useState(null)
  const [name, setName] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('library_items')
      .select('id, name, image_url, folder, data')
      .eq('game_id', gameId)
      .eq('type', 'map')
      .not('image_url', 'is', null)
      .order('name')
      .then(({ data }) => setLibraryMaps(data ?? []))
  }, [gameId])

  async function run(fn) {
    setBusy(true)
    setError('')
    try {
      onCreated(await fn())
    } catch (err) {
      setError(translateError(err.message))
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="pr-8">
        <h2 className="title text-2xl">🗺️ Neue Karte</h2>
        <p className="text-sm text-stone-400">Die Karte ist zuerst komplett im Nebel. Du deckst danach auf, was die Gruppe sieht.</p>
      </div>

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          run(() => createMapFromFile(gameId, name.trim(), file))
        }}
      >
        <h3 className="font-semibold text-stone-200">Bild hochladen</h3>
        <input className="input" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="Name, z. B. Die verlassene Mine" />
        <label className="btn-ghost w-full cursor-pointer justify-center">
          🖼️ {file ? file.name : 'Kartenbild auswählen'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (!f) return
              setFile(f)
              if (!name.trim()) setName(f.name.replace(/\.[^.]+$/, '').slice(0, 80))
            }}
          />
        </label>
        <button type="submit" className="btn-primary w-full" disabled={busy || !file || !name.trim()}>
          {busy ? 'Lade hoch …' : 'Karte anlegen'}
        </button>
      </form>

      <div className="space-y-2">
        <h3 className="font-semibold text-stone-200">… oder aus der Bibliothek</h3>
        {libraryMaps === null ? (
          <p className="text-sm text-stone-500">Lade …</p>
        ) : libraryMaps.length === 0 ? (
          <p className="text-sm text-stone-500">In der Bibliothek gibt es noch keine Karten mit Bild.</p>
        ) : (
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {libraryMaps.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(() => createMapFromLibrary(gameId, m))}
                  className="flex w-full items-center gap-3 rounded-xl border border-stone-700 p-2 text-left transition hover:border-amber-500 disabled:opacity-50"
                >
                  <img src={m.image_url} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-stone-100">{m.name}</span>
                    <span className="block truncate text-xs text-stone-500">
                      {m.folder ? `📁 ${m.folder}` : ''}
                      {m.data?.rooms?.length ? ` · 🏠 ${m.data.rooms.length} Räume vorbereitet` : ''}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="alert-error">{error}</p>}
    </div>
  )
}
