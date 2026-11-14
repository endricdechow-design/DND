// Auswahl-Kacheln (z. B. für Volk oder Klasse)
export function ChoiceGrid({ options, value, onChange, renderDetails }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {options.map((option) => {
        const active = option.key === value
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={`flex flex-col rounded-xl border p-4 text-left transition ${
              active
                ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30'
                : 'border-stone-700 bg-stone-950/40 hover:border-stone-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden>{option.icon}</span>
              <span className={`font-display font-bold ${active ? 'text-amber-200' : 'text-stone-100'}`}>{option.name}</span>
            </div>
            <p className="mt-1 text-sm text-stone-400">{option.blurb}</p>
            {renderDetails && <div className="mt-2 text-xs text-stone-500">{renderDetails(option)}</div>}
          </button>
        )
      })}
    </div>
  )
}

// Mehrfachauswahl als Chips (z. B. Fertigkeiten)
export function ChipPicker({ options, selected, max, onChange, disabled = [], labelFor }) {
  const toggle = (key) => {
    if (selected.includes(key)) onChange(selected.filter((k) => k !== key))
    else if (selected.length < max) onChange([...selected, key])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((key) => {
        const isSelected = selected.includes(key)
        const isDisabled = !isSelected && (disabled.includes(key) || selected.length >= max)
        return (
          <button
            key={key}
            type="button"
            disabled={isDisabled}
            onClick={() => toggle(key)}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              isSelected
                ? 'border-amber-500 bg-amber-500/15 text-amber-200'
                : 'border-stone-700 text-stone-300 hover:border-stone-500 disabled:cursor-not-allowed disabled:opacity-35'
            }`}
          >
            {isSelected ? '✓ ' : ''}
            {labelFor(key)}
          </button>
        )
      })}
    </div>
  )
}

// Überschrift + Erklärung für einen Abschnitt im Assistenten
export function StepSection({ title, hint, children }) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-display text-lg font-bold text-stone-100">{title}</h3>
        {hint && <p className="text-sm text-stone-400">{hint}</p>}
      </div>
      {children}
    </section>
  )
}
