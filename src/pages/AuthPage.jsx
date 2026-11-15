import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { translateError } from '../lib/errors'
import { cloudTexture } from '../lib/fog'

export default function AuthPage() {
  const [mode, setMode] = useState('login') // 'login' oder 'register'
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const isRegister = mode === 'register'

  function switchMode(newMode) {
    setMode(newMode)
    setError('')
    setInfo('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)

    try {
      if (isRegister) {
        if (username.trim().length < 2) throw new Error('Dein Name muss mindestens 2 Zeichen lang sein.')
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          // Der Name wird von der Datenbank automatisch ins Profil übernommen
          options: { data: { username: username.trim() } },
        })
        if (error) throw error
        if (!data.session) {
          setInfo('Fast geschafft! Bitte bestätige deine E-Mail-Adresse über den Link in deinem Postfach und melde dich dann an.')
          setMode('login')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      setError(translateError(err.message))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* Nebel im Hintergrund */}
      <div className="fog-drift pointer-events-none absolute inset-0 !opacity-25" style={{ backgroundImage: `url(${cloudTexture().url})` }} aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgb(12_10_9/0.85)_80%)]" aria-hidden />

      <div className="relative grid w-full max-w-5xl items-center gap-10 lg:grid-cols-2">
        {/* Begrüßung */}
        <div className="text-center lg:text-left">
          <div className="relative mx-auto mb-4 w-fit lg:mx-0">
            <span className="absolute inset-0 rounded-full bg-amber-500/30 blur-2xl" aria-hidden />
            <span className="relative block text-7xl sm:text-8xl" aria-hidden>🐉</span>
          </div>
          <h1 className="title text-4xl sm:text-6xl">Dungeon Lobby</h1>
          <div className="mx-auto mt-3 flex max-w-xs items-center gap-3 lg:mx-0" aria-hidden>
            <span className="h-px flex-1 bg-gradient-to-r from-amber-600/70 to-transparent" />
            <span className="text-amber-600/80">✦</span>
            <span className="h-px flex-1 bg-gradient-to-l from-amber-600/70 to-transparent" />
          </div>
          <p className="mt-3 text-lg text-stone-300">Versammelt eure Gruppe – das Abenteuer wartet.</p>
          <ul className="mx-auto mt-6 hidden max-w-sm space-y-3 text-left text-stone-300 sm:block lg:mx-0">
            {[
              ['🧝', 'Helden erschaffen', 'Die App rechnet alle Werte für euch aus.'],
              ['🗺️', 'Karten mit Nebel', 'Der Spielleiter deckt auf, was ihr seht.'],
              ['📚', 'Schätze & Handouts', 'Gegenstände, Briefe und Effekte – live für alle.'],
            ].map(([icon, title, text]) => (
              <li key={title} className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-900/50 bg-stone-900/70 text-xl" aria-hidden>{icon}</span>
                <span>
                  <span className="block font-display font-bold text-amber-100">{title}</span>
                  <span className="text-sm text-stone-400">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card mx-auto w-full max-w-md border-amber-800/50 shadow-amber-950/30">
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-stone-950/70 p-1">
            {[
              ['login', 'Anmelden'],
              ['register', 'Registrieren'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => switchMode(value)}
                className={`rounded-md py-2 text-sm font-semibold transition ${
                  mode === value ? 'bg-amber-600 text-stone-950' : 'text-stone-400 hover:text-amber-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="label" htmlFor="username">Dein Name</label>
                <input
                  id="username"
                  className="input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="z. B. Endri"
                  maxLength={40}
                  required
                />
                <p className="mt-1 text-xs text-stone-500">
                  Deinen Heldennamen wählst du später für jeden Charakter einzeln.
                </p>
              </div>
            )}

            <div>
              <label className="label" htmlFor="email">E-Mail</label>
              <input
                id="email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="du@beispiel.de"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="password">Passwort</label>
              <input
                id="password"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mindestens 6 Zeichen"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                minLength={6}
                required
              />
            </div>

            {error && <p className="alert-error">{error}</p>}
            {info && <p className="alert-info">{info}</p>}

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? 'Einen Moment …' : isRegister ? 'Konto erstellen' : 'Anmelden'}
            </button>
          </form>
          <p className="mt-5 text-center text-xs text-stone-500">🎲 Gewürfelt wird weiter am echten Tisch.</p>
        </div>
      </div>
    </div>
  )
}
