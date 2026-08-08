'use client'

import { useState } from 'react'
import type { ThreadedComment } from '@/lib/chatUtils'
import { formatRelativeTime, maskEmail } from '@/lib/chatUtils'

interface CommentItemProps {
  comment: ThreadedComment
  currentUserId: string
  depth?: number
  onReply: (parentId: string, body: string) => Promise<void>
  onEdit: (id: string, body: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export default function CommentItem({ comment, currentUserId, depth = 0, onReply, onEdit, onDelete }: CommentItemProps) {
  const [replying, setReplying] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const isOwn = comment.user_id === currentUserId
  const initial = (comment.user_email ?? 'u').charAt(0).toUpperCase()

  const startReply = () => {
    setDraft('')
    setEditing(false)
    setReplying((v) => !v)
    setError('')
  }

  const startEdit = () => {
    setDraft(comment.body)
    setReplying(false)
    setEditing((v) => !v)
    setError('')
  }

  const submitReply = async () => {
    if (draft.trim().length === 0 || busy) return
    setBusy(true)
    setError('')
    try {
      await onReply(comment.id, draft.trim())
      setReplying(false)
      setDraft('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to post reply')
    }
    setBusy(false)
  }

  const submitEdit = async () => {
    if (draft.trim().length === 0 || busy) return
    setBusy(true)
    setError('')
    try {
      await onEdit(comment.id, draft.trim())
      setEditing(false)
      setDraft('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to edit comment')
    }
    setBusy(false)
  }

  const confirmDelete = async () => {
    if (!window.confirm('Delete this comment? Replies to it will also be removed.')) return
    setBusy(true)
    setError('')
    try {
      await onDelete(comment.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete comment')
      setBusy(false)
    }
  }

  return (
    <div className={depth > 0 ? 'ml-3 border-l border-[var(--border)] pl-3' : ''}>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-dark)]/60 p-3">
        <div className="mb-1 flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--bg-accent)] text-[10px] font-bold text-black">
            {initial}
          </span>
          <span className="truncate text-[11px] font-medium text-[var(--text-secondary)]">
            {maskEmail(comment.user_email ?? 'user')}
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">{formatRelativeTime(comment.created_at)}</span>
          {isOwn && <span className="rounded bg-[var(--bg-primary)]/15 px-1 py-px text-[9px] uppercase tracking-wide text-[var(--bg-primary)]">You</span>}
        </div>

        {editing ? (
          <div className="space-y-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={2000}
              rows={3}
              className="w-full resize-none rounded border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1.5 text-xs text-white outline-none focus:border-[var(--bg-primary)]"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                onClick={submitEdit}
                disabled={busy || draft.trim().length === 0}
                className="rounded bg-[var(--bg-accent)] px-2.5 py-1 text-[10px] font-medium text-black disabled:opacity-50"
              >
                {busy ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setEditing(false)} className="text-[10px] text-[var(--text-muted)] hover:text-white">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-[var(--text-primary)]">{comment.body}</p>
        )}

        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={startReply}
            className="text-[10px] font-medium text-[var(--bg-primary)] hover:underline"
          >
            Reply
          </button>
          {isOwn && (
            <>
              <button onClick={startEdit} className="text-[10px] text-[var(--text-muted)] hover:text-white">
                Edit
              </button>
              <button onClick={confirmDelete} className="text-[10px] text-[var(--danger)] hover:underline">
                Delete
              </button>
            </>
          )}
        </div>

        {replying && (
          <div className="mt-2 space-y-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={2000}
              rows={2}
              placeholder="Write a reply…"
              className="w-full resize-none rounded border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1.5 text-xs text-white outline-none focus:border-[var(--bg-primary)]"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                onClick={submitReply}
                disabled={busy || draft.trim().length === 0}
                className="rounded bg-[var(--bg-accent)] px-2.5 py-1 text-[10px] font-medium text-black disabled:opacity-50"
              >
                {busy ? 'Posting…' : 'Post Reply'}
              </button>
              <button onClick={() => setReplying(false)} className="text-[10px] text-[var(--text-muted)] hover:text-white">
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && <p className="mt-2 text-[10px] text-[var(--danger)]">{error}</p>}
      </div>

      {comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              depth={Math.min(depth + 1, 1)}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
