import { useState } from 'react'
import { cantripDamage } from '../../data/spells'

/**
 * Zauber wirken: Zauberplatz wählen (Grad ≥ Zaubergrad) und abhaken.
 * slots: Plätze je Grad (Index 0 = Grad 1), used: { "1": 2, … }
 */
export default function CastDialog({ spell, slots, used, characterLevel, onCast, onClose }) {
  const [result, setResult] = useState(null)
  const options = slots
    .map((total, i) => ({ grade: i + 1, total, free: total - (used[i + 1] ?? 0) }))
    .filter((o) => o.grade >= spell.level && o.total > 0)

  if (result) {
    return (
      <div className="space-y-3 py-2 text-center">
        <p className="text-5xl">✨</p>
        <h2 className="title text-2xl">{spell.name}</h2>
        <p className="text-stone-300">
          {result === 'ritual' ? 'Als Ritual gewirkt – kein Zauberplatz verbraucht.' : `Zauberplatz Grad ${result} wurde abgehakt.`}
        </p>
        {typeof result === 'number' && result > spell.level && spell.higher && (
          <p className="text-sm text-amber-200">Höherer Grad ({result - spell.level}× stärker): {spell.higher}</p>
        )}
        {spell.concentration && <p className="text-sm text-sky-300">Denk an die Konzentration!</p>}
        <p className="text-sm text-stone-500">🎲 Gewürfelt wird am Tisch.</p>
        <button type="button" className="btn-primary" onClick={onClose}>Fertig</button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="pr-8">
        <h2 className="title text-2xl">✨ {spell.name} wirken</h2>
        <p className="text-sm text-stone-400">Mit welchem Zauberplatz? Höhere Plätze machen viele Zauber stärker.</p>
      </div>
      {spell.level === 0 ? (
        <p className="text-stone-300">Zaubertricks brauchen keinen Platz. {cantripDamage(spell.cantripDie, characterLevel) && `Schaden: ${cantripDamage(spell.cantripDie, characterLevel)}`}</p>
      ) : (
        <ul className="space-y-2">
          {options.map((o) => (
            <li key={o.grade}>
              <button
                type="button"
                disabled={o.free <= 0}
                onClick={() => {
                  onCast(o.grade)
                  setResult(o.grade)
                }}
                className="flex w-full items-center justify-between rounded-xl border border-stone-700 px-4 py-3 text-left transition hover:border-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span>
                  <span className="font-semibold text-stone-100">Grad {o.grade}</span>
                  {o.grade > spell.level && spell.higher && <span className="ml-2 text-xs text-amber-300">stärker</span>}
                </span>
                <span className="text-sm text-stone-400">{o.free > 0 ? `noch ${o.free} von ${o.total} frei` : 'keine frei'}</span>
              </button>
            </li>
          ))}
          {!options.some((o) => o.free > 0) && <li className="text-sm text-red-300">Keine passenden Zauberplätze mehr frei – Zeit für eine Rast.</li>}
        </ul>
      )}
      {spell.ritual && (
        <button type="button" className="btn-ghost w-full" onClick={() => setResult('ritual')}>
          🕯️ Als Ritual wirken (dauert 10 Minuten länger, kein Platz)
        </button>
      )}
    </div>
  )
}
