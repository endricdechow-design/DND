import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { translateError } from '../lib/errors'
import { LIBRARY_TYPES } from '../data/library'
import Modal from '../components/Modal'
import GameNav from '../components/GameNav'
import GameMasterBanner from '../components/GameMasterBanner'
import LibraryCard from '../components/library/LibraryCard'
import LibraryEditor from '../components/library/LibraryEditor'
import LibraryViewer from '../components/library/LibraryViewer'
import GiveDialog from '../components/library/GiveDialog'
import FoundItemDialog from '../components/library/FoundItemDialog'
import ReviewRequestDialog from '../components/library/ReviewRequestDialog'
import { formatKg, itemWeight, totalWeight } from '../lib/inventory'

export default function LibraryPage() {
  const { gameId } = useParams()
  return <Library key={gameId} gameId={gameId} />
}

function Library({ gameId }) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState(null) // 'gm' | 'player'
  const [items, setItems] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [players, setPlayers] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null) // { item } oder { item: null } für neu
  const [viewing, setViewing] = useState(null)
  const [giving, setGiving] = useState(null) // Eintrag, der gerade verschenkt wird
  const [notice, setNotice] = useState('')
  const [requests, setRequests] = useState([]) // offene Fundstücke
  const [capacity, setCapacity] = useState(null) // Traglast (nur Spieler)
  const [reviewing, setReviewing] = useState(null)
  const [finding, setFinding] = useState(false)
  const [error, setError] = useState('')
  const channelRef = useRef(null)

  const isGM = role === 'gm'

  const load = useCallback(async () => {
    const [
      { data: membership },
      { data: itemRows, error: itemError },
      { data: assignmentRows },
      { data: members },
      { data: cards },
      { data: requestRows },
      { data: myChar },
    ] = await Promise.all([
      supabase.from('game_members').select('role').eq('game_id', gameId).eq('user_id', profile.id).maybeSingle(),
      supabase.from('library_items').select('*').eq('game_id', gameId).order('name'),
      supabase.from('library_assignments').select('item_id, user_id, quantity').eq('game_id', gameId),
      supabase.from('game_members').select('user_id, role, profiles(username)').eq('game_id', gameId),
      supabase.from('party_cards').select('user_id, name').eq('game_id', gameId),
      supabase.from('item_requests').select('*').eq('game_id', gameId).eq('status', 'pending').order('created_at'),
      supabase.from('characters').select('carry_capacity').eq('game_id', gameId).eq('user_id', profile.id).maybeSingle(),
    ])
    if (!membership) {
      navigate('/', { replace: true })
      return
    }
    if (itemError) setError(translateError(itemError.message))
    setRole(membership.role)
    setItems(itemRows ?? [])
    setAssignments(assignmentRows ?? [])
    setRequests(requestRows ?? [])
    setCapacity(myChar?.carry_capacity != null ? Number(myChar.carry_capacity) : null)
    // Spieler mit Charakternamen beschriften (falls vorhanden)
    setPlayers(
      (members ?? [])
        .filter((m) => m.role !== 'gm')
        .map((m) => {
          const char = cards?.find((c) => c.user_id === m.user_id)
          const username = m.profiles?.username ?? 'Spieler'
          return { user_id: m.user_id, label: char ? `${char.name} (${username})` : username, short: char?.name ?? username }
        })
    )
  }, [gameId, profile.id, navigate])

  // Laden + live aktualisieren
  useEffect(() => {
    load()
    const channel = supabase
      .channel(`library-${gameId}`)
      // Der Spielleiter sendet nach jeder Änderung ein "changed" – so merken es auch Spieler,
      // wenn etwas wieder versteckt wurde.
      .on('broadcast', { event: 'changed' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'library_items', filter: `game_id=eq.${gameId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'library_assignments', filter: `game_id=eq.${gameId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'item_requests', filter: `game_id=eq.${gameId}` }, () => load())
      .subscribe()
    channelRef.current = channel

    // Jemand hat etwas benutzt (Meldung aus dem Protokoll) → neu laden
    const onGameLog = (e) => e.detail?.game_id === gameId && load()
    window.addEventListener('dnd:game-log', onGameLog)
    // Absicherung: regelmäßig und beim Zurückkehren zur Seite neu laden
    const interval = setInterval(load, 20000)
    const onVisible = () => document.visibilityState === 'visible' && load()
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.removeEventListener('dnd:game-log', onGameLog)
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [gameId, load])

  const notifyChanged = () => channelRef.current?.send({ type: 'broadcast', event: 'changed', payload: {} })

  async function afterChange() {
    setEditing(null)
    await load()
    notifyChanged()
  }

  async function toggleVisibility(item) {
    const visibility = item.visibility === 'all' ? 'hidden' : 'all'
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, visibility } : i)))
    const { error } = await supabase.from('library_items').update({ visibility }).eq('id', item.id)
    if (error) setError(translateError(error.message))
    await load()
    notifyChanged()
  }

  if (!items || !role) return <p className="title animate-pulse text-center text-xl">Öffne die Bibliothek …</p>

  const assignedTo = (itemId) => assignments.filter((a) => a.item_id === itemId).map((a) => a.user_id)
  // Spieler: eigene Anzahl je Eintrag, Gewicht und Traglast
  const myQty = Object.fromEntries(assignments.filter((a) => a.user_id === profile.id).map((a) => [a.item_id, a.quantity ?? 1]))
  const myLoad =
    totalWeight(items.filter((i) => i.type === 'item' && myQty[i.id]).map((i) => ({ item: i, quantity: myQty[i.id] }))) +
    requests.filter((r) => r.user_id === profile.id).reduce((sum, r) => sum + itemWeight(r) * r.quantity, 0)
  const playerLabel = (userId) => players.find((p) => p.user_id === userId)?.label ?? 'Ein Spieler'
  const folders = [...new Set(items.map((i) => i.folder).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'de'))

  return (
    <div className="space-y-6">
      <GameNav gameId={gameId} />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="title text-3xl">📚 Bibliothek</h1>
          <p className="text-stone-400">
            {isGM ? 'Gegenstände, Karten, Handouts und Effekte deiner Runde.' : 'Alles, was dein Spielleiter für dich freigeschaltet hat.'}
          </p>
        </div>
        {isGM ? (
          <button className="btn-primary" onClick={() => setEditing({ item: null })}>＋ Neuer Eintrag</button>
        ) : (
          <button className="btn-secondary" onClick={() => setFinding(true)}>🔍 Etwas gefunden</button>
        )}
      </div>

      {isGM && (
        <GameMasterBanner>
          Neue Einträge sind zuerst <b>versteckt</b>. Schalte sie für alle frei oder teile sie einzelnen Spielern zu –
          die Spieler sehen es sofort.
        </GameMasterBanner>
      )}

      {error && <p className="alert-error">{error}</p>}
      {notice && <p className="alert-info">{notice}</p>}

      {/* Spielleiter: offene Fundstücke */}
      {isGM && requests.length > 0 && (
        <section className="card border-amber-600/70">
          <h2 className="title mb-3 text-xl">🔍 Offene Funde ({requests.length})</h2>
          <ul className="space-y-2">
            {requests.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-800 bg-stone-950/40 p-3">
                <div className="min-w-0">
                  <p className="text-stone-100">
                    <b>{r.name}</b>{r.quantity > 1 ? ` ×${r.quantity}` : ''}
                    {itemWeight(r) > 0 && <span className="ml-2 text-xs text-stone-500">⚖️ {formatKg(itemWeight(r) * r.quantity)}</span>}
                  </p>
                  <p className="text-xs text-violet-300">gefunden von {playerLabel(r.user_id)}</p>
                </div>
                <button className="btn-primary px-4 py-2 text-sm" onClick={() => setReviewing(r)}>Prüfen</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Spieler: Traglast und eigene offene Funde */}
      {!isGM && (capacity != null || requests.length > 0) && (
        <section className="card space-y-2 py-4">
          {capacity != null && (
            <p className={`text-sm ${myLoad > capacity ? 'font-semibold text-red-300' : 'text-stone-300'}`}>
              ⚖️ Traglast: {formatKg(myLoad)} / {formatKg(capacity)}
              {myLoad > capacity && ' – überladen, du kannst nichts mehr aufsammeln'}
            </p>
          )}
          {requests.length > 0 && (
            <p className="text-sm text-stone-400">
              ⏳ Wartet auf Bestätigung: {requests.map((r) => `${r.name}${r.quantity > 1 ? ` ×${r.quantity}` : ''}`).join(', ')}
            </p>
          )}
        </section>
      )}

      {isGM ? (
        <GameMasterView
          items={items}
          folders={folders}
          players={players}
          assignedTo={assignedTo}
          filter={filter}
          setFilter={setFilter}
          search={search}
          setSearch={setSearch}
          onOpen={(item) => setEditing({ item })}
          onToggle={toggleVisibility}
          onGive={setGiving}
        />
      ) : (
        <PlayerView items={items} myQty={myQty} onOpen={setViewing} />
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <LibraryEditor
            gameId={gameId}
            item={editing.item}
            assignedUserIds={editing.item ? assignedTo(editing.item.id) : []}
            players={players}
            folders={folders}
            defaultType={filter !== 'all' ? filter : 'item'}
            onSaved={afterChange}
            onDeleted={afterChange}
          />
        </Modal>
      )}

      {giving && (
        <Modal onClose={() => setGiving(null)}>
          <GiveDialog
            gameId={gameId}
            item={giving}
            players={players}
            onGiven={async () => {
              await load()
              notifyChanged()
            }}
            onClose={() => setGiving(null)}
          />
        </Modal>
      )}

      {reviewing && (
        <Modal onClose={() => setReviewing(null)}>
          <ReviewRequestDialog
            request={reviewing}
            playerLabel={playerLabel(reviewing.user_id)}
            onDone={async (approved) => {
              setReviewing(null)
              setNotice(approved ? `✅ „${reviewing.name}“ angenommen und ins Inventar gelegt.` : `❌ „${reviewing.name}“ abgelehnt.`)
              await load()
              notifyChanged()
            }}
          />
        </Modal>
      )}

      {finding && (
        <Modal onClose={() => setFinding(false)}>
          <FoundItemDialog gameId={gameId} load={myLoad} capacity={capacity} onSent={load} onClose={() => setFinding(false)} />
        </Modal>
      )}

      {viewing && (
        <Modal onClose={() => setViewing(null)}>
          <LibraryViewer
            item={viewing}
            quantity={myQty[viewing.id] ?? 1}
            canUse={!isGM && assignments.some((a) => a.item_id === viewing.id)}
            groupOnly={!isGM && !assignments.some((a) => a.item_id === viewing.id)}
            onUsed={async (used) => {
              setViewing(null)
              setNotice(`🧪 „${used.name}“ benutzt und aus deinem Inventar entfernt.`)
              await load()
            }}
          />
        </Modal>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------
// Ansicht des Spielleiters: alles, nach Ordnern sortiert, mit Filter und Suche
// ---------------------------------------------------------------------
function GameMasterView({ items, folders, players, assignedTo, filter, setFilter, search, setSearch, onOpen, onToggle, onGive }) {
  const term = search.trim().toLowerCase()
  const visible = items.filter(
    (i) => (filter === 'all' || i.type === filter) && (!term || `${i.name} ${i.description} ${i.folder}`.toLowerCase().includes(term))
  )
  const groups = [...folders, ''].map((folder) => ({ folder, list: visible.filter((i) => i.folder === folder) })).filter((g) => g.list.length)
  const nameOf = (userId) => players.find((p) => p.user_id === userId)?.short ?? '?'

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2">
          {[{ key: 'all', name: 'Alle', icon: '📚' }, ...LIBRARY_TYPES.map((t) => ({ ...t, name: t.plural }))].map((t) => {
            const count = t.key === 'all' ? items.length : items.filter((i) => i.type === t.key).length
            return (
              <button key={t.key} type="button" onClick={() => setFilter(t.key)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${filter === t.key ? 'border-amber-500 bg-amber-500/15 text-amber-200' : 'border-stone-700 text-stone-400 hover:border-stone-500'}`}>
                {t.icon} {t.name} <span className="text-stone-500">{count}</span>
              </button>
            )
          })}
        </div>
        <input className="input sm:ml-auto sm:w-56" placeholder="🔍 Suchen …" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {items.length === 0 ? (
        <div className="card text-center">
          <p className="text-4xl">📚</p>
          <p className="mt-2 text-stone-300">Deine Bibliothek ist noch leer.</p>
          <p className="text-sm text-stone-500">Lege Gegenstände, Karten, Handouts oder Effekte an und schalte sie im Spiel frei.</p>
        </div>
      ) : groups.length === 0 ? (
        <p className="text-center text-stone-500">Nichts gefunden.</p>
      ) : (
        groups.map(({ folder, list }) => (
          <section key={folder || '—'} className="card">
            <h2 className="mb-3 font-display text-lg font-bold text-amber-200">
              📁 {folder || 'Ohne Ordner'} <span className="text-sm font-normal text-stone-500">({list.length})</span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((item) => (
                <LibraryCard
                  key={item.id}
                  item={item}
                  assignedNames={assignedTo(item.id).map(nameOf)}
                  onOpen={() => onOpen(item)}
                  onToggleVisibility={() => onToggle(item)}
                  onGive={() => onGive(item)}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}

// ---------------------------------------------------------------------
// Ansicht der Spieler: "Für dich" und "Für die ganze Gruppe"
// ---------------------------------------------------------------------
function PlayerView({ items, myQty, onOpen }) {
  const mine = items.filter((i) => myQty[i.id])
  const group = items.filter((i) => !myQty[i.id])

  if (!items.length) {
    return (
      <div className="card text-center">
        <p className="text-4xl">🔒</p>
        <p className="mt-2 text-stone-300">Hier ist noch nichts.</p>
        <p className="text-sm text-stone-500">Sobald dein Spielleiter etwas freischaltet, erscheint es hier – ganz ohne Neuladen.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {LIBRARY_TYPES.map((type) => {
        const list = mine.filter((i) => i.type === type.key)
        if (!list.length) return null
        return (
          <section key={type.key} className="card">
            <h2 className="title mb-3 text-xl">{type.mine}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((item) => <LibraryCard key={item.id} item={item} quantity={myQty[item.id]} onOpen={() => onOpen(item)} />)}
            </div>
          </section>
        )
      })}

      {group.length > 0 && (
        <section className="card">
          <h2 className="title mb-1 text-xl">👥 Für die ganze Gruppe</h2>
          <p className="mb-3 text-sm text-stone-500">Das hat euer Spielleiter für alle freigeschaltet.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.map((item) => <LibraryCard key={item.id} item={item} onOpen={() => onOpen(item)} />)}
          </div>
        </section>
      )}
    </div>
  )
}
