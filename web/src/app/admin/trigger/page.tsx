'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminTriggerPage() {
  const [status, setStatus] = useState<'idle' | 'triggering' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleTrigger = async () => {
    setStatus('triggering')
    setMessage('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Not authenticated. Please sign in again.')
      }

      const response = await fetch('/.netlify/functions/trigger-scrape', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage(result.message || 'Scrape triggered successfully!')
      } else {
        throw new Error(result.error || `Server returned ${response.status}`)
      }
    } catch (e) {
      setStatus('error')
      setMessage(e instanceof Error ? e.message : 'Failed to trigger scrape.')
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-white">Trigger Scrape</h1>
      <p className="mb-4 text-xs text-[var(--text-muted)]">
        Manually trigger the SIGAA + custom portal scraper via GitHub Actions.
      </p>

      <div className="max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <p className="mb-4 text-xs leading-relaxed text-[var(--text-secondary)]">
          This dispatches the <code className="text-[var(--bg-accent)]">scrape.yml</code> workflow on GitHub,
          which runs all scrapers (SIGAA + custom portals) and updates the database.
        </p>

        <button
          onClick={handleTrigger}
          disabled={status === 'triggering'}
          className="w-full rounded-lg bg-[var(--bg-primary)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {status === 'triggering' ? 'Triggering…' : 'Trigger Scrape Now'}
        </button>

        {status === 'success' && (
          <p className="mt-3 text-xs text-[var(--success)]">✅ {message}</p>
        )}
        {status === 'error' && (
          <div>
            <p className="mt-3 text-xs text-[var(--danger)]">❌ {message}</p>
            <p className="mt-2 text-[10px] text-[var(--text-muted)]">
              Make sure the following secrets are set in your Netlify dashboard:
              <code className="block mt-1 rounded bg-[var(--bg-dark)] px-2 py-1 text-[var(--bg-accent)]">
                SUPABASE_URL, SUPABASE_SERVICE_KEY, GITHUB_TOKEN
              </code>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
