import { removeImage, uploadImage } from './images'

// Charakterbilder liegen im Speicher "avatars", Ordner = Benutzer-ID (so verlangen es die Zugriffsregeln)
export function uploadAvatar({ userId, characterId, file }) {
  return uploadImage({ bucket: 'avatars', pathWithoutExtension: `${userId}/${characterId}-${Date.now()}`, file, maxSize: 512 })
}

export function removeAvatar(publicUrl) {
  return removeImage('avatars', publicUrl)
}
