import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { supabase } from '../lib/supabase'
import { translateError } from '../lib/errors'
import { ABILITIES, byKey, CLASSES, RACES } from '../data/srd'
import { featuresAtLevel, formatXp, getsSpellsAt, isAsiLevel, xpForLevel } from '../data/levels'
import { useAuth } from '../lib/auth'
import { abilityMod, averageHitDie, deriveCharacter, formatMod, proficiencyBonus } from '../lib/character'
import Avatar from '../components/Avatar'
import PageSkeleton from '../components/Skeleton'

export default function LevelUpPage() {
  const { gameId, characterId } = useParams()
  return <LevelUp key={characterId} gameId={gameId} characterId={characterId} />
}

function LevelUp({ gameId, characterId }) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [character, setCharacter] = useState(null)
  const [hpMethod, setHpMethod] = useState('average') // 'average' oder 'roll'
  const [hpRoll, setHpRoll] = useState('')
  const [asiMode, setAsiMode] = useState('two') // 'one' = +2 auf eins, 'two' = +1 auf zwei
  const [asiPicks, setAsiPicks] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        // Ohne Zugriff (weder Besitzer noch Spielleiter) zurück zum Bogen
        if (!data) navigate(gameId ? `/runde/${gameId}/charakter/${characterId}` : '/', { replace: true })
        else setCharacter(data)
      })
    return () => {
      cancelled = true
    }
  }, [characterId, gameId, navigate])

  if (!character) return <PageSkeleton text="Lade …" />

  const current = deriveCharacter(character)
  const cls = byKey(CLASSES, character.class)
  const race = byKey(RACES, character.race)
  const newLevel = character.level + 1
  const sheetLink = gameId ? `/runde/${gameId}/charakter/${characterId}` : `/helden/${characterId}`

  // Spieler: erst mit genug EP (der Spielleiter darf immer – die Datenbank prüft es ebenfalls)
  const needed = xpForLevel(newLevel)
  if (character.level < 20 && character.xp != null && character.user_id === profile.id && character.xp < needed) {
    return (
      <div className="card space-y-4 text-center">
        <p className="text-5xl">🔒</p>
        <h1 className="title text-3xl">Noch nicht genug Erfahrung</h1>
        <p className="text-stone-400">
          Für Stufe {newLevel} braucht {character.name} {formatXp(needed)} EP – aktuell sind es {formatXp(character.xp)} EP.
          Dein Spielleiter vergibt die Erfahrungspunkte.
        </p>
        <Link to={sheetLink} className="btn-ghost">← Zurück zum Bogen</Link>
      </div>
    )
  }

  if (character.level >= 20) {
    return (
      <div className="card space-y-4 text-center">
        <p className="text-5xl">👑</p>
        <h1 className="title text-3xl">Höchste Stufe erreicht!</h1>
        <p className="text-stone-400">{character.name} ist bereits auf Stufe 20 – mehr geht nicht.</p>
        <Link to={sheetLink} className="btn-ghost">← Zurück zum Bogen</Link>
      </div>
    )
  }

  const hasAsi = isAsiLevel(character.class, newLevel)
  const rollValue = Number(hpRoll)
  const rollValid = Number.isInteger(rollValue) && rollValue >= 1 && rollValue <= cls.hitDie
  const hpValid = hpMethod === 'average' || rollValid

  // Attributserhöhung als Objekt, z. B. { dex: 2 } oder { dex: 1, con: 1 }
  const asi = !hasAsi
    ? null
    : asiMode === 'one'
      ? asiPicks[0] ? { [asiPicks[0]]: 2 } : null
      : asiPicks.length === 2 ? { [asiPicks[0]]: 1, [asiPicks[1]]: 1 } : null
  const asiValid = !hasAsi || Boolean(asi)

  const entry = {
    level: newLevel,
    hpRoll: hpMethod === 'roll' && rollValid ? rollValue : null,
    ...(asi ? { asi } : {}),
  }
  const newData = {
    ...character.data,
    levelUps: [...(character.data?.levelUps ?? []).filter((lu) => lu.level < newLevel), entry],
  }
  const next = deriveCharacter({ ...character, level: newLevel, data: newData })
  const hpGain = next.hpMax - current.hpMax
  const newFeatures = featuresAtLevel(character.class, newLevel)

  function toggleAsi(key) {
    if (asiMode === 'one') return setAsiPicks([key])
    setAsiPicks((picks) => (picks.includes(key) ? picks.filter((k) => k !== key) : picks.length < 2 ? [...picks, key] : picks))
  }

  async function levelUp() {
    setSaving(true)
    setError('')
    const hpCurrent = Math.min(next.hpMax, Math.max(0, character.hp_current + hpGain))
    // Datum des Aufstiegs für den Stufenverlauf merken
    const savedData = {
      ...newData,
      levelUps: newData.levelUps.map((lu) => (lu.level === newLevel ? { ...lu, date: new Date().toISOString() } : lu)),
    }
    const { error } = await supabase
      .from('characters')
      .update({ level: newLevel, data: savedData, hp_current: hpCurrent, hp_max: next.hpMax })
      .eq('id', characterId)
    if (error) {
      setError(translateError(error.message))
      setSaving(false)
      return
    }
    navigate(sheetLink, { replace: true, state: { notice: `🎉 ${character.name} ist jetzt Stufe ${newLevel}!` } })
  }

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border-2 border-amber-600/50 bg-gradient-to-br from-amber-900/40 via-stone-900/80 to-violet-950/40 p-5 shadow-2xl shadow-amber-950/40 sm:p-6">
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgb(245_158_11/0.25),transparent_60%)]" aria-hidden />
        <div className="relative flex flex-wrap items-center gap-4">
          <Avatar name={character.name} src={character.avatar_url} cls={character.class} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-400">✨ Stufenaufstieg</p>
            <h1 className="title truncate text-2xl sm:text-3xl">{character.name}</h1>
            <p className="font-display text-lg text-stone-200">
              Stufe {character.level} <span className="text-amber-300">→ {newLevel}</span>
            </p>
          </div>
          <Link to={sheetLink} className="btn-ghost">Abbrechen</Link>
        </div>
      </header>

      {/* 1. Trefferpunkte */}
      <section className="card space-y-4">
        <div>
          <h2 className="title text-xl">1. Trefferpunkte</h2>
          <p className="text-sm text-stone-400">
            Würfle am Tisch deinen Trefferwürfel <b className="text-stone-200">W{cls.hitDie}</b> – oder nimm einfach den Durchschnitt.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setHpMethod('average')}
            className={`rounded-xl border p-4 text-left transition ${hpMethod === 'average' ? 'border-amber-500 bg-amber-500/10' : 'border-stone-700 hover:border-stone-500'}`}
          >
            <p className={`font-semibold ${hpMethod === 'average' ? 'text-amber-200' : 'text-stone-200'}`}>Durchschnitt nehmen</p>
            <p className="text-sm text-stone-400">Sicher: immer {averageHitDie(cls.hitDie)}</p>
          </button>
          <div
            onClick={() => setHpMethod('roll')}
            className={`cursor-pointer rounded-xl border p-4 transition ${hpMethod === 'roll' ? 'border-amber-500 bg-amber-500/10' : 'border-stone-700 hover:border-stone-500'}`}
          >
            <p className={`font-semibold ${hpMethod === 'roll' ? 'text-amber-200' : 'text-stone-200'}`}>🎲 Gewürfelt</p>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={cls.hitDie}
                className="input w-24 py-2"
                placeholder={`1–${cls.hitDie}`}
                value={hpRoll}
                onFocus={() => setHpMethod('roll')}
                onChange={(e) => setHpRoll(e.target.value)}
              />
              <span className="text-sm text-stone-400">Augenzahl</span>
            </div>
            {hpMethod === 'roll' && hpRoll !== '' && !rollValid && (
              <p className="mt-1 text-xs text-red-300">Bitte eine Zahl von 1 bis {cls.hitDie}.</p>
            )}
          </div>
        </div>
        {hpValid && (
          <p className="text-sm text-stone-300">
            Ergebnis: <b className="text-emerald-300">+{hpGain} TP</b> (inkl. KON-Modifikator {formatMod(abilityMod(next.abilities.con))}
            {race?.hpPerLevel ? ' und Zwergenzähigkeit' : ''}) → neues Maximum <b>{next.hpMax}</b>
          </p>
        )}
      </section>

      {/* 2. Attributserhöhung */}
      {hasAsi && (
        <section className="card space-y-4">
          <div>
            <h2 className="title text-xl">2. Attributserhöhung</h2>
            <p className="text-sm text-stone-400">Auf Stufe {newLevel} darfst du deine Attribute verbessern (Maximum 20).</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              ['two', '+1 auf zwei Attribute'],
              ['one', '+2 auf ein Attribut'],
            ].map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setAsiMode(mode)
                  setAsiPicks([])
                }}
                className={`rounded-lg border px-4 py-2 text-left transition ${asiMode === mode ? 'border-amber-500 bg-amber-500/10 text-amber-200' : 'border-stone-700 text-stone-300 hover:border-stone-500'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ABILITIES.map((a) => {
              const score = current.abilities[a.key]
              const picked = asiPicks.includes(a.key)
              const plus = picked ? (asiMode === 'one' ? 2 : 1) : 0
              const disabled = !picked && score + (asiMode === 'one' ? 2 : 1) > 20
              return (
                <button
                  key={a.key}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleAsi(a.key)}
                  className={`rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${picked ? 'border-amber-500 bg-amber-500/10' : 'border-stone-700 hover:border-stone-500'}`}
                >
                  <p className={`text-sm font-semibold ${picked ? 'text-amber-200' : 'text-stone-200'}`}>{a.name}</p>
                  <p className="text-lg text-stone-100">
                    {score}
                    {plus > 0 && <span className="text-amber-300"> → {score + plus}</span>}
                    <span className="ml-2 text-xs text-stone-500">Mod {formatMod(abilityMod(score + plus))}</span>
                  </p>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* 3. Neue Fähigkeiten */}
      <section className="card space-y-3">
        <h2 className="title text-xl">{hasAsi ? '3.' : '2.'} Neu auf Stufe {newLevel}</h2>
        <ul className="space-y-2 text-sm">
          {proficiencyBonus(newLevel) > current.prof && (
            <li><span className="font-semibold text-amber-200">Übungsbonus steigt auf {formatMod(proficiencyBonus(newLevel))}:</span> <span className="text-stone-400">Alle geübten Fertigkeiten, Rettungswürfe und Zauberwerte werden besser.</span></li>
          )}
          {newFeatures.map(([name, text]) => (
            <li key={name}><span className="font-semibold text-amber-200">{name}:</span> <span className="text-stone-400">{text}</span></li>
          ))}
          {character.class === 'rogue' && newLevel % 2 === 1 && (
            <li><span className="font-semibold text-amber-200">Hinterhältiger Angriff {next.sneakAttack}:</span> <span className="text-stone-400">Ein Schadenswürfel mehr.</span></li>
          )}
          {next.breathWeapon && next.breathWeapon.dice !== current.breathWeapon?.dice && (
            <li><span className="font-semibold text-amber-200">Odemwaffe {next.breathWeapon.dice}:</span> <span className="text-stone-400">Mehr Schaden.</span></li>
          )}
          {getsSpellsAt(character.class, newLevel) && (
            <li><span className="font-semibold text-amber-200">Zauber:</span> <span className="text-stone-400">Je nach Klassentabelle neue Zauber und Zauberplätze – frag deinen Spielleiter.</span></li>
          )}
          {!newFeatures.length && proficiencyBonus(newLevel) === current.prof && !hasAsi && !getsSpellsAt(character.class, newLevel) && (
            <li className="text-stone-400">Auf dieser Stufe gibt es vor allem mehr Trefferpunkte.</li>
          )}
          {hasAsi && <li><span className="font-semibold text-amber-200">Attributserhöhung:</span> <span className="text-stone-400">siehe oben.</span></li>}
        </ul>
      </section>

      {error && <p className="alert-error">{error}</p>}

      <button type="button" onClick={levelUp} disabled={!hpValid || !asiValid || saving} className="btn-primary w-full py-3 text-lg">
        {saving ? 'Steige auf …' : `⬆️ Auf Stufe ${newLevel} aufsteigen`}
      </button>
      {(!hpValid || !asiValid) && (
        <p className="text-center text-sm text-stone-500">
          {!hpValid ? 'Bitte trage dein Würfelergebnis ein. ' : ''}
          {!asiValid ? 'Bitte wähle deine Attributserhöhung.' : ''}
        </p>
      )}
    </div>
  )
}
