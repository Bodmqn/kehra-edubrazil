'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function UnsubscribePage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const called = useRef(false)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    token ? 'loading' : 'error'
  )
  const [message, setMessage] = useState(
    token ? '' : 'No unsubscribe token found. Check the link in your email.'
  )

  useEffect(() => {
    if (!token || called.current) return
    called.current = true

    fetch('/.netlify/functions/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (resp) => {
        const data = await resp.json()
        if (resp.ok) {
          setStatus('success')
          setMessage('You have been unsubscribed successfully.')
        } else {
          setStatus('error')
          setMessage(data.error || 'Unsubscribe failed')
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Something went wrong.')
      })
  }, [token])

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4">
      <div className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center">
        {status === 'loading' && (
          <>
            <p className="text-3xl mb-3">⏳</p>
            <p className="text-sm text-[var(--text-secondary)]">Processing your request…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <p className="text-3xl mb-3">✅</p>
            <h1 className="mb-2 text-lg font-bold text-white">Unsubscribed</h1>
            <p className="text-sm text-[var(--text-secondary)]">{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="text-3xl mb-3">❌</p>
            <h1 className="mb-2 text-lg font-bold text-white">Something went wrong</h1>
            <p className="text-sm text-[var(--text-secondary)]">{message}</p>
          </>
        )}
      </div>
    </div>
  )
}
