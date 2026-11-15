import { useEffect, useState } from 'react'

// "Als App installieren": merkt sich das Installations-Angebot des Browsers (Android/PC)
let deferredPrompt = null
const listeners = new Set()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault() // eigenes Angebot statt Browser-Leiste
    deferredPrompt = event
    listeners.forEach((fn) => fn())
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    listeners.forEach((fn) => fn())
  })
}

/** Läuft die Seite schon als installierte App? */
export const isInstalledApp = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export const canPromptInstall = () => Boolean(deferredPrompt)

export function onInstallChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Zeigt das Installations-Fenster des Browsers. Gibt true zurück, wenn installiert wurde. */
export async function promptInstall() {
  if (!deferredPrompt) return false
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  deferredPrompt = null
  listeners.forEach((fn) => fn())
  return outcome === 'accepted'
}

/** React-Hook: { installed, canPrompt } – aktualisiert sich bei Änderungen */
export function useInstallState() {
  const [, rerender] = useState(0)
  useEffect(() => onInstallChange(() => rerender((n) => n + 1)), [])
  return { installed: isInstalledApp(), canPrompt: canPromptInstall() }
}
