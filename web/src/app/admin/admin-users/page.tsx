'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface AdminUser {
  id: string
  email: string
  created_at: string
}

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    async function fetch() {
      try {
        const { data, error } = await supabase.from('admin_users').select('*').order('created_at', { ascending: false })
        if (error) throw error
        setAdmins((data ?? []) as AdminUser[])
      } catch (e) {
        setFeedback({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load admin users.' })
      }
      setLoading(false)
    }
    fetch()
  }, [])

  const handleAdd = async () => {
    const email = newEmail.trim().toLowerCase()
    if (!email) return
    setSaving(true)
    setFeedback(null)
    try {
      const { error } = await supabase.from('admin_users').insert({ email })
      if (error) throw error
      setAdmins((prev) => [{ id: '', email, created_at: new Date().toISOString() }, ...prev])
      setNewEmail('')
      setFeedback({ type: 'success', text: `${email} added as admin.` })
    } catch (e) {
      setFeedback({ type: 'error', text: e instanceof Error ? e.message : 'Failed to add admin.' })
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (id: string, email: string) => {
    if (!window.confirm(`Remove ${email} from admins?`)) return
    try {
      const { error } = await supabase.from('admin_users').delete().eq('id', id)
      if (error) throw error
      setAdmins((prev) => prev.filter((a) => a.id !== id))
      setFeedback({ type: 'success', text: `Removed ${email}.` })
    } catch (e) {
      setFeedback({ type: 'error', text: e instanceof Error ? e.message : 'Failed to remove admin.' })
    }
  }

  if (loading) {
    return <p className="text-sm text-[var(--text-muted)]">Loading admin users…</p>
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-white">Admin Users</h1>
      <p className="mb-4 text-xs text-[var(--text-muted)]">
        Manage who can access the admin panel. Users must also have an account in Supabase Auth.
      </p>

      {feedback && (
        <p className={`mb-3 text-xs ${feedback.type === 'success' ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
          {feedback.text}
        </p>
      )}

      <div className="mb-6 flex gap-2">
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="admin@example.com"
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2 text-sm text-white placeholder-[var(--text-muted)] outline-none"
        />
        <button
          onClick={handleAdd}
          disabled={saving || !newEmail.trim()}
          className="rounded-lg bg-[var(--bg-primary)] px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
          style={{ color: 'white' }}
        >
          {saving ? 'Adding…' : 'Add Admin'}
        </button>
      </div>

      {admins.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No admin users found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--border)] bg-[var(--bg-card)]">
              <tr>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Email</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Added</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-card)]/50">
                  <td className="px-3 py-2.5 text-white">{a.email}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[var(--text-muted)]">
                    {new Date(a.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => handleRemove(a.id, a.email)}
                      className="rounded border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--danger)] hover:bg-[var(--danger)]/10"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-[var(--text-muted)]">
        Note: The user must also exist in{' '}
        <a
          href="https://supabase.com/dashboard/project/_/auth/users"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--bg-primary)] hover:underline"
        >
          Supabase Auth
        </a>{' '}
        with a password to sign in.
      </p>
    </div>
  )
}
