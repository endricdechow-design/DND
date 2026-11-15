import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../lib/auth'
import GiftNotifier from './GiftNotifier'
import GameLogNotifier from './GameLogNotifier'
import Modal from './Modal'
import CompendiumBrowser from './compendium/CompendiumBrowser'
import { CompendiumProvider, useCompendium } from '../lib/compendium'

export default function Layout({ children }) {
  return (
    <CompendiumProvider
      renderDialog={({ entryId, houseRules, close }) => (
        <Modal onClose={close}>
          <CompendiumBrowser houseRules={houseRules} initialEntryId={entryId} autoFocus onPageLink={close} />
        </Modal>
      )}
    >
      <div className="min-h-screen">
        <header className="relative z-30 border-b border-amber-900/30 bg-stone-950/60 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:gap-6 sm:py-4">
            <Link to="/" className="title flex shrink-0 items-center gap-2 text-xl sm:text-2xl">
              <span aria-hidden>🐉</span> Dungeon Lobby
            </Link>
            <SearchBar />
            <UserMenu />
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

// Suchleiste in der Mitte (am Handy nur ein Symbol) – öffnet das Kompendium.
// Am PC zusätzlich mit der Taste "/".
function SearchBar() {
  const { open } = useCompendium()

  useEffect(() => {
    const onKey = (e) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
      if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        open()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => open()}
        className="hidden flex-1 items-center gap-2 rounded-full border border-stone-700 bg-stone-950/60 px-4 py-2 text-left text-sm text-stone-500 transition hover:border-amber-600 hover:text-stone-300 sm:flex"
      >
        <span aria-hidden>🔍</span>
        <span className="flex-1 truncate">Im Kompendium suchen …</span>
        <kbd className="rounded border border-stone-700 px-1.5 text-xs text-stone-500">/</kbd>
      </button>
      <button
        type="button"
        onClick={() => open()}
        className="ml-auto flex h-10 w-10 items-center justify-center rounded-full border border-stone-700 text-lg transition hover:border-amber-600 sm:hidden"
        aria-label="Im Kompendium suchen"
      >
        🔍
      </button>
    </>
  )
}

// Rundes Profil-Symbol mit Menü (Name, Meine Runden, Kompendium, Abmelden)
function UserMenu() {
  const { profile, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)

  // Schließen bei Klick daneben oder mit Esc
  useEffect(() => {
    if (!isOpen) return
    const onClick = (e) => !ref.current?.contains(e.target) && setIsOpen(false)
    const onKey = (e) => e.key === 'Escape' && setIsOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen])

  const initial = profile.username?.charAt(0).toUpperCase() ?? '?'

  return (
    <div ref={ref} className="relative shrink-0 sm:ml-auto">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-b from-amber-500 to-amber-700 font-display text-lg font-bold text-stone-950 ring-2 ring-amber-900/60 transition hover:ring-amber-400"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Profil-Menü"
        title={profile.username}
      >
        {initial}
      </button>
      {isOpen && (
        <div role="menu" className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-xl border border-amber-900/50 bg-stone-900 shadow-2xl shadow-black">
          <div className="border-b border-stone-800 px-4 py-3">
            <p className="text-xs text-stone-500">Angemeldet als</p>
            <p className="truncate font-semibold text-stone-100">{profile.username}</p>
          </div>
          <Link to="/" role="menuitem" onClick={() => setIsOpen(false)} className="block px-4 py-2.5 text-sm text-stone-300 hover:bg-stone-800 hover:text-amber-200">
            🏰 Meine Runden
          </Link>
          <Link to="/kompendium" role="menuitem" onClick={() => setIsOpen(false)} className="block px-4 py-2.5 text-sm text-stone-300 hover:bg-stone-800 hover:text-amber-200">
            📖 Kompendium & Hausregeln
          </Link>
          <Link to="/werkstatt" role="menuitem" onClick={() => setIsOpen(false)} className="block px-4 py-2.5 text-sm text-stone-300 hover:bg-stone-800 hover:text-amber-200">
            🛠️ Spielleiter-Werkstatt
          </Link>
          <button type="button" role="menuitem" onClick={signOut} className="block w-full border-t border-stone-800 px-4 py-2.5 text-left text-sm text-red-300 hover:bg-red-950/40">
            🚪 Abmelden
          </button>
        </div>
      )}
    </div>
  )
}
