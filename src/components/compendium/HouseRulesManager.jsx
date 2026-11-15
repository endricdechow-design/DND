import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { useCompendium } from '../../lib/compendium'
import { translateError } from '../../lib/errors'
import Modal from '../Modal'
import { RichText } from './EntryView'

/**
 * Spielleiter: Hausregeln seiner Runden anlegen, bearbeiten und löschen.
 */
export default function HouseRulesManager() {
  const { profile } = useAuth()
  const { houseRules, reloadHouseRules } = useCompendium()
  const [gmGames, setGmGames] = useState([])
  const [editing, setEditing] = useState(null) // { rule } oder { rule: null, gameId }

  useEffect(() => {
    supabase
      .from('game_members')
      .select('game_id, games(name)')
      .eq('user_id', profile.id)
      .eq('role', 'gm')
      .then(({ data }) => setGmGames((data ?? []).map((m) => ({ id: m.game_id, name: m.games?.name ?? 'Runde' }))))
  }, [profile.id])

  if (!gmGames.length) return null

  return (
    <section className="card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="title text-xl">🏠 Hausregeln</h2>
          <p className="text-sm text-stone-400">Eure eigenen Absprachen – alle Spieler deiner Runde finden sie im Kompendium.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setEditing({ rule: null, gameId: gmGames[0].id })}>＋ Hausregel</button>
      </div>
      {gmGames.map((g) => {
        const rules = houseRules.filter((r) => r.game_id === g.id)
        return (
          <div key={g.id}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-stone-500">📜 {g.name}</p>
            {rules.length ? (
              <ul className="divide-y divide-stone-800 rounded-xl border border-stone-800">
                {rules.map((r) => (
                  <li key={r.id}>
                    <button type="button" onClick={() => setEditing({ rule: r, gameId: g.id })} className="w-full px-3 py-2 text-left hover:bg-stone-900/70">
                      <span className="font-medium text-stone-100">{r.title}</span>
                      <span className="line-clamp-1 block text-sm text-stone-400">{r.body}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-500">Noch keine Hausregeln.</p>
            )}
          </div>
        )
      })}

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <HouseRuleEditor
            rule={editing.rule}
            gameId={editing.gameId}
            games={gmGames}
            onDone={async () => {
              setEditing(null)
              await reloadHouseRules()
            }}
          />
        </Modal>
      )}
    </section>
  )
}

function HouseRuleEditor({ rule, gameId: initialGame, games, onDone }) {
  const [gameId, setGameId] = useState(rule?.game_id ?? initialGame)
  const [title, setTitle] = useState(rule?.title ?? '')
  const [body, setBody] = useState(rule?.body ?? '')
  const [preview, setPreview] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    setBusy(true)
    setError('')
    const row = { game_id: gameId, title: title.trim(), body: body.trim() }
    const { error } = rule
      ? await supabase.from('house_rules').update(row).eq('id', rule.id)
      : await supabase.from('house_rules').insert(row)
    setBusy(false)
    if (error) return setError(translateError(error.message))
    onDone()
  }

  async function remove() {
    if (!confirm(`Hausregel „${rule.title}“ löschen?`)) return
    setBusy(true)
    const { error } = await supabase.from('house_rules').delete().eq('id', rule.id)
    setBusy(false)
    if (error) return setError(translateError(error.message))
    onDone()
  }

  return (
    <div className="space-y-4">
      <h2 className="title pr-8 text-2xl">{rule ? 'Hausregel bearbeiten' : 'Neue Hausregel'}</h2>
      {games.length > 1 && !rule && (
        <div>
          <label className="label" htmlFor="hrGame">Für welche Runde?</label>
          <select id="hrGame" className="input" value={gameId} onChange={(e) => setGameId(e.target.value)}>
            {games.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
      )}
      <div>
        <label className="label" htmlFor="hrTitle">Titel</label>
        <input id="hrTitle" className="input" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Traglast" />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="label mb-0" htmlFor="hrBody">Regel</label>
          <button type="button" className="text-xs text-amber-400" onClick={() => setPreview(!preview)}>{preview ? 'Bearbeiten' : 'Vorschau'}</button>
        </div>
        {preview ? (
          <div className="rounded-lg border border-stone-800 p-3"><RichText text={body} /></div>
        ) : (
          <textarea id="hrBody" className="input min-h-40" value={body} maxLength={5000} onChange={(e) => setBody(e.target.value)}
            placeholder={'z. B. Die Traglast beträgt Stärke × 7,5 kg.\n\n- Überladene Charaktere können nichts aufsammeln.\n- Tränke trinken ist eine Bonusaktion.'} />
        )}
        <p className="mt-1 text-xs text-stone-500">Tipp: Leerzeile = neuer Absatz, „- “ am Zeilenanfang = Aufzählung.</p>
      </div>
      {error && <p className="alert-error">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {rule ? <button type="button" className="btn-danger" disabled={busy} onClick={remove}>Löschen</button> : <span />}
        <button type="button" className="btn-primary" disabled={busy || !title.trim()} onClick={save}>{busy ? 'Speichere …' : '💾 Speichern'}</button>
      </div>
    </div>
  )
}
