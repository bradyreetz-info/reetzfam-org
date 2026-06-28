/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import type { User } from '@supabase/supabase-js'
import { isDemoMode, isSupabaseConfigured, supabase } from './supabase'
import type { UserProfile } from '../types'

interface SignUpInput {
  email: string
  password: string
  firstName: string
  lastName: string
}

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  demoMode: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (input: SignUpInput) => Promise<{ needsEmailConfirmation: boolean }>
  sendMagicLink: (email: string) => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfileSnapshot: (patch: Partial<UserProfile>) => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)
const DEMO_KEY = 'reetzfam-demo-profile'

function demoProfile(email: string): UserProfile {
  const pending = email.toLowerCase().includes('pending')
  const admin = email.toLowerCase().includes('admin')
  return {
    id: 'demo-profile',
    email,
    first_name: admin ? 'Alex' : 'Jordan',
    last_name: 'Reetz',
    display_name: admin ? 'Alex Reetz' : 'Jordan Reetz',
    role: pending ? 'pending' : admin ? 'admin' : 'member',
    status: pending ? 'pending' : 'approved',
    created_at: new Date().toISOString(),
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (authUser: User) => {
    if (!supabase) return
    const { data, error } = await supabase.from('profiles').select('*').eq('auth_user_id', authUser.id).maybeSingle()
    if (error) throw error
    if (data) {
      const next = data as UserProfile
      const { data: onboarding } = await supabase
        .from('profile_onboarding_state')
        .select('current_step,completed_at,dismissed_at')
        .eq('profile_id', next.id)
        .maybeSingle()
      if (onboarding) {
        next.onboarding_current_step = onboarding.current_step
        next.onboarding_completed_at = onboarding.completed_at
        next.onboarding_dismissed_at = onboarding.dismissed_at
      }
      setProfile(next)
    } else setProfile({
      id: 'unprovisioned',
      auth_user_id: authUser.id,
      email: authUser.email ?? '',
      first_name: String(authUser.user_metadata.first_name ?? ''),
      last_name: String(authUser.user_metadata.last_name ?? ''),
      display_name: String(authUser.user_metadata.display_name ?? authUser.email ?? 'Pending member'),
      role: 'pending',
      status: 'pending',
      created_at: authUser.created_at,
    })
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user)
  }, [loadProfile, user])

  const updateProfileSnapshot = useCallback((patch: Partial<UserProfile>) => {
    setProfile(current => current ? { ...current, ...patch } : current)
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      if (isDemoMode) {
        const saved = sessionStorage.getItem(DEMO_KEY)
        if (saved) setProfile(JSON.parse(saved) as UserProfile)
      }
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(async ({ data }) => {
      setUser(data.session?.user ?? null)
      if (data.session?.user) await loadProfile(data.session.user)
    }).catch(() => {
      setUser(null)
      setProfile(null)
    }).finally(() => setLoading(false))

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) void loadProfile(session.user).catch(() => setProfile(null))
      else setProfile(null)
    })
    return () => listener.subscription.unsubscribe()
  }, [loadProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase()
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
      if (error) throw error
      if (data.user) await loadProfile(data.user)
      return
    }
    if (!isDemoMode) throw new Error('Sign-in is not configured yet. Please contact the site administrator.')
    const next = demoProfile(normalizedEmail)
    sessionStorage.setItem(DEMO_KEY, JSON.stringify(next))
    setProfile(next)
  }, [loadProfile])

  const signUp = useCallback(async ({ email, password, firstName, lastName }: SignUpInput) => {
    const normalizedEmail = email.trim().toLowerCase()
    const cleanFirst = firstName.trim()
    const cleanLast = lastName.trim()
    const displayName = `${cleanFirst} ${cleanLast}`.trim() || normalizedEmail

    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { first_name: cleanFirst, last_name: cleanLast, display_name: displayName },
          emailRedirectTo: `${window.location.origin}/app`,
        },
      })
      if (error) throw error
      if (data.user && data.session) await loadProfile(data.user)
      return { needsEmailConfirmation: !data.session }
    }

    if (!isDemoMode) throw new Error('Account creation is not configured yet. Please contact the site administrator.')
    const next = demoProfile(normalizedEmail)
    next.first_name = cleanFirst || next.first_name
    next.last_name = cleanLast || next.last_name
    next.display_name = `${next.first_name} ${next.last_name}`.trim()
    sessionStorage.setItem(DEMO_KEY, JSON.stringify(next))
    setProfile(next)
    return { needsEmailConfirmation: false }
  }, [loadProfile])

  const sendMagicLink = useCallback(async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase()
    if (!supabase) {
      if (isDemoMode) return
      throw new Error('Magic-link sign-in is not configured yet.')
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { emailRedirectTo: `${window.location.origin}/app` },
    })
    if (error) throw error
  }, [])

  const sendPasswordReset = useCallback(async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase()
    if (!supabase) {
      if (isDemoMode) return
      throw new Error('Password reset is not configured yet.')
    }
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/login`,
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    sessionStorage.removeItem(DEMO_KEY)
    if (supabase) await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }, [])

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    demoMode: isDemoMode,
    signIn,
    signUp,
    sendMagicLink,
    sendPasswordReset,
    refreshProfile,
    updateProfileSnapshot,
    signOut,
  }), [user, profile, loading, signIn, signUp, sendMagicLink, sendPasswordReset, refreshProfile, updateProfileSnapshot, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
