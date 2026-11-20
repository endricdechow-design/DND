import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { translateError } from '../../lib/errors'
import { uploadImage } from '../../lib/images'
import { parseKg } from '../../lib/inventory'
import { RARITIES, WORKSHOP_TYPES, imageSizeFor } from '../../data/library'
import CatalogNameInput from '../library/CatalogNameInput'
import RoomsOverlay from '../map/RoomsOverlay'
import GridOverlay from '../map/GridOverlay'
import { GRID_TYPES, normalizeGrid } from '../../lib/grid'
import { ask } from '../../lib/confirm'

const PLACEHOLDERS = {
  item: ['z. B. Spitzhacke des Zwergenkönigs', 'Was kann der Gegenstand?'],
  map: ['z. B. Karte der verlassenen Mine', 'Notizen zur Karte (nur für dich, bis du sie zeigst)'],
  handout: ['z. B. Brief des Barons', 'Der Text, den die Spieler lesen'],
  effect: ['z. B. Fluch der Mine', 'Was bewirkt der Effekt?'],
  npc: ['z. B. Wirt Brom', 'Aussehen, Stimme, was er weiß, was er will …'],
}

/**
 * Inhalt eines Abenteuers anlegen oder bearbeiten (nur für den Besitzer).
 */
export default function WorkshopItemEditor({ adventureId, item, defaultType = 'item', onDone }) {
  const { profile } = useAuth()
  const [type, setType] = useState(item?.type ?? defaultType)
  const [name, setName] = useState(item?.name ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [rarityKey, setRarityKey] = useState(item?.data?.rarity ?? 'common')
  const [stat, setStat] = useState(item?.data?.stat ?? '')
  const [weight, setWeight] = useState(item?.data?.weight != null ? String(item.data.weight).replace('.', ',') : '')
  const [duration, setDuration] = useState(item?.data?.duration ?? '')
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? null)
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [rooms, setRooms] = useState(item?.data?.rooms ?? [])
  const [editingRooms, setEditingRooms] = useState(false)
  const [grid, setGrid] = useState(item?.data?.grid ?? null)
  const [editingGrid, setEditingGrid] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])

  async function save() {
    setBusy(true)
    setError('')
    try {
      const id = item?.id ?? crypto.randomUUID()
      let url = imageUrl
      if (imageFile) {
        url = await uploadImage({
          bucket: 'workshop',
          pathWithoutExtension: `${profile.id}/${adventureId}-${id}-${Date.now()}`,
          file: imageFile,
          maxSize: imageSizeFor(type),
        })
      }
      const row = {
        type,
        name: name.trim(),
        description: description.trim(),
        image_url: url,
        data: {
          ...(item?.data ?? {}),
          stat: stat.trim() || undefined,
          ...(type === 'item' ? { rarity: rarityKey, weight: parseKg(weight) ?? undefined } : { rarity: undefined, weight: undefined }),
          ...(type === 'effect' ? { duration: duration.trim() || undefined } : { duration: undefined }),
          rooms: type === 'map' && rooms.length ? rooms : undefined,
          grid: type === 'map' && grid ? grid : undefined,
        },
      }
      const { error } = item
        ? await supabase.from('adventure_items').update(row).eq('id', id)
        : await supabase.from('adventure_items').insert({ id, adventure_id: adventureId, ...row })
      if (error) throw error
      // Hinweis: alte Bilder werden bewusst nicht gelöscht – sie können schon in einer Runde benutzt werden.
      onDone()
    } catch (err) {
      setError(translateError(err.message))
      setBusy(false)
    }
  }

  async function remove() {
    if (!(await ask(`„${item.name}“ aus dem Abenteuer löschen? (Bereits in Runden geladene Kopien bleiben erhalten.)`))) return
    setBusy(true)
    const { error } = await supabase.from('adventure_items').delete().eq('id', item.id)
    if (error) {
      setError(translateError(error.message))
      setBusy(false)
      return
    }
    onDone()
  }

  const shownImage = preview ?? imageUrl
  const [namePlaceholder, descPlaceholder] = PLACEHOLDERS[type]

  return (
    <div className="space-y-4">
      <h2 className="title pr-8 text-2xl">{item ? 'Inhalt bearbeiten' : 'Neuer Inhalt'}</h2>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {WORKSHOP_TYPES.map((t) => (
          <button key={t.key} type="button" onClick={() => setType(t.key)}
            className={`rounded-lg border px-2 py-2 text-sm transition ${type === t.key ? 'border-amber-500 bg-amber-500/10 text-amber-200' : 'border-stone-700 text-stone-300 hover:border-stone-500'}`}>
            {t.icon} {t.name}
          </button>
        ))}
      </div>

      <div>
        <label className="label" htmlFor="wsName">Name</label>
        <CatalogNameInput
          id="wsName"
          type={type}
          value={name}
          onChange={setName}
          onPick={(entry) => {
            setName(entry.name)
            setDescription(entry.description)
            setStat(entry.stat ?? '')
            if (entry.rarity) setRarityKey(entry.rarity)
            if (entry.duration) setDuration(entry.duration)
            setWeight(entry.weight ? String(entry.weight).replace('.', ',') : '')
          }}
          placeholder={namePlaceholder}
        />
      </div>

      {(type === 'item' || type === 'effect') && (
        <div className="grid grid-cols-2 gap-3">
          {type === 'item' && (
            <>
              <div>
                <label className="label" htmlFor="wsRarity">Seltenheit</label>
                <select id="wsRarity" className="input" value={rarityKey} onChange={(e) => setRarityKey(e.target.value)}>
                  {RARITIES.map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="wsWeight">Gewicht (kg)</label>
                <input id="wsWeight" className="input" inputMode="decimal" value={weight} maxLength={8} placeholder="optional"
                  onChange={(e) => setWeight(e.target.value.replace(/[^0-9.,]/g, ''))} />
              </div>
            </>
          )}
          {type === 'effect' && (
            <div>
              <label className="label" htmlFor="wsDuration">Dauer</label>
              <input id="wsDuration" className="input" value={duration} maxLength={40} placeholder="z. B. 1 Stunde" onChange={(e) => setDuration(e.target.value)} />
            </div>
          )}
          <div>
            <label className="label" htmlFor="wsStat">Kurzinfo</label>
            <input id="wsStat" className="input" value={stat} maxLength={24} placeholder="z. B. 1W8 Hieb" onChange={(e) => setStat(e.target.value)} />
          </div>
        </div>
      )}

      <div>
        <label className="label" htmlFor="wsDesc">{type === 'npc' ? 'Notizen zum NSC' : 'Beschreibung'}</label>
        <textarea id="wsDesc" className="input min-h-28" value={description} maxLength={5000} placeholder={descPlaceholder}
          onChange={(e) => setDescription(e.target.value)} />
        {type === 'npc' && <p className="mt-1 text-xs text-stone-500">In der Runde landet ein NSC versteckt in der Bibliothek – so kannst du sein Bild später den Spielern zeigen.</p>}
      </div>

      <div>
        <p className="label">{type === 'npc' ? 'Porträt (optional)' : 'Bild (optional)'}</p>
        <div className="flex flex-wrap items-center gap-3">
          {shownImage && <img src={shownImage} alt="" className="h-24 w-32 rounded-lg bg-stone-900 object-cover" />}
          <label className="btn-ghost cursor-pointer">
            🖼️ {shownImage ? 'Bild ändern' : 'Bild hochladen'}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              setImageFile(file)
              setPreview(URL.createObjectURL(file))
              e.target.value = ''
            }} />
          </label>
          {shownImage && (
            <button type="button" className="text-sm text-stone-500 hover:text-red-300" onClick={() => {
              setImageFile(null)
              setPreview(null)
              setImageUrl(null)
            }}>🗑️ Bild entfernen</button>
          )}
        </div>
      </div>

      {type === 'map' && shownImage && (
        <div className="rounded-xl border border-stone-800 bg-stone-950/40 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-stone-300">🏠 {rooms.length ? `${rooms.length} Räume vorbereitet` : 'Noch keine Räume eingezeichnet'}</p>
            <button type="button" className="btn-secondary px-3 py-1.5 text-sm" onClick={() => setEditingRooms(true)}>Räume einzeichnen</button>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-stone-800 pt-2">
            <p className="text-sm text-stone-300">
              📐 {grid ? `${GRID_TYPES.find((t) => t.key === normalizeGrid(grid).type)?.label ?? 'Raster'} eingestellt` : 'Raster noch nicht eingestellt'}
            </p>
            <button type="button" className="btn-secondary px-3 py-1.5 text-sm" onClick={() => setEditingGrid(true)}>Raster einstellen</button>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            Für die Nebelkarte: Räume einzeichnen (im Spiel mit einem Tipp aufdecken) und das Raster einstellen (wie groß ist ein Feld?).
          </p>
        </div>
      )}
      {editingGrid && (
        <GridOverlay
          title={name || 'Karte'}
          imageUrl={shownImage}
          rooms={rooms}
          grid={grid}
          onClose={() => setEditingGrid(false)}
          onSave={(next) => {
            setGrid(next)
            setEditingGrid(false)
          }}
        />
      )}
      {editingRooms && (
        <RoomsOverlay
          title={name || 'Karte'}
          grid={grid}
          imageUrl={shownImage}
          rooms={rooms}
          onClose={() => setEditingRooms(false)}
          onSave={(next) => {
            setRooms(next)
            setEditingRooms(false)
          }}
        />
      )}

      {error && <p className="alert-error">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {item ? <button type="button" className="btn-danger" disabled={busy} onClick={remove}>Löschen</button> : <span />}
        <button type="button" className="btn-primary" disabled={busy || !name.trim()} onClick={save}>{busy ? 'Speichere …' : '💾 Speichern'}</button>
      </div>
    </div>
  )
}
