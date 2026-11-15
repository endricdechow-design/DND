import { Link } from 'react-router'
import Avatar from '../Avatar'
import InfoTip from '../compendium/InfoTip'
import { CLASSES, RACES, byKey } from '../../data/srd'
import { hpStatus, shortRaceName } from '../../lib/party'
import { ConditionList, ConditionPicker } from './Conditions'

/**
 * Die "Gruppenkarte" eines Charakters – das, was alle in der Runde sehen dürfen.
 * canEditConditions: Besitzer oder Spielleiter dürfen Zustände setzen
 * sheetLink: Link zum vollen Bogen (nur für Besitzer und Spielleiter)
 */
export default function PartyCardDetails({ card, playerName, canEditConditions, onConditionsChange, sheetLink }) {
  const status = hpStatus(card.hp_percent)
  const race = byKey(RACES, card.race)
  const cls = byKey(CLASSES, card.class)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 pr-8">
        <Avatar name={card.name} src={card.avatar_url} size="xl" />
        <div className="min-w-0">
          <h2 className="title break-words text-2xl sm:text-3xl">{card.name}</h2>
          <p className="text-stone-200">
            {shortRaceName(race?.name)} · {cls?.name} · Stufe {card.level}
          </p>
          {playerName && <p className="text-sm text-stone-500">gespielt von {playerName}</p>}
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <p className="text-sm text-stone-400">Gesundheit</p>
          <p className={`text-sm font-semibold ${status.text}`}>{status.label}</p>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-stone-800">
          <div className={`h-full transition-all ${status.bar}`} style={{ width: `${card.hp_percent ?? 100}%` }} />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm text-stone-400">Zustände<InfoTip id="zustaende:poisoned" /></p>
        {canEditConditions ? (
          <ConditionPicker conditions={card.conditions} onChange={onConditionsChange} />
        ) : (
          <ConditionList conditions={card.conditions} />
        )}
      </div>

      {card.public_notes && (
        <div>
          <p className="mb-1 text-sm text-stone-400">Über {card.name}</p>
          <p className="whitespace-pre-wrap text-sm text-stone-300">{card.public_notes}</p>
        </div>
      )}

      {sheetLink && (
        <Link to={sheetLink} className="btn-primary w-full">
          📜 Vollen Charakterbogen öffnen
        </Link>
      )}
    </div>
  )
}
