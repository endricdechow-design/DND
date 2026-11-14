// Deutlicher Hinweis, dass man in dieser Runde der Spielleiter ist
export default function GameMasterBanner({ children }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border-2 border-amber-500/70 bg-gradient-to-r from-amber-900/40 via-amber-950/30 to-stone-950/40 p-4 shadow-lg shadow-amber-900/20">
      <span className="text-3xl leading-none" aria-hidden>📜</span>
      <div className="min-w-0">
        <p className="font-display text-lg font-bold tracking-wide text-amber-200">Spielleiter-Modus</p>
        <div className="text-sm text-amber-100/80">{children}</div>
      </div>
    </div>
  )
}
