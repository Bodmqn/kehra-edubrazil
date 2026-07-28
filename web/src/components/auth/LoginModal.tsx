'use client'

import { useState, useEffect } from 'react'

interface LoginModalProps {
  open: boolean
  onClose: () => void
  onSignIn: (email: string, password: string) => Promise<{ error: string | null }>
  onSignUp: (email: string, password: string) => Promise<{ error: string | null }>
  onResetPassword: (email: string) => Promise<{ error: string | null }>
}

type Panel = 'signin' | 'signup'

export default function LoginModal({ open, onClose, onSignIn, onSignUp, onResetPassword }: LoginModalProps) {
  const [panel, setPanel] = useState<Panel>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [resetMode, setResetMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  useEffect(() => {
    if (!open) {
      setPanel('signin')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setStatus('idle')
      setErrorMsg('')
      setResetMode(false)
      setResetSent(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    setStatus('loading')
    setErrorMsg('')
    const { error } = await onSignIn(email.trim(), password)
    if (error) {
      setStatus('error')
      setErrorMsg(error)
    } else {
      setStatus('done')
      onClose()
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    if (password !== confirmPassword) {
      setStatus('error')
      setErrorMsg('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setStatus('error')
      setErrorMsg('Password must be at least 6 characters.')
      return
    }
    setStatus('loading')
    setErrorMsg('')
    const { error } = await onSignUp(email.trim(), password)
    if (error) {
      setStatus('error')
      setErrorMsg(error)
    } else {
      setStatus('done')
      onClose()
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    setErrorMsg('')
    const { error } = await onResetPassword(email.trim())
    if (error) {
      setStatus('error')
      setErrorMsg(error)
    } else {
      setResetSent(true)
      setStatus('idle')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-8 pb-8">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {resetMode ? 'Reset Password' : panel === 'signin' ? 'Sign In' : 'Create Account'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-white transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {!resetMode && (
          <div className="mb-4 flex rounded-lg border border-[var(--border)] p-0.5">
            <button
              onClick={() => { setPanel('signin'); setErrorMsg('') }}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                panel === 'signin' ? 'bg-[var(--bg-accent)] text-black' : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setPanel('signup'); setErrorMsg('') }}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                panel === 'signup' ? 'bg-[var(--bg-accent)] text-black' : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {resetMode && resetSent ? (
          <div className="space-y-3">
            <p className="text-sm text-[var(--success)]">Reset link sent!</p>
            <p className="text-xs text-[var(--text-secondary)]">
              Check your inbox (and spam folder) for the password reset link.
            </p>
            <button
              onClick={() => { setResetMode(false); setResetSent(false) }}
              className="text-xs text-[var(--bg-primary)] hover:underline"
            >
              Back to Sign In
            </button>
          </div>
        ) : resetMode ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-xs text-[var(--text-secondary)]">
              Enter your email and we&apos;ll send you a password reset link.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={status === 'loading'}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-4 py-2.5 text-sm text-white placeholder-[var(--text-muted)] outline-none disabled:opacity-50"
            />
            {status === 'error' && (
              <p className="text-xs text-[var(--danger)]">{errorMsg}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setResetMode(false); setErrorMsg('') }}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs text-[var(--text-secondary)] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="flex-1 rounded-lg bg-[var(--bg-accent)] px-4 py-2 text-xs font-medium text-black hover:opacity-90 disabled:opacity-50"
              >
                {status === 'loading' ? 'Sending…' : 'Send Reset Link'}
              </button>
            </div>
          </form>
        ) : panel === 'signin' ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="mb-1 block text-[11px] text-[var(--text-secondary)]">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={status === 'loading'}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-4 py-2.5 text-sm text-white placeholder-[var(--text-muted)] outline-none disabled:opacity-50"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-[var(--text-secondary)]">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={status === 'loading'}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-4 py-2.5 text-sm text-white placeholder-[var(--text-muted)] outline-none disabled:opacity-50"
              />
            </div>
            <button
              type="button"
              onClick={() => { setResetMode(true); setErrorMsg('') }}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--bg-primary)]"
            >
              Forgot password?
            </button>
            {status === 'error' && (
              <p className="text-xs text-[var(--danger)]">{errorMsg}</p>
            )}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full rounded-lg bg-[var(--bg-accent)] px-4 py-2.5 text-sm font-medium text-black hover:opacity-90 disabled:opacity-50"
            >
              {status === 'loading' ? 'Signing in…' : 'Sign In'}
            </button>
            <p className="text-center text-xs text-[var(--text-muted)]">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => { setPanel('signup'); setErrorMsg('') }}
                className="text-[var(--bg-primary)] hover:underline"
              >
                Sign Up
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="mb-1 block text-[11px] text-[var(--text-secondary)]">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={status === 'loading'}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-4 py-2.5 text-sm text-white placeholder-[var(--text-muted)] outline-none disabled:opacity-50"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-[var(--text-secondary)]">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                disabled={status === 'loading'}
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
                disabled={status === 'loading'}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-4 py-2.5 text-sm text-white placeholder-[var(--text-muted)] outline-none disabled:opacity-50"
              />
            </div>
            {status === 'error' && (
              <p className="text-xs text-[var(--danger)]">{errorMsg}</p>
            )}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full rounded-lg bg-[var(--bg-accent)] px-4 py-2.5 text-sm font-medium text-black hover:opacity-90 disabled:opacity-50"
            >
              {status === 'loading' ? 'Creating account…' : 'Create Account'}
            </button>
            <p className="text-center text-xs text-[var(--text-muted)]">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setPanel('signin'); setErrorMsg('') }}
                className="text-[var(--bg-primary)] hover:underline"
              >
                Sign In
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
