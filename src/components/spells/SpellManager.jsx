import { useState } from 'react'
import { GRADE_NAME, spellByKey, spellsForClass } from '../../data/spells'
import { SpellTags } from './SpellDetails'

/**
 * Zauber auswählen: Zaubertricks, bekannte Zauber, Zauberbuch (Magier) und vorbereitete Zauber.
 * Zähler sind nur Hinweise (rot bei zu vielen), keine harte Sperre.
 */
export default function SpellManager({ classKey, rules, spells, onChange }) {
  const tabs = [
    ...(rules.cantrips > 0 ? [{ key: 'cantrips', label: 'Zaubertricks' }] : []),
    ...(rules.mode === 'known' ? [{ key: 'known', label: 'Bekannte Zauber' }] : []),
    ...(rules.mode === 'spellbook' ? [{ key: 'book', label: '📖 Zauberbuch' }, { key: 'prepared', label: 'Vorbereiten' }] : []),
    ...(rules.mode === 'prepared' ? [{ key: 'prepared', label: 'Vorbereiten' }] : []),
  ]
  const [tab, setTab] = useState(tabs[0]?.key)
  const [search, setSearch] = useState('')

  const cantrips = spells.cantrips ?? []
  const known = spells.known ?? []
  const prepared = spells.prepared ?? []

  // Welche Liste wird im aktuellen Reiter bearbeitet?
  let field, selected, limit, limitLabel, candidates, hint
  if (tab === 'cantrips') {
    field = 'cantrips'
    selected = cantrips
    limit = rules.cantrips
    limitLabel = 'Zaubertricks'
    candidates = spellsForClass(classKey, 0)
  } else if (tab === 'known') {
    field = 'known'
    selected = known
    limit = rules.limit
    limitLabel = 'bekannte Zauber'
    candidates = spellsForClass(classKey, rules.maxSpellLevel).filter((s) => s.level > 0)
  } else if (tab === 'book') {
    field = 'known'
    selected = known
    limit = rules.spellbookSize
    limitLabel = 'Zauber im Zauberbuch'
    candidates = spellsForClass(classKey, rules.maxSpellLevel).filter((s) => s.level > 0)
    hint = 'Magier können zusätzlich gefundene Zauberschriftrollen ins Buch kopieren – sprecht das mit dem Spielleiter ab.'
  } else {
    field = 'prepared'
    selected = prepared
    limit = rules.limit
    limitLabel = 'vorbereitete Zauber'
    candidates =
      rules.mode === 'spellbook'
        ? known.map((k) => spellByKey(k)).filter(Boolean)
        : spellsForClass(classKey, rules.maxSpellLevel).filter((s) => s.level > 0)
    hint =
      rules.mode === 'spellbook'
        ? 'Du kannst nur Zauber aus deinem Zauberbuch vorbereiten. Nach jeder langen Rast darfst du neu wählen.'
        : 'Nach jeder langen Rast darfst du neu wählen.'
  }

  const term = search.trim().toLowerCase()
  const filtered = candidates.filter((s) => !term || s.name.toLowerCase().includes(term) || s.text.toLowerCase().includes(term))
  const grades = [...new Set(filtered.map((s) => s.level))].sort((a, b) => a - b)
  const over = selected.length > limit

  function toggle(key) {
    const list = selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]
    const next = { ...spells, [field]: list }
    // Aus dem Zauberbuch entfernt → auch nicht mehr vorbereitet
    if (tab === 'book' && !list.includes(key)) next.prepared = prepared.filter((k) => k !== key)
    onChange(next)
  }

  return (
    <div className="space-y-4">
      <h2 className="title pr-8 text-2xl">📖 Zauber verwalten</h2>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${tab === t.key ? 'border-amber-500 bg-amber-500/15 text-amber-200' : 'border-stone-700 text-stone-400 hover:border-stone-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className={`rounded-lg px-3 py-2 text-sm ${over ? 'bg-red-950/50 text-red-300' : 'bg-stone-950/60 text-stone-300'}`}>
        <b>{selected.length} / {limit}</b> {limitLabel}
        {over && ' – das ist mehr als die Regeln erlauben. Frag deinen Spielleiter.'}
        {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
      </div>

      <input className="input" placeholder="🔍 Zauber suchen …" value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-1">
        {!filtered.length && (
          <p className="text-sm text-stone-500">
            {tab === 'prepared' && rules.mode === 'spellbook' ? 'Dein Zauberbuch ist noch leer – füge zuerst Zauber im Reiter „Zauberbuch“ hinzu.' : 'Keine Zauber gefunden.'}
          </p>
        )}
        {grades.map((grade) => (
          <div key={grade}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-stone-500">{GRADE_NAME(grade)}</p>
            <ul className="space-y-1">
              {filtered.filter((s) => s.level === grade).map((s) => {
                const active = selected.includes(s.key)
                return (
                  <li key={s.key}>
                    <button type="button" onClick={() => toggle(s.key)}
                      className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left transition ${active ? 'border-amber-500 bg-amber-500/10' : 'border-stone-800 hover:border-stone-600'}`}>
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${active ? 'border-amber-400 bg-amber-500 text-stone-950' : 'border-stone-600'}`}>
                        {active ? '✓' : ''}
                      </span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className={active ? 'text-amber-100' : 'text-stone-100'}>{s.name}</span>
                          <SpellTags spell={s} />
                        </span>
                        <span className="block text-xs text-stone-500">{s.text}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
