'use client'

import { useState, useEffect } from 'react'

interface LoginModalProps {
  open: boolean
  onClose: () => void
  onSignIn: (email: string, password: string) => Promise<{ error: string | null }>
  onSignUp: (email: string, password: string) => Promise<{ error: string | null }>
  onResetPassword: (email: string) => Promise<{ error: string | null }>
  onSuccess?: () => void
}

type Panel = 'signin' | 'signup'

function errorText(raw: string | null, fallback: string): string {
  const trimmed = raw?.trim()
  if (!trimmed || trimmed === '{}') return fallback
  return trimmed
}

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

export default function LoginModal({ open, onClose, onSignIn, onSignUp, onResetPassword, onSuccess }: LoginModalProps) {
  const [panel, setPanel] = useState<Panel>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [resetMode, setResetMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showSignUpPassword, setShowSignUpPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setPanel('signin')
        setEmail('')
        setPassword('')
        setConfirmPassword('')
        setStatus('idle')
        setErrorMsg('')
        setSuccessMsg('')
        setResetMode(false)
        setResetSent(false)
        setShowPassword(false)
        setShowSignUpPassword(false)
        setShowConfirmPassword(false)
      }, 0)
      return () => clearTimeout(timer)
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
      setErrorMsg(errorText(error, 'Could not sign in. Please try again.'))
    } else {
      setStatus('done')
      onSuccess?.()
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
    setSuccessMsg('')
    const { error } = await onSignUp(email.trim(), password)
    if (error) {
      setStatus('error')
      setErrorMsg(errorText(error, 'Could not create your account. Please try again.'))
    } else {
      setStatus('idle')
      setPanel('signin')
      setPassword('')
      setConfirmPassword('')
      setShowSignUpPassword(false)
      setShowConfirmPassword(false)
      setSuccessMsg('Account created! Sign in with your new credentials.')
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
      setErrorMsg(errorText(error, 'Could not send the reset link. Please try again later.'))
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
              onClick={() => { setPanel('signin'); setErrorMsg(''); setSuccessMsg('') }}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                panel === 'signin' ? 'bg-[var(--bg-accent)] text-black' : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setPanel('signup'); setErrorMsg(''); setSuccessMsg('') }}
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
              onClick={() => { setResetMode(false); setResetSent(false); setSuccessMsg('') }}
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
                onClick={() => { setResetMode(false); setErrorMsg(''); setSuccessMsg('') }}
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
                onChange={(e) => { setEmail(e.target.value); setSuccessMsg('') }}
                placeholder="your@email.com"
                required
                disabled={status === 'loading'}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-4 py-2.5 text-sm text-white placeholder-[var(--text-muted)] outline-none disabled:opacity-50"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-[var(--text-secondary)]">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setSuccessMsg('') }}
                  placeholder="Enter your password"
                  required
                  disabled={status === 'loading'}
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
            <button
              type="button"
              onClick={() => { setResetMode(true); setErrorMsg(''); setSuccessMsg('') }}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--bg-primary)]"
            >
              Forgot password?
            </button>
            {status === 'error' && (
              <p className="text-xs text-[var(--danger)]">{errorMsg}</p>
            )}
            {successMsg && (
              <p className="text-xs text-[var(--success)]">{successMsg}</p>
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
                onClick={() => { setPanel('signup'); setErrorMsg(''); setSuccessMsg('') }}
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
              <div className="relative">
                <input
                  type={showSignUpPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  disabled={status === 'loading'}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-4 py-2.5 pr-10 text-sm text-white placeholder-[var(--text-muted)] outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors"
                >
                  {showSignUpPassword ? <EyeOffIcon /> : <EyeIcon />}
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
              {status === 'loading' ? 'Creating account…' : 'Create Account'}
            </button>
            <p className="text-center text-xs text-[var(--text-muted)]">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setPanel('signin'); setErrorMsg(''); setSuccessMsg('') }}
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
