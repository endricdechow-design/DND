import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { translateError } from '../lib/errors'

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
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-3 text-5xl" aria-hidden>🐉</div>
          <h1 className="title text-4xl">Dungeon Lobby</h1>
          <p className="mt-2 text-stone-400">Versammelt eure Gruppe – das Abenteuer wartet.</p>
        </div>

        <div className="card">
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
        </div>
      </div>
    </div>
  )
}
