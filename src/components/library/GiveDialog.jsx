import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { translateError } from '../../lib/errors'
import { libraryType } from '../../data/library'

const VERB = { item: 'ins Inventar legen', effect: 'als Effekt anwenden', map: 'zeigen', handout: 'zeigen' }

/**
 * Spielleiter gibt einen Bibliothekseintrag an einen Spieler – mit Sicherheitsfrage.
 * Entweder ist der Eintrag fest (item) und man wählt den Spieler,
 * oder der Spieler ist fest (player) und man wählt den Eintrag.
 */
export default function GiveDialog({ gameId, item: fixedItem, player: fixedPlayer, players = [], onGiven, onClose }) {
  const [items, setItems] = useState(fixedItem ? [fixedItem] : null)
  const [assigned, setAssigned] = useState([]) // [{ item_id, user_id }]
  const [choice, setChoice] = useState(null) // { item, player }
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const queries = [supabase.from('library_assignments').select('item_id, user_id').eq('game_id', gameId)]
      if (!fixedItem) queries.push(supabase.from('library_items').select('*').eq('game_id', gameId).order('name'))
      const [{ data: a }, itemResult] = await Promise.all(queries)
      if (cancelled) return
      setAssigned(a ?? [])
      if (itemResult) setItems(itemResult.data ?? [])
    }
    load()
    return () => {
      cancelled = true
    }
  }, [gameId, fixedItem])

  const has = (itemId, userId) => assigned.some((a) => a.item_id === itemId && a.user_id === userId)

  async function give() {
    setSaving(true)
    setError('')
    const { error } = await supabase
      .from('library_assignments')
      .insert({ item_id: choice.item.id, game_id: gameId, user_id: choice.player.user_id })
    setSaving(false)
    if (error && error.code !== '23505') return setError(translateError(error.message)) // 23505 = hat es schon
    setDone(true)
    onGiven?.()
    setTimeout(onClose, 1200)
  }

  // Schritt 3: Erfolg
  if (done) {
    return (
      <div className="py-6 text-center">
        <p className="animate-bounce text-5xl">🎁</p>
        <p className="title mt-3 text-xl">Erledigt!</p>
        <p className="text-stone-400">{choice.player.short} hat „{choice.item.name}“ bekommen.</p>
      </div>
    )
  }

  // Schritt 2: Sicherheitsfrage
  if (choice) {
    const type = libraryType(choice.item.type)
    return (
      <div className="space-y-5 text-center">
        <p className="text-5xl">{type.icon}</p>
        <h2 className="title text-2xl">Wirklich geben?</h2>
        <p className="text-stone-300">
          „<b className="text-amber-200">{choice.item.name}</b>“ an <b className="text-violet-200">{choice.player.label}</b>{' '}
          {VERB[choice.item.type]}?
        </p>
        <p className="text-sm text-stone-500">Der Spieler sieht es sofort.</p>
        {error && <p className="alert-error">{error}</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <button type="button" className="btn-ghost" onClick={() => setChoice(null)} disabled={saving}>Abbrechen</button>
          <button type="button" className="btn-primary" onClick={give} disabled={saving}>
            {saving ? 'Gebe …' : '🎁 Ja, geben'}
          </button>
        </div>
      </div>
    )
  }

  // Schritt 1: Auswahl
  return (
    <div className="space-y-4">
      <h2 className="title pr-8 text-2xl">🎁 {fixedItem ? `„${fixedItem.name}“ geben` : `Etwas an ${fixedPlayer.short} geben`}</h2>

      {fixedItem ? (
        players.length ? (
          <ul className="space-y-2">
            {players.map((p) => {
              const already = has(fixedItem.id, p.user_id)
              return (
                <li key={p.user_id}>
                  <button
                    type="button"
                    disabled={already}
                    onClick={() => setChoice({ item: fixedItem, player: p })}
                    className="flex w-full items-center justify-between rounded-xl border border-stone-700 px-4 py-3 text-left transition hover:border-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="text-stone-100">{p.label}</span>
                    <span className="text-sm text-stone-500">{already ? '✓ hat es schon' : 'auswählen →'}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-stone-500">Noch keine Spieler in der Runde.</p>
        )
      ) : items === null ? (
        <p className="text-stone-400">Lade Bibliothek …</p>
      ) : items.length === 0 ? (
        <p className="text-stone-500">Deine Bibliothek ist noch leer. Lege zuerst Einträge in der Bibliothek an.</p>
      ) : (
        <ul className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
          {items.map((it) => {
            const already = has(it.id, fixedPlayer.user_id)
            const type = libraryType(it.type)
            return (
              <li key={it.id}>
                <button
                  type="button"
                  disabled={already}
                  onClick={() => setChoice({ item: it, player: fixedPlayer })}
                  className="flex w-full items-center gap-3 rounded-xl border border-stone-700 px-4 py-3 text-left transition hover:border-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="text-2xl">{type.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-stone-100">{it.name}</span>
                    <span className="text-xs text-stone-500">{type.name}{it.folder ? ` · ${it.folder}` : ''}</span>
                  </span>
                  <span className="shrink-0 text-sm text-stone-500">{already ? '✓ hat es' : '→'}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
