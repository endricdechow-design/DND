import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { translateError } from '../../lib/errors'
import { formatXp, xpProgress } from '../../data/levels'
import Avatar from '../Avatar'

const QUICK = [50, 100, 200, 500]

/**
 * Spielleiter: Erfahrungspunkte an Spieler verteilen.
 * „Jeder bekommt X“ oder „X wird aufgeteilt“. Minuszahlen ziehen ab.
 */
export default function XpDialog({ gameId, onDone }) {
  const [chars, setChars] = useState(null)
  const [selected, setSelected] = useState([])
  const [amount, setAmount] = useState('')
  const [split, setSplit] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('characters')
      .select('id, user_id, name, level, xp, class, avatar_url')
      .eq('game_id', gameId)
      .order('name')
      .then(({ data, error }) => {
        if (error) setError(translateError(error.message))
        setChars(data ?? [])
        setSelected((data ?? []).map((c) => c.user_id))
      })
  }, [gameId])

  const value = Math.trunc(Number(amount) || 0)
  const each = selected.length ? (split ? Math.trunc(value / selected.length) : value) : 0
  const toggle = (userId) => setSelected((list) => (list.includes(userId) ? list.filter((u) => u !== userId) : [...list, userId]))

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.rpc('award_xp', { p_game_id: gameId, p_user_ids: selected, p_amount: value, p_split: split, p_reason: reason })
    setBusy(false)
    if (error) return setError(translateError(error.message))
    onDone(each > 0 ? `✨ ${selected.length === 1 ? 'Der Spieler bekommt' : 'Jeder bekommt'} ${formatXp(each)} EP.` : `${formatXp(-each)} EP abgezogen.`)
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="pr-8">
        <h2 className="title text-2xl">✨ EP verteilen</h2>
        <p className="text-sm text-stone-400">Die Spieler bekommen eine Meldung. Wer genug EP hat, kann danach aufsteigen.</p>
      </div>

      {/* Wer? */}
      <div>
        <p className="label">An wen?</p>
        {chars === null ? (
          <p className="text-sm text-stone-500">Lade …</p>
        ) : chars.length === 0 ? (
          <p className="text-sm text-stone-500">Noch hat niemand einen Charakter.</p>
        ) : (
          <ul className="space-y-2">
            {chars.map((c) => {
              const on = selected.includes(c.user_id)
              const progress = xpProgress(c.xp ?? 0, c.level)
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => toggle(c.user_id)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-2 pr-3 text-left transition ${on ? 'border-amber-500 bg-amber-500/10' : 'border-stone-800 opacity-60'}`}
                  >
                    <Avatar name={c.name} src={c.avatar_url} cls={c.class} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-stone-100">{c.name}</span>
                      <span className="block text-xs text-stone-500">
                        Stufe {c.level} · {formatXp(c.xp ?? 0)} EP{progress.canLevelUp && <span className="text-amber-300"> · ⬆️ kann aufsteigen</span>}
                      </span>
                    </span>
                    <span className={`flex h-6 w-6 items-center justify-center rounded-md border text-sm ${on ? 'border-amber-500 bg-amber-500 text-stone-950' : 'border-stone-600'}`}>
                      {on && '✓'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Wie viel? */}
      <div className="space-y-2">
        <label className="label" htmlFor="xpAmount">Wie viele EP?</label>
        <input
          id="xpAmount"
          className="input text-center font-display text-2xl"
          inputMode="numeric"
          value={amount}
          maxLength={7}
          placeholder="z. B. 300"
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9-]/g, '').replace(/(?!^)-/g, ''))}
        />
        <div className="flex flex-wrap gap-2">
          {QUICK.map((q) => (
            <button key={q} type="button" className="btn-ghost px-3 py-1" onClick={() => setAmount(String(q))}>+{q}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-stone-950/70 p-1">
          {[
            [false, '👤 Jeder bekommt'],
            [true, '➗ Aufteilen'],
          ].map(([v, label]) => (
            <button key={label} type="button" onClick={() => setSplit(v)}
              className={`rounded-md py-2 text-sm font-semibold transition ${split === v ? 'bg-amber-600 text-stone-950' : 'text-stone-400 hover:text-amber-200'}`}>
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-stone-500">
          {split ? 'Praktisch für Monster: deren EP werden durch die Anzahl der Spieler geteilt.' : 'Jeder gewählte Spieler bekommt die volle Zahl.'} Zum Abziehen eine Minuszahl eingeben (z. B. -100).
        </p>
      </div>

      <div>
        <label className="label" htmlFor="xpReason">Wofür? (optional)</label>
        <input id="xpReason" className="input" value={reason} maxLength={80} onChange={(e) => setReason(e.target.value)} placeholder="z. B. Goblin-Hinterhalt überlebt" />
      </div>

      {error && <p className="alert-error">{error}</p>}

      <button type="submit" className="btn-primary w-full" disabled={busy || !value || !selected.length || !each}>
        {busy
          ? 'Verteile …'
          : !value || !selected.length
            ? 'EP verteilen'
            : each > 0
              ? `✨ ${selected.length} × ${formatXp(each)} EP verteilen`
              : `${selected.length} × ${formatXp(-each)} EP abziehen`}
      </button>
    </form>
  )
}
