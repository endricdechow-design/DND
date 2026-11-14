import Avatar from '../Avatar'
import { hpStatus } from '../../lib/party'
import { ConditionIcons } from './Conditions'

// Leiste mit den Köpfen aller Charaktere der Runde
export default function PartyBar({ cards, myUserId, onSelect }) {
  if (!cards.length) return null
  return (
    <section className="card p-4">
      <h2 className="title mb-3 text-xl">Die Gruppe</h2>
      <ul className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        {cards.map((card) => {
          const status = hpStatus(card.hp_percent)
          return (
            <li key={card.character_id} className="w-20 shrink-0">
              <button
                type="button"
                onClick={() => onSelect(card)}
                className="group flex w-full flex-col items-center gap-1.5 rounded-xl p-1 transition hover:bg-stone-800/60"
                title={`${card.name} – ${status.label}`}
              >
                <div className="relative">
                  <Avatar name={card.name} src={card.avatar_url} size="lg" />
                  {card.hp_percent === 0 && (
                    <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 text-2xl">💀</span>
                  )}
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-800">
                  <div className={`h-full ${status.bar}`} style={{ width: `${card.hp_percent ?? 100}%` }} />
                </div>
                <p className="w-full truncate text-center text-xs text-stone-200">
                  {card.name}
                  {card.user_id === myUserId && <span className="text-stone-500"> (du)</span>}
                </p>
                <div className="h-4">
                  <ConditionIcons conditions={card.conditions} />
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
