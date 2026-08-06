'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface AuthContextValue {
  user: User | null
  loading: boolean
  needsPasswordChange: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  needsPasswordChange: false,
  signIn: async () => ({ error: 'Auth provider not initialized' }),
  signUp: async () => ({ error: 'Auth provider not initialized' }),
  resetPassword: async () => ({ error: 'Auth provider not initialized' }),
  changePassword: async () => ({ error: 'Auth provider not initialized' }),
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null)
      })
      .catch(() => {
        setUser(null)
      })
      .finally(() => {
        setLoading(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }, [])

  const signUp = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined },
    })
    if (!error && data.session) {
      await supabase.auth.signOut()
    }
    return { error: error?.message ?? null }
  }, [])

  const resetPassword = useCallback(async (email: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/update-password` : undefined,
    })
    return { error: error?.message ?? null }
  }, [])

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<{ error: string | null }> => {
    if (!user?.email) return { error: 'You must be signed in to change your password.' }
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })
    if (signInError) return { error: 'Current password is incorrect.' }
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      data: { force_password_change: false },
    })
    return { error: error?.message ?? null }
  }, [user])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        needsPasswordChange: user?.user_metadata?.force_password_change === true,
        signIn,
        signUp,
        resetPassword,
        changePassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export function useUser() {
  return useContext(AuthContext).user
}
