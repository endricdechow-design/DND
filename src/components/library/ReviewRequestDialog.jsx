import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { translateError } from '../../lib/errors'
import { RARITIES } from '../../data/library'
import { parseKg } from '../../lib/inventory'
import CatalogNameInput from './CatalogNameInput'
import { ask } from '../../lib/confirm'

/**
 * Spielleiter prüft ein Fundstück: ggf. anpassen, dann annehmen oder ablehnen.
 */
export default function ReviewRequestDialog({ request, playerLabel, onDone }) {
  const [name, setName] = useState(request.name)
  const [description, setDescription] = useState(request.description ?? '')
  const [weight, setWeight] = useState(request.data?.weight != null ? String(request.data.weight).replace('.', ',') : '')
  const [quantity, setQuantity] = useState(request.quantity)
  const [rarityKey, setRarityKey] = useState(request.data?.rarity ?? 'common')
  const [stat, setStat] = useState(request.data?.stat ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function decide(approve) {
    if (!approve && !(await ask(`Fund „${request.name}“ wirklich ablehnen?`))) return
    setBusy(true)
    setError('')
    const data = {
      ...request.data,
      rarity: rarityKey,
      stat: stat.trim(),
      weight: parseKg(weight) ?? undefined,
    }
    const { error } = await supabase.rpc('decide_item_request', {
      p_request_id: request.id,
      p_approve: approve,
      p_name: name.trim(),
      p_description: description.trim(),
      p_data: data,
      p_quantity: quantity,
    })
    setBusy(false)
    if (error) return setError(translateError(error.message))
    onDone(approve)
  }

  return (
    <div className="space-y-4">
      <div className="pr-8">
        <h2 className="title text-2xl">🔍 Fund prüfen</h2>
        <p className="text-sm text-stone-400">
          <b className="text-violet-200">{playerLabel}</b> möchte das aufsammeln. Du kannst es vorher noch anpassen.
        </p>
      </div>

      <div>
        <label className="label" htmlFor="revName">Name</label>
        <CatalogNameInput
          id="revName"
          type="item"
          value={name}
          onChange={setName}
          onPick={(entry) => {
            setName(entry.name)
            setDescription(entry.description)
            setWeight(entry.weight ? String(entry.weight).replace('.', ',') : '')
            setRarityKey(entry.rarity ?? 'common')
            setStat(entry.stat ?? '')
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="revQty">Anzahl</label>
          <input id="revQty" type="number" min={1} max={999} inputMode="numeric" className="input" value={quantity}
            onChange={(e) => setQuantity(Math.min(999, Math.max(1, Number(e.target.value) || 1)))} />
        </div>
        <div>
          <label className="label" htmlFor="revWeight">Gewicht pro Stück (kg)</label>
          <input id="revWeight" className="input" inputMode="decimal" value={weight} maxLength={8} placeholder="optional"
            onChange={(e) => setWeight(e.target.value.replace(/[^0-9.,]/g, ''))} />
        </div>
        <div>
          <label className="label" htmlFor="revRarity">Seltenheit</label>
          <select id="revRarity" className="input" value={rarityKey} onChange={(e) => setRarityKey(e.target.value)}>
            {RARITIES.map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="revStat">Kurzinfo</label>
          <input id="revStat" className="input" value={stat} maxLength={24} onChange={(e) => setStat(e.target.value)} placeholder="optional" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="revDesc">Beschreibung</label>
        <textarea id="revDesc" className="input min-h-20" value={description} maxLength={5000} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <p className="text-xs text-stone-500">Angenommene Funde landen in deiner Bibliothek im Ordner „Fundstücke“ (versteckt) und im Inventar des Spielers.</p>

      {error && <p className="alert-error">{error}</p>}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <button type="button" className="btn-danger" disabled={busy} onClick={() => decide(false)}>❌ Ablehnen</button>
        <button type="button" className="btn-primary" disabled={busy || !name.trim()} onClick={() => decide(true)}>
          {busy ? 'Speichere …' : '✅ Annehmen'}
        </button>
      </div>
    </div>
  )
}
