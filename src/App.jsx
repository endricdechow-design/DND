import { Navigate, Route, Routes } from 'react-router'
import { useAuth } from './lib/auth'
import Layout from './components/Layout'
import FullscreenMessage from './components/FullscreenMessage'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import LobbyPage from './pages/LobbyPage'

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
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/runde/:gameId" element={<LobbyPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
