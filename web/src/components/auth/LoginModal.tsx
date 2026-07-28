'use client'

import { useState, useEffect } from 'react'

interface LoginModalProps {
  open: boolean
  onClose: () => void
  onLogin: (email: string) => Promise<{ error: string | null }>
}

export default function LoginModal({ open, onClose, onLogin }: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!open) {
      setEmail('')
      setStatus('idle')
      setErrorMsg('')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return

    setStatus('sending')
    setErrorMsg('')

    const { error } = await onLogin(trimmed)
    if (error) {
      setStatus('error')
      setErrorMsg(error)
    } else {
      setStatus('sent')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-8 pb-8">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Sign in with Email</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-white"
          >
            ✕
          </button>
        </div>

        {status === 'sent' ? (
          <div className="space-y-3">
            <p className="text-sm text-[var(--success)]">Magic link sent!</p>
            <p className="text-xs text-[var(--text-secondary)]">
              Check your inbox (and spam folder) for the login link. It expires in 30 minutes.
            </p>
            <button
              onClick={onClose}
              className="rounded-lg bg-[var(--bg-accent)] px-4 py-2 text-sm font-medium text-black hover:opacity-90"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-[var(--text-secondary)]">
              Enter your email and we&apos;ll send you a magic link. No password needed.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={status === 'sending'}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-4 py-2.5 text-sm text-white placeholder-[var(--text-muted)] outline-none disabled:opacity-50"
            />
            {status === 'error' && (
              <p className="text-xs text-[var(--danger)]">{errorMsg}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={status === 'sending'}
                className="flex-1 rounded-lg bg-[var(--bg-accent)] px-4 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-50"
              >
                {status === 'sending' ? 'Sending…' : 'Send Magic Link'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
