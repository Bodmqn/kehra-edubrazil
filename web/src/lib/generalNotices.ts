'use client'

import { useState, useEffect } from 'react'
import { supabase } from './supabase'

export interface GeneralNotice {
  id: string
  message: string
  type: 'info' | 'warning' | 'alert'
  active: boolean
  created_at: string
  updated_at: string
}

export function useActiveNotice() {
  const [notice, setNotice] = useState<GeneralNotice | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetch() {
      const { data } = await supabase
        .from('general_notices')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!cancelled) {
        setNotice(data as GeneralNotice | null)
      }
    }

    fetch()

    return () => { cancelled = true }
  }, [])

  return notice
}
