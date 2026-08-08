'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/AuthProvider'
import AdminMessages from '@/components/chat/AdminMessages'

export default function MessagesPage() {
  const { user, loading } = useAuth()

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
    <div className="mx-auto flex min-h-[70vh] max-w-sm items-start justify-center px-4 py-8">
      <div className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8">
        <h1 className="mb-1 text-xl font-bold text-white">Messages</h1>
        <p className="mb-6 text-xs text-[var(--text-muted)]">{user.email}</p>
        <AdminMessages />
      </div>
    </div>
  )
}