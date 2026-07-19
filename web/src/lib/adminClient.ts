'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

export function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export function signOut() {
  return supabase.auth.signOut()
}

export function useAdminSession() {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function check() {
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return

      if (!session?.user) {
        setUser(null)
        setIsAdmin(false)
        setLoading(false)
        return
      }

      setUser(session.user)

      const { data } = await supabase
        .from('admin_users')
        .select('email')
        .eq('email', session.user.email)
        .maybeSingle()

      if (!cancelled) {
        setIsAdmin(!!data)
        setLoading(false)
      }
    }

    check()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return
      if (!session?.user) {
        setUser(null)
        setIsAdmin(false)
        setLoading(false)
      } else {
        setUser(session.user)
        supabase
          .from('admin_users')
          .select('email')
          .eq('email', session.user.email)
          .maybeSingle()
          .then(({ data }) => {
            if (!cancelled) setIsAdmin(!!data)
          })
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return { user, isAdmin, loading }
}

export function useRequireAdmin() {
  const { user, isAdmin, loading } = useAdminSession()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace('/admin/login')
    }
  }, [user, isAdmin, loading, router])

  return { user, isAdmin, loading }
}
