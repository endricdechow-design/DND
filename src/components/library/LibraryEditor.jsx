import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { translateError } from '../../lib/errors'
import { removeImage, uploadImage } from '../../lib/images'
import { LIBRARY_TYPES, RARITIES, imageSizeFor, libraryType } from '../../data/library'
import CatalogNameInput from './CatalogNameInput'
import { parseKg } from '../../lib/inventory'
import { ask } from '../../lib/confirm'

/**
 * Eintrag anlegen oder bearbeiten (nur Spielleiter).
 * item: vorhandener Eintrag oder null für "neu"
 * assignedUserIds: aktuelle Zuteilungen dieses Eintrags
 * players: [{ user_id, label }] – mögliche Empfänger
 * folders: vorhandene Ordnernamen (für Vorschläge)
 */
export default function LibraryEditor({ gameId, item, assignedUserIds = [], players, folders, defaultType, onSaved, onDeleted }) {
  const isNew = !item
  const [type, setType] = useState(item?.type ?? defaultType ?? 'item')
  const [name, setName] = useState(item?.name ?? '')
  const [folder, setFolder] = useState(item?.folder ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [rarityKey, setRarityKey] = useState(item?.data?.rarity ?? 'common')
  const [duration, setDuration] = useState(item?.data?.duration ?? '')
  const [stat, setStat] = useState(item?.data?.stat ?? '')
  const [weight, setWeight] = useState(item?.data?.weight != null ? String(item.data.weight).replace('.', ',') : '')
  const [visibility, setVisibility] = useState(item?.visibility ?? 'hidden')
  const [assigned, setAssigned] = useState(assignedUserIds)
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? null)
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])

  const typeInfo = libraryType(type)
  const toggleAssigned = (userId) =>
    setAssigned((list) => (list.includes(userId) ? list.filter((id) => id !== userId) : [...list, userId]))

  function applySuggestion(entry) {
    setName(entry.name)
    setDescription(entry.description)
    setStat(entry.stat ?? '')
    if (entry.rarity) setRarityKey(entry.rarity)
    if (entry.duration) setDuration(entry.duration)
    setWeight(entry.weight ? String(entry.weight).replace('.', ',') : '')
  }

  async function save() {
    setError('')
    setSaving(true)
    try {
      const id = item?.id ?? crypto.randomUUID()
      let newImageUrl = imageUrl
      if (imageFile) {
        newImageUrl = await uploadImage({
          bucket: 'library',
          pathWithoutExtension: `${gameId}/${id}-${Date.now()}`,
          file: imageFile,
          maxSize: imageSizeFor(type),
        })
      }

      const row = {
        type,
        name: name.trim(),
        folder: folder.trim(),
        description: description.trim(),
        image_url: newImageUrl,
        visibility,
        data: {
          ...(item?.data ?? {}),
          ...(type === 'item' ? { rarity: rarityKey } : {}),
          ...(type === 'effect' ? { duration: duration.trim() } : {}),
          stat: stat.trim(),
          ...(type === 'item' && parseKg(weight) !== null ? { weight: parseKg(weight) } : { weight: undefined }),
        },
      }

      if (isNew) {
        const { error } = await supabase.from('library_items').insert({ id, game_id: gameId, ...row })
        if (error) throw error
      } else {
        const { error } = await supabase.from('library_items').update(row).eq('id', id)
        if (error) throw error
      }

      // Zuteilungen abgleichen: neue hinzufügen, entfernte löschen
      const toAdd = assigned.filter((u) => !assignedUserIds.includes(u))
      const toRemove = assignedUserIds.filter((u) => !assigned.includes(u))
      if (toAdd.length) {
        const { error } = await supabase
          .from('library_assignments')
          .insert(toAdd.map((user_id) => ({ item_id: id, game_id: gameId, user_id })))
        if (error) throw error
      }
      if (toRemove.length) {
        const { error } = await supabase.from('library_assignments').delete().eq('item_id', id).in('user_id', toRemove)
        if (error) throw error
      }

      // Altes Bild aufräumen, wenn es ersetzt oder entfernt wurde
      if (item?.image_url && item.image_url !== newImageUrl) removeImage('library', item.image_url)
      onSaved()
    } catch (err) {
      setError(translateError(err.message))
      setSaving(false)
    }
  }

  async function remove() {
    if (!(await ask(`„${item.name}“ endgültig löschen?`))) return
    setSaving(true)
    const { error } = await supabase.from('library_items').delete().eq('id', item.id)
    if (error) {
      setError(translateError(error.message))
      setSaving(false)
      return
    }
    if (item.image_url) removeImage('library', item.image_url)
    onDeleted()
  }

  const shownImage = preview ?? imageUrl

  return (
    <div className="space-y-5">
      <h2 className="title pr-8 text-2xl">{isNew ? 'Neuer Eintrag' : 'Eintrag bearbeiten'}</h2>

      {/* Art */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {LIBRARY_TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setType(t.key)}
            className={`rounded-lg border px-2 py-2 text-sm transition ${
              type === t.key ? 'border-amber-500 bg-amber-500/10 text-amber-200' : 'border-stone-700 text-stone-300 hover:border-stone-500'
            }`}
          >
            {t.icon} {t.name}
          </button>
        ))}
      </div>

      <div>
        <label className="label" htmlFor="libName">Name</label>
        <CatalogNameInput
          id="libName"
          type={type}
          value={name}
          onChange={setName}
          onPick={applySuggestion}
          placeholder={type === 'map' ? 'z. B. Karte der Phandelver-Mine' : type === 'effect' ? 'z. B. Segen' : 'z. B. Langschwert, Heiltrank …'}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="libFolder">Ordner (optional)</label>
          <input id="libFolder" className="input" value={folder} maxLength={40} list="libFolders"
            onChange={(e) => setFolder(e.target.value)} placeholder="z. B. Kapitel 1" />
          <datalist id="libFolders">
            {folders.map((f) => <option key={f} value={f} />)}
          </datalist>
        </div>
        {type === 'item' && (
          <div>
            <label className="label" htmlFor="libRarity">Seltenheit</label>
            <select id="libRarity" className="input" value={rarityKey} onChange={(e) => setRarityKey(e.target.value)}>
              {RARITIES.map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}
            </select>
          </div>
        )}
        {(type === 'item' || type === 'effect') && (
          <div>
            <label className="label" htmlFor="libStat">Kurzinfo auf der Kachel (optional)</label>
            <input id="libStat" className="input" value={stat} maxLength={24} onChange={(e) => setStat(e.target.value)}
              placeholder={type === 'item' ? 'z. B. 1W8 Hieb, RK 16' : 'z. B. +1W4'} />
          </div>
        )}
        {type === 'item' && (
          <div>
            <label className="label" htmlFor="libWeight">Gewicht pro Stück in kg (optional)</label>
            <input id="libWeight" className="input" inputMode="decimal" value={weight} maxLength={8}
              onChange={(e) => setWeight(e.target.value.replace(/[^0-9.,]/g, ''))} placeholder="z. B. 1,5" />
          </div>
        )}
        {type === 'effect' && (
          <div>
            <label className="label" htmlFor="libDuration">Dauer (optional)</label>
            <input id="libDuration" className="input" value={duration} maxLength={40} onChange={(e) => setDuration(e.target.value)}
              placeholder="z. B. 1 Stunde, bis zur langen Rast" />
          </div>
        )}
      </div>

      <div>
        <label className="label" htmlFor="libDesc">Beschreibung</label>
        <textarea id="libDesc" className="input min-h-28" value={description} maxLength={5000}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={type === 'item' ? 'Was kann der Gegenstand? z. B. +1W6 Feuerschaden bei Treffern.' : 'Was sehen oder wissen die Spieler?'} />
      </div>

      {/* Bild */}
      <div>
        <p className="label">Bild (optional)</p>
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
            }}>
              🗑️ Bild entfernen
            </button>
          )}
        </div>
      </div>

      {/* Sichtbarkeit */}
      <div className="space-y-3 rounded-xl border border-stone-800 bg-stone-950/40 p-4">
        <p className="font-semibold text-stone-200">Wer darf das sehen?</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => setVisibility('hidden')}
            className={`rounded-lg border px-3 py-2 text-left text-sm transition ${visibility === 'hidden' ? 'border-amber-500 bg-amber-500/10 text-amber-200' : 'border-stone-700 text-stone-300'}`}>
            🔒 Nur ich (und zugeteilte Spieler)
          </button>
          <button type="button" onClick={() => setVisibility('all')}
            className={`rounded-lg border px-3 py-2 text-left text-sm transition ${visibility === 'all' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-200' : 'border-stone-700 text-stone-300'}`}>
            👥 Für alle freigeschaltet
          </button>
        </div>
        <div>
          <p className="mb-2 text-sm text-stone-400">{typeInfo.assignLabel}:</p>
          {players.length ? (
            <div className="flex flex-wrap gap-2">
              {players.map((p) => {
                const active = assigned.includes(p.user_id)
                return (
                  <button key={p.user_id} type="button" onClick={() => toggleAssigned(p.user_id)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${active ? 'border-violet-400 bg-violet-500/20 text-violet-100' : 'border-stone-700 text-stone-400 hover:border-stone-500'}`}>
                    {active ? '✓ ' : ''}{p.label}
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-stone-500">Noch keine Spieler in der Runde.</p>
          )}
        </div>
      </div>

      {error && <p className="alert-error">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {!isNew ? (
          <button type="button" onClick={remove} disabled={saving} className="btn-danger">Löschen</button>
        ) : <span />}
        <button type="button" onClick={save} disabled={saving || !name.trim()} className="btn-primary">
          {saving ? 'Speichere …' : isNew ? '✨ Anlegen' : '💾 Speichern'}
        </button>
      </div>
    </div>
  )
}
