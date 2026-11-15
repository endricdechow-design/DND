import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { useAuth } from './lib/auth'
import Layout from './components/Layout'
import FullscreenMessage from './components/FullscreenMessage'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import LobbyPage from './pages/LobbyPage'
// Größere Seiten werden erst geladen, wenn man sie öffnet
const CharacterWizardPage = lazy(() => import('./pages/CharacterWizardPage'))
const CharacterSheetPage = lazy(() => import('./pages/CharacterSheetPage'))
const LevelUpPage = lazy(() => import('./pages/LevelUpPage'))
const LibraryPage = lazy(() => import('./pages/LibraryPage'))
const CompendiumPage = lazy(() => import('./pages/CompendiumPage'))
const WorkshopPage = lazy(() => import('./pages/WorkshopPage'))
const AdventurePage = lazy(() => import('./pages/AdventurePage'))

export default function App() {
  const { session, profile, loading, signOut } = useAuth()

  if (loading) return <FullscreenMessage text="Die Tore öffnen sich …" />
  if (!session) return <AuthPage />

  if (!profile) {
    return (
      <FullscreenMessage text="Profil nicht gefunden">
        <p className="mt-3 max-w-md text-center text-stone-400">
          Wahrscheinlich ist die Datenbank noch nicht eingerichtet. Führe die SQL-Dateien aus
          <code className="text-amber-300"> supabase/migrations </code> in Supabase aus und lade die Seite neu.
        </p>
        <button onClick={signOut} className="btn-ghost mt-4">Abmelden</button>
      </FullscreenMessage>
    )
  }

  return (
    <Layout>
      <Suspense fallback={<p className="title animate-pulse text-center text-xl">Lade …</p>}>
        <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/runde/:gameId" element={<LobbyPage />} />
        <Route path="/kompendium" element={<CompendiumPage />} />
        <Route path="/werkstatt" element={<WorkshopPage />} />
        <Route path="/werkstatt/:adventureId" element={<AdventurePage />} />
        <Route path="/runde/:gameId/bibliothek" element={<LibraryPage />} />
        <Route path="/runde/:gameId/charakter/neu" element={<CharacterWizardPage />} />
        <Route path="/runde/:gameId/charakter/:characterId" element={<CharacterSheetPage />} />
        <Route path="/runde/:gameId/charakter/:characterId/bearbeiten" element={<CharacterWizardPage />} />
        <Route path="/runde/:gameId/charakter/:characterId/aufstieg" element={<LevelUpPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </Layout>
  )
}
