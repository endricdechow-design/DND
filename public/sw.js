// Service Worker der Dungeon Lobby
// Bewusst schlicht: Es wird NICHTS aus der App zwischengespeichert, damit immer die
// neueste Version geladen wird. Nur die Offline-Seite wird gemerkt und angezeigt,
// wenn keine Internetverbindung besteht.
const CACHE = 'dungeon-lobby-offline-v1'
const OFFLINE_FILES = ['/offline.html', '/icons/icon-192.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(OFFLINE_FILES)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  // Nur Seitenaufrufe abfangen – alles andere (Daten, Bilder, Skripte) läuft ganz normal
  if (request.mode !== 'navigate') return
  event.respondWith(fetch(request).catch(() => caches.match('/offline.html')))
})
