import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { translateError } from '../lib/errors'
import { removeAvatar } from '../lib/avatars'
import { abilityShort } from '../data/srd'
import { deriveCharacter, formatMeters, formatMod } from '../lib/character'
import Avatar from '../components/Avatar'
import PartyCardDetails from '../components/party/PartyCardDetails'
import { ConditionPicker } from '../components/party/Conditions'

export default function CharacterSheetPage() {
  const { gameId, characterId } = useParams()
  return <Sheet key={characterId} gameId={gameId} characterId={characterId} />
}

function Sheet({ gameId, characterId }) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [character, setCharacter] = useState(null)
  const [partyCard, setPartyCard] = useState(null) // eingeschränkte Ansicht für Mitspieler
  const [isGM, setIsGM] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const [{ data: char }, { data: membership }] = await Promise.all([
      supabase.from('characters').select('*, profiles(username)').eq('id', characterId).maybeSingle(),
      supabase.from('game_members').select('role').eq('game_id', gameId).eq('user_id', profile.id).maybeSingle(),
    ])
    if (!membership) {
      navigate(`/runde/${gameId}`, { replace: true })
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
  const computedMax = character ? deriveCharacter(character).hpMax : null
  useEffect(() => {
    if (canEditLoaded && computedMax && character.hp_max !== computedMax) {
      supabase.from('characters').update({ hp_max: computedMax }).eq('id', characterId).then(() => {})
    }
  }, [canEditLoaded, computedMax, character?.hp_max, characterId])

  if (partyCard) {
    return (
      <div className="space-y-6">
        <Link to={`/runde/${gameId}`} className="btn-ghost">← Zur Lobby</Link>
        <section className="card">
          <PartyCardDetails card={partyCard} playerName={partyCard.profiles?.username} canEditConditions={false} />
          <p className="mt-5 text-xs text-stone-500">
            🔒 Den vollen Charakterbogen sehen nur {partyCard.name}s Spieler und der Spielleiter.
          </p>
        </section>
      </div>
    )
  }

  if (!character) return <p className="title animate-pulse text-center text-xl">Lade Charakterbogen …</p>

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

  async function deleteCharacter() {
    if (!confirm(`„${character.name}“ wirklich endgültig löschen?`)) return
    const { error } = await supabase.from('characters').delete().eq('id', characterId)
    if (error) return setError(translateError(error.message))
    if (character.avatar_url) removeAvatar(character.avatar_url)
    navigate(`/runde/${gameId}`, { replace: true })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to={`/runde/${gameId}`} className="btn-ghost">← Zur Lobby</Link>
        {canEdit && <Link to={`/runde/${gameId}/charakter/${characterId}/bearbeiten`} className="btn-ghost">✏️ Bearbeiten</Link>}
      </div>

      {/* Kopf */}
      <section className="card flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
        <Avatar name={character.name} src={character.avatar_url} size="xl" />
        <div className="min-w-0 flex-1">
          <h1 className="title break-words text-3xl sm:text-4xl">{character.name}</h1>
          <p className="mt-1 text-lg text-stone-200">
            Stufe {c.level} · {c.race?.name} · {c.cls?.name}
          </p>
          <p className="mt-1 text-sm text-stone-400">
            {[backgroundName, data.alignment, `gespielt von ${character.profiles?.username ?? '?'}`].filter(Boolean).join(' · ')}
          </p>
        </div>
      </section>

      {error && <p className="alert-error">{error}</p>}

      {/* Kampfwerte */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <BigStat label="Rüstungsklasse" value={c.ac} hint={c.armor.key === 'none' ? 'ohne Rüstung' : c.armor.name.replace(/ \(.*\)/, '')} />
        <BigStat label="Initiative" value={formatMod(c.initiative)} />
        <BigStat label="Bewegung" value={formatMeters(c.speed)} />
        <BigStat label="Übungsbonus" value={formatMod(c.prof)} />
        <BigStat label="Passive Wahrnehmung" value={c.passivePerception} className="col-span-2 sm:col-span-1" />
      </section>

      <HitPoints character={character} hpMax={c.hpMax} canEdit={canEdit} onSave={saveFields} />

      <section className="card">
        <h2 className="title mb-1 text-xl">Zustände</h2>
        <p className="mb-3 text-xs text-stone-500">Tippe an, was gerade auf {character.name} wirkt – die Gruppe sieht es sofort.</p>
        <ConditionPicker conditions={character.conditions ?? []} onChange={(conditions) => saveFields({ conditions })} />
      </section>

      {/* Attribute */}
      <section className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {Object.entries(c.abilities).map(([key, score]) => (
          <div key={key} className="card flex flex-col items-center p-3 text-center">
            <p className="text-xs font-semibold tracking-widest text-stone-400">{abilityShort(key)}</p>
            <p className="mt-1 text-3xl font-bold text-amber-200">{formatMod(c.mods[key])}</p>
            <p className="mt-1 rounded-full bg-stone-800 px-3 text-sm text-stone-300">{score}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Rettungswürfe & Fertigkeiten */}
        <section className="card space-y-5">
          <div>
            <h2 className="title mb-3 text-xl">Rettungswürfe</h2>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
              {c.saves.map((s) => <BonusRow key={s.key} label={s.name} bonus={s.bonus} proficient={s.proficient} />)}
            </ul>
          </div>
          <div>
            <h2 className="title mb-3 text-xl">Fertigkeiten</h2>
            <ul className="space-y-1">
              {c.skills.map((s) => (
                <BonusRow key={s.key} label={s.name} sub={abilityShort(s.ability)} bonus={s.bonus} proficient={s.proficient} />
              ))}
            </ul>
            <p className="mt-3 text-xs text-stone-500">● = geübt (Übungsbonus {formatMod(c.prof)} ist eingerechnet)</p>
          </div>
        </section>

        {/* Eigenschaften */}
        <section className="card space-y-5">
          {c.spellcasting && (
            <InfoBlock title="Zauberwirken">
              <p className="text-sm text-stone-300">
                Attribut: <b>{abilityShort(c.spellcasting.ability)}</b> · Rettungswurf-SG <b>{c.spellcasting.dc}</b> · Zauberangriff{' '}
                <b>{formatMod(c.spellcasting.attack)}</b>
              </p>
              <p className="mt-1 text-xs text-stone-500">Zauberlisten folgen in einem späteren Schritt.</p>
            </InfoBlock>
          )}
          {c.breathWeapon && (
            <InfoBlock title={`Odemwaffe (${c.breathWeapon.name})`}>
              <p className="text-sm text-stone-300">
                {c.breathWeapon.dice} {c.breathWeapon.damage}schaden · {c.breathWeapon.area} · {abilityShort(c.breathWeapon.save)}-Rettungswurf SG{' '}
                {c.breathWeapon.dc} (halber Schaden bei Erfolg)
              </p>
            </InfoBlock>
          )}
          <TraitBlock title={`Klasse: ${c.cls?.name}`} items={c.cls?.features ?? []} />
          <TraitBlock title={`Volk: ${c.race?.name}`} items={c.race?.traits ?? []} />
          {c.background?.feature && <TraitBlock title={`Hintergrund: ${c.background.name}`} items={[c.background.feature]} />}
        </section>
      </div>

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

      {canEdit && (
        <div className="flex justify-end">
          <button onClick={deleteCharacter} className="btn-danger">Charakter löschen</button>
        </div>
      )}
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
  const barColor = percent > 50 ? 'bg-emerald-500' : percent > 25 ? 'bg-amber-500' : 'bg-red-600'
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
        <h2 className="title text-xl">Trefferpunkte</h2>
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
          <button className="btn-ghost sm:ml-auto" onClick={() => onSave({ hp_current: hpMax, hp_temp: 0 })}>
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
// Kleine Anzeige-Bausteine
// ---------------------------------------------------------------------
function BigStat({ label, value, hint, className = '' }) {
  return (
    <div className={`card flex flex-col items-center p-4 text-center ${className}`}>
      <p className="text-3xl font-bold text-stone-100">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wider text-stone-400">{label}</p>
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

