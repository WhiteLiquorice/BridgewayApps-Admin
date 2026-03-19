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
