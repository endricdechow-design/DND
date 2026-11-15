import { Link } from 'react-router'
import { useAuth } from '../lib/auth'
import GiftNotifier from './GiftNotifier'
import GameLogNotifier from './GameLogNotifier'
import Modal from './Modal'
import CompendiumBrowser from './compendium/CompendiumBrowser'
import { CompendiumProvider, useCompendium } from '../lib/compendium'

export default function Layout({ children }) {
  const { profile, signOut } = useAuth()

  return (
    <CompendiumProvider
      renderDialog={({ entryId, houseRules, close }) => (
        <Modal onClose={close}>
          <CompendiumBrowser houseRules={houseRules} initialEntryId={entryId} autoFocus onPageLink={close} />
        </Modal>
      )}
    >
    <div className="min-h-screen">
      <header className="border-b border-amber-900/30 bg-stone-950/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="title flex items-center gap-2 text-xl sm:text-2xl">
            <span aria-hidden>🐉</span> Dungeon Lobby
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <CompendiumButton />
            <span className="hidden font-medium text-stone-200 sm:block">{profile.username}</span>
            <button onClick={signOut} className="btn-ghost">Abmelden</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      <footer className="pb-6 text-center text-xs text-stone-600">Version {__APP_VERSION__}</footer>
      <GiftNotifier />
      <GameLogNotifier />
    </div>
    </CompendiumProvider>
  )
}

// 📖-Knopf in der Kopfzeile: öffnet die Suche im Kompendium
function CompendiumButton() {
  const { open } = useCompendium()
  return (
    <button type="button" onClick={() => open()} className="btn-ghost px-3" title="Kompendium durchsuchen">
      📖<span className="hidden sm:inline">Kompendium</span>
    </button>
  )
}
