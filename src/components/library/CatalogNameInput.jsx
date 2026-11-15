import { useState } from 'react'
import { searchCatalog } from '../../data/catalog'
import { rarity } from '../../data/library'

/**
 * Namensfeld mit Vorschlägen aus dem Regelwerk (für Gegenstände und Effekte).
 * onPick(entry) wird aufgerufen, wenn ein Vorschlag gewählt wird.
 */
export default function CatalogNameInput({ id, type, value, onChange, onPick, placeholder }) {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const suggestions = searchCatalog(type, value).filter((e) => e.name.toLowerCase() !== value.trim().toLowerCase())

  function pick(entry) {
    onPick(entry)
    setOpen(false)
  }

  return (
    <div className="relative">
      <input
        id={id}
        className="input"
        value={value}
        maxLength={80}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
          setHighlight(0)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!open || !suggestions.length) return
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setHighlight((h) => (h + 1) % suggestions.length)
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length)
          } else if (e.key === 'Enter') {
            e.preventDefault()
            pick(suggestions[highlight])
          } else if (e.key === 'Escape') {
            e.stopPropagation()
            setOpen(false)
          }
        }}
        placeholder={placeholder}
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-10 mt-1 max-h-72 overflow-y-auto rounded-xl border border-amber-800/60 bg-stone-950 shadow-2xl shadow-black">
          <li className="px-3 py-1.5 text-xs text-stone-500">📖 Vorschläge aus dem Regelwerk – antippen zum Übernehmen</li>
          {suggestions.map((entry, index) => {
            const r = rarity(entry.rarity)
            return (
              <li key={entry.name}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(entry)}
                  onMouseEnter={() => setHighlight(index)}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left ${index === highlight ? 'bg-amber-500/15' : ''}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-stone-100">{entry.name}</span>
                    <span className="text-xs text-stone-500">
                      {entry.category}
                      {r && entry.rarity !== 'common' && <span className={`ml-1 ${r.color}`}>· {r.name}</span>}
                      {entry.weight > 0 && <span className="ml-1">· {String(entry.weight).replace('.', ',')} kg</span>}
                    </span>
                  </span>
                  {entry.stat && <span className="shrink-0 rounded bg-stone-800 px-2 py-0.5 text-xs text-amber-200">{entry.stat}</span>}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
