import { CONDITIONS, conditionByKey } from '../../data/conditions'

// Kleine Symbole am Avatar
export function ConditionIcons({ conditions = [], max = 3 }) {
  if (!conditions.length) return null
  const shown = conditions.slice(0, max)
  return (
    <span className="flex items-center gap-0.5 text-sm leading-none" title={conditions.map((k) => conditionByKey(k)?.name).join(', ')}>
      {shown.map((key) => <span key={key}>{conditionByKey(key)?.icon ?? '❔'}</span>)}
      {conditions.length > max && <span className="text-xs text-stone-400">+{conditions.length - max}</span>}
    </span>
  )
}

// Liste mit Erklärung
export function ConditionList({ conditions = [] }) {
  if (!conditions.length) return <p className="text-sm text-stone-500">Keine besonderen Zustände.</p>
  return (
    <ul className="space-y-1.5">
      {conditions.map((key) => {
        const c = conditionByKey(key)
        if (!c) return null
        return (
          <li key={key} className="text-sm">
            <span className="mr-1">{c.icon}</span>
            <span className="font-semibold text-stone-100">{c.name}:</span> <span className="text-stone-400">{c.text}</span>
          </li>
        )
      })}
    </ul>
  )
}

// Zustände an- und ausschalten (für Besitzer und Spielleiter)
export function ConditionPicker({ conditions = [], onChange, disabled = false }) {
  const toggle = (key) =>
    onChange(conditions.includes(key) ? conditions.filter((k) => k !== key) : [...conditions, key])
  return (
    <div className="flex flex-wrap gap-2">
      {CONDITIONS.map((c) => {
        const active = conditions.includes(c.key)
        return (
          <button
            key={c.key}
            type="button"
            disabled={disabled}
            title={c.text}
            onClick={() => toggle(c.key)}
            className={`rounded-full border px-3 py-1.5 text-sm transition disabled:opacity-50 ${
              active ? 'border-red-500 bg-red-500/15 text-red-200' : 'border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200'
            }`}
          >
            {c.icon} {c.name}
          </button>
        )
      })}
    </div>
  )
}
