'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface ReminderLogEntry {
  id: string
  programs_count: number
  recipients_count: number
  sent_at: string
}

export default function AdminReminderLogsPage() {
  const [logs, setLogs] = useState<ReminderLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    async function fetch() {
      try {
        const { data, error } = await supabase
          .from('reminder_logs')
          .select('*')
          .order('sent_at', { ascending: false })
        if (error) throw error
        setLogs((data ?? []) as ReminderLogEntry[])
      } catch (e) {
        setFetchError(e instanceof Error ? e.message : 'Failed to load reminder logs.')
      }
      setLoading(false)
    }
    fetch()
  }, [])

  if (loading) {
    return <p className="text-sm text-[var(--text-muted)]">Loading reminder logs…</p>
  }

  if (fetchError) {
    return <p className="text-sm text-[var(--danger)]">{fetchError}</p>
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-white">Reminder Logs</h1>
      <p className="mb-4 text-xs text-[var(--text-muted)]">
        Track when reminder emails were sent to subscribers.
      </p>

      {logs.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No reminder logs yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--border)] bg-[var(--bg-card)]">
              <tr>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Date</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Programs</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Recipients</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-card)]/50">
                  <td className="whitespace-nowrap px-3 py-2.5 text-white">
                    {new Date(l.sent_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-[var(--text-muted)]">{l.programs_count}</td>
                  <td className="px-3 py-2.5 text-[var(--text-muted)]">{l.recipients_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
