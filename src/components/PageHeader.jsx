/**
 * Einheitlicher Seitenkopf im Fantasy-Stil (wie Lobby und Startseite).
 * eyebrow = kleine Zeile über dem Titel, children = Knöpfe rechts
 */
export default function PageHeader({ icon, eyebrow, title, subtitle, children }) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-amber-900/40 bg-gradient-to-br from-amber-950/40 via-stone-900/80 to-violet-950/30 px-5 py-5 shadow-2xl shadow-black/50 sm:px-7 sm:py-6">
      {icon && (
        <span className="pointer-events-none absolute -right-2 -top-5 select-none text-[7rem] leading-none opacity-[0.08]" aria-hidden>
          {icon}
        </span>
      )}
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <p className="text-xs uppercase tracking-[0.3em] text-amber-500/80">{eyebrow}</p>}
          <h1 className="title mt-1 break-words text-3xl sm:text-4xl">
            {icon && <span aria-hidden>{icon} </span>}
            {title}
          </h1>
          <div className="mt-2 flex max-w-xs items-center gap-3" aria-hidden>
            <span className="h-px flex-1 bg-gradient-to-r from-amber-600/60 to-transparent" />
            <span className="text-xs text-amber-600/70">✦</span>
            <span className="h-px flex-1 bg-gradient-to-l from-amber-600/60 to-transparent" />
          </div>
          {subtitle && <p className="mt-2 max-w-2xl text-stone-400">{subtitle}</p>}
        </div>
        {children && <div className="flex flex-wrap gap-2">{children}</div>}
      </div>
    </header>
  )
}
