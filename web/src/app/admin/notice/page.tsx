'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { GeneralNotice } from '@/lib/generalNotices'

export default function AdminNoticePage() {
  const [notices, setNotices] = useState<GeneralNotice[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [type, setType] = useState<'info' | 'warning' | 'alert'>('info')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchNotices()
  }, [])

  async function fetchNotices() {
    const { data } = await supabase
      .from('general_notices')
      .select('*')
      .order('created_at', { ascending: false })
    setNotices((data ?? []) as GeneralNotice[])
    setLoading(false)
  }

  const activeNotice = notices.find((n) => n.active)

  const handleSave = async () => {
    if (!message.trim()) return
    setSaving(true)
    setFeedback(null)

    try {
      if (editingId) {
        const { error } = await supabase
          .from('general_notices')
          .update({ message: message.trim(), type, updated_at: new Date().toISOString() })
          .eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('general_notices').insert({
          message: message.trim(),
          type,
          active: false,
        })
        if (error) throw error
      }

      setFeedback({ type: 'success', text: editingId ? 'Notice updated.' : 'Notice created.' })
      setMessage('')
      setType('info')
      setEditingId(null)
      fetchNotices()
    } catch (e) {
      setFeedback({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save notice.' })
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (notice: GeneralNotice) => {
    try {
      // Deactivate all, then activate the selected one
      await supabase.from('general_notices').update({ active: false }).neq('id', 'none')
      if (!notice.active) {
        await supabase
          .from('general_notices')
          .update({ active: true, updated_at: new Date().toISOString() })
          .eq('id', notice.id)
      }
      fetchNotices()
    } catch {
      setFeedback({ type: 'error', text: 'Failed to toggle notice.' })
    }
  }

  const startEdit = (notice: GeneralNotice) => {
    setMessage(notice.message)
    setType(notice.type)
    setEditingId(notice.id)
    setFeedback(null)
  }

  const cancelEdit = () => {
    setMessage('')
    setType('info')
    setEditingId(null)
    setFeedback(null)
  }

  if (loading) {
    return <p className="text-sm text-[var(--text-muted)]">Loading notices…</p>
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-white">General Notice</h1>
      <p className="mb-4 text-xs text-[var(--text-muted)]">
        Manage the site-wide announcement banner.
      </p>

      {feedback && (
        <p
          className={`mb-3 text-xs ${
            feedback.type === 'success' ? 'text-[var(--success)]' : 'text-[var(--danger)]'
          }`}
        >
          {feedback.text}
        </p>
      )}

      {/* Active notice indicator */}
      <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <h3 className="mb-2 text-xs font-semibold text-white">
          {activeNotice ? 'Active Notice' : 'No Active Notice'}
        </h3>
        {activeNotice && (
          <p className="text-xs text-[var(--text-secondary)]">{activeNotice.message}</p>
        )}
      </div>

      {/* Editor */}
      <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <h3 className="mb-3 text-sm font-semibold text-white">
          {editingId ? 'Edit Notice' : 'Create Notice'}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] text-[var(--text-secondary)]">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="rounded border border-[var(--border)] bg-[var(--bg-dark)] px-2.5 py-1.5 text-xs text-white outline-none"
            >
              <option value="info">Info (ℹ️)</option>
              <option value="warning">Warning (⚠️)</option>
              <option value="alert">Alert (🚨)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-[var(--text-secondary)]">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full resize-none rounded border border-[var(--border)] bg-[var(--bg-dark)] px-2.5 py-1.5 text-xs text-white outline-none"
              placeholder="Write your announcement…"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !message.trim()}
              className="rounded bg-[var(--bg-accent)] px-3 py-1.5 text-xs font-medium text-black disabled:opacity-50"
            >
              {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
            </button>
            {editingId && (
              <button
                onClick={cancelEdit}
                className="rounded border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)]"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* All notices */}
      <Link
        href="/admin/notice/history"
        className="mb-3 inline-block text-xs text-[var(--bg-primary)] hover:underline"
      >
        View All Notices →
      </Link>

      {notices.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--border)] bg-[var(--bg-card)]">
              <tr>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Active</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Type</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Message</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Created</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {notices.map((n) => (
                <tr key={n.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-card)]/50">
                  <td className="px-3 py-2.5">
                    {n.active ? (
                      <span className="text-[var(--success)]">Active</span>
                    ) : (
                      <span className="text-[var(--text-muted)]">Inactive</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-[var(--text-secondary)]">
                    {n.type === 'info' ? 'ℹ️' : n.type === 'warning' ? '⚠️' : '🚨'}
                  </td>
                  <td className="max-w-[250px] truncate px-3 py-2.5 text-white">{n.message}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[var(--text-muted)]">
                    {new Date(n.created_at).toLocaleDateString()}
                  </td>
                  <td className="flex gap-1 px-3 py-2.5">
                    <button
                      onClick={() => toggleActive(n)}
                      className={`rounded px-2 py-1 text-[10px] ${
                        n.active
                          ? 'border border-[var(--border)] text-[var(--text-secondary)]'
                          : 'bg-[var(--bg-primary)] text-white'
                      }`}
                    >
                      {n.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => startEdit(n)}
                      className="rounded border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--text-secondary)] hover:text-white"
                    >
                      Edit
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
