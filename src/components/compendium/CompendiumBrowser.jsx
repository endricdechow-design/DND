import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { CATEGORIES, CATEGORY_ORDER, entriesInCategory, entryById, searchCompendium } from '../../data/compendium'
import EntryView from './EntryView'

// Favoriten und zuletzt angesehene Einträge im Browser merken (fehlertolerant)
function readList(key) {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]')
  } catch {
    return []
  }
}
function writeList(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list))
  } catch {
    // Speichern nicht möglich (z. B. privater Modus) – nicht schlimm
  }
}

/**
 * Das Kompendium: Suche, Kategorien, Favoriten, Verlauf und Einträge.
 * initialEntryId: direkt einen Eintrag öffnen (z. B. über ein ⓘ-Symbol)
 */
export default function CompendiumBrowser({ houseRules = [], initialEntryId = null, autoFocus = false, onPageLink }) {
  const [query, setQuery] = useState('')
  const [stack, setStack] = useState(initialEntryId ? [{ entry: initialEntryId }] : []) // Verlauf für "Zurück"
  const [favorites, setFavorites] = useState(() => readList('kompendium-favoriten'))
  const [recent, setRecent] = useState(() => readList('kompendium-zuletzt'))
  const inputRef = useRef(null)

  useEffect(() => {
    if (autoFocus && !initialEntryId) inputRef.current?.focus()
  }, [autoFocus, initialEntryId])

  const view = stack[stack.length - 1] ?? null
  const entry = view?.entry ? entryById(view.entry, houseRules) : null

  // Zuletzt angesehen merken
  const entryId = entry?.id
  useEffect(() => {
    if (!entryId) return
    setRecent((list) => {
      const next = [entryId, ...list.filter((id) => id !== entryId)].slice(0, 8)
      writeList('kompendium-zuletzt', next)
      return next
    })
  }, [entryId])

  const openEntry = (id) => setStack((s) => [...s, { entry: id }])
  const openCategory = (cat) => setStack((s) => [...s, { category: cat }])
  const back = () => setStack((s) => s.slice(0, -1))
  const home = () => {
    setStack([])
    setQuery('')
  }

  function toggleFavorite(id) {
    setFavorites((list) => {
      const next = list.includes(id) ? list.filter((f) => f !== id) : [id, ...list]
      writeList('kompendium-favoriten', next)
      return next
    })
  }

  const results = query.trim() ? searchCompendium(query, houseRules) : []

  return (
    <div className="space-y-4">
      {/* Suchfeld */}
      <div className="flex items-center gap-2 pr-8">
        {(stack.length > 0 || query) && (
          <button type="button" onClick={stack.length ? back : home} className="btn-ghost shrink-0 px-3" title="Zurück">←</button>
        )}
        <input
          ref={inputRef}
          className="input"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setStack([])
          }}
          placeholder="🔍 Suchen: z. B. Vorteil, Konzentration, Goblin, AC …"
          aria-label="Kompendium durchsuchen"
        />
      </div>

      {/* Suchergebnisse */}
      {query.trim() && !view && (
        results.length ? (
          <ResultList entries={results} onOpen={openEntry} />
        ) : (
          <p className="text-center text-sm text-stone-500">Nichts gefunden. Versuch es mit einem anderen Begriff (auch englisch).</p>
        )
      )}

      {/* Eintrag */}
      {entry && (
        <EntryView
          entry={entry}
          onOpen={openEntry}
          isFavorite={favorites.includes(entry.id)}
          onToggleFavorite={() => toggleFavorite(entry.id)}
        />
      )}
      {view?.entry && !entry && <p className="text-sm text-stone-500">Dieser Eintrag existiert nicht mehr.</p>}

      {/* Kategorie */}
      {view?.category && (
        <div className="space-y-3">
          <h2 className="title text-2xl">{CATEGORIES[view.category]?.icon} {CATEGORIES[view.category]?.name}</h2>
          <ResultList entries={sortEntries(entriesInCategory(view.category, houseRules), view.category)} onOpen={openEntry} hideCategory />
        </div>
      )}

      {/* Startseite */}
      {!query.trim() && !view && (
        <div className="space-y-5">
          {favorites.length > 0 && (
            <QuickList title="⭐ Favoriten" ids={favorites} houseRules={houseRules} onOpen={openEntry} />
          )}
          {recent.length > 0 && (
            <QuickList title="🕘 Zuletzt angesehen" ids={recent} houseRules={houseRules} onOpen={openEntry} />
          )}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(houseRules.length ? ['hausregeln', ...CATEGORY_ORDER] : CATEGORY_ORDER).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => openCategory(cat)}
                className={`rounded-xl border p-3 text-left transition hover:border-amber-600 ${cat === 'hausregeln' ? 'border-amber-700/70 bg-amber-950/20' : 'border-stone-800 bg-stone-950/40'}`}
              >
                <span className="text-xl">{CATEGORIES[cat].icon}</span>
                <span className="mt-1 block text-sm font-semibold text-stone-100">{CATEGORIES[cat].name}</span>
                <span className="text-xs text-stone-500">{entriesInCategory(cat, houseRules).length} Einträge</span>
              </button>
            ))}
          </div>
          {onPageLink && (
            <Link to="/kompendium" onClick={onPageLink} className="block text-center text-sm text-amber-400 hover:text-amber-300">
              Ganze Kompendium-Seite öffnen (dort verwalten Spielleiter auch ihre Hausregeln) →
            </Link>
          )}
          <p className="text-center text-xs text-stone-600">
            Regeln nach dem SRD 5.1 (CC-BY-4.0), eigene deutsche Zusammenfassungen.
          </p>
        </div>
      )}
    </div>
  )
}

// Zauber nach Grad, sonst alphabetisch (Regeln in ihrer festen Reihenfolge)
function sortEntries(list, category) {
  if (category === 'zauber') return [...list].sort((a, b) => a.spell.level - b.spell.level || a.title.localeCompare(b.title, 'de'))
  if (['gegenstaende', 'monster', 'hausregeln', 'fertigkeiten'].includes(category)) {
    return [...list].sort((a, b) => a.title.localeCompare(b.title, 'de'))
  }
  return list
}

function ResultList({ entries, onOpen, hideCategory = false }) {
  return (
    <ul className="divide-y divide-stone-800 rounded-xl border border-stone-800">
      {entries.map((e) => (
        <li key={e.id}>
          <button type="button" onClick={() => onOpen(e.id)} className="w-full px-3 py-2.5 text-left transition hover:bg-stone-900/70">
            <span className="flex flex-wrap items-baseline gap-2">
              <span className="font-medium text-stone-100">{e.title}</span>
              {!hideCategory && <span className="text-xs text-stone-500">{CATEGORIES[e.category]?.icon} {CATEGORIES[e.category]?.name}</span>}
              {e.gameName && <span className="rounded bg-amber-500/15 px-1.5 text-xs text-amber-300">{e.gameName}</span>}
            </span>
            <span className="line-clamp-2 block text-sm text-stone-400">{e.summary}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function QuickList({ title, ids, houseRules, onOpen }) {
  const entries = ids.map((id) => entryById(id, houseRules)).filter(Boolean)
  if (!entries.length) return null
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">{title}</p>
      <div className="flex flex-wrap gap-2">
        {entries.map((e) => (
          <button key={e.id} type="button" onClick={() => onOpen(e.id)} className="rounded-full border border-stone-700 bg-stone-950/40 px-3 py-1.5 text-sm text-stone-200 hover:border-amber-500">
            {e.title}
          </button>
        ))}
      </div>
    </div>
  )
}
