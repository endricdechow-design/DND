import { useState } from 'react'
import Modal from './Modal'
import { isIOS, promptInstall, useInstallState } from '../lib/install'

/**
 * Knopf "📱 Als App installieren" (im Profil-Menü) und Tipp-Kasten (Startseite).
 * Android/PC: echtes Installations-Fenster. iPhone: kurze Anleitung.
 */
export function InstallInstructions() {
  const ios = isIOS()
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 pr-8">
        <img src="/icons/icon-192.png" alt="" className="h-16 w-16 rounded-2xl" />
        <div>
          <h2 className="title text-2xl">Als App installieren</h2>
          <p className="text-sm text-stone-400">Mit eigenem Symbol auf dem Startbildschirm und ohne Browserleiste.</p>
        </div>
      </div>
      {ios ? (
        <ol className="list-decimal space-y-2 pl-5 text-stone-300">
          <li>Öffne die Seite in <b>Safari</b>.</li>
          <li>Tippe unten auf das <b>Teilen-Symbol</b> (Quadrat mit Pfeil nach oben ⬆️).</li>
          <li>Scrolle runter und tippe auf <b>„Zum Home-Bildschirm“</b>.</li>
          <li>Oben rechts auf <b>„Hinzufügen“</b> – fertig! 🐉</li>
        </ol>
      ) : (
        <div className="space-y-3 text-stone-300">
          <p><b>Handy (Android, Chrome):</b> oben rechts auf <b>⋮</b> → <b>„App installieren“</b> bzw. <b>„Zum Startbildschirm hinzufügen“</b>.</p>
          <p><b>PC (Chrome oder Edge):</b> rechts in der Adressleiste auf das <b>Installieren-Symbol</b> (Bildschirm mit Pfeil) klicken.</p>
        </div>
      )}
      <p className="text-xs text-stone-500">Die App braucht weiterhin Internet – sie ist nur bequemer zu öffnen. Updates kommen automatisch.</p>
    </div>
  )
}

export default function InstallAppButton({ className = '', onDone }) {
  const { installed, canPrompt } = useInstallState()
  const [showHelp, setShowHelp] = useState(false)
  if (installed) return null

  async function click() {
    if (canPrompt) {
      await promptInstall()
      onDone?.()
    } else {
      setShowHelp(true)
    }
  }

  return (
    <>
      <button type="button" role="menuitem" onClick={click} className={className}>📱 Als App installieren</button>
      {showHelp && (
        <Modal onClose={() => { setShowHelp(false); onDone?.() }}>
          <InstallInstructions />
        </Modal>
      )}
    </>
  )
}
