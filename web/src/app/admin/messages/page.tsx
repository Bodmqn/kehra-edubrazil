'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatRelativeTime } from '@/lib/chatUtils'
import { sendAdminReply, markThreadRead } from '@/lib/commentsApi'

interface Thread {
  user_id: string
  user_email: string
  unread: number
  messages_count: number
  last_message: string
  last_from_admin: boolean
  last_at: string | null
}

interface ThreadMessage {
  id: string
  user_id: string
  sender_id: string | null
  body: string
  is_admin_reply: boolean
  read_at: string | null
  created_at: string
}

export default function AdminMessagesPage() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [active, setActive] = useState<Thread | null>(null)
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [threadLoading, setThreadLoading] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const loadThreads = useCallback(async () => {
    setLoading(true)
    setFeedback(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')
      const resp = await fetch('/.netlify/functions/admin-messages', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const result = await resp.json()
      if (!resp.ok) throw new Error(result.error || 'Failed to load threads')
      setThreads(result.threads as Thread[])
    } catch (e) {
      setFeedback({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load threads' })
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(loadThreads, 0)
    return () => clearTimeout(timer)
  }, [loadThreads])

  const openThread = async (thread: Thread) => {
    setActive(thread)
    setThreadLoading(true)
    setFeedback(null)
    setDraft('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')
      const resp = await fetch(`/.netlify/functions/admin-messages?thread=${thread.user_id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const result = await resp.json()
      if (!resp.ok) throw new Error(result.error || 'Failed to load thread')
      setMessages(result.messages as ThreadMessage[])
      setActive((prev) => (prev ? { ...prev, user_email: result.user_email ?? prev.user_email } : prev))
    } catch (e) {
      setFeedback({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load thread' })
    }
    setThreadLoading(false)
  }

  const sendReply = async () => {
    if (!active || draft.trim().length === 0 || sending) return
    setSending(true)
    setFeedback(null)
    try {
      await sendAdminReply(active.user_id, draft.trim())
      setDraft('')
      await openThread(active)
      await loadThreads()
    } catch (e) {
      setFeedback({ type: 'error', text: e instanceof Error ? e.message : 'Failed to send reply' })
    }
    setSending(false)
  }

  const markRead = async (thread: Thread) => {
    try {
      await markThreadRead(thread.user_id)
      setActive((prev) => (prev ? { ...prev, unread: 0 } : prev))
      setThreads((prev) => prev.map((t) => (t.user_id === thread.user_id ? { ...t, unread: 0 } : t)))
    } catch (e) {
      setFeedback({ type: 'error', text: e instanceof Error ? e.message : 'Failed to mark thread as read' })
    }
  }

  const deleteThread = async (thread: Thread) => {
    if (!window.confirm(`Delete the entire conversation with ${thread.user_email}?`)) return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')
      const resp = await fetch(`/.netlify/functions/admin-messages?thread=${thread.user_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const result = await resp.json()
      if (!resp.ok) throw new Error(result.error || 'Failed to delete thread')
      setActive(null)
      setMessages([])
      await loadThreads()
      setFeedback({ type: 'success', text: 'Conversation deleted.' })
    } catch (e) {
      setFeedback({ type: 'error', text: e instanceof Error ? e.message : 'Failed to delete thread' })
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-white">User Messages</h1>
          <p className="text-xs text-[var(--text-muted)]">Private conversations from the account page</p>
        </div>
        <button
          onClick={loadThreads}
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

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading conversations…</p>
      ) : threads.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No conversations yet.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_1fr]">
          <div className="overflow-hidden rounded-xl border border-[var(--border)]">
            <div className="max-h-[60vh] overflow-y-auto">
              {threads.map((t) => (
                <button
                  key={t.user_id}
                  onClick={() => openThread(t)}
                  className={`block w-full border-b border-[var(--border)] px-3 py-2.5 text-left transition-colors last:border-0 ${
                    active?.user_id === t.user_id ? 'bg-[var(--bg-primary)]/10' : 'hover:bg-[var(--bg-card)]/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium text-white">{t.user_email}</span>
                    {t.unread > 0 && (
                      <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[9px] font-bold text-white">
                        {t.unread}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-[11px] text-[var(--text-muted)]">
                    {t.last_from_admin ? 'You: ' : ''}{t.last_message}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                    {t.messages_count} message{t.messages_count === 1 ? '' : 's'}
                    {t.last_at ? ` • ${formatRelativeTime(t.last_at)}` : ''}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
            {!active ? (
              <p className="py-10 text-center text-xs text-[var(--text-muted)]">Select a conversation to view it.</p>
            ) : (
              <>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-white">{active.user_email}</h2>
                    <p className="text-[10px] text-[var(--text-muted)]">{active.messages_count} messages in thread</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {active.unread > 0 && (
                      <button
                        onClick={() => markRead(active)}
                        className="rounded border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--text-secondary)] hover:text-white"
                      >
                        Mark Read
                      </button>
                    )}
                    <button
                      onClick={() => deleteThread(active)}
                      className="rounded border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--danger)] hover:bg-[var(--danger)]/10"
                    >
                      Delete Thread
                    </button>
                    <button
                      onClick={() => { setActive(null); setMessages([]) }}
                      className="rounded border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--text-secondary)] hover:text-white lg:hidden"
                    >
                      Back
                    </button>
                  </div>
                </div>

                <div className="mb-3 max-h-80 space-y-2 overflow-y-auto">
                  {threadLoading ? (
                    <p className="py-6 text-center text-xs text-[var(--text-muted)]">Loading conversation…</p>
                  ) : messages.length === 0 ? (
                    <p className="py-6 text-center text-xs text-[var(--text-muted)]">No messages in this thread.</p>
                  ) : (
                    messages.map((m) => (
                      <div key={m.id} className={`flex ${m.is_admin_reply ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                            m.is_admin_reply
                              ? 'bg-[var(--bg-accent)] text-black'
                              : 'border border-[var(--border)] bg-[var(--bg-dark)] text-[var(--text-primary)]'
                          }`}
                        >
                          <p className={`mb-0.5 text-[9px] font-semibold uppercase tracking-wide ${m.is_admin_reply ? 'text-black/70' : 'text-[var(--bg-primary)]'}`}>
                            {m.is_admin_reply ? 'You (Admin)' : active.user_email}
                          </p>
                          <p className="whitespace-pre-wrap break-words">{m.body}</p>
                          <p className={`mt-1 text-[9px] ${m.is_admin_reply ? 'text-black/60' : 'text-[var(--text-muted)]'}`}>
                            {formatRelativeTime(m.created_at)}
                            {m.is_admin_reply && !m.read_at ? ' • unread' : ''}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    maxLength={4000}
                    rows={2}
                    placeholder="Reply as admin…"
                    className="flex-1 resize-none rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2 text-xs text-white placeholder-[var(--text-muted)] outline-none focus:border-[var(--bg-primary)]"
                  />
                  <button
                    onClick={sendReply}
                    disabled={sending || draft.trim().length === 0}
                    className="rounded-lg bg-[var(--bg-accent)] px-4 py-2 text-xs font-medium text-black disabled:opacity-50"
                  >
                    {sending ? 'Sending…' : 'Reply'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}