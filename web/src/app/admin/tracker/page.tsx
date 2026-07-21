'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminTrackerPage() {
  const [totalReminders, setTotalReminders] = useState(0)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    async function fetch() {
      try {
        const { count, error } = await supabase
          .from('user_reminders')
          .select('*', { count: 'exact', head: true })
        if (error) throw error
        setTotalReminders(count ?? 0)
      } catch (e) {
        setFetchError(e instanceof Error ? e.message : 'Failed to load tracker data.')
      }
      setLoading(false)
    }
    fetch()
  }, [])

  if (loading) {
    return <p className="text-sm text-[var(--text-muted)]">Loading tracker overview…</p>
  }

  if (fetchError) {
    return <p className="text-sm text-[var(--danger)]">{fetchError}</p>
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-white">Tracker Overview</h1>
      <p className="mb-4 text-xs text-[var(--text-muted)]">
        Aggregate data from user tracker programs (synced via email subscriptions).
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
          <p className="text-2xl font-bold text-[var(--bg-primary)]">{totalReminders}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Total Saved Reminders</p>
        </div>
      </div>

      <p className="mt-6 text-xs text-[var(--text-muted)]">
        Tracker programs are stored locally in each user&apos;s browser. Only users who subscribe to email reminders sync their data to the server.
      </p>
    </div>
  )
}
