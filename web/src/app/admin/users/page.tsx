'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface AuthUser {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AuthUser[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    setFeedback(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const resp = await fetch('/.netlify/functions/admin-users-crud', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const result = await resp.json()
      if (!resp.ok) throw new Error(result.error || 'Failed to load users')
      setUsers(result.users as AuthUser[])
    } catch (e) {
      setFeedback({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load users.' })
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
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
      setFeedback({ type: 'success', text: `Deleted ${email}.` })
    } catch (e) {
      setFeedback({ type: 'error', text: e instanceof Error ? e.message : 'Failed to delete user.' })
    }
  }

  if (loading) {
    return <p className="text-sm text-[var(--text-muted)]">Loading users…</p>
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Users</h1>
          <p className="text-xs text-[var(--text-muted)]">All registered auth users</p>
        </div>
        <button
          onClick={fetchUsers}
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

      {users.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No users found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--border)] bg-[var(--bg-card)]">
              <tr>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Email</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Signed Up</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Last Sign In</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-card)]/50">
                  <td className="px-3 py-2.5 text-white">{u.email}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[var(--text-muted)]">
                    {new Date(u.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[var(--text-muted)]">
                    {u.last_sign_in_at
                      ? new Date(u.last_sign_in_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : '—'}
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
        Users are created when someone signs up via the Sign In / Sign Up modal.
      </p>
    </div>
  )
}
