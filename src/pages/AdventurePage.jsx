import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { translateError } from '../lib/errors'
import { WORKSHOP_TYPES, rarity } from '../data/library'
import Modal from '../components/Modal'
import WorkshopItemEditor from '../components/workshop/WorkshopItemEditor'
import { ask } from '../lib/confirm'
import PageSkeleton from '../components/Skeleton'

export default function AdventurePage() {
  const { adventureId } = useParams()
  return <Adventure key={adventureId} adventureId={adventureId} />
}

function Adventure({ adventureId }) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [adventure, setAdventure] = useState(null)
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null) // { item } oder { item: null, type }
  const [loadingInto, setLoadingInto] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    const [{ data: adv }, { data: rows }] = await Promise.all([
      supabase.from('adventures').select('*').eq('id', adventureId).maybeSingle(),
      supabase.from('adventure_items').select('*').eq('adventure_id', adventureId).order('name'),
    ])
    if (!adv) {
      navigate('/werkstatt', { replace: true })
      return
    }
    setAdventure(adv)
    setItems(rows ?? [])
  }, [adventureId, navigate])

  useEffect(() => {
    load()
  }, [load])

  if (!adventure) return <PageSkeleton text="Öffne das Abenteuer …" />

  async function saveField(patch) {
    setAdventure((a) => ({ ...a, ...patch }))
    const { error } = await supabase.from('adventures').update(patch).eq('id', adventureId)
    if (error) setError(translateError(error.message))
  }

  async function deleteAdventure() {
    if (!(await ask(`Abenteuer „${adventure.name}“ mit allen Inhalten löschen? (In Runden geladene Kopien bleiben erhalten.)`))) return
    const { error } = await supabase.from('adventures').delete().eq('id', adventureId)
    if (error) return setError(translateError(error.message))
    navigate('/werkstatt', { replace: true })
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(adventure.share_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Zwischenablage nicht verfügbar
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/werkstatt" className="btn-ghost">← Werkstatt</Link>

      {/* Kopf */}
      <section className="card space-y-4">
        <EditableTitle value={adventure.name} onSave={(name) => saveField({ name })} />
        <EditableText value={adventure.description} onSave={(description) => saveField({ description })} />
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn-primary" onClick={() => setLoadingInto(true)}>📤 In Runde laden</button>
          <div className="flex items-center gap-2 rounded-lg border border-stone-700 px-3 py-1.5 text-sm">
            <span className="text-stone-500">Teilen-Code</span>
            <span className="font-mono tracking-widest text-amber-300">{adventure.share_code}</span>
            <button type="button" onClick={copyCode} className="text-amber-500 hover:text-amber-300">{copied ? '✓' : 'kopieren'}</button>
          </div>
        </div>
        <p className="text-xs text-stone-500">
          Mit dem Teilen-Code kann ein anderer Spielleiter (z. B. dein Freund) eine <b>Kopie</b> dieses Abenteuers in seine Werkstatt übernehmen.
        </p>
      </section>

      {notice && <p className="alert-info">{notice}</p>}
      {error && <p className="alert-error">{error}</p>}

      {/* Inhalte nach Art */}
      {WORKSHOP_TYPES.map((t) => {
        const list = items.filter((i) => i.type === t.key)
        return (
          <section key={t.key} className="card">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="title text-xl">{t.icon} {t.plural} <span className="text-sm font-normal text-stone-500">({list.length})</span></h2>
              <button type="button" className="btn-ghost px-3 py-1.5 text-sm" onClick={() => setEditing({ item: null, type: t.key })}>＋ {t.name}</button>
            </div>
            {list.length ? (
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((i) => {
                  const r = i.type === 'item' ? rarity(i.data?.rarity) : null
                  return (
                    <li key={i.id}>
                      <button type="button" onClick={() => setEditing({ item: i })}
                        className="flex w-full items-center gap-3 rounded-xl border border-stone-800 bg-stone-950/40 p-2 text-left transition hover:border-amber-600">
                        {i.image_url ? (
                          <img src={i.image_url} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                        ) : (
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-stone-900 text-2xl">{t.icon}</span>
                        )}
                        <span className="min-w-0">
                          <span className="block truncate text-stone-100">{i.name}</span>
                          <span className="block truncate text-xs text-stone-500">
                            {r && <span className={r.color}>{r.name} </span>}
                            {i.data?.stat ?? ''}
                            {!r && !i.data?.stat && (i.description || '–')}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-sm text-stone-500">Noch nichts.</p>
            )}
          </section>
        )
      })}

      <div className="flex justify-end">
        <button type="button" className="btn-danger" onClick={deleteAdventure}>Abenteuer löschen</button>
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <WorkshopItemEditor
            adventureId={adventureId}
            item={editing.item}
            defaultType={editing.type}
            onDone={async () => {
              setEditing(null)
              await load()
            }}
          />
        </Modal>
      )}

      {loadingInto && (
        <Modal onClose={() => setLoadingInto(false)}>
          <LoadIntoGameDialog
            adventure={adventure}
            userId={profile.id}
            itemCount={items.length}
            onDone={(message) => {
              setLoadingInto(false)
              setNotice(message)
            }}
          />
        </Modal>
      )}
    </div>
  )
}

// Abenteuer in eine eigene Runde laden
function LoadIntoGameDialog({ adventure, userId, itemCount, onDone }) {
  const [games, setGames] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('game_members')
      .select('game_id, games(name)')
      .eq('user_id', userId)
      .eq('role', 'gm')
      .then(({ data }) => setGames((data ?? []).map((m) => ({ id: m.game_id, name: m.games?.name ?? 'Runde' }))))
  }, [userId])

  async function loadInto(game) {
    setBusy(true)
    setError('')
    const { data, error } = await supabase.rpc('load_adventure_into_game', { p_adventure_id: adventure.id, p_game_id: game.id })
    setBusy(false)
    if (error) return setError(translateError(error.message))
    onDone(
      data > 0
        ? `📤 ${data} ${data === 1 ? 'Inhalt' : 'Inhalte'} in „${game.name}“ geladen – versteckt im Bibliotheksordner „${adventure.name.slice(0, 40)}“.`
        : `„${game.name}“ hat schon alle Inhalte dieses Abenteuers.`
    )
  }

  return (
    <div className="space-y-4">
      <div className="pr-8">
        <h2 className="title text-2xl">📤 In Runde laden</h2>
        <p className="text-sm text-stone-400">
          Alle {itemCount} Inhalte landen <b>versteckt</b> in der Bibliothek der Runde. Dort schaltest du sie im Spiel frei oder gibst sie Spielern.
          Lädst du später erneut, kommen nur neue Inhalte dazu.
        </p>
      </div>
      {games === null ? (
        <p className="text-stone-400">Lade deine Runden …</p>
      ) : games.length === 0 ? (
        <p className="text-stone-500">Du leitest noch keine Runde. Erstelle zuerst eine auf der Startseite.</p>
      ) : (
        <ul className="space-y-2">
          {games.map((g) => (
            <li key={g.id}>
              <button type="button" disabled={busy || itemCount === 0} onClick={() => loadInto(g)}
                className="flex w-full items-center justify-between rounded-xl border border-stone-700 px-4 py-3 text-left transition hover:border-amber-500 disabled:opacity-50">
                <span className="text-stone-100">📜 {g.name}</span>
                <span className="text-sm text-stone-500">laden →</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {itemCount === 0 && <p className="text-sm text-stone-500">Das Abenteuer ist noch leer.</p>}
      {error && <p className="alert-error">{error}</p>}
    </div>
  )
}

// Titel zum Antippen und Bearbeiten
function EditableTitle({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(value)
  if (!editing) {
    return (
      <button type="button" onClick={() => { setText(value); setEditing(true) }} className="title text-left text-3xl hover:text-amber-100" title="Antippen zum Umbenennen">
        {value} <span className="text-base text-stone-600">✏️</span>
      </button>
    )
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) onSave(text.trim()); setEditing(false) }} className="flex gap-2">
      <input className="input" value={text} maxLength={80} autoFocus onChange={(e) => setText(e.target.value)} />
      <button type="submit" className="btn-primary">OK</button>
    </form>
  )
}

// Beschreibung zum Antippen und Bearbeiten
function EditableText({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(value)
  if (!editing) {
    return (
      <button type="button" onClick={() => { setText(value); setEditing(true) }} className="block w-full text-left text-stone-400 hover:text-stone-200">
        {value || '＋ Kurze Beschreibung / Notizen zum Abenteuer hinzufügen'}
      </button>
    )
  }
  return (
    <div className="space-y-2">
      <textarea className="input min-h-24" value={text} maxLength={5000} autoFocus onChange={(e) => setText(e.target.value)}
        placeholder="Worum geht es? Was ist der rote Faden? Notizen nur für dich." />
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={() => setEditing(false)}>Abbrechen</button>
        <button type="button" className="btn-primary" onClick={() => { onSave(text.trim()); setEditing(false) }}>Speichern</button>
      </div>
    </div>
  )
}
