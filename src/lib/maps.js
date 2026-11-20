import { supabase } from './supabase'
import { removeImage, uploadImage } from './images'
import { imageSizeFor } from '../data/library'

const LIBRARY_MARKER = '/object/public/library/'

/** Neue Nebelkarte aus einer hochgeladenen Datei */
export async function createMapFromFile(gameId, name, file) {
  const id = crypto.randomUUID()
  const imageUrl = await uploadImage({
    bucket: 'library',
    pathWithoutExtension: `${gameId}/nebelkarte-${id}-${Date.now()}`,
    file,
    maxSize: imageSizeFor('map'),
  })
  return insertMap({ id, game_id: gameId, name, image_url: imageUrl })
}

/**
 * Neue Nebelkarte aus einer Karte der Bibliothek. Das Bild wird kopiert,
 * damit die Nebelkarte bleibt, auch wenn der Bibliothekseintrag gelöscht wird.
 * Vorbereitete Räume und das Raster (aus der Werkstatt) werden übernommen.
 */
export async function createMapFromLibrary(gameId, item) {
  const id = crypto.randomUUID()
  let imageUrl = item.image_url
  const index = imageUrl.indexOf(LIBRARY_MARKER)
  if (index !== -1) {
    const from = decodeURIComponent(imageUrl.slice(index + LIBRARY_MARKER.length))
    const extension = from.split('.').pop()
    const to = `${gameId}/nebelkarte-${id}-${Date.now()}.${extension}`
    const { error } = await supabase.storage.from('library').copy(from, to)
    if (!error) imageUrl = supabase.storage.from('library').getPublicUrl(to).data.publicUrl
  }
  return insertMap({ id, game_id: gameId, name: item.name.slice(0, 80), image_url: imageUrl, rooms: item.data?.rooms ?? [], grid: item.data?.grid ?? null })
}

async function insertMap(row) {
  const { data, error } = await supabase.from('battle_maps').insert(row).select('*').single()
  if (error) throw error
  return data
}

/** Karte löschen (eigene Bildkopie wird mit entfernt) */
export async function deleteMap(map) {
  const { error } = await supabase.from('battle_maps').delete().eq('id', map.id)
  if (error) throw error
  if (map.image_url?.includes('/nebelkarte-')) removeImage('library', map.image_url)
}
