import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Eigene Sicherheitsfrage im Fantasy-Design statt des grauen Browser-Fensters.
 *   if (!(await ask('Karte löschen?'))) return
 * Gefährliche Aktionen (löschen, entfernen …) bekommen automatisch einen roten Knopf.
 */
let openDialog = null

const DANGER_WORDS = [
  ['löschen', 'Löschen'],
  ['entfernen', 'Entfernen'],
  ['verlassen', 'Verlassen'],
  ['ablehnen', 'Ablehnen'],
]

// oxlint-disable-next-line react/only-export-components
export function ask(message, options = {}) {
  const lower = message.toLowerCase()
  const match = DANGER_WORDS.find(([word]) => lower.includes(word))
  const request = {
    message,
    title: options.title ?? (match ? 'Bist du sicher?' : 'Kurz nachgefragt'),
    confirmLabel: options.confirmLabel ?? (match ? match[1] : 'Ja'),
    danger: options.danger ?? Boolean(match),
  }
  if (!openDialog) return Promise.resolve(window.confirm(message)) // Notfall: ohne Layout
  return new Promise((resolve) => openDialog({ ...request, resolve }))
}

/** Einmal im Layout einbinden – zeigt die Fragen an */
export function ConfirmHost() {
  const [request, setRequest] = useState(null)

  useEffect(() => {
    openDialog = setRequest
    return () => {
      openDialog = null
    }
  }, [])

  const finish = (result) => {
    request?.resolve(result)
    setRequest(null)
  }

  useEffect(() => {
    if (!request) return
    // Esc/Enter gehören nur dieser Frage (nicht dem Pop-up dahinter)
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault()
        e.stopImmediatePropagation()
        finish(e.key === 'Enter')
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  })

  if (!request) return null

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center" onClick={() => finish(false)} role="alertdialog" aria-modal="true">
      <div
        className="confirm-pop w-full max-w-sm overflow-hidden rounded-2xl border border-amber-800/60 bg-gradient-to-b from-stone-900 to-stone-950 shadow-2xl shadow-black"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`h-1 ${request.danger ? 'bg-gradient-to-r from-red-700 via-red-500 to-red-700' : 'bg-gradient-to-r from-amber-700 via-amber-400 to-amber-700'}`} />
        <div className="space-y-3 p-5 text-center">
          <p className="text-4xl" aria-hidden>{request.danger ? '⚠️' : '🤔'}</p>
          <h2 className="title text-xl">{request.title}</h2>
          <p className="text-stone-300">{request.message}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 border-t border-stone-800 p-3">
          <button type="button" className="btn-ghost justify-center py-2.5" onClick={() => finish(false)} autoFocus>
            Abbrechen
          </button>
          <button
            type="button"
            className={
              request.danger
                ? 'inline-flex items-center justify-center rounded-lg bg-gradient-to-b from-red-600 to-red-800 px-4 py-2.5 font-semibold text-white shadow-lg shadow-red-950/50 transition hover:from-red-500 hover:to-red-700'
                : 'btn-primary'
            }
            onClick={() => finish(true)}
          >
            {request.confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
