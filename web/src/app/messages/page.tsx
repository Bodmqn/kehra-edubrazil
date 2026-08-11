'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthProvider'
import AdminMessages from '@/components/chat/AdminMessages'

export default function MessagesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const closeMessages = () => {
    if (window.history.length > 1) router.back()
    else router.push('/')
  }

  useEffect(() => {
    if (!user) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMessages()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [user, closeMessages])

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-sm items-center justify-center px-4">
        <p className="text-sm text-[var(--text-muted)]">Checking your session…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-sm items-center justify-center px-4">
        <div className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center">
          <h1 className="mb-2 text-xl font-bold text-white">Messages</h1>
          <p className="mb-4 text-xs text-[var(--text-secondary)]">
            Sign in to message the admin.
          </p>
          <Link
            href="/"
            className="inline-block rounded-lg bg-[var(--bg-accent)] px-4 py-2 text-sm font-medium text-black"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-8 pb-8">
      <div className="fixed inset-0 bg-black/60" onClick={closeMessages} aria-hidden="true" />
      <div className="relative w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Messages</h2>
          <button
            onClick={closeMessages}
            aria-label="Close messages"
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-white transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <p className="mb-4 text-xs text-[var(--text-muted)]">{user.email}</p>
        <AdminMessages />
      </div>
    </div>
  )
}