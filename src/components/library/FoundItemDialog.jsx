import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { translateError } from '../../lib/errors'
import { formatKg, parseKg } from '../../lib/inventory'
import CatalogNameInput from './CatalogNameInput'

/**
 * Spieler meldet ein Fundstück. Der Spielleiter muss es bestätigen.
 * load/capacity: aktuelles Gewicht (inkl. offener Funde) und Traglast in kg
 */
export default function FoundItemDialog({ gameId, load, capacity, onSent, onClose }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [weight, setWeight] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [extra, setExtra] = useState({}) // Seltenheit/Kurzinfo aus einem Vorschlag
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const kg = parseKg(weight) ?? 0
  const addedWeight = kg * quantity
  const overloadedAlready = capacity != null && load > capacity
  const wouldOverload = capacity != null && addedWeight > 0 && load + addedWeight > capacity

  async function send() {
    setBusy(true)
    setError('')
    const data = { ...extra, ...(parseKg(weight) !== null ? { weight: parseKg(weight) } : {}) }
    const { error } = await supabase.rpc('request_found_item', {
      p_game_id: gameId,
      p_name: name.trim(),
      p_description: description.trim(),
      p_data: data,
      p_quantity: quantity,
    })
    setBusy(false)
    if (error) return setError(translateError(error.message))
    setSent(true)
    onSent?.()
    setTimeout(onClose, 1500)
  }

  if (sent) {
    return (
      <div className="py-6 text-center">
        <p className="text-5xl">⏳</p>
        <p className="title mt-3 text-xl">Gemeldet!</p>
        <p className="text-stone-400">Dein Spielleiter muss den Fund noch bestätigen.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="pr-8">
        <h2 className="title text-2xl">🔍 Etwas gefunden?</h2>
        <p className="text-sm text-stone-400">Trag ein, was du aufsammelst. Dein Spielleiter bestätigt es, dann landet es in deinem Inventar.</p>
      </div>

      {capacity != null && (
        <p className={`text-sm ${overloadedAlready ? 'text-red-300' : 'text-stone-400'}`}>
          ⚖️ Du trägst {formatKg(load)} von {formatKg(capacity)}.
        </p>
      )}

      {overloadedAlready ? (
        <p className="alert-error">Du bist überladen und kannst nichts mehr aufsammeln. Leg erst etwas ab oder benutze etwas.</p>
      ) : (
        <>
          <div>
            <label className="label" htmlFor="foundName">Was hast du gefunden?</label>
            <CatalogNameInput
              id="foundName"
              type="item"
              value={name}
              onChange={setName}
              onPick={(entry) => {
                setName(entry.name)
                setDescription(entry.description)
                setWeight(entry.weight ? String(entry.weight).replace('.', ',') : '')
                setExtra({ rarity: entry.rarity, stat: entry.stat })
              }}
              placeholder="z. B. Seil, Fackel, Dolch …"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="foundQty">Anzahl</label>
              <input id="foundQty" type="number" min={1} max={999} inputMode="numeric" className="input" value={quantity}
                onChange={(e) => setQuantity(Math.min(999, Math.max(1, Number(e.target.value) || 1)))} />
            </div>
            <div>
              <label className="label" htmlFor="foundWeight">Gewicht pro Stück (kg)</label>
              <input id="foundWeight" className="input" inputMode="decimal" value={weight} maxLength={8} placeholder="optional"
                onChange={(e) => setWeight(e.target.value.replace(/[^0-9.,]/g, ''))} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="foundDesc">Beschreibung (optional)</label>
            <textarea id="foundDesc" className="input min-h-20" value={description} maxLength={2000}
              onChange={(e) => setDescription(e.target.value)} placeholder="Wie sieht es aus? Wo hast du es gefunden?" />
          </div>
          {wouldOverload && (
            <p className="alert-error">
              Das wäre zu schwer: Mit {formatKg(addedWeight)} mehr trägst du {formatKg(load + addedWeight)} – erlaubt sind {formatKg(capacity)}.
            </p>
          )}
          {error && <p className="alert-error">{error}</p>}
          <button type="button" className="btn-primary w-full" disabled={busy || !name.trim() || wouldOverload} onClick={send}>
            {busy ? 'Melde …' : '🔍 Fund melden'}
          </button>
        </>
      )}
    </div>
  )
}
