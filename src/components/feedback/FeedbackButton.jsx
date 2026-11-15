import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { translateError } from '../../lib/errors'
import { uploadImage } from '../../lib/images'
import Modal from '../Modal'
import { FEEDBACK_CATEGORIES } from '../../data/feedback'


/** Kleiner runder 💬-Knopf unten rechts (am Handy über der unteren Navigation) */
export default function FeedbackButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="above-bottom-nav fixed bottom-4 right-3 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-amber-700/50 bg-stone-900/90 text-base opacity-70 shadow-lg shadow-black/60 transition hover:scale-105 hover:border-amber-400 hover:opacity-100 sm:right-4"
        title="Feedback senden"
        aria-label="Feedback senden"
      >
        💬
      </button>
      {open && (
        <Modal onClose={() => setOpen(false)}>
          <FeedbackForm onClose={() => setOpen(false)} />
        </Modal>
      )}
    </>
  )
}

function FeedbackForm({ onClose }) {
  const { profile } = useAuth()
  const [category, setCategory] = useState('bug')
  const [message, setMessage] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function send() {
    setBusy(true)
    setError('')
    try {
      let imageUrl = null
      if (file) {
        imageUrl = await uploadImage({ bucket: 'feedback', pathWithoutExtension: `${profile.id}/${Date.now()}`, file, maxSize: 1600 })
      }
      const { error } = await supabase.from('feedback').insert({
        user_id: profile.id,
        category,
        message: message.trim(),
        page_url: window.location.href,
        image_url: imageUrl,
        device: `${window.innerWidth}×${window.innerHeight} · ${navigator.userAgent.slice(0, 160)}`,
        version: __APP_VERSION__,
      })
      if (error) throw error
      setSent(true)
      setTimeout(onClose, 1800)
    } catch (err) {
      setError(translateError(err.message))
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <div className="py-6 text-center">
        <p className="text-5xl">🙏</p>
        <p className="title mt-3 text-xl">Danke für dein Feedback!</p>
        <p className="text-stone-400">Es ist angekommen.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="pr-8">
        <h2 className="title text-2xl">💬 Feedback senden</h2>
        <p className="text-sm text-stone-400">Was ist dir aufgefallen? Die aktuelle Seite wird automatisch mitgeschickt.</p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {FEEDBACK_CATEGORIES.map((c) => (
          <button key={c.key} type="button" onClick={() => setCategory(c.key)}
            className={`rounded-lg border px-1 py-2 text-sm transition ${category === c.key ? 'border-amber-500 bg-amber-500/10 text-amber-200' : 'border-stone-700 text-stone-300 hover:border-stone-500'}`}>
            <span className="block text-xl">{c.icon}</span>{c.name}
          </button>
        ))}
      </div>
      <textarea className="input min-h-32" value={message} maxLength={4000} autoFocus onChange={(e) => setMessage(e.target.value)}
        placeholder={category === 'bug' ? 'Was hast du gemacht und was ist passiert?' : category === 'idea' ? 'Was wünschst du dir?' : 'Erzähl …'} />
      <div className="flex flex-wrap items-center gap-3">
        <label className="btn-ghost cursor-pointer">
          📷 {file ? 'Screenshot ändern' : 'Screenshot anhängen'}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
            setFile(e.target.files?.[0] ?? null)
            e.target.value = ''
          }} />
        </label>
        {file && <span className="truncate text-sm text-stone-400">{file.name} <button type="button" className="ml-1 text-stone-500 hover:text-red-300" onClick={() => setFile(null)}>✕</button></span>}
      </div>
      {error && <p className="alert-error">{error}</p>}
      <button type="button" className="btn-primary w-full" disabled={busy || !message.trim()} onClick={send}>
        {busy ? 'Sende …' : 'Absenden'}
      </button>
    </div>
  )
}
