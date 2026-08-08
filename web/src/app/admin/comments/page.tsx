'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ChatComment, CommentCategory } from '@/lib/chatUtils'
import { formatRelativeTime } from '@/lib/chatUtils'
import { fetchComments, updateComment, deleteComment } from '@/lib/commentsApi'

type Filter = 'all' | CommentCategory

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<ChatComment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setFeedback(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')
      const data = await fetchComments()
      setComments(data)
    } catch (e) {
      setFeedback({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load comments' })
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(load, 0)
    return () => clearTimeout(timer)
  }, [load])

  const startEdit = (c: ChatComment) => {
    setEditingId(c.id)
    setEditDraft(c.body)
  }

  const saveEdit = async (id: string) => {
    if (editDraft.trim().length === 0) return
    setBusyId(id)
    setFeedback(null)
    try {
      await updateComment(id, editDraft.trim())
      setEditingId(null)
      setEditDraft('')
      await load()
      setFeedback({ type: 'success', text: 'Comment updated.' })
    } catch (e) {
      setFeedback({ type: 'error', text: e instanceof Error ? e.message : 'Failed to update comment' })
    }
    setBusyId(null)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this comment? Replies to it will also be removed.')) return
    setBusyId(id)
    setFeedback(null)
    try {
      await deleteComment(id)
      await load()
      setFeedback({ type: 'success', text: 'Comment deleted.' })
    } catch (e) {
      setFeedback({ type: 'error', text: e instanceof Error ? e.message : 'Failed to delete comment' })
    }
    setBusyId(null)
  }

  const filtered = comments.filter((c) => filter === 'all' || c.category === filter)

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-white">User Comments</h1>
          <p className="text-xs text-[var(--text-muted)]">All comments from the community chat widget</p>
        </div>
        <button
          onClick={load}
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-white"
        >
          Refresh
        </button>
      </div>

      <div className="mb-4 flex gap-1">
        {(['all', 'general', 'advisory'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              filter === f ? 'bg-[var(--bg-primary)]/15 text-[var(--bg-primary)]' : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            {f}
            <span className="ml-1.5 text-[10px] text-[var(--text-muted)]">
              {f === 'all' ? comments.length : comments.filter((c) => c.category === f).length}
            </span>
          </button>
        ))}
      </div>

      {feedback && (
        <p className={`mb-3 text-xs ${feedback.type === 'success' ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
          {feedback.text}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading comments…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No comments found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full min-w-[640px]">
            <thead className="border-b border-[var(--border)] bg-[var(--bg-card)]">
              <tr>
                <th className="px-3 py-2.5 text-left font-medium text-[var(--text-secondary)]">Author</th>
                <th className="px-3 py-2.5 text-left font-medium text-[var(--text-secondary)]">Category</th>
                <th className="px-3 py-2.5 text-left font-medium text-[var(--text-secondary)]">Comment</th>
                <th className="px-3 py-2.5 text-left font-medium text-[var(--text-secondary)]">Posted</th>
                <th className="px-3 py-2.5 text-left font-medium text-[var(--text-secondary)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-[var(--border)] align-top last:border-0 hover:bg-[var(--bg-card)]/50">
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-[var(--text-muted)]">
                    {c.user_email ?? 'user'}
                    {c.parent_id && <span className="ml-1.5 rounded bg-[var(--bg-primary)]/10 px-1 py-px text-[9px] text-[var(--bg-primary)]">reply</span>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span className={`rounded px-1.5 py-px text-[10px] font-medium ${c.category === 'advisory' ? 'bg-[var(--warning)]/15 text-[var(--warning)]' : 'bg-[var(--bg-primary)]/15 text-[var(--bg-primary)]'}`}>
                      {c.category}
                    </span>
                  </td>
                  <td className="max-w-md px-3 py-2.5">
                    {editingId === c.id ? (
                      <div className="flex items-start gap-2">
                        <textarea
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          maxLength={2000}
                          rows={3}
                          className="w-full resize-none rounded border border-[var(--border)] bg-[var(--bg-dark)] px-2.5 py-1.5 text-xs text-white outline-none"
                        />
                        <button
                          onClick={() => saveEdit(c.id)}
                          disabled={busyId === c.id || editDraft.trim().length === 0}
                          className="shrink-0 rounded bg-[var(--bg-accent)] px-2 py-1 text-[10px] font-medium text-black disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button onClick={() => setEditingId(null)} className="shrink-0 text-[10px] text-[var(--text-muted)]">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap break-words text-xs text-[var(--text-primary)]">{c.body}</p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-[var(--text-muted)]">
                    {formatRelativeTime(c.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(c)}
                        disabled={busyId === c.id}
                        className="rounded border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--text-secondary)] hover:text-white disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={busyId === c.id}
                        className="rounded border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--danger)] hover:bg-[var(--danger)]/10 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
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