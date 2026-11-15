import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { translateError } from '../lib/errors'
import { FEEDBACK_CATEGORIES } from '../data/feedback'

/**
 * Feedback-Eingang (nur für den Betreiber der App) + Push-Einrichtung.
 * Andere sehen hier ihre eigenen Rückmeldungen.
 */
export default function FeedbackPage() {
  const [isAdmin, setIsAdmin] = useState(null)
  const [adminExists, setAdminExists] = useState(true)
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('new')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const [{ data: admins }, { data: exists }, { data: rows, error }] = await Promise.all([
      supabase.from('app_admins').select('user_id').limit(1),
      supabase.rpc('app_admin_exists'),
      supabase.from('feedback').select('*, profiles(username)').order('created_at', { ascending: false }),
    ])
    if (error) setError(translateError(error.message))
    setIsAdmin((admins ?? []).length > 0)
    setAdminExists(Boolean(exists))
    setItems(rows ?? [])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function claim() {
    const { error } = await supabase.rpc('claim_app_admin')
    if (error) return setError(translateError(error.message))
    load()
  }

  async function setStatus(item, status) {
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, status } : i)))
    const { error } = await supabase.from('feedback').update({ status }).eq('id', item.id)
    if (error) setError(translateError(error.message))
  }

  async function remove(item) {
    if (!confirm('Dieses Feedback löschen?')) return
    const { error } = await supabase.from('feedback').delete().eq('id', item.id)
    if (error) return setError(translateError(error.message))
    setItems((list) => list.filter((i) => i.id !== item.id))
  }

  if (isAdmin === null) return <p className="title animate-pulse text-center text-xl">Lade …</p>

  const shown = items.filter((i) => filter === 'all' || i.status === filter)
  const category = (key) => FEEDBACK_CATEGORIES.find((c) => c.key === key) ?? FEEDBACK_CATEGORIES[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="title text-3xl">💬 Feedback</h1>
        <p className="text-stone-400">{isAdmin ? 'Alle Rückmeldungen aus eurer Gruppe.' : 'Deine Rückmeldungen – neues Feedback sendest du über den 💬-Knopf unten rechts.'}</p>
      </div>

      {error && <p className="alert-error">{error}</p>}

      {!isAdmin && !adminExists && (
        <section className="card space-y-3 border-amber-600/70">
          <h2 className="title text-xl">Betreiber festlegen</h2>
          <p className="text-sm text-stone-400">
            Noch niemand empfängt das Feedback. Der Erste, der hier tippt, wird Betreiber der App und sieht alle Rückmeldungen.
            Das geht nur einmal – also nur tippen, wenn du die App betreust.
          </p>
          <button type="button" className="btn-primary" onClick={claim}>👑 Ich bin der Betreiber</button>
        </section>
      )}

      {isAdmin && <PushSetup />}

      {isAdmin && (
        <div className="flex flex-wrap gap-2">
          {[['new', 'Neu'], ['done', 'Erledigt'], ['all', 'Alle']].map(([key, label]) => (
            <button key={key} type="button" onClick={() => setFilter(key)}
              className={`rounded-full border px-3 py-1.5 text-sm ${filter === key ? 'border-amber-500 bg-amber-500/15 text-amber-200' : 'border-stone-700 text-stone-400'}`}>
              {label} <span className="text-stone-500">{key === 'all' ? items.length : items.filter((i) => i.status === key).length}</span>
            </button>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <p className="card text-center text-stone-500">Keine Rückmeldungen.</p>
      ) : (
        <ul className="space-y-3">
          {shown.map((i) => {
            const c = category(i.category)
            let path = i.page_url
            try {
              path = new URL(i.page_url).pathname
            } catch {
              // keine gültige Adresse
            }
            return (
              <li key={i.id} className={`card space-y-2 p-4 ${i.status === 'done' ? 'opacity-60' : ''}`}>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-semibold text-stone-100">{c.icon} {c.name} · {i.profiles?.username ?? 'Unbekannt'}</span>
                  <span className="text-xs text-stone-500">{new Date(i.created_at).toLocaleString('de-DE')}</span>
                </div>
                <p className="whitespace-pre-wrap text-stone-200">{i.message}</p>
                {i.image_url && (
                  <a href={i.image_url} target="_blank" rel="noreferrer">
                    <img src={i.image_url} alt="Screenshot" className="max-h-60 rounded-lg border border-stone-800 object-contain" />
                  </a>
                )}
                <p className="text-xs text-stone-500">Seite: {path || '–'} · Version {i.version || '–'}</p>
                {isAdmin && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {i.status === 'new' ? (
                      <button type="button" className="btn-ghost px-3 py-1 text-xs" onClick={() => setStatus(i, 'done')}>✅ Erledigt</button>
                    ) : (
                      <button type="button" className="btn-ghost px-3 py-1 text-xs" onClick={() => setStatus(i, 'new')}>↩️ Wieder offen</button>
                    )}
                    <button type="button" className="btn-danger px-3 py-1 text-xs" onClick={() => remove(i)}>Löschen</button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// Einrichtung der Push-Benachrichtigung über die App "ntfy"
function PushSetup() {
  const [topic, setTopic] = useState(null) // null = lädt
  const [status, setStatus] = useState('')

  useEffect(() => {
    supabase.from('app_settings').select('value').eq('key', 'ntfy_topic').maybeSingle()
      .then(({ data }) => setTopic(data?.value ?? ''))
  }, [])

  async function createTopic() {
    const random = Array.from(crypto.getRandomValues(new Uint8Array(10)), (b) => 'abcdefghjkmnpqrstuvwxyz23456789'[b % 31]).join('')
    const value = `dnd-${random}`
    const { error } = await supabase.from('app_settings').upsert({ key: 'ntfy_topic', value })
    if (error) return setStatus(translateError(error.message))
    setTopic(value)
  }

  async function test() {
    setStatus('Sende …')
    const { error } = await supabase.rpc('send_test_push')
    setStatus(error ? translateError(error.message) : '✅ Test gesendet – dein Handy sollte gleich klingeln.')
  }

  if (topic === null) return null

  return (
    <section className="card space-y-3">
      <h2 className="title text-xl">📲 Push aufs Handy</h2>
      {!topic ? (
        <>
          <p className="text-sm text-stone-400">Bei jedem neuen Feedback eine Nachricht aufs Handy – über die kostenlose App <b>ntfy</b>.</p>
          <button type="button" className="btn-primary" onClick={createTopic}>Geheimen Kanal erzeugen</button>
        </>
      ) : (
        <>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-stone-300">
            <li>Installiere die App <b>ntfy</b> (Play Store bzw. App Store).</li>
            <li>Tippe dort auf <b>＋</b> („Thema abonnieren“) und gib genau diesen Namen ein:</li>
          </ol>
          <p className="select-all rounded-lg bg-stone-950/70 px-3 py-2 text-center font-mono text-lg tracking-wide text-amber-300">{topic}</p>
          <ol start={3} className="list-decimal space-y-1.5 pl-5 text-sm text-stone-300">
            <li>Server bleibt <b>ntfy.sh</b> (Standard). Fertig – dann hier testen:</li>
          </ol>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn-secondary" onClick={test}>🔔 Test-Push senden</button>
            <button type="button" className="text-xs text-stone-500 hover:text-amber-300" onClick={createTopic}>Neuen Kanal erzeugen</button>
          </div>
          <p className="text-xs text-stone-500">Den Kanalnamen nicht weitergeben – wer ihn kennt, kann die Nachrichten mitlesen.</p>
        </>
      )}
      {status && <p className="text-sm text-stone-300">{status}</p>}
    </section>
  )
}
