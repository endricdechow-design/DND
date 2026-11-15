/**
 * Schimmernde Platzhalter, solange eine Seite lädt.
 * <PageSkeleton text="Öffne die Bibliothek …" />
 */
export function Shimmer({ className = '' }) {
  return <div className={`skeleton rounded-xl ${className}`} />
}

export default function PageSkeleton({ text = 'Lade …', tiles = 4 }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">{text}</span>
      <Shimmer className="h-32 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: tiles }, (_, i) => (
          <Shimmer key={i} className="h-28" />
        ))}
      </div>
      <Shimmer className="h-48 rounded-2xl" />
      <p className="text-center text-sm text-stone-500">{text}</p>
    </div>
  )
}
