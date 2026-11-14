import { libraryType, rarity } from '../../data/library'

// Detailansicht eines Eintrags (für Spieler und als Vorschau)
export default function LibraryViewer({ item }) {
  const type = libraryType(item.type)
  const r = item.type === 'item' ? rarity(item.data?.rarity) : null
  return (
    <div className="space-y-4">
      <div className="pr-8">
        <p className="text-sm text-stone-500">
          {type.icon} {type.name}
          {r && <span className={`ml-1 ${r.color}`}>· {r.name}</span>}
        </p>
        <h2 className="title break-words text-2xl sm:text-3xl">{item.name}</h2>
        {item.type === 'effect' && item.data?.duration && <p className="text-sm text-amber-300">⏳ Dauer: {item.data.duration}</p>}
      </div>
      {item.image_url && (
        <div className="space-y-1">
          <img src={item.image_url} alt={item.name} className="max-h-[60vh] w-full rounded-xl bg-stone-900 object-contain" />
          <a href={item.image_url} target="_blank" rel="noreferrer" className="text-sm text-amber-400 hover:text-amber-300">
            🔍 In voller Größe öffnen
          </a>
        </div>
      )}
      {item.description ? (
        <p className="whitespace-pre-wrap text-stone-300">{item.description}</p>
      ) : (
        !item.image_url && <p className="text-sm text-stone-500">Keine Beschreibung.</p>
      )}
    </div>
  )
}
