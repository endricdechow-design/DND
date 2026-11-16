import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { translateError } from '../lib/errors'
import { hpStatus, shortRaceName } from '../lib/party'
import { CLASSES, RACES, byKey } from '../data/srd'
import Avatar from '../components/Avatar'
import AreaTile from '../components/AreaTile'
import XpDialog from '../components/party/XpDialog'
import { formatXp, xpProgress } from '../data/levels'
import Modal from '../components/Modal'
import GameNav from '../components/GameNav'
import PartyCardDetails from '../components/party/PartyCardDetails'
import { ConditionIcons } from '../components/party/Conditions'
import { ask } from '../lib/confirm'
import PageSkeleton from '../components/Skeleton'

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
  const [openFinds, setOpenFinds] = useState(0) // offene Fundstücke (nur Spielleiter)
  const [selectedId, setSelectedId] = useState(null) // geöffnete Charakterkarte
  const [error, setError] = useState('')
  const [live, setLive] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeMap, setActiveMap] = useState(null) // gerade gezeigte Karte
  const [myXp, setMyXp] = useState(null) // { xp, level } meines Charakters
  const [awarding, setAwarding] = useState(false)
  const [notice, setNotice] = useState('')
  const [freeHeroes, setFreeHeroes] = useState([]) // meine Helden ohne Runde

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
    // Offene Funde zählen (Spieler sehen nur ihre eigenen – angezeigt wird es nur dem Spielleiter)
    const { count } = await supabase
      .from('item_requests')
      .select('id', { count: 'exact', head: true })
      .eq('game_id', gameId)
      .eq('status', 'pending')
    setOpenFinds(count ?? 0)
    // Gerade gezeigte Karte (Fehler ignorieren, falls die Kartenfunktion noch nicht eingerichtet ist)
    const { data: map } = await supabase.from('battle_maps').select('id, name').eq('game_id', gameId).eq('active', true).maybeSingle()
    setActiveMap(map ?? null)
    // Meine EP (Fehler ignorieren, falls die EP-Funktion noch nicht eingerichtet ist)
    const { data: mine } = await supabase.from('characters').select('xp, level').eq('game_id', gameId).eq('user_id', profile.id).maybeSingle()
    setMyXp(mine?.xp != null ? mine : null)
    // Helden aus „Meine Helden“, die mitgebracht werden können
    const { data: free } = await supabase
      .from('characters')
      .select('id, name, level, class, avatar_url')
      .eq('user_id', profile.id)
      .is('game_id', null)
      .order('name')
    setFreeHeroes(free ?? [])
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'battle_maps', filter: `game_id=eq.${gameId}` }, () => loadMembers())
      .subscribe((status) => setLive(status === 'SUBSCRIBED'))

    // Neue Protokoll-Meldung (z. B. Fund gemeldet) → Zähler aktualisieren
    const onGameLog = (e) => e.detail?.game_id === gameId && loadMembers()
    window.addEventListener('dnd:game-log', onGameLog)

    return () => {
      window.removeEventListener('dnd:game-log', onGameLog)
      supabase.removeChannel(channel)
    }
  }, [gameId, loadMembers])

  if (!game || !members) {
    return <PageSkeleton text="Betrete die Lobby …" />
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

  async function bringHero(hero) {
    if (!(await ask(`${hero.name} in „${game.name}“ mitbringen? Solange der Held hier ist, kann er in keiner anderen Runde mitspielen.`, { confirmLabel: '🧝 Mitbringen' }))) return
    const { error } = await supabase.rpc('bring_character', { p_character_id: hero.id, p_game_id: gameId })
    if (error) return setError(translateError(error.message))
    setNotice(`🧝 ${hero.name} ist jetzt in dieser Runde dabei!`)
    loadMembers()
  }

  async function removeMember(userId, name) {
    if (!(await ask(`${name} wirklich aus der Runde entfernen? Der Held kehrt in die Heldenliste des Spielers zurück.`))) return
    const { error } = await supabase.from('game_members').delete().eq('game_id', gameId).eq('user_id', userId)
    if (error) setError(translateError(error.message))
  }

  async function leaveGame() {
    if (!(await ask('Willst du diese Runde wirklich verlassen? Dein Held kehrt in „Meine Helden“ zurück.'))) return
    const { error } = await supabase.from('game_members').delete().eq('game_id', gameId).eq('user_id', profile.id)
    if (error) setError(translateError(error.message))
    else backToDashboard('Du hast die Runde verlassen.')
  }

  async function deleteGame() {
    if (!(await ask(`Runde „${game.name}“ endgültig löschen? Alle Spieler verlieren den Zugang – ihre Helden bleiben in „Meine Helden“ erhalten.`))) return
    const { error } = await supabase.from('games').delete().eq('id', gameId)
    if (error) setError(translateError(error.message))
    else backToDashboard('Die Runde wurde gelöscht.')
  }

  const raceClass = (card) =>
    [shortRaceName(byKey(RACES, card.race)?.name), byKey(CLASSES, card.class)?.name].filter(Boolean).join(' · ')
  // Gruppe: alle anderen Spieler (mein eigener Held steht schon oben)
  const others = players.filter((m) => m.user_id !== profile.id)

  return (
    <div className="space-y-6">
      <GameNav gameId={gameId} />

      {/* ---------- Kopf: Name der Runde ---------- */}
      <header className="relative overflow-hidden rounded-2xl border border-amber-900/40 bg-gradient-to-br from-amber-950/50 via-stone-900/80 to-violet-950/40 px-5 py-6 shadow-2xl shadow-black/50 sm:px-8">
        <span className="pointer-events-none absolute -right-6 -top-10 select-none text-[9rem] leading-none opacity-[0.07]" aria-hidden>🐉</span>
        <div className="relative flex flex-wrap items-center gap-2 text-xs">
          <span className={isGM ? 'badge-gm' : 'badge-player'}>{isGM ? '📜 Du leitest diese Runde' : '🗡️ Du bist Spieler'}</span>
          <span className="flex items-center gap-1.5 rounded-full bg-stone-950/50 px-2.5 py-0.5 text-stone-400">
            <span className={`h-2 w-2 rounded-full ${live ? 'animate-pulse bg-emerald-400' : 'bg-stone-600'}`} />
            {live ? 'Live' : 'Verbinde …'}
          </span>
        </div>
        <h1 className="title relative mt-2 break-words text-3xl sm:text-5xl">{game.name}</h1>
        <div className="relative mt-3 flex items-center gap-3" aria-hidden>
          <span className="h-px flex-1 bg-gradient-to-r from-amber-600/60 to-transparent" />
          <span className="text-amber-600/70">✦</span>
          <span className="h-px flex-1 bg-gradient-to-l from-amber-600/60 to-transparent" />
        </div>
        <p className="relative mt-3 text-sm text-stone-400">
          {players.length === 0 ? 'Noch keine Gefährten' : `${players.length} ${players.length === 1 ? 'Gefährte' : 'Gefährten'}`}
          {gm && <> · Spielleiter: <span className="text-amber-300">{gm.profiles?.username ?? 'Unbekannt'}</span></>}
        </p>
      </header>

      {error && <p className="alert-error">{error}</p>}
      {notice && <p className="alert-info">{notice}</p>}

      {/* ---------- 1. Mein Held (Spieler) bzw. Spielleiter-Tisch ---------- */}
      {isGM ? (
        <section className="card space-y-4 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="title text-2xl">📜 Spielleiter-Tisch</h2>
            <button type="button" className="btn-primary px-4 py-2 text-sm" onClick={() => setAwarding(true)}>✨ EP verteilen</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <AreaTile to={`/runde/${gameId}/karte`} icon="🗺️" title="Karte" text={activeMap ? `Gezeigt: ${activeMap.name}` : 'Nebelkarten & Tisch-Bildschirm'} highlight={!!activeMap} />
            <AreaTile
              to={`/runde/${gameId}/bibliothek`}
              icon="📚"
              title="Bibliothek"
              text="Gegenstände, Handouts & Effekte"
              badge={openFinds > 0 ? `🔍 ${openFinds} ${openFinds === 1 ? 'offener Fund' : 'offene Funde'}` : null}
            />
          </div>
        </section>
      ) : myCard ? (
        <HeroCard card={myCard} xp={myXp} subtitle={raceClass(myCard)} gameId={gameId} onDetails={() => setSelectedId(myCard.character_id)} />
      ) : (
        <section className="card relative overflow-hidden text-center">
          <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgb(245_158_11/0.18),transparent_60%)]" aria-hidden />
          <div className="relative space-y-3 py-4">
            <div className="text-6xl" aria-hidden>🧝</div>
            <h2 className="title text-3xl">Erschaffe deinen Helden</h2>
            <p className="mx-auto max-w-md text-stone-400">Wähle Volk, Klasse und Werte – die App rechnet alles für dich aus.</p>
            <Link to={`/runde/${gameId}/charakter/neu`} className="btn-primary">✨ Charakter erstellen</Link>
            {freeHeroes.length > 0 && (
              <div className="mx-auto max-w-lg space-y-3 border-t border-stone-800 pt-5">
                <p className="font-display text-lg text-amber-100">… oder bring einen deiner Helden mit</p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {freeHeroes.map((h) => (
                    <li key={h.id}>
                      <button
                        type="button"
                        onClick={() => bringHero(h)}
                        className="flex w-full items-center gap-3 rounded-xl border border-stone-700 bg-stone-950/50 p-2 pr-3 text-left transition hover:border-violet-500"
                      >
                        <Avatar name={h.name} src={h.avatar_url} cls={h.class} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-stone-100">{h.name}</span>
                          <span className="block text-xs text-violet-300">Stufe {h.level}</span>
                        </span>
                        <span className="text-sm text-amber-300">mitbringen →</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ---------- 2. Die Gruppe ---------- */}
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3 px-1">
          <h2 className="title text-2xl">{isGM ? '⚔️ Deine Gruppe' : '⚔️ Deine Gefährten'}</h2>
          {isGM && <span className="hidden text-xs text-stone-500 sm:inline">Antippen für Details & Zustände</span>}
        </div>
        {others.length === 0 ? (
          <p className="card py-8 text-center text-stone-400">
            {isGM ? 'Noch keine Spieler da.' : 'Du bist noch allein unterwegs.'} Teile den Einladungscode unten mit deiner Gruppe!
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {others.map((m) => {
              const card = cardOf(m.user_id)
              const name = m.profiles?.username ?? 'Unbekannt'
              return (
                <li key={m.user_id} className="flex flex-col">
                  <PartyTile card={card} playerName={name} subtitle={card ? raceClass(card) : ''} onClick={card ? () => setSelectedId(card.character_id) : null} />
                  {isGM && (
                    <button onClick={() => removeMember(m.user_id, name)} className="mt-1 rounded-md px-2 py-1 text-xs text-stone-600 hover:bg-red-950/60 hover:text-red-300">
                      entfernen
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* ---------- 3. Bereiche (Spieler) ---------- */}
      {!isGM && (
        <section className="grid gap-3 sm:grid-cols-2">
          <AreaTile to={`/runde/${gameId}/karte`} icon="🗺️" title="Karte" text={activeMap ? `Gerade: ${activeMap.name}` : 'Noch keine Karte gezeigt'} highlight={!!activeMap} />
          <AreaTile to={`/runde/${gameId}/bibliothek`} icon="🎒" title="Inventar & Bibliothek" text="Gegenstände, Handouts & Effekte" />
        </section>
      )}

      {/* ---------- Einladung + Verlassen ---------- */}
      <section className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-dashed border-stone-700 p-4 sm:flex-row">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden>🔑</span>
          <div>
            <p className="text-xs uppercase tracking-widest text-stone-500">Einladungscode</p>
            <p className="font-display text-2xl font-bold tracking-[0.25em] text-amber-300">{game.invite_code}</p>
          </div>
          <button onClick={copyCode} className="btn-ghost ml-1 px-3 py-1.5">{copied ? '✓ Kopiert' : 'Kopieren'}</button>
        </div>
        {isGM ? (
          <button onClick={deleteGame} className="text-sm text-stone-500 hover:text-red-300">🗑️ Runde löschen</button>
        ) : (
          <button onClick={leaveGame} className="text-sm text-stone-500 hover:text-red-300">🚪 Runde verlassen</button>
        )}
      </section>

      {awarding && (
        <Modal onClose={() => setAwarding(false)}>
          <XpDialog
            gameId={gameId}
            onDone={(message) => {
              setAwarding(false)
              setNotice(message)
            }}
          />
        </Modal>
      )}

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

// Großer Kasten „Dein Held“ ganz oben
function HeroCard({ card, xp, subtitle, gameId, onDetails }) {
  const status = hpStatus(card.hp_percent)
  const progress = xp ? xpProgress(xp.xp, xp.level) : null
  return (
    <section className="relative overflow-hidden rounded-2xl border-2 border-violet-700/50 bg-gradient-to-br from-violet-950/60 via-stone-900/80 to-stone-950 p-5 shadow-2xl shadow-violet-950/40 sm:p-6">
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_30%,rgb(139_92_246/0.25),transparent_55%)]" aria-hidden />
      <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
        <button type="button" onClick={onDetails} className="relative shrink-0 rounded-full transition hover:scale-[1.03]" title="Details & Zustände">
          <Avatar name={card.name} src={card.avatar_url} cls={card.class} size="xl" />
          <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-amber-600 bg-stone-950 px-3 py-0.5 font-display text-xs font-bold text-amber-300 shadow-lg">
            Stufe {card.level}
          </span>
        </button>
        <div className="w-full min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-violet-300/80">Dein Held</p>
            <h2 className="title break-words text-3xl sm:text-4xl">{card.name}</h2>
            <p className="text-stone-300">{subtitle}</p>
          </div>
          <div className="mx-auto max-w-sm sm:mx-0">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className={status.text}>❤️ {status.label}</span>
              {card.conditions?.length > 0 && <ConditionIcons conditions={card.conditions} max={5} />}
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-stone-800">
              <div className={`h-full ${status.bar} transition-all`} style={{ width: `${card.hp_percent ?? 100}%` }} />
            </div>
            {progress && (
              <>
                <div className="mb-1 mt-2 flex items-center justify-between text-xs">
                  <span className="text-amber-300">✨ {formatXp(progress.xp)} EP</span>
                  <span className={progress.canLevelUp ? 'font-semibold text-amber-300' : 'text-stone-500'}>
                    {progress.next == null ? 'Höchste Stufe' : progress.canLevelUp ? '⬆️ Aufstieg bereit!' : `noch ${formatXp(progress.missing)} bis Stufe ${progress.nextLevel}`}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-stone-800">
                  <div className="h-full bg-gradient-to-r from-amber-600 to-amber-300" style={{ width: `${progress.percent}%` }} />
                </div>
              </>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <Link to={`/runde/${gameId}/charakter/${card.character_id}`} className="btn-primary">📜 Charakterbogen</Link>
            {progress?.canLevelUp && (
              <Link to={`/runde/${gameId}/charakter/${card.character_id}/aufstieg`} className="btn-primary levelup-ready">⬆️ Aufsteigen</Link>
            )}
            <Link to={`/runde/${gameId}/bibliothek`} className="btn-ghost">🎒 Inventar</Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// Kachel eines Gefährten in der Gruppe
function PartyTile({ card, playerName, subtitle, onClick }) {
  if (!card) {
    return (
      <div className="flex h-full flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-700 p-4 text-center opacity-70">
        <Avatar name={playerName} size="lg" />
        <p className="w-full truncate font-medium text-stone-300">{playerName}</p>
        <p className="text-xs text-stone-500">⏳ erschafft noch einen Helden</p>
      </div>
    )
  }
  const status = hpStatus(card.hp_percent)
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full w-full flex-col items-center gap-2 rounded-2xl border border-stone-800 bg-stone-900/70 p-4 text-center shadow-lg shadow-black/40 transition hover:-translate-y-0.5 hover:border-amber-600"
    >
      <div className="relative">
        <Avatar name={card.name} src={card.avatar_url} cls={card.class} size="lg" />
        {card.hp_percent === 0 && <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 text-2xl">💀</span>}
        <span className="absolute -bottom-1 -right-2 rounded-full border border-stone-700 bg-stone-950 px-1.5 text-xs font-bold text-amber-300">{card.level}</span>
      </div>
      <div className="w-full min-w-0">
        <p className="truncate font-display font-bold text-stone-100 group-hover:text-amber-200">{card.name}</p>
        <p className="truncate text-xs text-violet-300">{subtitle}</p>
      </div>
      <div className="mt-auto w-full space-y-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-stone-800" title={status.label}>
          <div className={`h-full ${status.bar}`} style={{ width: `${card.hp_percent ?? 100}%` }} />
        </div>
        <div className="flex h-5 items-center justify-between gap-1 text-xs">
          <span className="truncate text-stone-500">{playerName}</span>
          <ConditionIcons conditions={card.conditions} />
        </div>
      </div>
    </button>
  )
}
