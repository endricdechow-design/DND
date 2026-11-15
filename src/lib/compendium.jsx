import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth'

const CompendiumContext = createContext(null)

/**
 * Stellt das Kompendium überall bereit:
 *  - open(entryId?) öffnet das Kompendium als Pop-up (optional direkt bei einem Eintrag)
 *  - houseRules: Hausregeln aller eigenen Runden
 */
export function CompendiumProvider({ children, renderDialog }) {
  const { profile } = useAuth()
  const [state, setState] = useState(null) // null = zu, sonst { entryId }
  const [houseRules, setHouseRules] = useState([])

  const loadHouseRules = useCallback(async () => {
    const { data } = await supabase.from('house_rules').select('*, games(name)').order('title')
    setHouseRules(data ?? [])
  }, [])

  useEffect(() => {
    if (profile?.id) loadHouseRules()
  }, [profile?.id, loadHouseRules])

  const open = useCallback(
    (entryId = null) => {
      setState({ entryId })
      loadHouseRules()
    },
    [loadHouseRules]
  )
  const close = useCallback(() => setState(null), [])

  return (
    <CompendiumContext.Provider value={{ open, close, houseRules, reloadHouseRules: loadHouseRules }}>
      {children}
      {state && renderDialog({ entryId: state.entryId, houseRules, close })}
    </CompendiumContext.Provider>
  )
}

// oxlint-disable-next-line react/only-export-components
export function useCompendium() {
  return useContext(CompendiumContext) ?? { open: () => {}, close: () => {}, houseRules: [], reloadHouseRules: () => {} }
}
