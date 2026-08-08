'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthProvider'
import AdminMessages from '@/components/chat/AdminMessages'

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

export default function AccountPage() {
  const { user, loading, needsPasswordChange, changePassword } = useAuth()
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [doneForced, setDoneForced] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [activeTab, setActiveTab] = useState<'password' | 'messages'>('password')

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword) {
      setStatus('error')
      setErrorMsg('Enter your current password.')
      return
    }
    if (newPassword.length < 6) {
      setStatus('error')
      setErrorMsg('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setStatus('error')
      setErrorMsg('Passwords do not match.')
      return
    }
    const wasForced = needsPasswordChange
    setStatus('loading')
    setErrorMsg('')
    const { error } = await changePassword(currentPassword, newPassword)
    if (error) {
      setStatus('error')
      setErrorMsg(error)
    } else {
      setStatus('done')
      setDoneForced(wasForced)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

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
          <h1 className="mb-2 text-xl font-bold text-white">Account</h1>
          <p className="mb-4 text-xs text-[var(--text-secondary)]">
            Sign in to change your password and manage your account.
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
        <div className="mb-1 flex items-start justify-between gap-2">
          <h1 className="text-xl font-bold text-white">Account</h1>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close account page"
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-white transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <p className="mb-6 text-xs text-[var(--text-muted)]">{user.email}</p>

        {needsPasswordChange && (
          <div className="mb-4 rounded-lg border border-[var(--warning)]/40 bg-[var(--warning)]/10 p-3">
            <p className="text-xs text-[var(--warning)]">
              An admin reset your password. Please set a new password before continuing.
            </p>
          </div>
        )}

        {!needsPasswordChange && (
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] p-1">
            <button
              type="button"
              onClick={() => setActiveTab('password')}
              className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === 'password'
                  ? 'bg-[var(--bg-accent)] text-black'
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              Change Password
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('messages')}
              className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === 'messages'
                  ? 'bg-[var(--bg-accent)] text-black'
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              Message Admin
            </button>
          </div>
        )}

        {activeTab === 'messages' && !needsPasswordChange ? (
          <AdminMessages />
        ) : (
          <>
        <h2 className="mb-4 text-sm font-semibold text-white">Change Password</h2>

        {status === 'done' ? (
          <div className="space-y-3">
            <p className="text-sm text-[var(--success)]">
              {doneForced ? 'Password updated. You are all set!' : 'Password updated!'}
            </p>
            <Link
              href="/tracker"
              className="inline-block rounded-lg bg-[var(--bg-accent)] px-4 py-2 text-sm font-medium text-black"
            >
              Go to My Tracker
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-[11px] text-[var(--text-secondary)]">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                  disabled={status === 'loading'}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-4 py-2.5 pr-10 text-sm text-white placeholder-[var(--text-muted)] outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors"
                >
                  {showCurrentPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-[var(--text-secondary)]">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  disabled={status === 'loading'}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-4 py-2.5 pr-10 text-sm text-white placeholder-[var(--text-muted)] outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors"
                >
                  {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-[var(--text-secondary)]">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  required
                  disabled={status === 'loading'}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-4 py-2.5 pr-10 text-sm text-white placeholder-[var(--text-muted)] outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            {status === 'error' && (
              <p className="text-xs text-[var(--danger)]">{errorMsg}</p>
            )}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full rounded-lg bg-[var(--bg-accent)] px-4 py-2.5 text-sm font-medium text-black hover:opacity-90 disabled:opacity-50"
            >
              {status === 'loading' ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        )}
          </>
        )}
      </div>
    </div>
  )
}
