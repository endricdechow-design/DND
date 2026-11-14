import { useEffect } from 'react'
import { createPortal } from 'react-dom'

// Einfaches Pop-up-Fenster: schließt bei Klick daneben oder mit der Esc-Taste.
// Wird direkt in <body> gezeichnet (Portal), damit es immer über der ganzen Seite liegt.
export default function Modal({ onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="card relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-b-none sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-stone-400 hover:bg-stone-800 hover:text-stone-100"
          aria-label="Schließen"
        >
          ✕
        </button>
        {children}
      </div>
    </div>,
    document.body
  )
}
