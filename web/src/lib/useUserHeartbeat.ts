'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthProvider'

const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000

export function useUserHeartbeat() {
  const { user, loading } = useAuth()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const userAgentRef = useRef<string>('')

  useEffect(() => {
    userAgentRef.current = navigator.userAgent
  }, [])

  useEffect(() => {
    if (loading || !user) return

    let cancelled = false

    const sendHeartbeat = async () => {
      if (cancelled || document.hidden) return

      // Check if user is admin — skip tracking
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('email')
        .eq('email', user.email)
        .maybeSingle()

      if (adminUser) return

      const today = new Date().toISOString().split('T')[0]

      await supabase.from('user_activity').upsert(
        {
          user_id: user.id,
          last_active_at: new Date().toISOString(),
          user_agent: userAgentRef.current,
          active_date: today,
        },
        { onConflict: 'user_id,active_date' },
      )
    }

    // Send immediately on mount
    sendHeartbeat()

    // Then every HEARTBEAT_INTERVAL
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS)

    // Also send when tab becomes visible again
    const handleVisibility = () => {
      if (!document.hidden) {
        sendHeartbeat()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelled = true
      if (intervalRef.current) clearInterval(intervalRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [user, loading])
}
