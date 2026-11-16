import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import { useAuth } from './lib/auth'
import Layout from './components/Layout'
import FullscreenMessage from './components/FullscreenMessage'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import LobbyPage from './pages/LobbyPage'
import PageSkeleton from './components/Skeleton'
// Größere Seiten werden erst geladen, wenn man sie öffnet
const CharacterWizardPage = lazy(() => import('./pages/CharacterWizardPage'))
const CharacterSheetPage = lazy(() => import('./pages/CharacterSheetPage'))
const LevelUpPage = lazy(() => import('./pages/LevelUpPage'))
const LibraryPage = lazy(() => import('./pages/LibraryPage'))
const CompendiumPage = lazy(() => import('./pages/CompendiumPage'))
const WorkshopPage = lazy(() => import('./pages/WorkshopPage'))
const FeedbackPage = lazy(() => import('./pages/FeedbackPage'))
const AdventurePage = lazy(() => import('./pages/AdventurePage'))
const MapPage = lazy(() => import('./pages/MapPage'))
const TablePage = lazy(() => import('./pages/TablePage'))

export default function App() {
  const { session, profile, loading, signOut } = useAuth()
  const location = useLocation()

  // Tisch-Bildschirm: ohne Anmeldung, ohne Kopfzeile
  if (location.pathname.startsWith('/tisch/')) {
    return (
      <Suspense fallback={<FullscreenMessage text="Die Karte wird entrollt …" />}>
        <Routes>
          <Route path="/tisch/:code" element={<TablePage />} />
        </Routes>
      </Suspense>
    )
  }

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
      <Suspense fallback={<PageSkeleton text="Lade …" />}>
        <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/runde/:gameId" element={<LobbyPage />} />
        <Route path="/kompendium" element={<CompendiumPage />} />
        <Route path="/werkstatt" element={<WorkshopPage />} />
        <Route path="/helden/neu" element={<CharacterWizardPage />} />
        <Route path="/helden/:characterId" element={<CharacterSheetPage />} />
        <Route path="/helden/:characterId/bearbeiten" element={<CharacterWizardPage />} />
        <Route path="/helden/:characterId/aufstieg" element={<LevelUpPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/werkstatt/:adventureId" element={<AdventurePage />} />
        <Route path="/runde/:gameId/bibliothek" element={<LibraryPage />} />
        <Route path="/runde/:gameId/karte" element={<MapPage />} />
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
