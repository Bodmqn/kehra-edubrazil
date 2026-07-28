'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'checking' | 'ready' | 'done' | 'error'>('checking')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
        setStatus('ready')
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatus('ready')
      }
    })

    return () => subscription.unsubscribe()
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
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  disabled={submitting}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-4 py-2.5 pr-10 text-sm text-white placeholder-[var(--text-muted)] outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-[var(--text-secondary)]">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  disabled={submitting}
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
