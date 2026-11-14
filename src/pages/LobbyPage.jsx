import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { translateError } from '../lib/errors'
import Avatar from '../components/Avatar'
import { CLASSES, RACES, byKey } from '../data/srd'

// "key" sorgt dafür, dass beim Wechsel in eine andere Runde alles frisch geladen wird
export default function LobbyPage() {
  const { gameId } = useParams()
  return <Lobby key={gameId} gameId={gameId} />
}

function Lobby({ gameId }) {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [game, setGame] = useState(null)
  const [members, setMembers] = useState(null) // null = lädt noch
  const [characters, setCharacters] = useState([])
  const [error, setError] = useState('')
  const [live, setLive] = useState(false)
  const [copied, setCopied] = useState(false)

  const backToDashboard = useCallback(
    (notice) => navigate('/', { replace: true, state: notice ? { notice } : undefined }),
    [navigate]
  )

  // Runde laden (nur sichtbar, wenn ich Mitglied bin)
  useEffect(() => {
    let cancelled = false
    supabase
      .from('games')
      .select('id, name, invite_code, owner_id, created_at')
      .eq('id', gameId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        if (!data) backToDashboard('Diese Runde gibt es nicht oder du bist kein Mitglied.')
        else setGame(data)
      })
    return () => {
      cancelled = true
    }
  }, [gameId, backToDashboard])

  // Teilnehmerliste + Charaktere laden
  const loadMembers = useCallback(async () => {
    const [{ data, error }, { data: chars }] = await Promise.all([
      supabase
        .from('game_members')
        .select('user_id, role, joined_at, profiles(username)')
        .eq('game_id', gameId)
        .order('joined_at', { ascending: true }),
      supabase.from('characters').select('id, user_id, name, race, class, level, avatar_url').eq('game_id', gameId),
    ])

    if (error) {
      setError(translateError(error.message))
      return
    }
    // Wurde ich entfernt oder die Runde gelöscht? Dann zurück zur Übersicht.
    if (!data.some((m) => m.user_id === profile.id)) {
      backToDashboard('Du bist nicht mehr Teil dieser Runde.')
      return
    }
    setMembers(data)
    setCharacters(chars ?? [])
  }, [gameId, profile.id, backToDashboard])

  // Realtime: bei jeder Änderung an den Teilnehmern neu laden
  useEffect(() => {
    loadMembers()

    const channel = supabase
      .channel(`lobby-${gameId}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'game_members', filter: `game_id=eq.${gameId}` },
        () => loadMembers()
      )
      .on(
        // DELETE-Events lassen sich nicht filtern – wir laden einfach neu
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'game_members' },
        () => loadMembers()
      )
      .on(
        // Neue oder geänderte Charaktere (Name, Bild, Stufe …)
        'postgres_changes',
        { event: '*', schema: 'public', table: 'characters', filter: `game_id=eq.${gameId}` },
        () => loadMembers()
      )
      .subscribe((status) => setLive(status === 'SUBSCRIBED'))

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId, loadMembers])

  if (!game || !members) {
    return <p className="title animate-pulse text-center text-xl">Betrete die Lobby …</p>
  }

  const me = members.find((m) => m.user_id === profile.id)
  const isGM = me?.role === 'gm'
  const gm = members.find((m) => m.role === 'gm')
  const players = members.filter((m) => m.role !== 'gm')
  const characterOf = (userId) => characters.find((c) => c.user_id === userId)
  const myCharacter = characterOf(profile.id)

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(game.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Zwischenablage nicht verfügbar – der Code steht ja groß da
    }
  }

  async function removeMember(userId, name) {
    if (!confirm(`${name} wirklich aus der Runde entfernen?`)) return
    const { error } = await supabase.from('game_members').delete().eq('game_id', gameId).eq('user_id', userId)
    if (error) setError(translateError(error.message))
  }

  async function leaveGame() {
    if (!confirm('Willst du diese Runde wirklich verlassen?')) return
    const { error } = await supabase.from('game_members').delete().eq('game_id', gameId).eq('user_id', profile.id)
    if (error) setError(translateError(error.message))
    else backToDashboard('Du hast die Runde verlassen.')
  }

  async function deleteGame() {
    if (!confirm(`Runde „${game.name}“ endgültig löschen? Alle Spieler verlieren den Zugang.`)) return
    const { error } = await supabase.from('games').delete().eq('id', gameId)
    if (error) setError(translateError(error.message))
    else backToDashboard('Die Runde wurde gelöscht.')
  }

  return (
    <div className="space-y-6">
      <Link to="/" className="btn-ghost">← Zurück zur Übersicht</Link>

      {/* Kopfbereich */}
      <section className="card flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm uppercase tracking-widest text-stone-500">
            Lobby
            <span className={isGM ? 'badge-gm normal-case tracking-normal' : 'badge-player normal-case tracking-normal'}>
              {isGM ? 'Du bist Spielleiter' : 'Du bist Spieler'}
            </span>
          </p>
          <h1 className="title mt-1 break-words text-3xl sm:text-4xl">{game.name}</h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-stone-400">
            <span className={`h-2.5 w-2.5 rounded-full ${live ? 'animate-pulse bg-emerald-400' : 'bg-stone-600'}`} />
            {live ? 'Live verbunden' : 'Verbinde …'}
          </p>
        </div>

        <div className="shrink-0 rounded-xl border border-amber-800/50 bg-stone-950/60 p-4 text-center">
          <p className="mb-1 text-xs uppercase tracking-widest text-stone-500">Einladungscode</p>
          <p className="font-display text-4xl font-bold tracking-[0.3em] text-amber-300">{game.invite_code}</p>
          <button onClick={copyCode} className="mt-2 text-sm text-amber-500 hover:text-amber-300">
            {copied ? '✓ Kopiert!' : 'Code kopieren'}
          </button>
        </div>
      </section>

      {error && <p className="alert-error">{error}</p>}

      {/* Mein Charakter (nur für Spieler) */}
      {!isGM && !myCharacter && (
        <section className="card flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="text-5xl" aria-hidden>🧝</div>
          <div className="flex-1">
            <h2 className="title text-2xl">Erschaffe deinen Helden</h2>
            <p className="text-stone-400">Wähle Volk, Klasse und Werte – die App rechnet alles für dich aus.</p>
          </div>
          <Link to={`/runde/${gameId}/charakter/neu`} className="btn-primary">✨ Charakter erstellen</Link>
        </section>
      )}
      {!isGM && myCharacter && (
        <Link
          to={`/runde/${gameId}/charakter/${myCharacter.id}`}
          className="card flex items-center gap-4 transition hover:border-amber-600"
        >
          <Avatar name={myCharacter.name} src={myCharacter.avatar_url} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-widest text-stone-500">Dein Charakter</p>
            <p className="title truncate text-2xl">{myCharacter.name}</p>
          </div>
          <span className="btn-ghost shrink-0">Bogen öffnen →</span>
        </Link>
      )}

      {/* Teilnehmer */}
      <section className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="title text-2xl">Die Gefährten</h2>
          <span className="rounded-full bg-stone-800 px-3 py-1 text-sm text-stone-300">{players.length} Spieler</span>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2">
          {[gm, ...players].filter(Boolean).map((m) => {
            const name = m.profiles?.username ?? 'Unbekannt'
            const memberIsGM = m.role === 'gm'
            const char = characterOf(m.user_id)
            const cardClass = `flex items-center gap-3 rounded-xl border p-3 ${
              memberIsGM ? 'border-amber-700/60 bg-amber-950/20' : 'border-stone-800 bg-stone-950/40'
            }`
            const content = (
              <>
                <Avatar name={char?.name ?? name} src={char?.avatar_url} variant={memberIsGM ? 'gm' : 'player'} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-stone-100">
                    {char ? char.name : name} {m.user_id === profile.id && <span className="text-xs text-stone-500">(du)</span>}
                  </p>
                  <p className={`truncate text-xs ${memberIsGM ? 'text-amber-400' : 'text-violet-300'}`}>
                    {memberIsGM
                      ? '📜 Spielleiter'
                      : char
                        ? `${byKey(RACES, char.race)?.name.replace(/ \(.*\)/, '') ?? ''} · ${byKey(CLASSES, char.class)?.name ?? ''} · Stufe ${char.level}`
                        : '🗡️ Spieler · noch kein Charakter'}
                  </p>
                  {char && <p className="truncate text-xs text-stone-500">gespielt von {name}</p>}
                </div>
              </>
            )
            return (
              <li key={m.user_id} className={char ? '' : cardClass}>
                {char ? (
                  <Link
                    to={`/runde/${gameId}/charakter/${char.id}`}
                    className={`${cardClass} transition hover:border-amber-600`}
                  >
                    {content}
                  </Link>
                ) : (
                  content
                )}
                {isGM && !memberIsGM && (
                  <button
                    onClick={() => removeMember(m.user_id, name)}
                    className="mt-1 w-full rounded-md px-2 py-1 text-right text-xs text-stone-500 hover:bg-red-950/60 hover:text-red-300"
                  >
                    {name} entfernen
                  </button>
                )}
              </li>
            )
          })}
        </ul>

        {players.length === 0 && (
          <p className="mt-4 text-center text-sm text-stone-500">
            Noch keine Spieler da. Teile den Einladungscode mit deiner Gruppe!
          </p>
        )}
      </section>

      {/* Vorschau auf kommende Bereiche */}
      <section className="card">
        <h2 className="title mb-4 text-2xl">Bald verfügbar</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['👥', 'Gruppenansicht', 'Sichtbarkeit & Avatar-Leiste'],
            ['🎲', 'Würfel', 'Gemeinsames Wurf-Protokoll'],
            ['📚', 'Bibliothek', 'Karten, Gegenstände & Effekte'],
            ['⚔️', 'Kampffeld', 'Raster, Figuren & Initiative'],
          ].map(([icon, title, text]) => (
            <div key={title} className="rounded-xl border border-dashed border-stone-700 p-4 opacity-70">
              <div className="text-2xl" aria-hidden>{icon}</div>
              <p className="mt-1 font-display font-bold text-stone-200">{title}</p>
              <p className="text-xs text-stone-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        {isGM ? (
          <button onClick={deleteGame} className="btn-danger">Runde löschen</button>
        ) : (
          <button onClick={leaveGame} className="btn-danger">Runde verlassen</button>
        )}
      </div>
    </div>
  )
}
