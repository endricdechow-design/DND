import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { translateError } from '../lib/errors'
import { removeAvatar } from '../lib/avatars'
import { ABILITIES, abilityShort } from '../data/srd'
import { featuresUpTo, formatXp, xpProgress } from '../data/levels'
import { deriveCharacter, formatMeters, formatMod } from '../lib/character'
import Avatar from '../components/Avatar'
import GameNav from '../components/GameNav'
import InfoTip from '../components/compendium/InfoTip'
import GameMasterBanner from '../components/GameMasterBanner'
import PartyCardDetails from '../components/party/PartyCardDetails'
import { ConditionIcons, ConditionPicker } from '../components/party/Conditions'
import { conditionByKey } from '../data/conditions'
import { spellRules } from '../data/spells'
import { hpStatus } from '../lib/party'
import OwnedFromLibrary from '../components/library/OwnedFromLibrary'
import SpellsSection from '../components/spells/SpellsSection'
import { ask } from '../lib/confirm'
import PageSkeleton from '../components/Skeleton'

export default function CharacterSheetPage() {
  const { gameId, characterId } = useParams()
  return <Sheet key={characterId} gameId={gameId} characterId={characterId} />
}

function Sheet({ gameId, characterId }) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const notice = location.state?.notice
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [character, setCharacter] = useState(null)
  const [partyCard, setPartyCard] = useState(null) // eingeschränkte Ansicht für Mitspieler
  const [isGM, setIsGM] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    // „Meine Helden“ (ohne Runde): nur der eigene Held
    if (!gameId) {
      const { data: char } = await supabase.from('characters').select('*, profiles(username)').eq('id', characterId).maybeSingle()
      if (!char || char.user_id !== profile.id) return navigate('/', { replace: true })
      if (char.game_id) return navigate(`/runde/${char.game_id}/charakter/${char.id}`, { replace: true })
      setCharacter(char)
      setIsGM(false)
      return
    }
    const [{ data: char }, { data: membership }] = await Promise.all([
      supabase.from('characters').select('*, profiles(username)').eq('id', characterId).maybeSingle(),
      supabase.from('game_members').select('role').eq('game_id', gameId).eq('user_id', profile.id).maybeSingle(),
    ])
    if (!membership) {
      navigate(`/runde/${gameId}`, { replace: true })
      return
    }
    if (char && char.game_id !== gameId) {
      // Held ist nicht (mehr) in dieser Runde
      navigate(char.user_id === profile.id && !char.game_id ? `/helden/${char.id}` : `/runde/${gameId}`, { replace: true })
      return
    }
    if (!char) {
      // Kein Zugriff auf den vollen Bogen → Gruppenkarte zeigen (falls vorhanden)
      const { data: card } = await supabase
        .from('party_cards')
        .select('*, profiles(username)')
        .eq('character_id', characterId)
        .maybeSingle()
      if (!card) {
        navigate(`/runde/${gameId}`, { replace: true })
        return
      }
      setPartyCard(card)
      return
    }
    setCharacter(char)
    setIsGM(membership.role === 'gm')
  }, [characterId, gameId, profile.id, navigate])

  // Laden + live mitbekommen, wenn jemand (z. B. der Spielleiter) etwas ändert
  useEffect(() => {
    load()
    const channel = supabase
      .channel(`character-${characterId}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'characters', filter: `id=eq.${characterId}` }, load)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'characters' }, load)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'party_cards', filter: `character_id=eq.${characterId}` }, load)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [characterId, load])

  // Maximale TP für den Lebensbalken der Gruppe aktuell halten (wird nur hier berechnet)
  const canEditLoaded = character && (character.user_id === profile.id || isGM)
  const derivedNow = character ? deriveCharacter(character) : null
  const computedMax = derivedNow?.hpMax ?? null
  const computedCapacity = derivedNow?.carryCapacity ?? null
  // Gecachte Werte (Lebensbalken der Gruppe, Traglast-Prüfung in der Datenbank) aktuell halten
  useEffect(() => {
    if (!canEditLoaded || !computedMax) return
    const patch = {}
    if (character.hp_max !== computedMax) patch.hp_max = computedMax
    if (Number(character.carry_capacity) !== computedCapacity) patch.carry_capacity = computedCapacity
    if (Object.keys(patch).length) supabase.from('characters').update(patch).eq('id', characterId).then(() => {})
  }, [canEditLoaded, computedMax, computedCapacity, character?.hp_max, character?.carry_capacity, characterId])

  if (partyCard) {
    return (
      <div className="space-y-6">
        <GameNav gameId={gameId} />
        <section className="card">
          <PartyCardDetails card={partyCard} playerName={partyCard.profiles?.username} canEditConditions={false} />
          <p className="mt-5 text-xs text-stone-500">
            🔒 Den vollen Charakterbogen sehen nur {partyCard.name}s Spieler und der Spielleiter.
          </p>
        </section>
      </div>
    )
  }

  if (!character) return <PageSkeleton text="Lade Charakterbogen …" />

  const canEdit = character.user_id === profile.id || isGM
  const c = deriveCharacter(character)
  const data = character.data ?? {}
  const backgroundName = data.background === 'custom' ? data.backgroundName : c.background?.name

  async function saveFields(patch) {
    setError('')
    setCharacter((prev) => ({ ...prev, ...patch })) // sofort anzeigen
    const { error } = await supabase.from('characters').update(patch).eq('id', characterId)
    if (error) {
      setError(translateError(error.message))
      load()
    }
  }

  // Letzten Stufenaufstieg zurücknehmen
  async function undoLastLevel() {
    const last = (data.levelUps ?? []).find((lu) => lu.level === c.level)
    if (!last) return
    if (!(await ask(`Aufstieg auf Stufe ${c.level} rückgängig machen?`))) return
    const newData = { ...data, levelUps: data.levelUps.filter((lu) => lu.level < c.level) }
    const prev = deriveCharacter({ ...character, level: c.level - 1, data: newData })
    const hpCurrent = Math.max(0, Math.min(prev.hpMax, character.hp_current - (c.hpMax - prev.hpMax)))
    await saveFields({ level: c.level - 1, data: newData, hp_current: hpCurrent, hp_max: prev.hpMax })
  }

  async function deleteCharacter() {
    if (!(await ask(`„${character.name}“ wirklich endgültig löschen?`))) return
    const { error } = await supabase.from('characters').delete().eq('id', characterId)
    if (error) return setError(translateError(error.message))
    if (character.avatar_url) removeAvatar(character.avatar_url)
    navigate(gameId ? `/runde/${gameId}` : '/', { replace: true })
  }

  // Held aus der Runde nehmen → zurück in „Meine Helden“
  async function releaseCharacter() {
    if (!(await ask(`${character.name} aus dieser Runde nehmen? Der Held kommt zurück in „Meine Helden“ und du kannst ihn später wieder mitbringen.`, { confirmLabel: '📖 Zurücklegen' }))) return
    const { error } = await supabase.from('characters').update({ game_id: null }).eq('id', characterId)
    if (error) return setError(translateError(error.message))
    navigate(`/helden/${characterId}`, { replace: true })
  }

  const base = gameId ? `/runde/${gameId}/charakter/${characterId}` : `/helden/${characterId}`

  const isCaster = Boolean(spellRules(character.class, c.level, c.mods) && c.spellcasting)
  const tabs = TABS.filter((t) => (t.key !== 'zauber' || isCaster) && (t.key !== 'inventar' || gameId))
  const tab = tabs.some((t) => t.key === tabParam) ? tabParam : 'kampf'
  const setTab = (key) => setSearchParams(key === 'kampf' ? {} : { tab: key }, { replace: true })
  const hpCurrent = Math.min(character.hp_current, c.hpMax)
  const hpPercent = c.hpMax > 0 ? Math.round((hpCurrent / c.hpMax) * 100) : 0
  const hp = hpStatus(hpPercent)
  // EP (null, solange die Datenbank-Spalte noch fehlt → Aufstieg wie früher immer möglich)
  const xp = character.xp != null ? xpProgress(character.xp, c.level) : null
  const levelUpOpen = !xp || xp.canLevelUp || isGM

  return (
    <div className="space-y-6">
      {gameId ? (
        <GameNav gameId={gameId} />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="btn-ghost">← Meine Helden</Link>
          <span className="badge-player">📖 Nicht in einer Runde</span>
        </div>
      )}

      {isGM && character.user_id !== profile.id && (
        <GameMasterBanner>
          Du siehst den vollen Bogen von <b>{character.name}</b> (gespielt von {character.profiles?.username ?? '?'}).
          Änderungen an Trefferpunkten, Zuständen oder Werten sieht der Spieler sofort.
        </GameMasterBanner>
      )}

      {/* ---------- Kopf: der Held ---------- */}
      <section className="relative overflow-hidden rounded-2xl border-2 border-violet-700/50 bg-gradient-to-br from-violet-950/60 via-stone-900/80 to-stone-950 p-5 shadow-2xl shadow-violet-950/40 sm:p-6">
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_30%,rgb(139_92_246/0.25),transparent_55%)]" aria-hidden />
        <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:text-left">
          <div className="relative shrink-0">
            <Avatar name={character.name} src={character.avatar_url} cls={character.class} size="xl" />
            <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-amber-600 bg-stone-950 px-3 py-0.5 font-display text-xs font-bold text-amber-300 shadow-lg">
              Stufe {c.level}
            </span>
          </div>
          <div className="w-full min-w-0 flex-1 space-y-3">
            <div>
              <h1 className="title break-words text-3xl sm:text-4xl">{character.name}</h1>
              <p className="text-stone-200">{[c.race?.name, c.cls?.name].filter(Boolean).join(' · ')}</p>
              <p className="text-sm text-stone-400">
                {[backgroundName, data.alignment, `gespielt von ${character.profiles?.username ?? '?'}`].filter(Boolean).join(' · ')}
              </p>
            </div>
            <div className="mx-auto max-w-md sm:mx-0">
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className={hp.text}>❤️ {hpCurrent} / {c.hpMax} TP{character.hp_temp > 0 && <span className="text-sky-300"> (+{character.hp_temp})</span>}</span>
                <ConditionIcons conditions={character.conditions ?? []} max={5} />
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-stone-800">
                <div className={`h-full ${hp.bar} transition-all`} style={{ width: `${hpPercent}%` }} />
              </div>
              {xp && <XpBar xp={xp} />}
            </div>
            {canEdit && (
              <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                {c.level < 20 && (gameId || xp?.canLevelUp) &&
                  (levelUpOpen ? (
                    <Link to={`${base}/aufstieg`} className={`btn-primary px-4 py-2 text-sm ${xp?.canLevelUp ? 'levelup-ready' : ''}`}>
                      ⬆️ Stufe aufsteigen
                    </Link>
                  ) : (
                    <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-stone-700 bg-stone-900/60 px-4 py-2 text-sm text-stone-500" title="Dein Spielleiter vergibt die Erfahrungspunkte">
                      🔒 Aufstieg ab {formatXp(xp.next)} EP
                    </span>
                  ))}
                <Link to={`${base}/bearbeiten`} className="btn-ghost">✏️ Bearbeiten</Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {notice && <p className="alert-info">{notice}</p>}
      {error && <p className="alert-error">{error}</p>}

      {/* ---------- Reiter (bleiben beim Scrollen oben) ---------- */}
      <nav className="sticky top-0 z-20 -mx-4 border-b border-stone-800 bg-stone-950/90 px-4 backdrop-blur sm:mx-0 sm:rounded-xl sm:border" aria-label="Bereiche des Charakterbogens">
        <div className="grid grid-cols-3 gap-1 py-2 sm:flex">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`shrink-0 truncate rounded-lg px-2 py-2 text-sm font-medium transition sm:px-3 ${
                tab === t.key ? 'bg-amber-500/20 text-amber-200' : 'text-stone-400 hover:bg-stone-800 hover:text-stone-200'
              }`}
              aria-current={tab === t.key ? 'page' : undefined}
            >
              <span aria-hidden>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ---------- Kampf ---------- */}
      {tab === 'kampf' && (
        <>
          <HitPoints character={character} hpMax={c.hpMax} canEdit={canEdit} onSave={saveFields} />
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <BigStat icon="🛡️" label="Rüstungsklasse" info="kampf:ruestungsklasse" value={c.ac} hint={c.armor.key === 'none' ? 'ohne Rüstung' : c.armor.name.replace(/ \(.*\)/, '')} highlight />
            <BigStat icon="⚡" label="Initiative" info="kampf:initiative" value={formatMod(c.initiative)} />
            <BigStat icon="👣" label="Bewegung" info="bewegung:bewegungsrate" value={formatMeters(c.speed)} />
            <BigStat icon="🎓" label="Übungsbonus" info="grundregeln:uebungsbonus" value={formatMod(c.prof)} />
            <BigStat icon="👁️" label="Passive Wahrnehmung" info="grundregeln:passiv" value={c.passivePerception} className="col-span-2 sm:col-span-1" />
          </section>
          <ConditionsCard name={character.name} conditions={character.conditions ?? []} onChange={(conditions) => saveFields({ conditions })} />
          {(c.breathWeapon || c.sneakAttack) && (
            <section className="card space-y-4">
              {c.breathWeapon && (
                <InfoBlock title={`🐲 Odemwaffe (${c.breathWeapon.name})`}>
                  <p className="text-sm text-stone-300">
                    {c.breathWeapon.dice} {c.breathWeapon.damage}schaden · {c.breathWeapon.area} · {abilityShort(c.breathWeapon.save)}-Rettungswurf SG{' '}
                    {c.breathWeapon.dc} (halber Schaden bei Erfolg)
                  </p>
                </InfoBlock>
              )}
              {c.sneakAttack && (
                <InfoBlock title="🗡️ Hinterhältiger Angriff">
                  <p className="text-sm text-stone-300">Aktuell <b>{c.sneakAttack}</b> zusätzlicher Schaden (1× pro Zug).</p>
                </InfoBlock>
              )}
            </section>
          )}
        </>
      )}

      {/* ---------- Werte ---------- */}
      {tab === 'werte' && (
        <>
          <section className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-6">
            {Object.entries(c.abilities).map(([key, score]) => (
              <AbilityShield key={key} label={abilityShort(key)} mod={formatMod(c.mods[key])} score={score} />
            ))}
          </section>
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card">
              <h2 className="title mb-3 text-xl">Rettungswürfe<InfoTip id="grundregeln:rettungswurf" /></h2>
              <ul className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
                {c.saves.map((sv) => <BonusRow key={sv.key} label={sv.name} bonus={sv.bonus} proficient={sv.proficient} />)}
              </ul>
            </section>
            <section className="card lg:row-span-2">
              <h2 className="title mb-3 text-xl">Fertigkeiten<InfoTip id="fertigkeiten:uebersicht" /></h2>
              <ul className="space-y-1">
                {c.skills.map((sk) => (
                  <BonusRow key={sk.key} label={sk.name} sub={abilityShort(sk.ability)} bonus={sk.bonus} proficient={sk.proficient} />
                ))}
              </ul>
              <p className="mt-3 text-xs text-stone-500">● = geübt (Übungsbonus {formatMod(c.prof)} ist eingerechnet)</p>
            </section>
          </div>
        </>
      )}

      {/* ---------- Zauber ---------- */}
      {tab === 'zauber' && <SpellsSection character={character} derived={c} canEdit={canEdit} onSave={saveFields} />}

      {/* ---------- Inventar ---------- */}
      {tab === 'inventar' && (
        <OwnedFromLibrary
          gameId={gameId}
          player={{
            user_id: character.user_id,
            short: character.name,
            label: `${character.name} (${character.profiles?.username ?? '?'})`,
          }}
          canGive={isGM}
          capacity={c.carryCapacity}
          gameIdForFound={character.user_id === profile.id ? gameId : null}
        />
      )}

      {/* ---------- Merkmale ---------- */}
      {tab === 'merkmale' && (
        <>
          <section className="card space-y-5">
            <TraitBlock title={`⚔️ Klasse: ${c.cls?.name}`} items={[...(c.cls?.features ?? []), ...featuresUpTo(character.class, c.level)]} />
            <TraitBlock title={`🧬 Volk: ${c.race?.name}`} items={c.race?.traits ?? []} />
            {c.background?.feature && <TraitBlock title={`📖 Hintergrund: ${c.background.name}`} items={[c.background.feature]} />}
          </section>
          {c.level > 1 && <LevelHistory character={character} derived={c} canEdit={canEdit} onUndo={undoLastLevel} />}
        </>
      )}

      {/* ---------- Notizen ---------- */}
      {tab === 'notizen' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Notes
            character={character}
            field="notes"
            title="Öffentliche Notizen"
            hint="👥 Für alle in der Runde sichtbar – Aussehen, Vorgeschichte, was die Gruppe wissen darf."
            placeholder="z. B. Aussehen, Herkunft, Ziele …"
            onSave={saveFields}
          />
          <Notes
            character={character}
            field="privateNotes"
            title="Private Notizen"
            hint="🔒 Nur für dich und den Spielleiter – Ausrüstung, Gold, Geheimnisse."
            placeholder="z. B. Ausrüstung, Gold, Geheimnisse, Pläne …"
            onSave={saveFields}
          />
        </div>
      )}

      {canEdit && (
        <div className="flex justify-end pt-4">
          {gameId && character.user_id === profile.id && (
            <button onClick={releaseCharacter} className="mr-5 text-sm text-stone-500 hover:text-amber-200">📖 In „Meine Helden“ zurücklegen</button>
          )}
          <button onClick={deleteCharacter} className="text-sm text-stone-600 hover:text-red-300">🗑️ Charakter löschen</button>
        </div>
      )}
    </div>
  )
}

const TABS = [
  { key: 'kampf', icon: '⚔️', label: 'Kampf' },
  { key: 'werte', icon: '🎲', label: 'Werte' },
  { key: 'zauber', icon: '✨', label: 'Zauber' },
  { key: 'inventar', icon: '🎒', label: 'Inventar' },
  { key: 'merkmale', icon: '📜', label: 'Merkmale' },
  { key: 'notizen', icon: '📝', label: 'Notizen' },
]

// EP-Balken bis zur nächsten Stufe
function XpBar({ xp }) {
  return (
    <div className="mt-2">
      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
        <span className="text-amber-300">✨ {formatXp(xp.xp)} EP<InfoTip id="grundregeln:stufenaufstieg" /></span>
        <span className={xp.canLevelUp ? 'font-semibold text-amber-300' : 'text-stone-500'}>
          {xp.next == null ? 'Höchste Stufe' : xp.canLevelUp ? '⬆️ Aufstieg bereit!' : `noch ${formatXp(xp.missing)} bis Stufe ${xp.nextLevel}`}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-stone-800">
        <div className="h-full bg-gradient-to-r from-amber-600 to-amber-300 transition-all" style={{ width: `${xp.percent}%` }} />
      </div>
    </div>
  )
}

// Zustände: nur die aktiven zeigen, Auswahl auf Knopfdruck
function ConditionsCard({ name, conditions, onChange }) {
  const [picking, setPicking] = useState(false)
  return (
    <section className="card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="title text-xl">Zustände<InfoTip id="zustaende:poisoned" /></h2>
        <button type="button" className="btn-ghost px-3 py-1.5" onClick={() => setPicking(!picking)}>
          {picking ? '✓ Fertig' : '＋ Zustand'}
        </button>
      </div>
      {picking ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-stone-500">Tippe an, was gerade auf {name} wirkt – die Gruppe sieht es sofort.</p>
          <ConditionPicker conditions={conditions} onChange={onChange} />
        </div>
      ) : conditions.length ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {conditions.map((key) => {
            const cond = conditionByKey(key)
            if (!cond) return null
            return (
              <li key={key} className="flex items-center gap-1 rounded-full border border-red-500/60 bg-red-500/10 py-1 pl-3 pr-1 text-sm text-red-200" title={cond.text}>
                {cond.icon} {cond.name}
                <InfoTip id={`zustaende:${key}`} />
                <button type="button" className="ml-1 rounded-full px-1.5 text-red-300 hover:bg-red-500/20" aria-label={`${cond.name} entfernen`} onClick={() => onChange(conditions.filter((k) => k !== key))}>
                  ✕
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-stone-500">✨ Keine besonderen Zustände.</p>
      )}
    </section>
  )
}

// Attribut im Wappen-Look
function AbilityShield({ label, mod, score }) {
  const shield = 'polygon(50% 0, 100% 10%, 100% 62%, 50% 100%, 0 62%, 0 10%)'
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-28 w-24 bg-gradient-to-b from-amber-500/80 to-amber-900/80" style={{ clipPath: shield }}>
        <div className="absolute inset-[2px] flex flex-col items-center bg-gradient-to-b from-stone-900 to-stone-950 pt-3" style={{ clipPath: shield }}>
          <p className="text-xs font-bold tracking-[0.2em] text-amber-400/90">{label}</p>
          <p className="mt-1 font-display text-3xl font-bold text-stone-100">{mod}</p>
        </div>
      </div>
      <p className="relative -mt-3 rounded-full border border-amber-700/70 bg-stone-950 px-3 text-sm font-semibold text-amber-200">{score}</p>
    </div>
  )
}

// ---------------------------------------------------------------------
// Trefferpunkte mit Schaden / Heilung / temporären TP
// ---------------------------------------------------------------------
function HitPoints({ character, hpMax, canEdit, onSave }) {
  const [amount, setAmount] = useState('')
  const current = Math.min(character.hp_current, hpMax)
  const temp = character.hp_temp
  const percent = hpMax > 0 ? Math.round((current / hpMax) * 100) : 0
  const barColor = hpStatus(percent).bar
  const value = Math.max(0, Math.floor(Number(amount) || 0))

  function damage() {
    const fromTemp = Math.min(temp, value)
    onSave({ hp_temp: temp - fromTemp, hp_current: Math.max(0, current - (value - fromTemp)) })
    setAmount('')
  }
  function heal() {
    onSave({ hp_current: Math.min(hpMax, current + value) })
    setAmount('')
  }
  function setTemp() {
    onSave({ hp_temp: value })
    setAmount('')
  }

  return (
    <section className="card">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="title text-xl">Trefferpunkte<InfoTip id="grundregeln:trefferpunkte" /></h2>
        <p className="text-stone-300">
          <span className="text-3xl font-bold text-stone-100">{current}</span>
          <span className="text-stone-500"> / {hpMax}</span>
          {temp > 0 && <span className="ml-2 rounded-full bg-sky-900/60 px-2 py-0.5 text-sm text-sky-200">+{temp} temporär</span>}
        </p>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-stone-800">
        <div className={`h-full transition-all ${barColor}`} style={{ width: `${percent}%` }} />
      </div>
      {current === 0 && <p className="mt-2 text-sm text-red-300">💀 Bewusstlos – Zeit für Todesrettungswürfe!</p>}

      {canEdit && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            className="input w-24 py-2"
            placeholder="Wert"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button className="btn-danger" disabled={!value} onClick={damage}>🗡️ Schaden</button>
          <button className="btn-ghost" disabled={!value} onClick={heal}>💚 Heilen</button>
          <button className="btn-ghost" onClick={setTemp} title="Temporäre TP auf diesen Wert setzen">🛡️ Temp. TP</button>
          <button
            className="btn-ghost sm:ml-auto"
            onClick={() =>
              onSave({
                hp_current: hpMax,
                hp_temp: 0,
                // Lange Rast: auch alle Zauberplätze zurück
                data: { ...character.data, spells: { ...(character.data?.spells ?? {}), slotsUsed: {} } },
              })
            }
          >
            🌙 Lange Rast
          </button>
        </div>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------
// Notizen
// ---------------------------------------------------------------------
function Notes({ character, field, title, hint, placeholder, onSave }) {
  const saved = character.data?.[field] ?? ''
  const [text, setText] = useState(saved)
  const [prevSaved, setPrevSaved] = useState(saved)

  // Wenn sich die gespeicherten Notizen von außen ändern, Feld aktualisieren
  if (saved !== prevSaved) {
    setPrevSaved(saved)
    setText(saved)
  }

  return (
    <section className="card">
      <h2 className="title mb-1 text-xl">{title}</h2>
      <p className="mb-3 text-xs text-stone-500">{hint}</p>
      <textarea
        className="input min-h-32"
        value={text}
        maxLength={5000}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
      />
      <div className="mt-2 flex justify-end">
        <button
          className="btn-primary"
          disabled={text === saved}
          onClick={() => onSave({ data: { ...character.data, [field]: text } })}
        >
          Speichern
        </button>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------
// Stufenverlauf mit Rückgängig für den letzten Aufstieg
// ---------------------------------------------------------------------
function LevelHistory({ character, derived, canEdit, onUndo }) {
  const levelUps = derived.levelUps
  const abilityName = (key) => ABILITIES.find((a) => a.key === key)?.short ?? key
  const rows = []
  for (let lvl = 2; lvl <= derived.level; lvl++) {
    const lu = levelUps.find((l) => l.level === lvl)
    const hp = lu?.hpRoll ? `TP gewürfelt: ${lu.hpRoll}` : 'TP: Durchschnitt'
    const asi = lu?.asi ? Object.entries(lu.asi).map(([k, v]) => `${abilityName(k)} +${v}`).join(', ') : null
    rows.push({ lvl, text: [hp, asi].filter(Boolean).join(' · '), canUndo: Boolean(lu) && lvl === derived.level })
  }
  return (
    <section className="card">
      <h2 className="title mb-3 text-xl">Stufenverlauf</h2>
      <ul className="space-y-1.5 text-sm">
        <li className="text-stone-400"><span className="font-semibold text-stone-200">Stufe 1:</span> Erschaffung</li>
        {rows.map((row) => (
          <li key={row.lvl} className="flex flex-wrap items-center gap-x-3 text-stone-400">
            <span><span className="font-semibold text-stone-200">Stufe {row.lvl}:</span> {row.text}</span>
            {canEdit && row.canUndo && (
              <button onClick={onUndo} className="text-xs text-stone-500 underline hover:text-red-300">
                rückgängig
              </button>
            )}
          </li>
        ))}
      </ul>
      {character.level > 1 && !levelUps.length && (
        <p className="mt-2 text-xs text-stone-500">Frühere Stufen wurden ohne Assistent eingetragen (Durchschnitts-TP).</p>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------
// Kleine Anzeige-Bausteine
// ---------------------------------------------------------------------
function BigStat({ icon, label, value, hint, info, highlight = false, className = '' }) {
  return (
    <div className={`flex flex-col items-center rounded-2xl border p-4 text-center shadow-lg shadow-black/40 ${highlight ? 'border-amber-700/60 bg-gradient-to-b from-amber-950/40 to-stone-900/80' : 'border-stone-800 bg-stone-900/70'} ${className}`}>
      {icon && <span className="text-lg leading-none opacity-80" aria-hidden>{icon}</span>}
      <p className="mt-1 font-display text-3xl font-bold text-stone-100">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wider text-stone-400">{label}
        {info && <InfoTip id={info} />}
      </p>
      {hint && <p className="text-xs text-stone-500">{hint}</p>}
    </div>
  )
}

function BonusRow({ label, sub, bonus, proficient }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${proficient ? 'bg-amber-400' : 'border border-stone-600'}`} />
      <span className={`w-9 shrink-0 text-right font-semibold ${proficient ? 'text-amber-200' : 'text-stone-300'}`}>{formatMod(bonus)}</span>
      <span className={proficient ? 'text-stone-100' : 'text-stone-400'}>{label}</span>
      {sub && <span className="text-xs text-stone-600">{sub}</span>}
    </li>
  )
}

function InfoBlock({ title, children }) {
  return (
    <div>
      <h3 className="mb-1 font-display font-bold text-amber-200">{title}</h3>
      {children}
    </div>
  )
}

function TraitBlock({ title, items }) {
  return (
    <InfoBlock title={title}>
      <ul className="space-y-1 text-sm">
        {items.map(([name, text]) => (
          <li key={name}><span className="font-semibold text-stone-200">{name}:</span> <span className="text-stone-400">{text}</span></li>
        ))}
      </ul>
    </InfoBlock>
  )
}

