// =====================================================================
//  Berechnungen für Charakterbögen (D&D 5e)
//  Alles, was sich aus den gespeicherten Angaben ableiten lässt, wird hier
//  berechnet und NICHT in der Datenbank gespeichert.
// =====================================================================
import {
  ABILITIES, ARMORS, BACKGROUNDS, CLASSES, DRAGON_ANCESTRIES, POINT_BUY_BUDGET, POINT_BUY_COST, RACES, SKILLS, STANDARD_ARRAY, byKey,
} from '../data/srd'
import { carryCapacity } from './inventory'

/** Attributsmodifikator: 10–11 → +0, 12–13 → +1, 8–9 → −1 … */
export const abilityMod = (score) => Math.floor((score - 10) / 2)

/** Zahl mit Vorzeichen: 2 → "+2", -1 → "−1" */
export const formatMod = (n) => (n >= 0 ? `+${n}` : `−${Math.abs(n)}`)

/** Übungsbonus: Stufe 1–4 → +2, 5–8 → +3, 9–12 → +4, 13–16 → +5, 17–20 → +6 */
export const proficiencyBonus = (level) => Math.ceil(level / 4) + 1

/** Meter hübsch formatieren: 7.5 → "7,5 m" */
export const formatMeters = (m) => `${String(m).replace('.', ',')} m`

/** Endgültige Attributswerte = Grundwerte + Volksboni (+ frei gewählte Boni) */
export function finalAbilities(baseAbilities, raceKey, raceChoices = {}, levelUps = []) {
  const race = byKey(RACES, raceKey)
  const result = {}
  for (const { key } of ABILITIES) {
    let score = Number(baseAbilities?.[key]) || 0
    score += race?.bonuses?.[key] ?? 0
    if (race?.chooseAbilities && raceChoices?.abilities?.includes(key)) score += race.chooseAbilities.amount
    // Attributserhöhungen aus Stufenaufstiegen (Maximum 20)
    const asi = levelUps.reduce((sum, lu) => sum + (lu.asi?.[key] ?? 0), 0)
    if (asi) score = Math.min(20, score + asi)
    result[key] = score
  }
  return result
}

/** Durchschnittlicher TP-Gewinn pro Stufe (ohne KON) */
export const averageHitDie = (hitDie) => Math.floor(hitDie / 2) + 1

/** TP-Gewinn einer Stufe: Würfel (oder Durchschnitt) + KON-Mod, mindestens 1 (+ Zwergenbonus) */
export function hpGainForLevel({ classKey, raceKey, conScore, roll }) {
  const cls = byKey(CLASSES, classKey)
  const race = byKey(RACES, raceKey)
  if (!cls) return 0
  const base = roll ?? averageHitDie(cls.hitDie)
  return Math.max(1, base + abilityMod(conScore)) + (race?.hpPerLevel ?? 0)
}

/** Maximale Trefferpunkte (Stufe 1: voller Würfel, danach Durchschnitt) */
export function maxHitPoints({ classKey, raceKey, level, conScore, levelUps = [] }) {
  const cls = byKey(CLASSES, classKey)
  const race = byKey(RACES, raceKey)
  if (!cls) return 0
  // Stufe 1: voller Trefferwürfel
  let hp = Math.max(1, cls.hitDie + abilityMod(conScore)) + (race?.hpPerLevel ?? 0)
  // Ab Stufe 2: gewürfelter Wert aus dem Stufenaufstieg, sonst Durchschnitt
  for (let lvl = 2; lvl <= level; lvl++) {
    const roll = levelUps.find((lu) => lu.level === lvl)?.hpRoll ?? null
    hp += hpGainForLevel({ classKey, raceKey, conScore, roll })
  }
  return hp
}

/** Rüstungsklasse inkl. Schild und ungerüsteter Verteidigung (Barbar/Mönch) */
export function armorClass({ classKey, armorKey = 'none', shield = false, abilities }) {
  const cls = byKey(CLASSES, classKey)
  const armor = byKey(ARMORS, armorKey) ?? ARMORS[0]
  const dex = abilityMod(abilities.dex)

  let ac
  if (armor.type === 'none') {
    ac = 10 + dex
    const canUseUnarmored = cls?.unarmored && !(cls.unarmoredNoShield && shield)
    if (canUseUnarmored) ac = Math.max(ac, 10 + dex + abilityMod(abilities[cls.unarmored]))
  } else {
    ac = armor.base + (armor.dexMax === null ? dex : Math.min(dex, armor.dexMax))
  }
  return ac + (shield ? 2 : 0)
}

