import { useState } from 'react'
import { GRADE_NAME, spellByKey, spellRules } from '../../data/spells'
import { abilityShort } from '../../data/srd'
import { formatMod } from '../../lib/character'
import Modal from '../Modal'
import SpellDetails, { SpellTags } from './SpellDetails'
import SpellManager from './SpellManager'
import CastDialog from './CastDialog'

/**
 * Bereich "Zauber" auf dem Charakterbogen.
 * Gespeichert wird alles in characters.data.spells:
 *   { cantrips: [..], known: [..], prepared: [..], slotsUsed: { "1": 2, … } }
 */
export default function SpellsSection({ character, derived, canEdit, onSave }) {
  const rules = spellRules(character.class, derived.level, derived.mods)
  const [open, setOpen] = useState(null) // aufgeklappter Zauber
  const [dialog, setDialog] = useState(null) // 'manage' | { cast: spell }
  if (!rules || !derived.spellcasting) return null
  // Paladin/Waldläufer zaubern erst ab Stufe 2
  if (rules.maxSpellLevel === 0 && rules.cantrips === 0) {
    return (
      <section className="card">
        <h2 className="title text-xl">🔮 Zauber</h2>
        <p className="mt-1 text-sm text-stone-400">Du lernst ab Stufe 2 zu zaubern.</p>
      </section>
    )
  }

  const spells = character.data?.spells ?? {}
  const used = spells.slotsUsed ?? {}
  const active = [
    ...(spells.cantrips ?? []),
    ...(rules.mode === 'known' ? spells.known ?? [] : spells.prepared ?? []),
  ]
    .map((k) => spellByKey(k))
    .filter(Boolean)
  const grades = [...new Set(active.map((s) => s.level))].sort((a, b) => a - b)

  const saveSpells = (next) => onSave({ data: { ...character.data, spells: next } })
  const setUsed = (grade, count) => saveSpells({ ...spells, slotsUsed: { ...used, [grade]: count } })

  // Hinweise, wenn mehr gewählt ist als erlaubt
  const counts = [
    rules.cantrips > 0 && { label: 'Zaubertricks', have: spells.cantrips?.length ?? 0, max: rules.cantrips },
    rules.mode === 'spellbook' && { label: 'Zauberbuch', have: spells.known?.length ?? 0, max: rules.spellbookSize },
    { label: rules.mode === 'known' ? 'Bekannt' : 'Vorbereitet', have: (rules.mode === 'known' ? spells.known : spells.prepared)?.length ?? 0, max: rules.limit },
  ].filter(Boolean)

  return (
    <section className="card space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="title text-xl">🔮 Zauber</h2>
          <p className="text-sm text-stone-400">
            {abilityShort(derived.spellcasting.ability)} · Rettungswurf-SG <b className="text-stone-200">{derived.spellcasting.dc}</b> · Zauberangriff{' '}
            <b className="text-stone-200">{formatMod(derived.spellcasting.attack)}</b>
          </p>
        </div>
        {canEdit && (
          <button type="button" className="btn-secondary px-3 py-1.5 text-sm" onClick={() => setDialog('manage')}>
            📖 Zauber verwalten
          </button>
        )}
      </div>

      {/* Zauberplätze */}
      {rules.slots.some((n) => n > 0) && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-stone-400">
              {rules.pact ? `Paktmagie: Plätze vom Grad ${rules.pact.level} – kommen nach jeder kurzen Rast zurück` : 'Zauberplätze – kommen nach einer langen Rast zurück'}
            </p>
            {canEdit && rules.shortRestSlots && (
              <button type="button" className="btn-ghost px-3 py-1 text-xs" onClick={() => saveSpells({ ...spells, slotsUsed: {} })}>
                ☀️ Kurze Rast
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {rules.slots.map((total, i) => {
              const grade = i + 1
              if (!total) return null
              const u = Math.min(total, used[grade] ?? 0)
              return (
                <div key={grade} className="flex items-center gap-2">
                  <span className="text-sm text-stone-300">Grad {grade}</span>
                  <div className="flex gap-1">
                    {Array.from({ length: total }, (_, n) => {
                      const isUsed = n < u
                      return (
                        <button
                          key={n}
                          type="button"
                          disabled={!canEdit}
                          title={isUsed ? 'verbraucht – antippen zum Zurückgeben' : 'frei – antippen zum Abhaken'}
                          onClick={() => setUsed(grade, isUsed ? n : n + 1)}
                          className={`h-5 w-5 rounded-full border-2 transition ${isUsed ? 'border-stone-600 bg-stone-800' : 'border-violet-400 bg-violet-500 shadow shadow-violet-500/50'}`}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Hinweise zu den Zählern */}
      <div className="flex flex-wrap gap-2 text-xs">
        {counts.map((c) => (
          <span key={c.label} className={`rounded-full px-2.5 py-1 ${c.have > c.max ? 'bg-red-950/60 text-red-300' : 'bg-stone-800 text-stone-400'}`}>
            {c.label}: {c.have} / {c.max}
            {c.have > c.max && ' ⚠️'}
          </span>
        ))}
      </div>

      {/* Zauberliste */}
      {active.length === 0 ? (
        <p className="text-sm text-stone-500">
          Noch keine Zauber gewählt.{canEdit && ' Tippe auf „📖 Zauber verwalten“.'}
        </p>
      ) : (
        grades.map((grade) => (
          <div key={grade}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-stone-500">{GRADE_NAME(grade)}</p>
            <ul className="divide-y divide-stone-800 rounded-xl border border-stone-800">
              {active.filter((s) => s.level === grade).map((s) => {
                const isOpen = open === s.key
                return (
                  <li key={s.key}>
                    <button type="button" onClick={() => setOpen(isOpen ? null : s.key)} className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-stone-900/60">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium text-stone-100">{s.name}</span>
                        <SpellTags spell={s} />
                      </span>
                      <span className="shrink-0 text-xs text-stone-500">{s.time} · {s.range} {isOpen ? '▲' : '▼'}</span>
                    </button>
                    {isOpen && (
                      <div className="space-y-3 px-3 pb-3">
                        <SpellDetails spell={s} characterLevel={derived.level} />
                        {canEdit && s.level > 0 && (
                          <button type="button" className="btn-primary px-4 py-2 text-sm" onClick={() => setDialog({ cast: s })}>
                            ✨ Wirken
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))
      )}

      {dialog === 'manage' && (
        <Modal onClose={() => setDialog(null)}>
          <SpellManager classKey={character.class} rules={rules} spells={spells} onChange={saveSpells} />
        </Modal>
      )}
      {dialog?.cast && (
        <Modal onClose={() => setDialog(null)}>
          <CastDialog
            spell={dialog.cast}
            slots={rules.slots}
            used={used}
            characterLevel={derived.level}
            onCast={(grade) => setUsed(grade, (used[grade] ?? 0) + 1)}
            onClose={() => setDialog(null)}
          />
        </Modal>
      )}
    </section>
  )
}
