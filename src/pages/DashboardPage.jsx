import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { translateError } from '../lib/errors'

export default function DashboardPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const notice = location.state?.notice

  const [games, setGames] = useState(null) // null = lädt noch
  const [listError, setListError] = useState('')

  // Alle Runden, in denen ich Mitglied bin – inkl. meiner Rolle dort
  const loadGames = useCallback(async () => {
    const { data, error } = await supabase
      .from('game_members')
      .select('role, games(id, name, invite_code, created_at)')
      .eq('user_id', profile.id)

    if (error) {
      setListError(translateError(error.message))
      return
    }
    const list = data
      .filter((row) => row.games)
      .map((row) => ({ ...row.games, role: row.role }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
    setGames(list)
  }, [profile.id])

  useEffect(() => {
    loadGames()
  }, [loadGames])

  return (
    <div className="space-y-6">
      {notice && <p className="alert-info">{notice}</p>}

      <div>
        <h1 className="title text-3xl">Willkommen, {profile.username}!</h1>
        <p className="mt-1 text-stone-400">Leite eine eigene Runde oder tritt der Runde deiner Freunde bei.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <CreateGameCard onCreated={(game) => navigate(`/runde/${game.id}`)} />
        <JoinGameCard onJoined={(game) => navigate(`/runde/${game.id}`)} />
      </div>

      <section className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="title text-2xl">Meine Runden</h2>
          <button onClick={loadGames} className="btn-ghost" title="Neu laden">↻</button>
        </div>

        {listError && <p className="alert-error">{listError}</p>}

        {games === null && !listError ? (
          <p className="text-stone-400">Lade Runden …</p>
        ) : games?.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-700 p-6 text-center text-stone-400">
            Du bist noch in keiner Runde. Erstelle eine oder tritt mit einem Code bei!
          </p>
        ) : (
          <ul className="space-y-3">
            {games?.map((game) => (
              <li key={game.id}>
                <button
                  onClick={() => navigate(`/runde/${game.id}`)}
                  className={`flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition hover:border-amber-600 hover:bg-stone-900 ${
                    game.role === 'gm' ? 'border-amber-700/60 bg-amber-950/20' : 'border-stone-800 bg-stone-950/40'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-bold text-stone-100">
                      {game.role === 'gm' && <span aria-hidden>📜 </span>}
                      {game.name}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-stone-500">
                      <span className={game.role === 'gm' ? 'badge-gm' : 'badge-player'}>
                        {game.role === 'gm' ? '📜 Spielleiter' : '🗡️ Spieler'}
                      </span>
                      seit {new Date(game.created_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md bg-stone-800 px-3 py-1 font-mono text-sm tracking-widest text-amber-300">
                    {game.invite_code}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function CreateGameCard({ onCreated }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { data, error } = await supabase.rpc('create_game', { p_name: name })
    setBusy(false)
    if (error) return setError(translateError(error.message))
    onCreated(data)
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-4">
      <div>
        <h2 className="title text-2xl">📜 Runde leiten</h2>
        <p className="mt-1 text-sm text-stone-400">
          Du wirst Spielleiter und bekommst einen 6-stelligen Einladungscode für deine Gruppe.
        </p>
      </div>
      <div>
        <label className="label" htmlFor="gameName">Name der Kampagne</label>
        <input
          id="gameName"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z. B. Der Fluch von Strahd"
          maxLength={80}
          required
        />
      </div>
      {error && <p className="alert-error">{error}</p>}
      <button type="submit" disabled={busy} className="btn-primary mt-auto">
        {busy ? 'Wird erschaffen …' : '✨ Runde erstellen'}
      </button>
    </form>
  )
}

function JoinGameCard({ onJoined }) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { data, error } = await supabase.rpc('join_game', { p_code: code })
    setBusy(false)
    if (error) return setError(translateError(error.message))
    onJoined(data)
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-4">
      <div>
        <h2 className="title text-2xl">🗡️ Runde beitreten</h2>
        <p className="mt-1 text-sm text-stone-400">Gib den Code ein, den dir dein Spielleiter gegeben hat.</p>
      </div>
      <div>
        <label className="label" htmlFor="code">Einladungscode</label>
        <input
          id="code"
          className="input text-center font-display text-2xl uppercase tracking-[0.5em]"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          placeholder="ABC123"
          maxLength={6}
          autoComplete="off"
          required
        />
      </div>
      {error && <p className="alert-error">{error}</p>}
      <button type="submit" disabled={busy || code.length !== 6} className="btn-secondary mt-auto">
        {busy ? 'Reise beginnt …' : 'Beitreten'}
      </button>
    </form>
  )
}