/** Alle Fertigkeiten, in denen der Charakter geübt ist (aus Volk, Klasse, Hintergrund) */
export function proficientSkills(data, raceKey) {
  const race = byKey(RACES, raceKey)
  const background = byKey(BACKGROUNDS, data.background)
  return new Set([
    ...(race?.skills ?? []),
    ...(data.raceChoices?.skills ?? []),
    ...(data.classSkills ?? []),
    ...(background?.skills ?? []),
    ...(data.backgroundSkills ?? []),
  ])
}

/**
 * Nimmt eine Zeile aus der Tabelle "characters" und berechnet alle Werte
 * für den Charakterbogen.
 */
export function deriveCharacter(character) {
  const data = character.data ?? {}
  const race = byKey(RACES, character.race)
  const cls = byKey(CLASSES, character.class)
  const background = byKey(BACKGROUNDS, data.background)
  const level = character.level ?? 1

  const levelUps = (data.levelUps ?? []).filter((lu) => lu.level <= level)
  const abilities = finalAbilities(data.baseAbilities, character.race, data.raceChoices, levelUps)
  const mods = Object.fromEntries(Object.entries(abilities).map(([k, v]) => [k, abilityMod(v)]))
  const prof = proficiencyBonus(level)
  const skillSet = proficientSkills(data, character.race)

  const skills = SKILLS.map((skill) => {
    const proficient = skillSet.has(skill.key)
    return { ...skill, proficient, bonus: mods[skill.ability] + (proficient ? prof : 0) }
  })

  const saves = ABILITIES.map((ability) => {
    const proficient = cls?.saves.includes(ability.key) ?? false
    return { ...ability, proficient, bonus: mods[ability.key] + (proficient ? prof : 0) }
  })

  const perception = skills.find((s) => s.key === 'perception')

  let breathWeapon = null
  if (race?.chooseAncestry) {
    const ancestry = byKey(DRAGON_ANCESTRIES, data.raceChoices?.ancestry)
    if (ancestry) {
      const dice = level >= 16 ? 5 : level >= 11 ? 4 : level >= 6 ? 3 : 2
      breathWeapon = { ...ancestry, dice: `${dice}W6`, dc: 8 + mods.con + prof }
    }
  }

  let spellcasting = null
  if (cls?.spellcasting) {
    const mod = mods[cls.spellcasting]
    spellcasting = { ability: cls.spellcasting, dc: 8 + prof + mod, attack: prof + mod }
  }

  return {
    race,
    cls,
    background,
    level,
    abilities,
    mods,
    prof,
    skills,
    saves,
    initiative: mods.dex,
    speed: race?.speed ?? 9,
    passivePerception: 10 + (perception?.bonus ?? 0),
    hpMax: maxHitPoints({ classKey: character.class, raceKey: character.race, level, conScore: abilities.con, levelUps }),
    levelUps,
    carryCapacity: carryCapacity(abilities.str),
    sneakAttack: character.class === 'rogue' ? `${Math.ceil(level / 2)}W6` : null,
    ac: armorClass({ classKey: character.class, armorKey: data.armor, shield: data.shield, abilities }),
    armor: byKey(ARMORS, data.armor) ?? ARMORS[0],
    breathWeapon,
    spellcasting,
  }
}

// ---------------------------------------------------------------------
// Attributswerte festlegen (Standardwerte, Punktekauf, gewürfelt)
// ---------------------------------------------------------------------
export function defaultAbilities(method) {
  const start = method === 'standard' ? null : method === 'pointbuy' ? 8 : 10
  return Object.fromEntries(ABILITIES.map((a) => [a.key, start]))
}

export function pointBuySpent(base) {
  return ABILITIES.reduce((sum, a) => sum + (POINT_BUY_COST[base[a.key]] ?? 0), 0)
}

/** Ist die Attributsverteilung vollständig und gültig? */
export function abilitiesValid(method, base) {
  const values = ABILITIES.map((a) => base[a.key])
  if (method === 'standard') {
    return values.every((v) => v !== null) && [...values].sort().join() === [...STANDARD_ARRAY].sort().join()
  }
  if (method === 'pointbuy') {
    return values.every((v) => v >= 8 && v <= 15) && pointBuySpent(base) <= POINT_BUY_BUDGET
  }
  return values.every((v) => Number.isInteger(v) && v >= 3 && v <= 20)
}

