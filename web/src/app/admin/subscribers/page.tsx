'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Subscriber {
  id: string
  email: string
  created_at: string
}

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    supabase
      .from('email_subscriptions')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setSubscribers((data ?? []) as Subscriber[])
        setLoading(false)
      })
  }, [])

  const handleDelete = async (id: string, email: string) => {
    if (!window.confirm(`Remove ${email} from subscribers?`)) return
    try {
      const { error } = await supabase.from('email_subscriptions').delete().eq('id', id)
      if (error) throw error
      setSubscribers((prev) => prev.filter((s) => s.id !== id))
      setMessage({ type: 'success', text: `Removed ${email}.` })
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to remove subscriber.' })
    }
  }

  const exportCSV = () => {
    const header = 'Email,Subscribed Date\n'
    const rows = subscribers.map((s) => `${s.email},${new Date(s.created_at).toISOString()}`).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'email-subscribers.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = search
    ? subscribers.filter((s) => s.email.toLowerCase().includes(search.toLowerCase()))
    : subscribers

  if (loading) {
    return <p className="text-sm text-[var(--text-muted)]">Loading subscribers…</p>
  }

  return (
    <div>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Email Subscribers</h1>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {subscribers.length} subscriber{subscribers.length !== 1 ? 's' : ''}
          </p>
        </div>
        {subscribers.length > 0 && (
          <button
            onClick={exportCSV}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-white"
          >
            Export CSV
          </button>
        )}
      </div>

      {message && (
        <p
          className={`mb-3 text-xs ${
            message.type === 'success' ? 'text-[var(--success)]' : 'text-[var(--danger)]'
          }`}
        >
          {message.text}
        </p>
      )}

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by email…"
        className="mb-4 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2 text-sm text-white placeholder-[var(--text-muted)] outline-none"
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">
          {subscribers.length === 0 ? 'No subscribers yet.' : 'No subscribers match your search.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--border)] bg-[var(--bg-card)]">
              <tr>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Email</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Subscribed</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-card)]/50">
                  <td className="px-3 py-2.5 text-white">{s.email}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[var(--text-muted)]">
                    {new Date(s.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => handleDelete(s.id, s.email)}
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
    </div>
  )
}
