'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface SplashConfig {
  id: string
  title: string
  message: string
  enabled: boolean
  timer_seconds: number
  dismiss_hours: number
}

const DEFAULTS = {
  title: 'General Notice',
  message: '',
  timer_seconds: 9,
  dismiss_hours: 24,
}

export default function AdminSplashNoticePage() {
  const [config, setConfig] = useState<SplashConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    async function fetch() {
      try {
        const { data, error } = await supabase.from('splash_notice').select('*').limit(1).maybeSingle()
        if (error) throw error
        if (data) {
          setConfig(data as SplashConfig)
        } else {
          setConfig({ id: '', enabled: true, ...DEFAULTS })
        }
      } catch (e) {
        setFeedback({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load splash notice.' })
      }
      setLoading(false)
    }
    fetch()
  }, [])

  const handleSave = async () => {
    if (!config) return
    setSaving(true)
    setFeedback(null)
    try {
      const payload = {
        title: config.title,
        message: config.message,
        enabled: config.enabled,
        timer_seconds: config.timer_seconds,
        dismiss_hours: config.dismiss_hours,
      }
      if (config.id) {
        const { error } = await supabase.from('splash_notice').update(payload).eq('id', config.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('splash_notice').insert(payload).select().single()
        if (error) throw error
        setConfig(data as SplashConfig)
      }
      setFeedback({ type: 'success', text: 'Splash notice saved.' })
    } catch (e) {
      setFeedback({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-[var(--text-muted)]">Loading splash notice…</p>
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-white">Splash Notice</h1>
      <p className="mb-4 text-xs text-[var(--text-muted)]">
        Manage the home page modal that appears once per day.
      </p>

      {feedback && (
        <p className={`mb-3 text-xs ${feedback.type === 'success' ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
          {feedback.text}
        </p>
      )}

      {config && (
        <div className="max-w-xl space-y-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
          <div className="flex items-center gap-3">
            <label className="text-sm text-white">Enabled</label>
            <button
              onClick={() => setConfig({ ...config, enabled: !config.enabled })}
              className={`relative h-5 w-9 rounded-full transition-colors ${config.enabled ? 'bg-[var(--success)]' : 'bg-[var(--border)]'}`}
            >
              <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${config.enabled ? 'translate-x-4' : ''}`} />
            </button>
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-[var(--text-secondary)]">Title</label>
            <input
              type="text"
              value={config.title}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
              className="w-full rounded border border-[var(--border)] bg-[var(--bg-dark)] px-2.5 py-1.5 text-xs text-white outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-[var(--text-secondary)]">Message</label>
            <textarea
              value={config.message}
              onChange={(e) => setConfig({ ...config, message: e.target.value })}
              rows={5}
              className="w-full resize-none rounded border border-[var(--border)] bg-[var(--bg-dark)] px-2.5 py-1.5 text-xs text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] text-[var(--text-secondary)]">Timer (seconds)</label>
              <input
                type="number"
                value={config.timer_seconds}
                onChange={(e) => setConfig({ ...config, timer_seconds: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full rounded border border-[var(--border)] bg-[var(--bg-dark)] px-2.5 py-1.5 text-xs text-white outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-[var(--text-secondary)]">Re-appear after (hours)</label>
              <input
                type="number"
                value={config.dismiss_hours}
                onChange={(e) => setConfig({ ...config, dismiss_hours: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-full rounded border border-[var(--border)] bg-[var(--bg-dark)] px-2.5 py-1.5 text-xs text-white outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-[var(--bg-accent)] px-4 py-2 text-xs font-medium text-black disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}
    </div>
  )
}
