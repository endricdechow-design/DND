import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { translateError } from '../lib/errors'
import { uploadAvatar, removeAvatar } from '../lib/avatars'
import { abilitiesValid, defaultAbilities, deriveCharacter, formatMeters, formatMod } from '../lib/character'
import {
  ABILITIES, ALIGNMENTS, ARMORS, BACKGROUNDS, CLASSES, DRAGON_ANCESTRIES, RACES, SKILLS,
  abilityShort, byKey, skillName,
} from '../data/srd'
import { ChipPicker, ChoiceGrid, StepSection } from '../components/character/ChoiceGrid'
import AbilityStep from '../components/character/AbilityStep'
import Avatar from '../components/Avatar'

const STEPS = ['Volk', 'Klasse', 'Attribute', 'Fertigkeiten', 'Details']
const ALL_SKILL_KEYS = SKILLS.map((s) => s.key)

function emptyDraft() {
  return {
    name: '',
    level: 1,
    race: '',
    raceChoices: { abilities: [], skills: [], ancestry: '' },
    class: '',
    classSkills: [],
    abilityMethod: 'standard',
    baseAbilities: defaultAbilities('standard'),
    background: 'acolyte',
    backgroundName: '',
    backgroundSkills: [],
    alignment: '',
    armor: 'none',
    shield: false,
    notes: '',
    avatarUrl: null,
  }
}

// Gespeicherten Charakter → Formular-Daten
function draftFromCharacter(c) {
  const d = c.data ?? {}
  return {
    ...emptyDraft(),
    ...d,
    raceChoices: { abilities: [], skills: [], ancestry: '', ...(d.raceChoices ?? {}) },
    name: c.name,
    level: c.level,
    race: c.race,
    class: c.class,
    avatarUrl: c.avatar_url,
  }
}

// Fertigkeiten, die fest vorgegeben sind (Volk + Hintergrund)
function lockedSkills(draft) {
  return [...(byKey(RACES, draft.race)?.skills ?? []), ...(byKey(BACKGROUNDS, draft.background)?.skills ?? [])]
}

export default function CharacterWizardPage() {
  const { gameId, characterId } = useParams()
  return <Wizard key={characterId ?? 'neu'} gameId={gameId} characterId={characterId} />
}

