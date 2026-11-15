import { useState } from 'react'
import { displayType, rarity } from '../../data/library'

/**
 * Kachel für einen Bibliothekseintrag.
 * assignedNames: Namen der zugeteilten Spieler (nur für den Spielleiter)
 * onToggleVisibility: schneller Freischalten/Verstecken-Knopf (nur für den Spielleiter)
 */
export default function LibraryCard({ item, assignedNames, quantity = 1, onOpen, onToggleVisibility, onGive }) {
  const type = displayType(item)
  const r = item.type === 'item' ? rarity(item.data?.rarity) : null
  const isGMView = Boolean(onToggleVisibility)
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-stone-800 bg-stone-950/50 transition hover:border-amber-700">
      <button type="button" onClick={onOpen} className="flex flex-1 flex-col text-left">
        {item.image_url && !imageFailed ? (
          <img src={item.image_url} alt={item.name} loading="lazy" onError={() => setImageFailed(true)}
            className="h-32 w-full bg-stone-900 object-cover" />
        ) : (
          <div className="flex h-20 w-full items-center justify-center bg-stone-900/60 text-4xl">{type.icon}</div>
        )}
        <div className="flex flex-1 flex-col gap-1 p-3">
          <p className="flex items-start justify-between gap-2">
            <span className="font-display font-bold leading-tight text-stone-100">{item.name}</span>
            <span className="flex shrink-0 gap-1">
              {quantity > 1 && <span className="rounded bg-amber-600 px-2 py-0.5 text-xs font-bold text-stone-950">×{quantity}</span>}
              {item.data?.stat && <span className="rounded bg-stone-800 px-2 py-0.5 text-xs text-amber-200">{item.data.stat}</span>}
            </span>
          </p>
          <p className="text-xs text-stone-500">
            {type.icon} {type.name}
            {r && <span className={`ml-1 ${r.color}`}>· {r.name}</span>}
            {item.type === 'effect' && item.data?.duration && <span className="ml-1">· {item.data.duration}</span>}
          </p>
          {isGMView && (
            <p className="mt-auto pt-1 text-xs">
              {item.visibility === 'all' ? (
                <span className="text-emerald-300">👥 Für alle freigeschaltet</span>
              ) : assignedNames?.length ? (
                <span className="text-violet-300">👤 {assignedNames.join(', ')}</span>
              ) : (
                <span className="text-stone-500">🔒 Versteckt</span>
              )}
            </p>
          )}
        </div>
      </button>
      {isGMView && (
        <div className="grid grid-cols-2 border-t border-stone-800 text-sm">
          <button
            type="button"
            onClick={onGive}
            className="border-r border-stone-800 px-2 py-2 text-violet-300 transition hover:bg-violet-950/40"
          >
            🎁 Geben
          </button>
          <button
            type="button"
            onClick={onToggleVisibility}
            className={`px-2 py-2 transition ${
              item.visibility === 'all' ? 'text-stone-400 hover:bg-stone-800' : 'text-amber-300 hover:bg-amber-950/40'
            }`}
          >
            {item.visibility === 'all' ? '🔒 Verstecken' : '🔓 Freischalten'}
          </button>
        </div>
      )}
    </div>
  )
}
