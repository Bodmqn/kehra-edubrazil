'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'
import { useUser } from './AuthProvider'

export function useUnreadAdminMessages(pollMs = 60000) {
  const user = useUser()
  const [unread, setUnread] = useState(0)

  const refresh = useCallback(async () => {
    if (!user) {
      setUnread(0)
      return
    }
    const { count, error } = await supabase
      .from('direct_messages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_admin_reply', true)
      .is('read_at', null)

    if (!error) setUnread(count ?? 0)
  }, [user])

  useEffect(() => {
    const initial = setTimeout(refresh, 0)
    const interval = setInterval(refresh, pollMs)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      clearTimeout(initial)
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [refresh, pollMs])

  return { unread, refresh }
}
