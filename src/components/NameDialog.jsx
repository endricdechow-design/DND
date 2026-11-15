import { useState } from 'react'
import Modal from './Modal'

/** Kleines Pop-up, um einen Namen einzugeben (z. B. für einen Raum) */
export default function NameDialog({ title, hint, initial = '', placeholder, confirmLabel = 'Speichern', maxLength = 60, requireChange = false, error, onSave, onClose }) {
  const [name, setName] = useState(initial)
  return (
    <Modal onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim()) onSave(name.trim())
        }}
      >
        <h2 className="title pr-8 text-2xl">{title}</h2>
        {hint && <p className="text-sm text-stone-400">{hint}</p>}
        <input className="input" value={name} maxLength={maxLength} autoFocus placeholder={placeholder} onChange={(e) => setName(e.target.value)} />
        {error && <p className="alert-error">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Abbrechen</button>
          <button type="submit" className="btn-primary" disabled={!name.trim() || (requireChange && name.trim() === initial)}>{confirmLabel}</button>
        </div>
      </form>
    </Modal>
  )
}