function Wizard({ gameId, characterId }) {
  const isEdit = Boolean(characterId)
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [draft, setDraft] = useState(emptyDraft)
  const [original, setOriginal] = useState(null)
  const [step, setStep] = useState(0)
  const [ready, setReady] = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Vorhandene Daten laden und Berechtigung prüfen
  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: membership } = await supabase
        .from('game_members')
        .select('role')
        .eq('game_id', gameId)
        .eq('user_id', profile.id)
        .maybeSingle()
      if (cancelled) return
      if (!membership) return navigate('/', { replace: true })

      if (isEdit) {
        const { data: character } = await supabase.from('characters').select('*').eq('id', characterId).maybeSingle()
        if (cancelled) return
        const allowed = character && (character.user_id === profile.id || membership.role === 'gm')
        if (!allowed) return navigate(`/runde/${gameId}`, { replace: true })
        setOriginal(character)
        setDraft(draftFromCharacter(character))
      } else {
        if (membership.role === 'gm') return navigate(`/runde/${gameId}`, { replace: true })
        const { data: existing } = await supabase
          .from('characters')
          .select('id')
          .eq('game_id', gameId)
          .eq('user_id', profile.id)
          .maybeSingle()
        if (cancelled) return
        if (existing) return navigate(`/runde/${gameId}/charakter/${existing.id}`, { replace: true })
      }
      setReady(true)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [gameId, characterId, isEdit, profile.id, navigate])

  // Vorschau-Adresse für ein neu gewähltes Bild wieder freigeben
  useEffect(() => () => avatarPreview && URL.revokeObjectURL(avatarPreview), [avatarPreview])

  const update = (patch) => setDraft((d) => ({ ...d, ...patch }))

  // Doppelte Fertigkeiten entfernen, wenn sich Volk oder Hintergrund ändert
  const cleanSkills = (next) => {
    const locked = lockedSkills(next)
    const classSkills = next.classSkills.filter((s) => !locked.includes(s))
    const backgroundSkills = next.backgroundSkills.filter((s) => !locked.includes(s) && !classSkills.includes(s))
    const raceSkills = next.raceChoices.skills.filter(
      (s) => !locked.includes(s) && !classSkills.includes(s) && !backgroundSkills.includes(s)
    )
    return { ...next, classSkills, backgroundSkills, raceChoices: { ...next.raceChoices, skills: raceSkills } }
  }

  const race = byKey(RACES, draft.race)
  const cls = byKey(CLASSES, draft.class)
  const background = byKey(BACKGROUNDS, draft.background)
  const locked = lockedSkills(draft)

  // Ist der aktuelle Schritt vollständig?
  const stepValid = [
    Boolean(race) &&
      (!race.chooseAbilities || draft.raceChoices.abilities.length === race.chooseAbilities.count) &&
      (!race.chooseAncestry || Boolean(draft.raceChoices.ancestry)),
    Boolean(cls),
    abilitiesValid(draft.abilityMethod, draft.baseAbilities),
    Boolean(cls) &&
      draft.classSkills.length === cls.skillChoices.count &&
      (!race?.chooseSkills || draft.raceChoices.skills.length === race.chooseSkills) &&
      (!background?.chooseSkills || (draft.backgroundSkills.length === background.chooseSkills && draft.backgroundName.trim() !== '')),
    draft.name.trim().length > 0 && draft.level >= 1 && draft.level <= 20,
  ]
  const allValid = stepValid.every(Boolean)

  async function save() {
    setError('')
    setSaving(true)
    try {
      const id = original?.id ?? crypto.randomUUID()
      let avatarUrl = draft.avatarUrl
      if (avatarFile) {
        avatarUrl = await uploadAvatar({ userId: profile.id, characterId: id, file: avatarFile })
      }

      const data = {
        // Bestehende Angaben (z. B. Stufenaufstiege, private Notizen) behalten
        ...(original?.data ?? {}),
        raceChoices: draft.raceChoices,
        classSkills: draft.classSkills,
        abilityMethod: draft.abilityMethod,
        baseAbilities: draft.baseAbilities,
        background: draft.background,
        backgroundName: draft.background === 'custom' ? draft.backgroundName.trim() : '',
        backgroundSkills: draft.background === 'custom' ? draft.backgroundSkills : [],
        alignment: draft.alignment,
        armor: draft.armor,
        shield: draft.shield,
        notes: draft.notes,
      }
      const row = { name: draft.name.trim(), level: draft.level, race: draft.race, class: draft.class, avatar_url: avatarUrl, data }
      const newMax = deriveCharacter(row).hpMax

      if (original) {
        // Steigt das Maximum (z. B. Stufenaufstieg), steigen die aktuellen TP mit
        const oldMax = deriveCharacter(original).hpMax
        const hpCurrent = Math.min(newMax, Math.max(0, original.hp_current + Math.max(0, newMax - oldMax)))
        const { error } = await supabase.from('characters').update({ ...row, hp_current: hpCurrent, hp_max: newMax }).eq('id', id)
        if (error) throw error
        // Altes Bild aufräumen, wenn es ersetzt oder entfernt wurde
        if (original.avatar_url && original.avatar_url !== avatarUrl) removeAvatar(original.avatar_url)
      } else {
        const { error } = await supabase
          .from('characters')
          .insert({ id, game_id: gameId, user_id: profile.id, ...row, hp_current: newMax, hp_max: newMax })
        if (error) throw error
      }
      navigate(`/runde/${gameId}/charakter/${id}`, { replace: true })
    } catch (err) {
      setError(translateError(err.message))
      setSaving(false)
    }
  }

  if (!ready) return <p className="title animate-pulse text-center text-xl">Lade …</p>

  const preview = deriveCharacter({
    name: draft.name, level: draft.level, race: draft.race, class: draft.class,
    data: { ...draft, levelUps: original?.data?.levelUps ?? [] },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="title text-3xl">{isEdit ? 'Charakter bearbeiten' : 'Neuer Charakter'}</h1>
        <Link to={isEdit ? `/runde/${gameId}/charakter/${characterId}` : `/runde/${gameId}`} className="btn-ghost">
          Abbrechen
        </Link>
      </div>

      {/* Fortschritt */}
      <ol className="grid grid-cols-5 gap-1 sm:gap-2">
        {STEPS.map((label, index) => {
          const reachable = index <= step || stepValid.slice(0, index).every(Boolean)
          return (
            <li key={label}>
              <button
                type="button"
                disabled={!reachable}
                onClick={() => setStep(index)}
                className="w-full text-left disabled:cursor-not-allowed"
              >
                <div className={`h-1.5 rounded-full ${index <= step ? 'bg-amber-500' : 'bg-stone-800'}`} />
                <p className={`mt-1 truncate text-xs sm:text-sm ${index === step ? 'font-semibold text-amber-200' : 'text-stone-500'}`}>
                  <span className="hidden sm:inline">{index + 1}. </span>{label}
                </p>
              </button>
            </li>
          )
        })}
      </ol>

      <div className="card space-y-6">
        {step === 0 && (
          <>
            <StepSection title="Wähle dein Volk" hint="Dein Volk gibt dir Attributsboni und besondere Eigenschaften.">
              <ChoiceGrid
                options={RACES}
                value={draft.race}
                onChange={(key) =>
                  setDraft((d) => cleanSkills({ ...d, race: key, raceChoices: { abilities: [], skills: [], ancestry: '' } }))
                }
                renderDetails={(r) =>
                  `${Object.entries(r.bonuses).map(([k, v]) => `${abilityShort(k)} +${v}`).join(', ')}${
                    r.chooseAbilities ? ` + ${r.chooseAbilities.count}× frei +1` : ''
                  } · ${formatMeters(r.speed)}`
                }
              />
            </StepSection>

            {race?.chooseAbilities && (
              <StepSection title="Halbelf: zwei Attribute +1" hint="Wähle zwei Attribute (nicht Charisma), die um 1 steigen.">
                <ChipPicker
                  options={ABILITIES.map((a) => a.key).filter((k) => !race.chooseAbilities.exclude.includes(k))}
                  selected={draft.raceChoices.abilities}
                  max={race.chooseAbilities.count}
                  onChange={(abilities) => update({ raceChoices: { ...draft.raceChoices, abilities } })}
                  labelFor={(k) => byKey(ABILITIES, k).name}
                />
              </StepSection>
            )}

            {race?.chooseAncestry && (
              <StepSection title="Deine Drachenabstammung" hint="Bestimmt die Schadensart deiner Odemwaffe und deine Resistenz.">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  {DRAGON_ANCESTRIES.map((a) => (
                    <button
                      key={a.key}
                      type="button"
                      onClick={() => update({ raceChoices: { ...draft.raceChoices, ancestry: a.key } })}
                      className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                        draft.raceChoices.ancestry === a.key ? 'border-amber-500 bg-amber-500/10 text-amber-200' : 'border-stone-700 text-stone-300 hover:border-stone-500'
                      }`}
                    >
                      <b>{a.name}</b>
                      <span className="block text-xs text-stone-400">{a.damage} · {a.area}</span>
                    </button>
                  ))}
                </div>
              </StepSection>
            )}

            {race && <TraitList title={`Eigenschaften: ${race.name}`} items={race.traits} />}
          </>
        )}

        {step === 1 && (
          <>
            <StepSection title="Wähle deine Klasse" hint="Deine Klasse bestimmt, wie du kämpfst, zauberst und der Gruppe hilfst.">
              <ChoiceGrid
                options={CLASSES}
                value={draft.class}
                onChange={(key) => update({ class: key, classSkills: [] })}
                renderDetails={(c) => `Trefferwürfel W${c.hitDie} · Wichtig: ${c.primary.map(abilityShort).join('/')}`}
              />
            </StepSection>
            {cls && <TraitList title={`Fähigkeiten auf Stufe 1: ${cls.name}`} items={cls.features} />}
          </>
        )}

        {step === 2 && <AbilityStep draft={draft} update={update} />}

        {step === 3 && cls && (
          <>
            <StepSection title="Hintergrund" hint="Was hat dein Charakter vor dem Abenteuer gemacht?">
              <div className="grid gap-3 sm:grid-cols-2">
                {BACKGROUNDS.map((b) => (
                  <button
                    key={b.key}
                    type="button"
                    onClick={() => setDraft((d) => cleanSkills({ ...d, background: b.key, backgroundSkills: [] }))}
                    className={`rounded-xl border p-4 text-left transition ${
                      draft.background === b.key ? 'border-amber-500 bg-amber-500/10' : 'border-stone-700 hover:border-stone-500'
                    }`}
                  >
                    <p className={`font-display font-bold ${draft.background === b.key ? 'text-amber-200' : 'text-stone-100'}`}>{b.name}</p>
                    <p className="text-sm text-stone-400">{b.blurb}</p>
                    {b.skills && <p className="mt-1 text-xs text-stone-500">Fertigkeiten: {b.skills.map(skillName).join(', ')}</p>}
                  </button>
                ))}
              </div>
              {background?.chooseSkills && (
                <div className="space-y-3">
                  <div>
                    <label className="label" htmlFor="bgName">Name deines Hintergrunds</label>
                    <input
                      id="bgName"
                      className="input"
                      value={draft.backgroundName}
                      onChange={(e) => update({ backgroundName: e.target.value })}
                      placeholder="z. B. Schmied, Seefahrer, Straßenkind …"
                      maxLength={40}
                    />
                  </div>
                  <p className="text-sm text-stone-400">Wähle {background.chooseSkills} passende Fertigkeiten:</p>
                  <ChipPicker
                    options={ALL_SKILL_KEYS}
                    selected={draft.backgroundSkills}
                    max={background.chooseSkills}
                    disabled={[...locked, ...draft.classSkills, ...draft.raceChoices.skills]}
                    onChange={(backgroundSkills) => update({ backgroundSkills })}
                    labelFor={skillName}
                  />
                </div>
              )}
            </StepSection>

            <StepSection
              title={`Fertigkeiten der Klasse (${draft.classSkills.length}/${cls.skillChoices.count})`}
              hint={`Als ${cls.name} wählst du ${cls.skillChoices.count} Fertigkeiten, in denen du geübt bist.`}
            >
              <ChipPicker
                options={cls.skillChoices.from}
                selected={draft.classSkills}
                max={cls.skillChoices.count}
                disabled={[...locked, ...draft.backgroundSkills, ...draft.raceChoices.skills]}
                onChange={(classSkills) => update({ classSkills })}
                labelFor={skillName}
              />
            </StepSection>

            {race?.chooseSkills && (
              <StepSection
                title={`Halbelf: freie Fertigkeiten (${draft.raceChoices.skills.length}/${race.chooseSkills})`}
                hint="Dank deiner Vielseitigkeit wählst du zwei beliebige Fertigkeiten."
              >
                <ChipPicker
                  options={ALL_SKILL_KEYS}
                  selected={draft.raceChoices.skills}
                  max={race.chooseSkills}
                  disabled={[...locked, ...draft.classSkills, ...draft.backgroundSkills]}
                  onChange={(skills) => update({ raceChoices: { ...draft.raceChoices, skills } })}
                  labelFor={skillName}
                />
              </StepSection>
            )}

            {locked.length > 0 && (
              <p className="text-sm text-stone-400">
                Automatisch geübt (durch Volk/Hintergrund): <span className="text-stone-200">{locked.map(skillName).join(', ')}</span>
              </p>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <div className="grid gap-6 md:grid-cols-[auto_1fr]">
              <div className="flex flex-col items-center gap-3">
                <Avatar name={draft.name || '?'} src={avatarPreview ?? draft.avatarUrl} size="xl" />
                <label className="btn-ghost cursor-pointer">
                  📷 {avatarPreview || draft.avatarUrl ? 'Bild ändern' : 'Bild hochladen'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setAvatarFile(file)
                      setAvatarPreview(URL.createObjectURL(file))
                      e.target.value = '' // gleiche Datei kann erneut gewählt werden
                    }}
                  />
                </label>
                {(avatarPreview || draft.avatarUrl) && (
                  <button
                    type="button"
                    className="text-sm text-stone-500 hover:text-red-300"
                    onClick={() => {
                      setAvatarFile(null)
                      setAvatarPreview(null)
                      update({ avatarUrl: null })
                    }}
                  >
                    🗑️ Bild entfernen
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label" htmlFor="charName">Name deines Charakters</label>
                  <input id="charName" className="input" value={draft.name} maxLength={60}
                    onChange={(e) => update({ name: e.target.value })} placeholder="z. B. Lyra Mondschatten" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="level">Stufe</label>
                    {isEdit ? (
                      <>
                        <p id="level" className="input bg-stone-900/60 text-stone-400">Stufe {draft.level}</p>
                        <p className="mt-1 text-xs text-stone-500">Aufsteigen über „⬆️ Stufe aufsteigen“ auf dem Bogen.</p>
                      </>
                    ) : (
                      <input id="level" type="number" min={1} max={20} className="input" value={draft.level}
                        onChange={(e) => update({ level: Math.min(20, Math.max(1, Number(e.target.value) || 1)) })} />
                    )}
                  </div>
                  <div>
                    <label className="label" htmlFor="alignment">Gesinnung (optional)</label>
                    <select id="alignment" className="input" value={draft.alignment} onChange={(e) => update({ alignment: e.target.value })}>
                      <option value="">– keine Angabe –</option>
                      {ALIGNMENTS.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label" htmlFor="armor">Rüstung</label>
                    <select id="armor" className="input" value={draft.armor} onChange={(e) => update({ armor: e.target.value })}>
                      {ARMORS.map((a) => <option key={a.key} value={a.key}>{a.name}</option>)}
                    </select>
                  </div>
                  <label className="flex items-center gap-3 self-end rounded-lg border border-stone-700 px-4 py-2.5">
                    <input type="checkbox" className="h-4 w-4 accent-amber-500" checked={draft.shield}
                      onChange={(e) => update({ shield: e.target.checked })} />
                    <span>Schild (+2 RK)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Kurze Vorschau */}
            {allValid && (
              <div className="rounded-xl border border-amber-900/40 bg-stone-950/50 p-4">
                <p className="mb-3 font-display font-bold text-amber-200">Vorschau</p>
                <div className="grid grid-cols-3 gap-3 text-center sm:grid-cols-6">
                  <MiniStat label="TP" value={preview.hpMax} />
                  <MiniStat label="RK" value={preview.ac} />
                  <MiniStat label="Initiative" value={formatMod(preview.initiative)} />
                  <MiniStat label="Tempo" value={formatMeters(preview.speed)} />
                  <MiniStat label="Übung" value={formatMod(preview.prof)} />
                  <MiniStat label="Wahrn. (passiv)" value={preview.passivePerception} />
                </div>
              </div>
            )}
          </>
        )}

        {error && <p className="alert-error">{error}</p>}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3 border-t border-stone-800 pt-4">
          <button type="button" className="btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
            ← Zurück
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" className="btn-primary" disabled={!stepValid[step]} onClick={() => setStep(step + 1)}>
              Weiter →
            </button>
          ) : (
            <button type="button" className="btn-primary" disabled={!allValid || saving} onClick={save}>
              {saving ? 'Speichere …' : isEdit ? '💾 Änderungen speichern' : '✨ Charakter erschaffen'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function TraitList({ title, items }) {
  return (
    <div className="rounded-xl border border-stone-800 bg-stone-950/40 p-4">
      <p className="mb-2 font-display font-bold text-stone-200">{title}</p>
      <ul className="space-y-1.5 text-sm">
        {items.map(([name, text]) => (
          <li key={name}><span className="font-semibold text-amber-200">{name}:</span> <span className="text-stone-400">{text}</span></li>
        ))}
      </ul>
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg bg-stone-900 p-2">
      <p className="text-lg font-bold text-stone-100">{value}</p>
      <p className="text-xs text-stone-500">{label}</p>
    </div>
  )
}
