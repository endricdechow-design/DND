import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

/**
 * Stellt überall in der App bereit:
 *  - session: Login-Sitzung (null = nicht eingeloggt)
 *  - profile: { id, username } des eingeloggten Benutzers
 *  - loading: true, solange noch geladen wird
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = noch unbekannt
  const [loadedProfile, setLoadedProfile] = useState({ userId: null, data: null })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => subscription.unsubscribe()
  }, [])

  const userId = session?.user?.id ?? null

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    supabase
      .from('profiles')
      .select('id, username')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('Profil konnte nicht geladen werden:', error.message)
        if (!cancelled) setLoadedProfile({ userId, data })
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  const profileReady = !userId || loadedProfile.userId === userId
  const value = {
    session: session ?? null,
    profile: userId && profileReady ? loadedProfile.data : null,
    loading: session === undefined || !profileReady,
    signOut: () => supabase.auth.signOut(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth muss innerhalb von <AuthProvider> benutzt werden.')
  return ctx
}
