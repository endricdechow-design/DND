import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { translateError } from '../../lib/errors'

/** Spielleiter: Link + Code für den Tisch-Bildschirm */
export default function DisplayDialog({ gameId }) {
  const [code, setCode] = useState(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.rpc('get_display_code', { p_game_id: gameId }).then(({ data, error }) => {
      if (error) setError(translateError(error.message))
      else setCode(data)
    })
  }, [gameId])

  const link = code ? `${window.location.origin}/tisch/${code}` : ''

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Zwischenablage nicht verfügbar
    }
  }

  async function renew() {
    if (!confirm('Neuen Code erzeugen? Bildschirme mit dem alten Link zeigen danach nichts mehr an.')) return
    const { data, error } = await supabase.rpc('renew_display_code', { p_game_id: gameId })
    if (error) setError(translateError(error.message))
    else setCode(data)
  }

  return (
    <div className="space-y-4">
      <div className="pr-8">
        <h2 className="title text-2xl">📺 Tisch-Bildschirm</h2>
        <p className="text-sm text-stone-400">
          Ein Fernseher, Laptop oder Tablet am Tisch zeigt dauerhaft die Karte – so, wie die Spieler sie sehen (mit Nebel).
          Dort ist <b>keine Anmeldung</b> nötig.
        </p>
      </div>
      {error && <p className="alert-error">{error}</p>}
      {code && (
        <>
          <div className="rounded-xl border border-amber-700/50 bg-stone-950/60 p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-stone-500">Code</p>
            <p className="font-mono text-4xl font-bold tracking-[0.3em] text-amber-300">{code}</p>
          </div>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-stone-300">
            <li>Am großen Gerät den Browser öffnen.</li>
            <li>
              Diese Adresse eingeben: <span className="break-all font-mono text-amber-200">{link}</span>
            </li>
            <li>Dort auf <b>„⛶ Vollbild“</b> tippen – fertig.</li>
          </ol>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={copy}>{copied ? '✓ Kopiert' : '🔗 Link kopieren'}</button>
            <a href={link} target="_blank" rel="noreferrer" className="btn-secondary">Hier öffnen ↗</a>
            <button type="button" className="btn-ghost" onClick={renew}>Neuer Code</button>
          </div>
          <p className="text-xs text-stone-500">
            Wer den Code kennt, kann die Karte ansehen (nur zusehen, nichts ändern). Mit „Neuer Code“ sperrst du alte Links.
          </p>
        </>
      )}
    </div>
  )
}
