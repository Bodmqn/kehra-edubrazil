'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { ScrapeLog } from '@/lib/types'

interface LogWithUniversity extends ScrapeLog {
  university_name: string
  university_acronym: string
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogWithUniversity[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error' | 'partial'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('scrape_logs')
        .select('*, universities(name, acronym)')
        .order('scraped_at', { ascending: false })

      if (data) {
        setLogs(
          (data as Record<string, unknown>[]).map((l) => {
            const uni = l.universities as Record<string, unknown> | null
            return {
              id: l.id as string,
              university_id: l.university_id as string,
              status: l.status as ScrapeLog['status'],
              programs_found: l.programs_found as number,
              errors: l.errors as string | null,
              scraped_at: l.scraped_at as string,
              university_name: (uni?.name as string) ?? 'Unknown',
              university_acronym: (uni?.acronym as string) ?? '',
            }
          })
        )
      }
      setLoading(false)
    }
    fetch()
  }, [])

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          l.university_name.toLowerCase().includes(q) ||
          l.university_acronym.toLowerCase().includes(q) ||
          (l.errors ?? '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [logs, statusFilter, search])

  if (loading) {
    return <p className="text-sm text-[var(--text-muted)]">Loading logs…</p>
  }

  const statusColors: Record<string, string> = {
    success: 'var(--success)',
    error: 'var(--danger)',
    partial: 'var(--warning)',
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-white">Scrape Logs</h1>
      <p className="mb-4 text-xs text-[var(--text-muted)]">
        View results from the last scrape run for each university.
      </p>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search university or error message…"
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2 text-sm text-white placeholder-[var(--text-muted)] outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs text-white outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
          <option value="partial">Partial</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No logs found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--border)] bg-[var(--bg-card)]">
              <tr>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">University</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Status</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Programs</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Errors</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Scraped At</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-card)]/50">
                  <td className="px-3 py-2.5 text-white">
                    {l.university_name}
                    <span className="ml-1 text-[var(--text-muted)]">({l.university_acronym})</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ color: statusColors[l.status], backgroundColor: statusColors[l.status] + '15' }}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[var(--text-muted)]">{l.programs_found}</td>
                  <td className="max-w-[250px] truncate px-3 py-2.5 text-[var(--text-secondary)]">
                    {l.errors || '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[var(--text-muted)]">
                    {new Date(l.scraped_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
