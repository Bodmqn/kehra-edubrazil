'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminTrackerPage() {
  const [totalReminders, setTotalReminders] = useState(0)
  const [totalCloudPrograms, setTotalCloudPrograms] = useState(0)
  const [totalSyncedUsers, setTotalSyncedUsers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    async function fetch() {
      try {
        const [
          { count: reminderCount, error: remErr },
          { count: cloudCount, error: cloudErr },
          { data: cloudUsers, error: usersErr },
        ] = await Promise.all([
          supabase.from('user_reminders').select('*', { count: 'exact', head: true }),
          supabase.from('user_tracker_programs').select('*', { count: 'exact', head: true }),
          supabase.from('user_tracker_programs').select('user_id'),
        ])
        if (remErr) throw remErr
        if (cloudErr) throw cloudErr
        if (usersErr) throw usersErr
        setTotalReminders(reminderCount ?? 0)
        setTotalCloudPrograms(cloudCount ?? 0)
        setTotalSyncedUsers(new Set(cloudUsers?.map((r) => r.user_id) ?? []).size)
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
        Aggregate data from user tracker programs and email reminders.
      </p>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
          <p className="text-2xl font-bold text-[var(--bg-primary)]">{totalReminders}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Email Reminders</p>
          <p className="mt-1 text-[10px] text-[var(--text-muted)]">
            From users who subscribed for email alerts (user_reminders)
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
          <p className="text-2xl font-bold text-[var(--success)]">{totalCloudPrograms}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Cloud-Synced Programs</p>
          <p className="mt-1 text-[10px] text-[var(--text-muted)]">
            Programs synced by logged-in users (user_tracker_programs)
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
          <p className="text-2xl font-bold text-[var(--bg-accent)]">{totalSyncedUsers}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Active Synced Users</p>
          <p className="mt-1 text-[10px] text-[var(--text-muted)]">
            Distinct users with cloud-synced programs
          </p>
        </div>
      </div>

      <p className="mt-6 text-xs text-[var(--text-muted)]">
        Users who sign in via magic link sync their tracker programs to the cloud. 
        Guests still use local storage only. Email reminder subscriptions 
        (for deadline alerts) are stored in <code className="text-[var(--bg-primary)]">user_reminders</code>.
      </p>
    </div>
  )
}
