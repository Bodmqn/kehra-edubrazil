'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { GeneralNotice } from '@/lib/generalNotices'

export default function AdminNoticeHistoryPage() {
  const [notices, setNotices] = useState<GeneralNotice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('general_notices')
        .select('*')
        .order('created_at', { ascending: false })
      setNotices((data ?? []) as GeneralNotice[])
      setLoading(false)
    }
    fetch()
  }, [])

  const filtered = search
    ? notices.filter((n) => n.message.toLowerCase().includes(search.toLowerCase()))
    : notices

  if (loading) {
    return <p className="text-sm text-[var(--text-muted)]">Loading history…</p>
  }

  return (
    <div>
      <Link href="/admin/notice" className="text-xs text-[var(--bg-primary)] hover:underline">
        ← Back to Notice Editor
      </Link>
      <h1 className="mb-1 mt-1 text-xl font-bold text-white">Notice History</h1>
      <p className="mb-4 text-xs text-[var(--text-muted)]">All past and current notices.</p>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search notices…"
        className="mb-4 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2 text-sm text-white placeholder-[var(--text-muted)] outline-none"
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No notices found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--border)] bg-[var(--bg-card)]">
              <tr>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Date</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Type</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Message</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((n) => (
                <tr key={n.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-card)]/50">
                  <td className="whitespace-nowrap px-3 py-2.5 text-[var(--text-muted)]">
                    {new Date(n.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-3 py-2.5 text-[var(--text-secondary)]">
                    {n.type === 'info' ? 'ℹ️ Info' : n.type === 'warning' ? '⚠️ Warning' : '🚨 Alert'}
                  </td>
                  <td className="max-w-[350px] truncate px-3 py-2.5 text-white">{n.message}</td>
                  <td className="px-3 py-2.5">
                    {n.active ? (
                      <span className="rounded bg-[var(--success)]/10 px-1.5 py-0.5 text-[10px] text-[var(--success)]">
                        Active
                      </span>
                    ) : (
                      <span className="text-[var(--text-muted)]">Inactive</span>
                    )}
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
