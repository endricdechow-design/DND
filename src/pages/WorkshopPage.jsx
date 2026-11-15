import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { translateError } from '../lib/errors'
import { WORKSHOP_TYPES } from '../data/library'
import PageHeader from '../components/PageHeader'

/**
 * Spielleiter-Werkstatt: Übersicht der eigenen Abenteuer.
 */
export default function WorkshopPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [adventures, setAdventures] = useState(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('adventures')
      .select('id, name, description, updated_at, adventure_items(type)')
      .order('updated_at', { ascending: false })
    if (error) setError(translateError(error.message))
    setAdventures(data ?? [])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function create(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { data, error } = await supabase.from('adventures').insert({ owner_id: profile.id, name: name.trim() }).select('id').single()
    setBusy(false)
    if (error) return setError(translateError(error.message))
    navigate(`/werkstatt/${data.id}`)
  }

  async function importByCode(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { data, error } = await supabase.rpc('import_shared_adventure', { p_code: code })
    setBusy(false)
    if (error) return setError(translateError(error.message))
    navigate(`/werkstatt/${data}`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon="🛠️"
        eyebrow="Nur für dich"
        title="Spielleiter-Werkstatt"
        subtitle="Bereite Abenteuer in Ruhe vor – Gegenstände, Karten, Handouts, Effekte und NSCs. Später lädst du sie mit einem Klick in deine Runde."
      />

      {error && <p className="alert-error">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <form onSubmit={create} className="card space-y-3">
          <h2 className="title text-xl">✨ Neues Abenteuer</h2>
          <input className="input" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="z. B. Die verlassene Mine" required />
          <button type="submit" className="btn-primary w-full" disabled={busy || !name.trim()}>Anlegen</button>
        </form>
        <form onSubmit={importByCode} className="card space-y-3">
          <h2 className="title text-xl">📥 Abenteuer übernehmen</h2>
          <input className="input text-center font-mono uppercase tracking-widest" value={code} maxLength={8}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="Teilen-Code" />
          <button type="submit" className="btn-secondary w-full" disabled={busy || code.length !== 8}>Kopie übernehmen</button>
        </form>
      </div>

      <section className="card">
        <h2 className="title mb-3 text-2xl">Meine Abenteuer</h2>
        {adventures === null ? (
          <p className="text-stone-400">Lade …</p>
        ) : adventures.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-700 p-6 text-center text-stone-400">Noch keine Abenteuer. Leg oben dein erstes an!</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {adventures.map((a) => (
              <li key={a.id}>
                <Link to={`/werkstatt/${a.id}`} className="block h-full rounded-xl border border-stone-800 bg-stone-950/40 p-4 transition hover:border-amber-600">
                  <p className="font-display text-lg font-bold text-stone-100">{a.name}</p>
                  {a.description && <p className="line-clamp-2 text-sm text-stone-400">{a.description}</p>}
                  <p className="mt-2 flex flex-wrap gap-2 text-xs text-stone-500">
                    {WORKSHOP_TYPES.map((t) => {
                      const n = a.adventure_items.filter((i) => i.type === t.key).length
                      return n ? <span key={t.key}>{t.icon} {n}</span> : null
                    })}
                    {!a.adventure_items.length && <span>noch leer</span>}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
