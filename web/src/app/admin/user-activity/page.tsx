'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface UserActivity {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  activity: {
    last_active_at: string
    user_agent: string
    active_days_month: number
    active_days_total: number
  } | null
}

interface Stats {
  activeToday: number
  activeThisWeek: number
  activeThisMonth: number
  totalUsers: number
}

export default function AdminUserActivityPage() {
  const [users, setUsers] = useState<UserActivity[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setFeedback(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')

      const params = new URLSearchParams()
      if (search) params.set('search', search)

      const resp = await fetch(`/.netlify/functions/user-activity-admin?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const result = await resp.json()
      if (!resp.ok) throw new Error(result.error || 'Failed to load data')
      setStats(result.stats)
      setUsers(result.users as UserActivity[])
    } catch (e) {
      setFeedback({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load data.' })
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDelete = async (id: string, email: string) => {
    if (!window.confirm(`Delete user ${email}? This removes their account and all related data.`)) return
    setFeedback(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')

      const resp = await fetch(`/.netlify/functions/admin-users-crud?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const result = await resp.json()
      if (!resp.ok) throw new Error(result.error || 'Failed to delete user')
      setUsers((prev) => prev.filter((u) => u.id !== id))
      if (stats) setStats({ ...stats, totalUsers: stats.totalUsers - 1 })
      setFeedback({ type: 'success', text: `Deleted ${email}.` })
    } catch (e) {
      setFeedback({ type: 'error', text: e instanceof Error ? e.message : 'Failed to delete user.' })
    }
  }

  const formatUA = (ua: string) => {
    if (!ua) return '—'
    if (ua.includes('Mobile')) return '📱 Mobile'
    if (ua.includes('Tablet')) return '📱 Tablet'
    if (ua.includes('Mac')) return '💻 macOS'
    if (ua.includes('Windows')) return '💻 Windows'
    if (ua.includes('Linux')) return '💻 Linux'
    if (ua.includes('iPhone') || ua.includes('iPad')) return '📱 iOS'
    if (ua.includes('Android')) return '📱 Android'
    return ua.split(' ')[0].slice(0, 30)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">User Activity</h1>
          <p className="text-xs text-[var(--text-muted)]">Minimal activity tracking — no IPs or location data</p>
        </div>
        <button
          onClick={fetchData}
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-white"
        >
          Refresh
        </button>
      </div>

      {feedback && (
        <p className={`mb-3 text-xs ${feedback.type === 'success' ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
          {feedback.text}
        </p>
      )}

      {/* Stats cards */}
      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <p className="text-2xl font-bold text-[var(--bg-primary)]">{stats.activeToday}</p>
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">Active Today</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <p className="text-2xl font-bold text-[var(--success)]">{stats.activeThisWeek}</p>
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">Active This Week</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <p className="text-2xl font-bold text-[var(--warning)]">{stats.activeThisMonth}</p>
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">Active This Month</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <p className="text-2xl font-bold text-[var(--bg-accent)]">{stats.totalUsers}</p>
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">Total Registered Users</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email…"
          onKeyDown={(e) => { if (e.key === 'Enter') fetchData() }}
          className="w-full max-w-xs rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-1.5 text-xs text-white outline-none placeholder:text-[var(--text-muted)]"
        />
      </div>

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No user activity data yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--border)] bg-[var(--bg-card)]">
              <tr>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Email</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Last Active</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Device</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Active Days (Month)</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Active Days (Total)</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-card)]/50">
                  <td className="px-3 py-2.5 text-white">{u.email}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[var(--text-muted)]">
                    {u.activity?.last_active_at
                      ? new Date(u.activity.last_active_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })
                      : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-[var(--text-muted)]">
                    {formatUA(u.activity?.user_agent ?? '')}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`font-medium ${(u.activity?.active_days_month ?? 0) > 0 ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}`}>
                      {u.activity?.active_days_month ?? 0}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`font-medium ${(u.activity?.active_days_total ?? 0) > 0 ? 'text-[var(--bg-primary)]' : 'text-[var(--text-muted)]'}`}>
                      {u.activity?.active_days_total ?? 0}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => handleDelete(u.id, u.email)}
                      className="rounded border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--danger)] hover:bg-[var(--danger)]/10"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-[var(--text-muted)]">
        Tracks non-admin users only. One row per active day. No IP addresses or location data stored.
      </p>
    </div>
  )
}
