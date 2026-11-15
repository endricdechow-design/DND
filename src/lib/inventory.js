// Gewicht und Traglast
// Traglast nach SRD: Stärke × 15 Pfund ≈ Stärke × 7,5 kg

export const carryCapacity = (strengthScore) => Math.round((Number(strengthScore) || 0) * 7.5 * 10) / 10

/** 1.5 → "1,5 kg" */
export const formatKg = (kg) => `${(Math.round((Number(kg) || 0) * 10) / 10).toLocaleString('de-DE')} kg`

/** Gewicht eines Eintrags (pro Stück) */
export const itemWeight = (item) => {
  const w = Number(item?.data?.weight)
  return Number.isFinite(w) && w > 0 ? w : 0
}

/** Gesamtgewicht: entries = [{ item, quantity }] */
export const totalWeight = (entries) =>
  entries.reduce((sum, { item, quantity }) => sum + itemWeight(item) * (quantity ?? 1), 0)

/** Eingabe "1,5" oder "1.5" → Zahl (oder null) */
export function parseKg(text) {
  if (text === '' || text === null || text === undefined) return null
  const n = Number(String(text).replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : null
}
