import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useCompendium } from '../lib/compendium'
import { translateError } from '../lib/errors'
import { ask } from '../lib/confirm'
import GameNav from '../components/GameNav'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import PageSkeleton from '../components/Skeleton'
import { RichText } from '../components/compendium/EntryView'
import { HouseRuleEditor } from '../components/compendium/HouseRulesManager'
import TemplatePicker from '../components/compendium/TemplatePicker'

export default function HouseRulesPage() {
  const { gameId } = useParams()
  return <HouseRules key={gameId} gameId={gameId} />
}

/**
 * Hausregeln einer Runde: Spieler lesen, der Spielleiter ändert jederzeit.
 * Mit ?start=1 (direkt nach „Runde erstellen“) erscheint zuerst die Vorlagen-Auswahl.
 */
function HouseRules({ gameId }) {
  const { profile } = useAuth()
  const { reloadHouseRules } = useCompendium()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isStart = searchParams.get('start') === '1'
  const [game, setGame] = useState(null)
  const [role, setRole] = useState(null)
  const [rules, setRules] = useState(null)
  const [editing, setEditing] = useState(null) // { rule } oder { rule: null }
  const [picking, setPicking] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const [{ data: membership }, { data: g }, { data: rows, error }] = await Promise.all([
      supabase.from('game_members').select('role').eq('game_id', gameId).eq('user_id', profile.id).maybeSingle(),
      supabase.from('games').select('id, name').eq('id', gameId).maybeSingle(),
      supabase.from('house_rules').select('*').eq('game_id', gameId).order('title'),
    ])
    if (!membership) return navigate('/', { replace: true })
    if (error) setError(translateError(error.message))
    setRole(membership.role)
    setGame(g)
    setRules(rows ?? [])
  }, [gameId, profile.id, navigate])

  useEffect(() => {
    load()
    const channel = supabase
      .channel(`house-rules-${gameId}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'house_rules', filter: `game_id=eq.${gameId}` }, () => load())
      .subscribe()
    const onLog = (e) => e.detail?.game_id === gameId && e.detail?.kind === 'house_rule' && load()
    window.addEventListener('dnd:game-log', onLog)
    return () => {
      window.removeEventListener('dnd:game-log', onLog)
      supabase.removeChannel(channel)
    }
  }, [gameId, load])

  if (!rules || !role) return <PageSkeleton text="Schlage die Hausregeln auf …" />
  const isGM = role === 'gm'

  async function afterChange(message) {
    setEditing(null)
    setPicking(false)
    if (message) setNotice(message)
    await load()
    reloadHouseRules()
  }

  async function remove(rule) {
    if (!(await ask(`Hausregel „${rule.title}“ löschen?`))) return
    const { error } = await supabase.from('house_rules').delete().eq('id', rule.id)
    if (error) return setError(translateError(error.message))
    afterChange()
  }

  // Direkt nach „Runde erstellen“: Willkommen + Vorlagen
  if (isStart && isGM) {
    return (
      <div className="space-y-6">
        <PageHeader icon="🎉" eyebrow="Deine Runde steht!" title={game?.name ?? 'Neue Runde'} subtitle="Bevor es losgeht: Welche Hausregeln sollen bei euch gelten? Kreuze an, was passt – du kannst alles später jederzeit ändern oder ergänzen." />
        <section className="card space-y-4">
          <h2 className="title text-2xl">🏠 Hausregeln wählen</h2>
          <TemplatePicker
            gameId={gameId}
            existingTitles={rules.map((r) => r.title)}
            submitLabel="✓ Übernehmen & zur Lobby"
            onSkip={() => navigate(`/runde/${gameId}`, { replace: true })}
            onDone={() => {
              reloadHouseRules()
              navigate(`/runde/${gameId}`, { replace: true })
            }}
          />
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <GameNav gameId={gameId} />
      <PageHeader
        icon="🏠"
        eyebrow={game?.name}
        title="Hausregeln"
        subtitle={isGM ? 'Eure eigenen Absprachen. Du kannst sie jederzeit ändern – die Spieler bekommen eine Meldung.' : 'Das gilt bei euch am Tisch – festgelegt von eurem Spielleiter.'}
      >
        {isGM && (
          <>
            <button type="button" className="btn-secondary" onClick={() => setPicking(true)}>📋 Vorlagen</button>
            <button type="button" className="btn-primary" onClick={() => setEditing({ rule: null })}>＋ Eigene Regel</button>
          </>
        )}
      </PageHeader>

      {error && <p className="alert-error">{error}</p>}
      {notice && <p className="alert-info">{notice}</p>}

      {rules.length === 0 ? (
        <section className="card py-10 text-center">
          <p className="text-5xl" aria-hidden>📜</p>
          <p className="mt-3 text-stone-400">
            {isGM ? 'Noch keine Hausregeln. Nimm Vorlagen oder schreib eine eigene Regel.' : 'Euer Spielleiter hat noch keine Hausregeln festgelegt – es gelten die normalen Regeln.'}
          </p>
          {isGM && (
            <button type="button" className="btn-primary mt-4" onClick={() => setPicking(true)}>📋 Vorlagen ansehen</button>
          )}
        </section>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {rules.map((rule) => (
            <li key={rule.id} className="card flex flex-col gap-3 p-5">
              <h2 className="title text-xl">{rule.title}</h2>
              <div className="flex-1 text-sm">
                <RichText text={rule.body} />
              </div>
              {isGM && (
                <div className="flex justify-end gap-3 border-t border-stone-800 pt-3 text-sm">
                  <button type="button" className="text-amber-400 hover:text-amber-200" onClick={() => setEditing({ rule })}>✏️ Bearbeiten</button>
                  <button type="button" className="text-stone-500 hover:text-red-300" onClick={() => remove(rule)}>🗑️ Löschen</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <HouseRuleEditor rule={editing.rule} gameId={gameId} games={[{ id: gameId, name: game?.name ?? '' }]} onDone={() => afterChange(editing.rule ? '✓ Hausregel gespeichert.' : '✓ Hausregel hinzugefügt.')} />
        </Modal>
      )}
      {picking && (
        <Modal onClose={() => setPicking(false)}>
          <div className="space-y-4">
            <div className="pr-8">
              <h2 className="title text-2xl">📋 Vorlagen</h2>
              <p className="text-sm text-stone-400">Beliebte Hausregeln zum Ankreuzen – danach kannst du jede einzeln anpassen.</p>
            </div>
            <TemplatePicker
              gameId={gameId}
              existingTitles={rules.map((r) => r.title)}
              onDone={(n) => afterChange(n ? `✓ ${n} ${n === 1 ? 'Hausregel' : 'Hausregeln'} hinzugefügt.` : '')}
            />
          </div>
        </Modal>
      )}
    </div>
  )
}
