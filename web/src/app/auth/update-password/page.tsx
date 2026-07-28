'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'checking' | 'ready' | 'done' | 'error'>('checking')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
        setStatus('ready')
      }
    })

    // Also check if already signed in via hash
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatus('ready')
      } else {
        // If no session after 2s, likely an invalid/expired link
        setTimeout(() => {
          setStatus('error')
          setErrorMsg('Invalid or expired reset link. Please request a new one.')
        }, 2000)
      }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }

    setSubmitting(true)
    setErrorMsg('')

      const { error } = await supabase.auth.updateUser({ password })
    setSubmitting(false)
    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
    } else {
      setStatus('done')
      setTimeout(() => router.push('/tracker'), 2000)
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm items-center justify-center px-4">
      <div className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8">
        <h1 className="mb-1 text-xl font-bold text-white">Update Password</h1>
        <p className="mb-6 text-xs text-[var(--text-muted)]">Enter your new password</p>

        {status === 'checking' && (
          <p className="text-sm text-[var(--text-secondary)]">Checking your reset link…</p>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--danger)]">{errorMsg}</p>
            <a
              href="/"
              className="inline-block rounded-lg bg-[var(--bg-accent)] px-4 py-2 text-sm font-medium text-black"
            >
              Go Home
            </a>
          </div>
        )}

        {status === 'done' && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--success)]">Password updated! Redirecting to tracker…</p>
          </div>
        )}

        {status === 'ready' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-[11px] text-[var(--text-secondary)]">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                disabled={submitting}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-4 py-2.5 text-sm text-white placeholder-[var(--text-muted)] outline-none disabled:opacity-50"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-[var(--text-secondary)]">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                disabled={submitting}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-4 py-2.5 text-sm text-white placeholder-[var(--text-muted)] outline-none disabled:opacity-50"
              />
            </div>
            {errorMsg && <p className="text-xs text-[var(--danger)]">{errorMsg}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-[var(--bg-accent)] px-4 py-2.5 text-sm font-medium text-black hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
