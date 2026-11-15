import { Link } from 'react-router'

// Kachel mit Symbol, Titel und Kurztext, die zu einem Bereich führt (Karte, Bibliothek, Kompendium …)
export default function AreaTile({ to, icon, title, text, badge, highlight }) {
  return (
    <Link
      to={to}
      className={`group flex min-w-0 items-center gap-4 rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:border-amber-600 ${
        highlight ? 'border-emerald-700/60 bg-emerald-950/20' : 'border-stone-800 bg-stone-900/70'
      }`}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-stone-950/60 text-3xl" aria-hidden>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg font-bold text-stone-100 group-hover:text-amber-200">{title}</p>
        <p className={`truncate text-sm ${highlight ? 'text-emerald-300' : 'text-stone-400'}`}>
          {highlight && '👁️ '}
          {text}
        </p>
        {badge && <p className="mt-1 inline-block rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-stone-950">{badge}</p>}
      </div>
      <span className="text-stone-600 group-hover:text-amber-400" aria-hidden>→</span>
    </Link>
  )
}
