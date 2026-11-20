import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { translateError } from '../lib/errors'
import { shortRaceName } from '../lib/party'
import { CLASSES, RACES, byKey } from '../data/srd'
import Avatar from '../components/Avatar'
import AreaTile from '../components/AreaTile'

export default function DashboardPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const notice = location.state?.notice

  const [games, setGames] = useState(null) // null = lädt noch
  const [listError, setListError] = useState('')
  const [hour] = useState(() => new Date().getHours()) // für die Begrüßung
  const [heroes, setHeroes] = useState(null) // alle meine Charaktere (mit und ohne Runde)

  // Alle Runden, in denen ich Mitglied bin – inkl. meiner Rolle, meinem Helden und der Spielerzahl
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
    const ids = list.map((g) => g.id)
    const [{ data: heroes }, { data: members }] = ids.length
      ? await Promise.all([
          supabase.from('party_cards').select('game_id, name, avatar_url, level, race, class').eq('user_id', profile.id).in('game_id', ids),
          supabase.from('game_members').select('game_id, role').in('game_id', ids),
        ])
      : [{ data: [] }, { data: [] }]
    setGames(
      list.map((g) => ({
        ...g,
        hero: heroes?.find((h) => h.game_id === g.id) ?? null,
        playerCount: members?.filter((m) => m.game_id === g.id && m.role !== 'gm').length ?? 0,
      }))
    )
  }, [profile.id])

  useEffect(() => {
    loadGames()
    supabase
      .from('characters')
      .select('id, name, level, race, class, avatar_url, game_id, games(name)')
      .eq('user_id', profile.id)
      .order('name')
      .then(({ data }) => setHeroes(data ?? []))
  }, [loadGames, profile.id])

  const greeting = hour < 5 ? 'Gute Nacht' : hour < 11 ? 'Guten Morgen' : hour < 18 ? 'Willkommen zurück' : 'Guten Abend'
  const hasGames = games?.length > 0

  const newAdventure = (
    <section className="space-y-3">
      <h2 className="title px-1 text-2xl">✨ Neues Abenteuer</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <CreateGameCard onCreated={(game) => navigate(`/runde/${game.id}/hausregeln?start=1`)} />
        <JoinGameCard onJoined={(game) => navigate(`/runde/${game.id}`)} />
      </div>
    </section>
  )

  return (
    <div className="space-y-8">
      {notice && <p className="alert-info">{notice}</p>}

      {/* ---------- Begrüßung ---------- */}
      <header className="relative overflow-hidden rounded-2xl border border-amber-900/40 bg-gradient-to-br from-amber-950/50 via-stone-900/80 to-violet-950/40 px-5 py-7 shadow-2xl shadow-black/50 sm:px-8 sm:py-9">
        <span className="pointer-events-none absolute -bottom-8 -right-4 select-none text-[10rem] leading-none opacity-[0.07]" aria-hidden>🐉</span>
        <p className="relative text-xs uppercase tracking-[0.3em] text-amber-500/80">{greeting}</p>
        <h1 className="title relative mt-1 break-words text-3xl sm:text-5xl">{profile.username}</h1>
        <div className="relative mt-3 flex items-center gap-3" aria-hidden>
          <span className="h-px flex-1 bg-gradient-to-r from-amber-600/60 to-transparent" />
          <span className="text-amber-600/70">✦</span>
          <span className="h-px flex-1 bg-gradient-to-l from-amber-600/60 to-transparent" />
        </div>
        <p className="relative mt-3 max-w-xl text-stone-300">
          {hasGames ? 'Deine Gefährten warten schon. Wohin führt euch die Reise heute?' : 'Dein Abenteuer beginnt hier: Leite eine eigene Runde oder tritt der Runde deiner Freunde bei.'}
        </p>
      </header>

      {/* Ohne Runden: zuerst erstellen/beitreten */}
      {games?.length === 0 && newAdventure}

      {/* ---------- Meine Runden ---------- */}
      {(hasGames || games === null || listError) && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="title text-2xl">🏰 Meine Runden</h2>
            <button onClick={loadGames} className="btn-ghost px-3 py-1.5" title="Neu laden" aria-label="Neu laden">↻</button>
          </div>
          {listError && <p className="alert-error">{listError}</p>}
          {games === null && !listError ? (
            <p className="text-stone-400">Lade Runden …</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {games?.map((game) => (
                <li key={game.id}>
                  <GameTile game={game} onOpen={() => navigate(`/runde/${game.id}`)} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ---------- Meine Helden ---------- */}
      {heroes !== null && (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3 px-1">
            <h2 className="title text-2xl">🧝 Meine Helden</h2>
            <span className="text-xs text-stone-500">{heroes.length ? 'Ein Held ist immer in höchstens einer Runde' : ''}</span>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {heroes.map((h) => (
              <li key={h.id}>
                <HeroTile hero={h} onOpen={() => navigate(h.game_id ? `/runde/${h.game_id}/charakter/${h.id}` : `/helden/${h.id}`)} />
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => navigate('/helden/neu')}
                className="flex h-full min-h-40 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-violet-800/70 p-4 text-violet-200 transition hover:border-violet-500 hover:bg-violet-950/30"
              >
                <span className="text-4xl" aria-hidden>✨</span>
                <span className="font-display font-bold">Neuer Held</span>
                <span className="text-center text-xs text-stone-500">auch ohne Runde – mitbringen kannst du ihn später</span>
              </button>
            </li>
          </ul>
        </section>
      )}

      {hasGames && newAdventure}

      {/* ---------- Werkzeuge ---------- */}
      <section className="space-y-3">
        <h2 className="title px-1 text-2xl">🧭 Werkzeuge</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <AreaTile to="/kompendium" icon="📖" title="Kompendium" text="Regeln, Zauber, Monster & Hausregeln" />
          <AreaTile to="/werkstatt" icon="🛠️" title="Spielleiter-Werkstatt" text="Abenteuer in Ruhe vorbereiten" />
        </div>
      </section>
    </div>
  )
}

// Kachel eines Helden in „Meine Helden“
function HeroTile({ hero, onOpen }) {
  const line = [byKey(CLASSES, hero.class)?.name, `Stufe ${hero.level}`].filter(Boolean).join(' · ')
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-full w-full flex-col items-center gap-2 rounded-2xl border border-stone-800 bg-stone-900/70 p-4 text-center shadow-lg shadow-black/40 transition hover:-translate-y-0.5 hover:border-violet-500"
    >
      <Avatar name={hero.name} src={hero.avatar_url} cls={hero.class} size="lg" />
      <div className="w-full min-w-0">
        <p className="truncate font-display font-bold text-stone-100 group-hover:text-amber-200">{hero.name}</p>
        <p className="truncate text-xs text-violet-300">{line}</p>
      </div>
      <p className={`mt-auto w-full truncate rounded-full px-2 py-0.5 text-xs ${hero.game_id ? 'bg-emerald-950/50 text-emerald-300' : 'bg-stone-800 text-stone-400'}`}>
        {hero.game_id ? `📍 ${hero.games?.name ?? 'in einer Runde'}` : '📖 bereit für ein Abenteuer'}
      </p>
    </button>
  )
}

// Kachel einer Runde: Name, Rolle, mein Held (bzw. Spielerzahl beim Spielleiter)
function GameTile({ game, onOpen }) {
  const isGM = game.role === 'gm'
  const hero = game.hero
  const heroLine = hero
    ? [shortRaceName(byKey(RACES, hero.race)?.name), byKey(CLASSES, hero.class)?.name, `Stufe ${hero.level}`].filter(Boolean).join(' · ')
    : ''
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border text-left shadow-xl shadow-black/40 transition hover:-translate-y-0.5 ${
        isGM ? 'border-amber-800/60 bg-stone-900/80 hover:border-amber-500' : 'border-violet-900/60 bg-stone-900/80 hover:border-violet-500'
      }`}
    >
      {/* Farbiger Kopf */}
      <div className={`relative px-5 pb-4 pt-5 ${isGM ? 'bg-gradient-to-br from-amber-900/50 to-transparent' : 'bg-gradient-to-br from-violet-900/50 to-transparent'}`}>
        <span className="pointer-events-none absolute right-3 top-2 text-5xl opacity-15" aria-hidden>{isGM ? '📜' : '⚔️'}</span>
        <span className={isGM ? 'badge-gm' : 'badge-player'}>{isGM ? '📜 Spielleiter' : '🗡️ Spieler'}</span>
        <p className="title mt-2 break-words pr-10 text-2xl group-hover:text-amber-100">{game.name}</p>
      </div>
      {/* Inhalt */}
      <div className="flex flex-1 items-center gap-3 border-t border-stone-800/80 px-5 py-4">
        {isGM ? (
          <>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-950/60 text-xl" aria-hidden>👥</span>
            <p className="min-w-0 flex-1 text-sm text-stone-300">
              {game.playerCount === 0 ? 'Noch keine Spieler – teile den Code!' : `${game.playerCount} Spieler in deiner Gruppe`}
            </p>
          </>
        ) : hero ? (
          <>
            <Avatar name={hero.name} src={hero.avatar_url} cls={hero.class} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-stone-100">{hero.name}</p>
              <p className="truncate text-xs text-violet-300">{heroLine}</p>
            </div>
          </>
        ) : (
          <>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dashed border-violet-700 text-xl" aria-hidden>🧝</span>
            <p className="min-w-0 flex-1 text-sm text-violet-200">Noch kein Held – jetzt erschaffen!</p>
          </>
        )}
        <span className="text-xl text-stone-600 transition group-hover:translate-x-1 group-hover:text-amber-400" aria-hidden>→</span>
      </div>
      <div className="flex items-center justify-between border-t border-stone-800/80 px-5 py-2 text-xs text-stone-500">
        <span>seit {new Date(game.created_at).toLocaleDateString('de-DE')}</span>
        <span className="font-mono tracking-widest text-stone-400">🔑 {game.invite_code}</span>
      </div>
    </button>
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
    <form onSubmit={handleSubmit} className="card flex flex-col gap-4 border-amber-800/50">
      <div>
        <h3 className="title text-xl">📜 Runde leiten</h3>
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
          placeholder="z. B. Der Fluch von Schwarzstein"
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
    <form onSubmit={handleSubmit} className="card flex flex-col gap-4 border-violet-800/50">
      <div>
        <h3 className="title text-xl">🗡️ Runde beitreten</h3>
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
