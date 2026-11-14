import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { translateError } from '../lib/errors'
import { shortRaceName } from '../lib/party'
import { CLASSES, RACES, byKey } from '../data/srd'
import Avatar from '../components/Avatar'
import Modal from '../components/Modal'
import GameMasterBanner from '../components/GameMasterBanner'
import PartyBar from '../components/party/PartyBar'
import PartyCardDetails from '../components/party/PartyCardDetails'
import { ConditionIcons } from '../components/party/Conditions'

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
  const [cards, setCards] = useState([]) // Gruppenkarten aller Charaktere
  const [selectedId, setSelectedId] = useState(null) // geöffnete Charakterkarte
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

  // Teilnehmer + Gruppenkarten laden
  const loadMembers = useCallback(async () => {
    const [{ data, error }, { data: partyCards }] = await Promise.all([
      supabase
        .from('game_members')
        .select('user_id, role, joined_at, profiles(username)')
        .eq('game_id', gameId)
        .order('joined_at', { ascending: true }),
      supabase.from('party_cards').select('*').eq('game_id', gameId).order('name'),
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
    setCards(partyCards ?? [])
  }, [gameId, profile.id, backToDashboard])

  // Realtime: bei Änderungen an Teilnehmern oder Charakteren neu laden
  useEffect(() => {
    loadMembers()

    const channel = supabase
      .channel(`lobby-${gameId}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_members', filter: `game_id=eq.${gameId}` }, () => loadMembers())
      // DELETE-Events lassen sich nicht filtern – wir laden einfach neu
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'game_members' }, () => loadMembers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'party_cards', filter: `game_id=eq.${gameId}` }, () => loadMembers())
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'party_cards' }, () => loadMembers())
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
  const cardOf = (userId) => cards.find((c) => c.user_id === userId)
  const myCard = cardOf(profile.id)
  const selectedCard = cards.find((c) => c.character_id === selectedId)
  const playerNameOf = (userId) => members.find((m) => m.user_id === userId)?.profiles?.username

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(game.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Zwischenablage nicht verfügbar – der Code steht ja groß da
    }
  }

  async function updateConditions(card, conditions) {
    setCards((prev) => prev.map((c) => (c.character_id === card.character_id ? { ...c, conditions } : c)))
    const { error } = await supabase.from('characters').update({ conditions }).eq('id', card.character_id)
    if (error) {
      setError(translateError(error.message))
      loadMembers()
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

      {isGM && (
        <GameMasterBanner>
          Du leitest diese Runde. Du siehst die vollen Charakterbögen aller Spieler, kannst sie bearbeiten,
          Zustände vergeben und Spieler entfernen. Tippe auf einen Charakter, um loszulegen.
        </GameMasterBanner>
      )}

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

      {/* Avatar-Leiste der Gruppe */}
      <PartyBar cards={cards} myUserId={profile.id} onSelect={(card) => setSelectedId(card.character_id)} />

      {/* Mein Charakter (nur für Spieler) */}
      {!isGM && !myCard && (
        <section className="card flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="text-5xl" aria-hidden>🧝</div>
          <div className="flex-1">
            <h2 className="title text-2xl">Erschaffe deinen Helden</h2>
            <p className="text-stone-400">Wähle Volk, Klasse und Werte – die App rechnet alles für dich aus.</p>
          </div>
          <Link to={`/runde/${gameId}/charakter/neu`} className="btn-primary">✨ Charakter erstellen</Link>
        </section>
      )}
      {!isGM && myCard && (
        <Link
          to={`/runde/${gameId}/charakter/${myCard.character_id}`}
          className="card flex items-center gap-4 transition hover:border-amber-600"
        >
          <Avatar name={myCard.name} src={myCard.avatar_url} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-widest text-stone-500">Dein Charakter</p>
            <p className="title truncate text-2xl">{myCard.name}</p>
          </div>
          <span className="btn-ghost shrink-0">
            <span className="hidden sm:inline">Bogen öffnen</span> →
          </span>
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
            const card = cardOf(m.user_id)
            const content = (
              <>
                <Avatar name={card?.name ?? name} src={card?.avatar_url} variant={memberIsGM ? 'gm' : 'player'} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-medium text-stone-100">
                    <span className="truncate">{card ? card.name : name}</span>
                    {m.user_id === profile.id && <span className="text-xs text-stone-500">(du)</span>}
                    {card && <ConditionIcons conditions={card.conditions} />}
                  </p>
                  <p className={`truncate text-xs ${memberIsGM ? 'text-amber-400' : 'text-violet-300'}`}>
                    {memberIsGM
                      ? '📜 Spielleiter'
                      : card
                        ? `${shortRaceName(byKey(RACES, card.race)?.name)} · ${byKey(CLASSES, card.class)?.name ?? ''} · Stufe ${card.level}`
                        : '🗡️ Spieler · noch kein Charakter'}
                  </p>
                  {card && <p className="truncate text-xs text-stone-500">gespielt von {name}</p>}
                </div>
              </>
            )
            const cardClass = `flex w-full items-center gap-3 rounded-xl border p-3 text-left ${
              memberIsGM ? 'border-amber-700/60 bg-amber-950/20' : 'border-stone-800 bg-stone-950/40'
            }`
            return (
              <li key={m.user_id}>
                {card ? (
                  <button type="button" onClick={() => setSelectedId(card.character_id)} className={`${cardClass} transition hover:border-amber-600`}>
                    {content}
                  </button>
                ) : (
                  <div className={cardClass}>{content}</div>
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

      {/* Bereiche der Runde */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Link to={`/runde/${gameId}/bibliothek`} className="card flex items-center gap-4 transition hover:border-amber-600">
          <span className="text-4xl" aria-hidden>📚</span>
          <div className="min-w-0">
            <p className="title text-xl">Bibliothek</p>
            <p className="text-sm text-stone-400">
              {isGM ? 'Gegenstände, Karten, Handouts & Effekte verwalten' : 'Inventar, Karten, Handouts & Effekte'}
            </p>
          </div>
        </Link>
        <div className="rounded-2xl border border-dashed border-stone-700 p-6 opacity-70">
          <div className="flex items-center gap-4">
            <span className="text-4xl" aria-hidden>⚔️</span>
            <div>
              <p className="font-display text-xl font-bold text-stone-300">Kampffeld</p>
              <p className="text-sm text-stone-500">Bald verfügbar: Raster, Figuren & Initiative</p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        {isGM ? (
          <button onClick={deleteGame} className="btn-danger">Runde löschen</button>
        ) : (
          <button onClick={leaveGame} className="btn-danger">Runde verlassen</button>
        )}
      </div>

      {/* Charakterkarte als Pop-up */}
      {selectedCard && (
        <Modal onClose={() => setSelectedId(null)}>
          <PartyCardDetails
            card={selectedCard}
            playerName={playerNameOf(selectedCard.user_id)}
            canEditConditions={isGM || selectedCard.user_id === profile.id}
            onConditionsChange={(conditions) => updateConditions(selectedCard, conditions)}
            sheetLink={
              isGM || selectedCard.user_id === profile.id
                ? `/runde/${gameId}/charakter/${selectedCard.character_id}`
                : null
            }
          />
        </Modal>
      )}
    </div>
  )
}
