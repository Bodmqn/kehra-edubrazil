'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export const SPLASH_KEY = 'kehra-edubrazil-splash'

const FALLBACK = {
  title: 'General Notice',
  message: 'This platform is designed to make finding graduate (Master\'s and PhD) opportunities at Brazilian universities easier, faster, and more accessible. We aggregate information from official university sources to help prospective students discover programs, admission calls (Editais), eligibility requirements, and application links in one convenient place. While we strive for accuracy, we encourage all applicants to verify important information through the university\'s official website and SIGAA/Edital pages before applying.',
  enabled: true,
  timer_seconds: 9,
  dismiss_hours: 24,
}

export default function SplashNotice() {
  const [config, setConfig] = useState(FALLBACK)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    supabase.from('splash_notice').select('*').limit(1).maybeSingle().then(({ data }) => {
      if (data) {
        setConfig({
          title: data.title ?? FALLBACK.title,
          message: data.message ?? FALLBACK.message,
          enabled: data.enabled ?? true,
          timer_seconds: data.timer_seconds ?? 9,
          dismiss_hours: data.dismiss_hours ?? 24,
        })
      }
    })
  }, [])

  useEffect(() => {
    if (!config.enabled) return
    const last = localStorage.getItem(SPLASH_KEY)
    if (last) {
      const elapsed = Date.now() - parseInt(last, 10)
      if (elapsed < config.dismiss_hours * 60 * 60 * 1000) return
    }
    queueMicrotask(() => {
      setVisible(true)
      document.body.style.overflow = 'hidden'
    })
  }, [config.enabled, config.dismiss_hours])

  const dismiss = () => {
    localStorage.setItem(SPLASH_KEY, Date.now().toString())
    setVisible(false)
    document.body.style.overflow = ''
  }

  useEffect(() => {
    if (!visible) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible])

  if (!visible || !config.enabled) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative mx-4 max-w-lg rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center shadow-2xl">
        <button
          onClick={dismiss}
          aria-label="Close notice"
          className="absolute right-3 top-3 rounded-lg p-1.5 text-sm leading-none text-[var(--text-muted)] hover:text-white"
        >
          ✕
        </button>
        <div className="mb-4 text-4xl">📢</div>
        <h2 className="mb-4 text-xl font-bold text-white">{config.title}</h2>
        <p className="mb-6 text-sm leading-relaxed text-white/90">
          {config.message}
        </p>
        <button
          onClick={dismiss}
          className="rounded-lg bg-[var(--bg-accent)] px-6 py-2.5 text-sm font-medium text-black hover:opacity-90"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
