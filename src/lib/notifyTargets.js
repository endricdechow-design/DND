import { supabase } from './supabase'

/**
 * Wohin führt ein Tipp auf eine Einblendung?
 * Sucht den Charakter eines Spielers in einer Runde und baut den Link zum passenden Reiter.
 */
export async function characterLink(gameId, userId, tab) {
  const { data } = await supabase.from('characters').select('id').eq('game_id', gameId).eq('user_id', userId).maybeSingle()
  if (!data) return null
  return `/runde/${gameId}/charakter/${data.id}${tab && tab !== 'kampf' ? `?tab=${tab}` : ''}`
}

/** Geschenk vom Spielleiter → Gegenstände/Effekte ins Inventar, Karten/Handouts in die Bibliothek */
export async function giftLink(item, myUserId) {
  if (item.type === 'item' || item.type === 'effect') {
    const link = await characterLink(item.game_id, myUserId, 'inventar')
    if (link) return link
  }
  return `/runde/${item.game_id}/bibliothek`
}

/** Meldung aus dem Protokoll → passende Stelle */
export async function logLink(row, myUserId) {
  switch (row.kind) {
    case 'xp_awarded': // Spieler: eigener Bogen, EP stehen oben im Kopf
      return (await characterLink(row.game_id, myUserId, 'kampf')) ?? `/runde/${row.game_id}`
    case 'item_used': // Spielleiter: Inventar des Spielers, der etwas benutzt hat
      return (await characterLink(row.game_id, row.user_id, 'inventar')) ?? `/runde/${row.game_id}/bibliothek`
    case 'house_rule':
      return `/runde/${row.game_id}/hausregeln`
    default: // Funde, abgelehnte Funde …
      return `/runde/${row.game_id}/bibliothek`
  }
}
