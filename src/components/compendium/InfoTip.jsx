import { useCompendium } from '../../lib/compendium'

/**
 * Kleines ⓘ-Symbol: öffnet den passenden Kompendium-Eintrag als Pop-up.
 * Beispiel: <InfoTip id="kampf:ruestungsklasse" />
 */
export default function InfoTip({ id, label = 'Erklärung im Kompendium' }) {
  const { open } = useCompendium()
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        open(id)
      }}
      className="ml-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-stone-600 align-middle text-[10px] font-bold normal-case leading-none tracking-normal text-stone-400 transition hover:border-amber-400 hover:text-amber-300"
      title={label}
      aria-label={label}
    >
      i
    </button>
  )
}
