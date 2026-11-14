import { supabase } from './supabase'

const MAX_FILE_SIZE = 15 * 1024 * 1024 // vor dem Verkleinern: max. 15 MB

/**
 * Verkleinert ein Bild auf höchstens maxSize × maxSize Pixel (als WebP),
 * damit Uploads schnell gehen und wenig Speicher brauchen.
 */
export async function resizeImage(file, maxSize = 512) {
  if (!file.type.startsWith('image/')) throw new Error('Bitte wähle eine Bilddatei aus (JPG, PNG, WebP …).')
  if (file.size > MAX_FILE_SIZE) throw new Error('Das Bild ist zu groß (max. 15 MB).')

  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('Dieses Bild kann nicht gelesen werden. Versuch es mit einer JPG- oder PNG-Datei.')
  }
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Das Bild konnte nicht verarbeitet werden.'))),
      'image/webp',
      0.85
    )
  })
}

/** Bild verkleinern, hochladen und die öffentliche Adresse zurückgeben */
export async function uploadImage({ bucket, pathWithoutExtension, file, maxSize }) {
  const blob = await resizeImage(file, maxSize)
  const extension = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/jpeg' ? 'jpg' : 'png'
  const path = `${pathWithoutExtension}.${extension}`
  const { error } = await supabase.storage.from(bucket).upload(path, blob, { contentType: blob.type })
  if (error) throw error
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

/** Bild anhand seiner öffentlichen Adresse löschen (Fehler werden ignoriert – nur Aufräumen) */
export async function removeImage(bucket, publicUrl) {
  const marker = `/object/public/${bucket}/`
  const index = publicUrl?.indexOf(marker) ?? -1
  if (index === -1) return
  const path = decodeURIComponent(publicUrl.slice(index + marker.length))
  await supabase.storage.from(bucket).remove([path])
}
