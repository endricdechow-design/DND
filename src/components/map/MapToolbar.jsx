import { BRUSH_SIZES, TOOLS } from '../../lib/fog'


const HINTS = {
  move: 'Karte mit dem Finger verschieben, mit zwei Fingern oder dem Mausrad zoomen.',
  rect: 'Rechteck aufziehen. Zwei Finger verschieben/zoomen weiterhin.',
  poly: 'Ecken nacheinander antippen, zum Schließen die erste Ecke antippen oder „Fertig“.',
  brush: 'Mit dem Finger malen. Zwei Finger verschieben/zoomen weiterhin.',
}

/** Werkzeugwahl (Bewegen / Rechteck / Vieleck / Pinsel) + Pinselgröße */
export default function MapToolbar({ tool, setTool, brush, setBrush, tools = TOOLS, children }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-lg border border-stone-700">
          {tools.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTool(t.key)}
              title={t.label}
              className={`px-3 py-2 text-sm transition ${tool === t.key ? 'bg-amber-500/20 text-amber-200' : 'text-stone-300 hover:bg-stone-800'}`}
            >
              <span aria-hidden>{t.icon}</span> <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
        {tool === 'brush' && setBrush && (
          <div className="flex overflow-hidden rounded-lg border border-stone-700" aria-label="Pinselgröße">
            {BRUSH_SIZES.map((b) => (
              <button
                key={b.key}
                type="button"
                onClick={() => setBrush(b.r)}
                className={`px-3 py-2 text-sm ${brush === b.r ? 'bg-amber-500/20 text-amber-200' : 'text-stone-400 hover:bg-stone-800'}`}
              >
                {b.label}
              </button>
            ))}
          </div>
        )}
        {children}
      </div>
      <p className="text-xs text-stone-500">{HINTS[tool]}</p>
    </div>
  )
}
