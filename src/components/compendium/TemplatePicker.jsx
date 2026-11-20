import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { translateError } from '../../lib/errors'
import { HOUSE_RULE_TEMPLATES } from '../../data/houseRuleTemplates'

/**
 * Hausregel-Vorlagen ankreuzen und in einem Rutsch für eine Runde übernehmen.
 * Vorlagen, die es (gleicher Titel) schon gibt, werden ausgeblendet.
 */
export default function TemplatePicker({ gameId, existingTitles = [], onDone, submitLabel = '✓ Übernehmen', onSkip }) {
  const available = HOUSE_RULE_TEMPLATES.filter((t) => !existingTitles.includes(t.title))
  const [picked, setPicked] = useState([])
  const [open, setOpen] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const toggle = (key) => setPicked((list) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key]))

  async function save() {
    setBusy(true)
    setError('')
    const rows = available.filter((t) => picked.includes(t.key)).map((t) => ({ game_id: gameId, title: t.title, body: t.body }))
    const { error } = rows.length ? await supabase.from('house_rules').insert(rows) : { error: null }
    setBusy(false)
    if (error) return setError(translateError(error.message))
    onDone(rows.length)
  }

  if (!available.length) return <p className="text-sm text-stone-500">Alle Vorlagen sind schon in dieser Runde.</p>

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {available.map((t) => {
          const on = picked.includes(t.key)
          return (
            <li key={t.key} className={`rounded-xl border transition ${on ? 'border-amber-500 bg-amber-500/10' : 'border-stone-800 bg-stone-950/40'}`}>
              <div className="flex items-center gap-3 p-3">
                <button type="button" onClick={() => toggle(t.key)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-sm ${on ? 'border-amber-500 bg-amber-500 text-stone-950' : 'border-stone-600'}`}>
                    {on && '✓'}
                  </span>
                  <span className="text-xl" aria-hidden>{t.icon}</span>
                  <span className="min-w-0 font-medium text-stone-100">{t.title}</span>
                </button>
                <button type="button" className="shrink-0 text-xs text-amber-400 hover:text-amber-200" onClick={() => setOpen(open === t.key ? null : t.key)}>
                  {open === t.key ? 'weniger' : 'mehr'}
                </button>
              </div>
              {open === t.key && <p className="whitespace-pre-line px-3 pb-3 pl-12 text-sm text-stone-400">{t.body.replaceAll('\n\n', '\n')}</p>}
            </li>
          )
        })}
      </ul>
      {error && <p className="alert-error">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        {onSkip && <button type="button" className="btn-ghost" onClick={onSkip}>Überspringen</button>}
        <button type="button" className="btn-primary" disabled={busy || (!picked.length && !onSkip)} onClick={save}>
          {busy ? 'Speichere …' : picked.length ? `${submitLabel} (${picked.length})` : submitLabel}
        </button>
      </div>
    </div>
  )
}
