'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminTriggerPage() {
  const [scrapeStatus, setScrapeStatus] = useState<'idle' | 'triggering' | 'success' | 'error'>('idle')
  const [scrapeMessage, setScrapeMessage] = useState('')

  const [reminderStatus, setReminderStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [reminderMessage, setReminderMessage] = useState('')
  const [reminderResult, setReminderResult] = useState<Record<string, unknown> | null>(null)

  const handleTriggerScrape = async () => {
    setScrapeStatus('triggering')
    setScrapeMessage('')

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
        setScrapeStatus('success')
        setScrapeMessage(result.message || 'Scrape triggered successfully!')
      } else {
        throw new Error(result.error || `Server returned ${response.status}`)
      }
    } catch (e) {
      setScrapeStatus('error')
      setScrapeMessage(e instanceof Error ? e.message : 'Failed to trigger scrape.')
    }
  }

  const handleSendReminders = async () => {
    setReminderStatus('sending')
    setReminderMessage('')
    setReminderResult(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Not authenticated. Please sign in again.')
      }

      const response = await fetch('/.netlify/functions/send-reminders', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (response.ok) {
        setReminderStatus('success')
        setReminderResult(result)
        setReminderMessage(`Broadcast sent: ${result.broadcast_sent}, Targeted sent: ${result.targeted_sent}`)
      } else {
        throw new Error(result.error || `Server returned ${response.status}`)
      }
    } catch (e) {
      setReminderStatus('error')
      setReminderMessage(e instanceof Error ? e.message : 'Failed to send reminders.')
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Trigger Scrape Section ── */}
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
            onClick={handleTriggerScrape}
            disabled={scrapeStatus === 'triggering'}
            className="w-full rounded-lg bg-[var(--bg-primary)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            style={{ color: 'white' }}
          >
            {scrapeStatus === 'triggering' ? 'Triggering…' : 'Trigger Scrape Now'}
          </button>

          {scrapeStatus === 'success' && (
            <p className="mt-3 text-xs text-[var(--success)]">✅ {scrapeMessage}</p>
          )}
          {scrapeStatus === 'error' && (
            <div>
              <p className="mt-3 text-xs text-[var(--danger)]">❌ {scrapeMessage}</p>
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

      {/* ── Send Reminders Section ── */}
      <div>
        <h1 className="mb-1 text-xl font-bold text-white">Send Reminders</h1>
        <p className="mb-4 text-xs text-[var(--text-muted)]">
          Manually send reminder emails to all subscribed users right now.
        </p>

        <div className="max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <p className="mb-4 text-xs leading-relaxed text-[var(--text-secondary)]">
            Sends broadcast alerts for upcoming deadlines (next 7 days) and
            targeted reminders based on each subscriber&apos;s tracker settings.
          </p>

          <button
            onClick={handleSendReminders}
            disabled={reminderStatus === 'sending'}
            className="w-full rounded-lg bg-[var(--bg-accent)] px-4 py-2.5 text-sm font-medium text-black hover:opacity-90 disabled:opacity-50"
          >
            {reminderStatus === 'sending' ? 'Sending…' : 'Send Reminders Now'}
          </button>

          {reminderStatus === 'success' && (
            <div className="mt-3 space-y-1">
              <p className="text-xs text-[var(--success)]">✅ {reminderMessage}</p>
              {Array.isArray(reminderResult?.errors) && reminderResult.errors.length > 0 && (
                <div>
                  <p className="mt-2 text-[10px] font-medium text-[var(--danger)]">Errors:</p>
                  {(reminderResult.errors as string[]).map((e, i) => (
                    <p key={i} className="text-[10px] text-[var(--danger)]">• {e}</p>
                  ))}
                </div>
              )}
              {reminderResult?.reason ? (
                <p className="text-[10px] text-[var(--text-muted)]">Reason: {String(reminderResult.reason)}</p>
              ) : null}
            </div>
          )}
          {reminderStatus === 'error' && (
            <div>
              <p className="mt-3 text-xs text-[var(--danger)]">❌ {reminderMessage}</p>
              <p className="mt-2 text-[10px] text-[var(--text-muted)]">
                Make sure the following secrets are set in your Netlify dashboard:
                <code className="block mt-1 rounded bg-[var(--bg-dark)] px-2 py-1 text-[var(--bg-accent)]">
                  GMAIL_USER, GMAIL_APP_PASSWORD, CRON_SECRET
                </code>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
