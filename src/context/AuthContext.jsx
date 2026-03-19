import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [org,     setOrg]     = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId) {
    if (!userId) { setProfile(null); setOrg(null); return }
    try {
      const { data: prof } = await supabase
        .from('profiles').select('*').eq('user_id', userId).maybeSingle()
      setProfile(prof ?? null)
      if (prof?.org_id) {
        const { data: orgData } = await supabase
          .from('orgs').select('*').eq('id', prof.org_id).maybeSingle()
        setOrg(orgData ?? null)
      } else {
        setOrg(null)
      }
    } catch {
      // Network error — leave any existing profile/org in place
    }
  }

  useEffect(() => {
    // Read local session immediately (localStorage, no network) → unblock UI
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
      loadProfile(session?.user?.id ?? null)
    }).catch(() => {
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setSession(null); setProfile(null); setOrg(null)
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        setSession(session)
        loadProfile(session?.user?.id ?? null)
      }
      // TOKEN_REFRESHED: ignored — Supabase rotates the token internally
      // INITIAL_SESSION: ignored — getSession() already handled it
    })

    return () => subscription.unsubscribe()
  }, [])

  // Idle auto-logout: sign out after the role-specific inactivity timeout.
  // Runs only when session + org + profile are all loaded.
  // Set timeout to 0 in Admin → Org Setup to disable for a role.
  useEffect(() => {
    if (!session || !org || !profile) return
    const mins = ({
      staff:   org.session_timeout_staff_min   ?? 30,
      manager: org.session_timeout_manager_min ?? 240,
      admin:   org.session_timeout_admin_min   ?? 480,
      patient: org.session_timeout_patient_min ?? 480,
    })[profile.role] ?? 480
    if (mins === 0) return
    const ms = mins * 60 * 1000
    let timer
    const reset = () => { clearTimeout(timer); timer = setTimeout(() => supabase.auth.signOut(), ms) }
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach(e => document.addEventListener(e, reset, true))
    reset()
    return () => { clearTimeout(timer); events.forEach(e => document.removeEventListener(e, reset, true)) }
  }, [session?.user?.id, profile?.role,
      org?.session_timeout_staff_min, org?.session_timeout_manager_min,
      org?.session_timeout_admin_min, org?.session_timeout_patient_min])

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      profile,
      org,
      role: profile?.role ?? null,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
