import { ABILITIES, POINT_BUY_BUDGET, POINT_BUY_COST, STANDARD_ARRAY, abilityShort, byKey, CLASSES } from '../../data/srd'
import { abilityMod, finalAbilities, formatMod, defaultAbilities, pointBuySpent } from '../../lib/character'
import { StepSection } from './ChoiceGrid'

const METHODS = [
  { key: 'standard', name: 'Standardwerte', hint: 'Verteile 15, 14, 13, 12, 10 und 8. Am einfachsten!' },
  { key: 'pointbuy', name: 'Punktekauf', hint: `Kaufe Werte von 8 bis 15 mit ${POINT_BUY_BUDGET} Punkten.` },
  { key: 'manual', name: 'Gewürfelt / Eigene', hint: 'Trage gewürfelte Werte ein (oder lass die App würfeln).' },
]

// 4W6 würfeln und den niedrigsten Würfel streichen
function roll4d6DropLowest() {
  const dice = Array.from({ length: 4 }, () => 1 + Math.floor(Math.random() * 6)).sort((a, b) => a - b)
  return dice[1] + dice[2] + dice[3]
}

export default function AbilityStep({ draft, update }) {
  const { abilityMethod: method, baseAbilities: base } = draft
  const cls = byKey(CLASSES, draft.class)
  const final = finalAbilities(base, draft.race, draft.raceChoices)

  const setBase = (key, value) => update({ baseAbilities: { ...base, [key]: value } })
  const spent = pointBuySpent(base)
  const usedStandard = Object.values(base).filter((v) => v !== null)

  return (
    <div className="space-y-6">
      <StepSection
        title="Wie willst du deine Werte bestimmen?"
        hint={cls ? `Tipp für ${cls.name}: Setz den höchsten Wert auf ${cls.primary.map(abilityShort).join(' oder ')}.` : undefined}
      >
        <div className="grid gap-2 sm:grid-cols-3">
          {METHODS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => update({ abilityMethod: m.key, baseAbilities: defaultAbilities(m.key) })}
              className={`rounded-xl border p-3 text-left transition ${
                method === m.key ? 'border-amber-500 bg-amber-500/10' : 'border-stone-700 hover:border-stone-500'
              }`}
            >
              <p className={`font-semibold ${method === m.key ? 'text-amber-200' : 'text-stone-200'}`}>{m.name}</p>
              <p className="text-xs text-stone-400">{m.hint}</p>
            </button>
          ))}
        </div>
      </StepSection>

      {method === 'pointbuy' && (
        <p className={`text-sm ${spent > POINT_BUY_BUDGET ? 'text-red-400' : 'text-stone-300'}`}>
          Verbleibende Punkte: <b>{POINT_BUY_BUDGET - spent}</b> von {POINT_BUY_BUDGET}
        </p>
      )}
      {method === 'manual' && (
        <button
          type="button"
          className="btn-ghost"
          onClick={() => update({ baseAbilities: Object.fromEntries(ABILITIES.map((a) => [a.key, roll4d6DropLowest()])) })}
        >
          🎲 Für mich würfeln (4W6, niedrigsten streichen)
        </button>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ABILITIES.map((ability) => {
          const value = base[ability.key]
          const isPrimary = cls?.primary.includes(ability.key)
          const bonus = final[ability.key] - (Number(value) || 0)
          return (
            <div
              key={ability.key}
              className={`rounded-xl border p-4 ${isPrimary ? 'border-amber-700/60 bg-amber-950/10' : 'border-stone-800 bg-stone-950/40'}`}
            >
              <div className="flex items-baseline justify-between">
                <p className="font-semibold text-stone-100">
                  {ability.name} {isPrimary && <span className="text-xs text-amber-400">★ wichtig</span>}
                </p>
                <span className="text-xs text-stone-500">{ability.short}</span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                {method === 'standard' && (
                  <select
                    className="input py-2"
                    value={value ?? ''}
                    onChange={(e) => setBase(ability.key, e.target.value === '' ? null : Number(e.target.value))}
                  >
                    <option value="">– wählen –</option>
                    {STANDARD_ARRAY.map((n) => (
                      <option key={n} value={n} disabled={n !== value && usedStandard.includes(n)}>{n}</option>
                    ))}
                  </select>
                )}

                {method === 'pointbuy' && (
                  <div className="flex items-center gap-2">
                    <button type="button" className="btn-ghost h-9 w-9 p-0" disabled={value <= 8} onClick={() => setBase(ability.key, value - 1)}>−</button>
                    <span className="w-8 text-center text-xl font-bold text-stone-100">{value}</span>
                    <button
                      type="button"
                      className="btn-ghost h-9 w-9 p-0"
                      disabled={value >= 15 || spent - POINT_BUY_COST[value] + POINT_BUY_COST[value + 1] > POINT_BUY_BUDGET}
                      onClick={() => setBase(ability.key, value + 1)}
                    >
                      +
                    </button>
                  </div>
                )}

                {method === 'manual' && (
                  <input
                    type="number"
                    min={3}
                    max={20}
                    className="input w-24 py-2"
                    value={value ?? ''}
                    onChange={(e) => setBase(ability.key, e.target.value === '' ? null : Number(e.target.value))}
                  />
                )}

                <div className="ml-auto text-right">
                  <p className="text-2xl font-bold text-amber-200">
                    {value === null || value === '' ? '–' : final[ability.key]}
                  </p>
                  <p className="text-xs text-stone-400">
                    {value === null || value === '' ? '' : `Mod ${formatMod(abilityMod(final[ability.key]))}`}
                    {bonus > 0 && value !== null ? ` · Volk +${bonus}` : ''}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
