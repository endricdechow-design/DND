import { CATEGORIES, entryById } from '../../data/compendium'
import { abilityShort, skillName } from '../../data/srd'
import { featuresUpTo } from '../../data/levels'
import { abilityMod, formatMeters, formatMod } from '../../lib/character'
import SpellDetails from '../spells/SpellDetails'

// Einfache Textformatierung: Absätze, "- " Aufzählungen, "| a | b |" Tabellen
export function RichText({ text }) {
  if (!text) return null
  return (
    <div className="space-y-3 text-stone-300">
      {text.split('\n\n').map((block, i) => {
        const lines = block.split('\n')
        if (lines.every((l) => l.startsWith('|'))) {
          const rows = lines.map((l) => l.split('|').slice(1, -1).map((c) => c.trim()))
          return (
            <div key={i} className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {rows.map((cells, r) => (
                    <tr key={r} className={r === 0 ? 'border-b border-stone-700 font-semibold text-stone-100' : 'border-b border-stone-800/60'}>
                      {cells.map((c, k) => <td key={k} className="px-2 py-1">{c}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        if (lines.every((l) => l.startsWith('- '))) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines.map((l, k) => <li key={k}>{l.slice(2)}</li>)}
            </ul>
          )
        }
        return (
          <div key={i} className="space-y-1">
            {lines.map((l, k) =>
              l.startsWith('- ') ? (
                <p key={k} className="pl-4">• {l.slice(2)}</p>
              ) : (
                // Überschrift über einer Aufzählung (z. B. „1️⃣ Karte anlegen“) hervorheben
                <p key={k} className={k === 0 && lines.length > 1 && lines.slice(1).every((x) => x.startsWith('- ')) ? 'font-semibold text-stone-100' : undefined}>{l}</p>
              )
            )}
          </div>
        )
      })}
    </div>
  )
}

function TraitList({ items }) {
  return (
    <ul className="space-y-1.5 text-sm">
      {items.map(([name, text]) => (
        <li key={name}><span className="font-semibold text-amber-200">{name}:</span> <span className="text-stone-300">{text}</span></li>
      ))}
    </ul>
  )
}

// Werteblock eines Monsters
function MonsterBlock({ m }) {
  return (
    <div className="space-y-3 rounded-xl border border-red-900/50 bg-red-950/10 p-4 text-sm">
      <p className="italic text-stone-400">{m.type}</p>
      <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
        <p><b className="text-stone-100">Rüstungsklasse</b> {m.ac}</p>
        <p><b className="text-stone-100">Trefferpunkte</b> {m.hp}</p>
        <p><b className="text-stone-100">Bewegung</b> {m.speed}</p>
      </div>
      <div className="grid grid-cols-6 gap-1 text-center">
        {['STÄ', 'GES', 'KON', 'INT', 'WEI', 'CHA'].map((label, i) => (
          <div key={label} className="rounded bg-stone-900 py-1">
            <p className="text-xs text-stone-500">{label}</p>
            <p className="text-stone-100">{m.abilities[i]}</p>
            <p className="text-xs text-stone-400">{formatMod(abilityMod(m.abilities[i]))}</p>
          </div>
        ))}
      </div>
      {m.extras && <p><b className="text-stone-100">Weiteres</b> {m.extras}</p>}
      <p><b className="text-stone-100">Sinne</b> {m.senses}</p>
      <p><b className="text-stone-100">Sprachen</b> {m.languages}</p>
      <p><b className="text-stone-100">Herausforderung</b> {m.cr} ({m.xp.toLocaleString('de-DE')} EP)</p>
      {m.traits.length > 0 && <div className="border-t border-red-900/40 pt-2"><TraitList items={m.traits} /></div>}
      <div className="border-t border-red-900/40 pt-2">
        <p className="mb-1 font-display font-bold text-red-200">Aktionen</p>
        <TraitList items={m.actions} />
      </div>
    </div>
  )
}

/**
 * Anzeige eines Kompendium-Eintrags (je nach Art unterschiedlich).
 * onOpen(id) öffnet einen verlinkten Eintrag.
 */
export default function EntryView({ entry, onOpen, isFavorite, onToggleFavorite }) {
  const cat = CATEGORIES[entry.category]
  return (
    <article className="space-y-4">
      <div className="flex items-start justify-between gap-3 pr-8">
        <div>
          <p className="text-xs uppercase tracking-wider text-stone-500">
            {cat?.icon} {cat?.name}
            {entry.gameName && <span className="ml-2 rounded bg-amber-500/15 px-1.5 normal-case tracking-normal text-amber-300">Hausregel · {entry.gameName}</span>}
          </p>
          <h2 className="title text-2xl sm:text-3xl">{entry.title}</h2>
        </div>
        {onToggleFavorite && (
          <button type="button" onClick={onToggleFavorite} className="text-2xl" title={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten'}>
            {isFavorite ? '⭐' : '☆'}
          </button>
        )}
      </div>

      {entry.kind !== 'spell' && entry.kind !== 'monster' && entry.summary && entry.kind !== 'house' && (
        <p className="rounded-lg border-l-4 border-amber-600 bg-amber-950/20 px-3 py-2 text-stone-100">{entry.summary}</p>
      )}

      {(entry.kind === 'rule' || entry.kind === 'house') && <RichText text={entry.body} />}

      {entry.kind === 'rule' && entry.example && (
        <div className="rounded-lg bg-stone-950/60 px-3 py-2 text-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-stone-500">🎲 Beispiel am Tisch</p>
          <p className="text-stone-300">{entry.example}</p>
        </div>
      )}

      {entry.kind === 'spell' && (
        <>
          <p className="text-sm text-stone-400">
            {entry.spell.level === 0 ? 'Zaubertrick' : `Grad ${entry.spell.level}`} · {entry.spell.school} ·{' '}
            Klassen: {entry.spell.classes.map((c) => ({ bard: 'Barde', cleric: 'Kleriker', druid: 'Druide', paladin: 'Paladin', ranger: 'Waldläufer', sorcerer: 'Zauberer', warlock: 'Hexenmeister', wizard: 'Magier' })[c]).join(', ')}
          </p>
          <SpellDetails spell={entry.spell} characterLevel={1} />
        </>
      )}

      {entry.kind === 'item' && (
        <>
          <div className="flex flex-wrap gap-2 text-sm">
            {entry.item.stat && <span className="rounded bg-stone-800 px-2 py-0.5 text-amber-200">{entry.item.stat}</span>}
            {entry.item.weight > 0 && <span className="rounded bg-stone-800 px-2 py-0.5 text-stone-300">⚖️ {String(entry.item.weight).replace('.', ',')} kg</span>}
            {entry.item.duration && <span className="rounded bg-stone-800 px-2 py-0.5 text-stone-300">⏳ {entry.item.duration}</span>}
          </div>
          <RichText text={entry.item.description} />
        </>
      )}

      {entry.kind === 'monster' && <MonsterBlock m={entry.monster} />}

      {entry.kind === 'race' && (
        <>
          <p className="text-sm text-stone-400">
            Attributsboni: {Object.entries(entry.race.bonuses).map(([k, v]) => `${abilityShort(k)} +${v}`).join(', ')}
            {entry.race.chooseAbilities ? ` + ${entry.race.chooseAbilities.count}× frei +1` : ''} · Bewegung {formatMeters(entry.race.speed)}
            {entry.race.skills ? ` · geübt in ${entry.race.skills.map(skillName).join(', ')}` : ''}
          </p>
          <TraitList items={entry.race.traits} />
        </>
      )}

      {entry.kind === 'class' && (
        <>
          <p className="text-sm text-stone-400">
            Trefferwürfel W{entry.cls.hitDie} · Rettungswürfe {entry.cls.saves.map(abilityShort).join(', ')} · Wichtig: {entry.cls.primary.map(abilityShort).join('/')}
            {entry.cls.spellcasting ? ` · Zaubert mit ${abilityShort(entry.cls.spellcasting)}` : ''}
          </p>
          <p className="text-sm text-stone-400">Fertigkeiten ({entry.cls.skillChoices.count} wählen): {entry.cls.skillChoices.from.map(skillName).join(', ')}</p>
          <TraitList items={[...entry.cls.features.map(([n, t]) => [`${n} (St. 1)`, t]), ...featuresUpTo(entry.cls.key, 20)]} />
        </>
      )}

      {entry.related?.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">Siehe auch</p>
          <div className="flex flex-wrap gap-2">
            {entry.related.map((id) => (
              <button key={id} type="button" onClick={() => onOpen(id)} className="rounded-full border border-stone-700 px-3 py-1 text-sm text-amber-300 hover:border-amber-500">
                {entryById(id)?.title ?? id.split(':')[1]} →
              </button>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}
