'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/AuthProvider'
import LoginModal from '@/components/auth/LoginModal'
import CommentItem from '@/components/chat/CommentItem'
import type { ChatComment, CommentCategory } from '@/lib/chatUtils'
import { countByCategory, topLevelComments } from '@/lib/chatUtils'
import { fetchComments, createComment, updateComment, deleteComment } from '@/lib/commentsApi'

const CATEGORIES: { key: CommentCategory; label: string; hint: string }[] = [
  { key: 'general', label: 'General', hint: 'General discussion and feedback' },
  { key: 'advisory', label: 'Advisory', hint: 'Advice and improvement suggestions' },
]

function ChatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export default function ChatWidget() {
  const pathname = usePathname()
  const { user, loading: authLoading, signIn, signUp, resetPassword } = useAuth()

  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<CommentCategory>('general')
  const [comments, setComments] = useState<ChatComment[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [draft, setDraft] = useState('')
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState('')
  const [loginOpen, setLoginOpen] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)

  const isHiddenRoute = pathname.startsWith('/admin')
  const isOpen = open && !isHiddenRoute

  const loadComments = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const data = await fetchComments()
      setComments(data)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load comments')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (isOpen && user) {
      const timer = setTimeout(loadComments, 0)
      return () => clearTimeout(timer)
    }
  }, [isOpen, user, loadComments])

  useEffect(() => {
    if (!open || isHiddenRoute) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, isHiddenRoute])

  const submitNewComment = async () => {
    if (draft.trim().length === 0 || posting || !user) return
    setPosting(true)
    setPostError('')
    try {
      await createComment({ category, body: draft.trim() })
      setDraft('')
      await loadComments()
    } catch (e) {
      setPostError(e instanceof Error ? e.message : 'Failed to post comment')
    }
    setPosting(false)
  }

  const handleReply = async (parentId: string, body: string) => {
    await createComment({ category, body, parent_id: parentId })
    await loadComments()
  }

  const handleEdit = async (id: string, body: string) => {
    await updateComment(id, body)
    await loadComments()
  }

  const handleDelete = async (id: string) => {
    await deleteComment(id)
    await loadComments()
  }

  if (isHiddenRoute) return null

  const counts = countByCategory(comments)

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={isOpen ? 'Close comments panel' : 'Open comments panel'}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg-accent)] text-black shadow-lg shadow-black/40 transition-transform hover:scale-105"
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        ref={panelRef}
        role="dialog"
        aria-label="Comments"
        className={`fixed inset-y-0 right-0 z-[70] flex w-full max-w-md flex-col bg-[var(--bg-card)] shadow-2xl shadow-black/50 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'pointer-events-none translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-white">Community Comments</h2>
            <p className="text-[10px] text-[var(--text-muted)]">Share feedback and advice with the community</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close panel"
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-white"
          >
            <CloseIcon />
          </button>
        </div>

        {!user ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              {authLoading ? 'Checking your session…' : 'Sign in to view and post comments.'}
            </p>
            {!authLoading && (
              <button
                onClick={() => { setLoginOpen(true); setOpen(false) }}
                className="rounded-lg bg-[var(--bg-accent)] px-4 py-2 text-sm font-medium text-black hover:opacity-90"
              >
                Sign In
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex gap-1 border-b border-[var(--border)] px-4 pt-3">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={`rounded-t-lg px-3 py-2 text-xs font-medium transition-colors ${
                    category === c.key
                      ? 'border border-b-0 border-[var(--border)] bg-[var(--bg-dark)] text-white'
                      : 'text-[var(--text-muted)] hover:text-white'
                  }`}
                >
                  {c.label}
                  {counts[c.key] > 0 && (
                    <span className="ml-1.5 rounded-full bg-[var(--bg-primary)]/20 px-1.5 py-px text-[9px] text-[var(--bg-primary)]">
                      {counts[c.key]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="border-b border-[var(--border)] px-4 py-3">
              <p className="mb-2 text-[10px] text-[var(--text-muted)]">
                {CATEGORIES.find((c) => c.key === category)?.hint}
              </p>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={2000}
                rows={3}
                placeholder={`Post a ${category} comment…`}
                className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2 text-xs text-white placeholder-[var(--text-muted)] outline-none focus:border-[var(--bg-primary)]"
              />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-[10px] text-[var(--text-muted)]">{draft.length}/2000</p>
                <button
                  onClick={submitNewComment}
                  disabled={posting || draft.trim().length === 0}
                  className="rounded-lg bg-[var(--bg-accent)] px-3 py-1.5 text-xs font-medium text-black disabled:opacity-50"
                >
                  {posting ? 'Posting…' : 'Post Comment'}
                </button>
              </div>
              {postError && <p className="mt-1 text-[10px] text-[var(--danger)]">{postError}</p>}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {loading ? (
                <p className="py-8 text-center text-xs text-[var(--text-muted)]">Loading comments…</p>
              ) : loadError ? (
                <div className="py-8 text-center">
                  <p className="mb-2 text-xs text-[var(--danger)]">{loadError}</p>
                  <button onClick={loadComments} className="text-xs text-[var(--bg-primary)] hover:underline">
                    Try again
                  </button>
                </div>
              ) : comments.length === 0 ? (
                <p className="py-8 text-center text-xs text-[var(--text-muted)]">
                  No comments yet. Be the first to start a {category} discussion!
                </p>
              ) : (
                <div className="space-y-3">
                  {topLevelComments(comments.filter((c) => c.category === category))
                    .sort((a, b) => b.created_at.localeCompare(a.created_at))
                    .map((root) => (
                      <CommentItem
                        key={root.id}
                        comment={root}
                        currentUserId={user.id}
                        onReply={handleReply}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => setOpen(true)}
        onSignIn={signIn}
        onSignUp={signUp}
        onResetPassword={resetPassword}
      />
    </>
  )
}
