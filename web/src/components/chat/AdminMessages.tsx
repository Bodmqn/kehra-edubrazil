'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/lib/AuthProvider'
import { formatRelativeTime } from '@/lib/chatUtils'

export interface DirectMessage {
  id: string
  user_id: string
  sender_id: string | null
  body: string
  is_admin_reply: boolean
  read_at: string | null
  created_at: string
}

export default function AdminMessages() {
  const user = useUser()
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    try {
      const { data, error: fetchError } = await supabase
        .from('direct_messages')
        .select('id, user_id, sender_id, body, is_admin_reply, read_at, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError
      setMessages((data ?? []) as DirectMessage[])
      setUnread((data ?? []).filter((m) => m.is_admin_reply && !m.read_at).length)

      const unreadIds = (data ?? [])
        .filter((m) => m.is_admin_reply && !m.read_at)
        .map((m) => m.id)
      if (unreadIds.length > 0) {
        await supabase
          .from('direct_messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadIds)
        setMessages((prev) => prev.map((m) => (unreadIds.includes(m.id) ? { ...m, read_at: new Date().toISOString() } : m)))
        setUnread(0)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load messages')
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    const timer = setTimeout(fetchMessages, 0)
    return () => clearTimeout(timer)
  }, [fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const sendMessage = async () => {
    if (!user || draft.trim().length === 0 || sending) return
    setSending(true)
    setError('')
    try {
      const { error: insertError } = await supabase.from('direct_messages').insert({
        user_id: user.id,
        sender_id: null,
        body: draft.trim(),
        is_admin_reply: false,
      })
      if (insertError) throw insertError
      setDraft('')
      await fetchMessages()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send message')
    }
    setSending(false)
  }

  return (
    <div className="mt-2">
      <div className="mb-1 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-white">Message Admin</h2>
        {unread > 0 && (
          <span className="rounded-full bg-[var(--danger)] px-1.5 py-px text-[9px] font-bold text-white">
            {unread} new
          </span>
        )}
      </div>
      <p className="mb-4 text-[11px] text-[var(--text-muted)]">
        Private conversation with the EduBrazil team. For help or improvement suggestions.
      </p>

      <div className="max-h-80 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg-dark)] p-3">
        {loading ? (
          <p className="py-6 text-center text-xs text-[var(--text-muted)]">Loading conversation…</p>
        ) : messages.length === 0 ? (
          <p className="py-6 text-center text-xs text-[var(--text-muted)]">
            No messages yet. Send a message and the team will reply here.
          </p>
        ) : (
          <div className="space-y-2">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.is_admin_reply ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    m.is_admin_reply
                      ? 'border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)]'
                      : 'bg-[var(--bg-accent)] text-black'
                  }`}
                >
                  <p className={`mb-0.5 text-[9px] font-semibold uppercase tracking-wide ${m.is_admin_reply ? 'text-[var(--bg-primary)]' : 'text-black/70'}`}>
                    {m.is_admin_reply ? 'Admin' : 'You'}
                  </p>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`mt-1 text-[9px] ${m.is_admin_reply ? 'text-[var(--text-muted)]' : 'text-black/60'}`}>
                    {formatRelativeTime(m.created_at)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={4000}
          rows={2}
          placeholder="Write a message to the admin…"
          className="flex-1 resize-none rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2 text-xs text-white placeholder-[var(--text-muted)] outline-none focus:border-[var(--bg-primary)]"
        />
        <button
          onClick={sendMessage}
          disabled={sending || draft.trim().length === 0}
          className="rounded-lg bg-[var(--bg-accent)] px-4 py-2 text-xs font-medium text-black disabled:opacity-50"
        >
          {sending ? 'Sending…' : 'Send'}
        </button>
      </div>
      <p className="mt-1 text-right text-[10px] text-[var(--text-muted)]">{draft.length}/4000</p>
      {error && <p className="mt-1 text-[10px] text-[var(--danger)]">{error}</p>}
    </div>
  )
}