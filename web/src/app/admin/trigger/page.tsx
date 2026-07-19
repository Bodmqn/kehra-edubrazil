'use client'

import { useState } from 'react'

export default function AdminTriggerPage() {
  const [status, setStatus] = useState<'idle' | 'triggering' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleTrigger = async () => {
    setStatus('triggering')
    setMessage('')

    try {
      const token = 'github_pat_placeholder'
      const response = await fetch(
        'https://api.github.com/repos/Bodmqn/kehra-edubrazil/actions/workflows/scrape.yml/dispatches',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'kehra-admin',
          },
          body: JSON.stringify({ ref: 'main' }),
        }
      )

      if (response.ok) {
        setStatus('success')
        setMessage('Scrape triggered successfully! It will run on GitHub Actions shortly.')
      } else {
        const errText = await response.text().catch(() => 'Unknown error')
        throw new Error(`GitHub API returned ${response.status}: ${errText}`)
      }
    } catch (e) {
      setStatus('error')
      setMessage(
        e instanceof Error
          ? e.message
          : 'Failed to trigger scrape. Make sure a GitHub token is configured.'
      )
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
          This will dispatch the <code className="text-[var(--bg-accent)]">scrape.yml</code> workflow on GitHub,
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
          <p className="mt-3 text-xs text-[var(--danger)]">❌ {message}</p>
        )}

        {status === 'error' && (
          <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] p-3">
            <p className="mb-1 text-[10px] font-medium text-[var(--text-secondary)]">
              To fix, add a GitHub token:
            </p>
            <ol className="list-inside list-decimal space-y-1 text-[10px] text-[var(--text-muted)]">
              <li>Create a <code className="text-[var(--bg-accent)]">GITHUB_TOKEN</code> secret in your Supabase project or Netlify env</li>
              <li>Or manually trigger at:{' '}
                <a
                  href="https://github.com/Bodmqn/kehra-edubrazil/actions/workflows/scrape.yml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--bg-primary)] hover:underline"
                >
                  github.com/Bodmqn/kehra-edubrazil/actions
                </a>
              </li>
            </ol>
          </div>
        )}

        <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] p-3">
          <p className="text-[10px] text-[var(--text-muted)]">
            🔗{' '}
            <a
              href="https://github.com/Bodmqn/kehra-edubrazil/actions/workflows/scrape.yml"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--bg-primary)] hover:underline"
            >
              View workflow runs on GitHub
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
