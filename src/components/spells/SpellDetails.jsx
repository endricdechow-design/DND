import { cantripDamage } from '../../data/spells'

// Kleine Markierungen: Konzentration / Ritual
export function SpellTags({ spell }) {
  return (
    <>
      {spell.concentration && <span className="rounded bg-sky-900/60 px-1.5 text-xs text-sky-200" title="Konzentration – siehe Kompendium">K</span>}
      {spell.ritual && <span className="rounded bg-emerald-900/60 px-1.5 text-xs text-emerald-200" title="Ritual">R</span>}
    </>
  )
}

// Alle Angaben eines Zaubers
export default function SpellDetails({ spell, characterLevel }) {
  const scaled = cantripDamage(spell.cantripDie, characterLevel)
  return (
    <div className="space-y-2 text-sm">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-stone-400 sm:grid-cols-4">
        <div><dt className="text-xs text-stone-500">Zeitaufwand</dt><dd className="text-stone-200">{spell.time}</dd></div>
        <div><dt className="text-xs text-stone-500">Reichweite</dt><dd className="text-stone-200">{spell.range}</dd></div>
        <div><dt className="text-xs text-stone-500">Komponenten</dt><dd className="text-stone-200">{spell.components}</dd></div>
        <div><dt className="text-xs text-stone-500">Dauer</dt><dd className="text-stone-200">{spell.concentration ? `Konz., ${spell.duration}` : spell.duration}</dd></div>
      </dl>
      <p className="text-stone-300">{spell.text}</p>
      {scaled && <p className="text-amber-200">Schaden auf deiner Stufe: <b>{scaled}</b></p>}
      {spell.higher && <p className="text-stone-400"><span className="text-stone-500">Höherer Grad:</span> {spell.higher}</p>}
      <p className="text-xs text-stone-500">
        {spell.school}
        {spell.ritual && ' · kann als Ritual gewirkt werden (+10 Minuten, ohne Zauberplatz)'}
        {spell.concentration && ' · Konzentration: endet, wenn du einen anderen Konzentrationszauber wirkst oder sie verlierst'}
      </p>
    </div>
  )
}
