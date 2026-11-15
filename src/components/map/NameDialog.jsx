import { useState } from 'react'
import Modal from '../Modal'

/** Kleines Pop-up, um einen Namen einzugeben (z. B. für einen Raum) */
export default function NameDialog({ title, initial = '', placeholder, confirmLabel = 'Speichern', onSave, onClose }) {
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
        <input className="input" value={name} maxLength={60} autoFocus placeholder={placeholder} onChange={(e) => setName(e.target.value)} />
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Abbrechen</button>
          <button type="submit" className="btn-primary" disabled={!name.trim()}>{confirmLabel}</button>
        </div>
      </form>
    </Modal>
  )
}
