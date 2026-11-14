import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { translateError } from '../../lib/errors'
import { libraryType, rarity } from '../../data/library'

/**
 * Detailansicht eines Eintrags (für Spieler und als Vorschau).
 * canUse: Gegenstand liegt im eigenen Inventar → "Benutzen"-Knopf
 * onUsed: wird nach dem Benutzen aufgerufen
 */
export default function LibraryViewer({ item, canUse = false, onUsed }) {
  const type = libraryType(item.type)
  const r = item.type === 'item' ? rarity(item.data?.rarity) : null
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function use() {
    setBusy(true)
    setError('')
    const { error } = await supabase.rpc('use_library_item', { p_item_id: item.id })
    setBusy(false)
    if (error) return setError(translateError(error.message))
    onUsed?.(item)
  }

  return (
    <div className="space-y-4">
      <div className="pr-8">
        <p className="text-sm text-stone-500">
          {type.icon} {type.name}
          {r && <span className={`ml-1 ${r.color}`}>· {r.name}</span>}
        </p>
        <h2 className="title break-words text-2xl sm:text-3xl">{item.name}</h2>
        {item.type === 'effect' && item.data?.duration && <p className="text-sm text-amber-300">⏳ Dauer: {item.data.duration}</p>}
      </div>
      {item.image_url && (
        <div className="space-y-1">
          <img src={item.image_url} alt={item.name} className="max-h-[60vh] w-full rounded-xl bg-stone-900 object-contain" />
          <a href={item.image_url} target="_blank" rel="noreferrer" className="text-sm text-amber-400 hover:text-amber-300">
            🔍 In voller Größe öffnen
          </a>
        </div>
      )}
      {item.description ? (
        <p className="whitespace-pre-wrap text-stone-300">{item.description}</p>
      ) : (
        !item.image_url && <p className="text-sm text-stone-500">Keine Beschreibung.</p>
      )}

      {canUse && item.type === 'item' && (
        <div className="border-t border-stone-800 pt-4">
          {error && <p className="alert-error mb-3">{error}</p>}
          {confirming ? (
            <div className="space-y-3 rounded-xl border border-amber-700/60 bg-amber-950/20 p-4 text-center">
              <p className="text-stone-200">
                „<b className="text-amber-200">{item.name}</b>“ wirklich benutzen?
              </p>
              <p className="text-sm text-stone-400">Der Gegenstand wird aus deinem Inventar entfernt. Dein Spielleiter bekommt Bescheid.</p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
                <button type="button" className="btn-ghost" onClick={() => setConfirming(false)} disabled={busy}>Abbrechen</button>
                <button type="button" className="btn-primary" onClick={use} disabled={busy}>
                  {busy ? 'Benutze …' : '🧪 Ja, benutzen'}
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="btn-secondary w-full" onClick={() => setConfirming(true)}>
              🧪 Benutzen
            </button>
          )}
        </div>
      )}
    </div>
  )
}
