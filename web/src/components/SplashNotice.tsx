'use client'

import { useState, useEffect } from 'react'

const SPLASH_KEY = 'kehra-edubrazil-splash'

export default function SplashNotice() {
  const [visible, setVisible] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(9)
  const [showClose, setShowClose] = useState(false)

  useEffect(() => {
    const last = localStorage.getItem(SPLASH_KEY)
    if (last) {
      const elapsed = Date.now() - parseInt(last, 10)
      if (elapsed < 24 * 60 * 60 * 1000) return
    }
    queueMicrotask(() => {
      setVisible(true)
      document.body.style.overflow = 'hidden'
    })
  }, [])

  useEffect(() => {
    if (!visible) return
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          setShowClose(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [visible])

  const dismiss = () => {
    localStorage.setItem(SPLASH_KEY, Date.now().toString())
    setVisible(false)
    document.body.style.overflow = ''
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 max-w-lg rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center shadow-2xl">
        <div className="mb-4 text-4xl">📢</div>
        <h2 className="mb-4 text-xl font-bold text-white">General Notice</h2>
        <p className="mb-6 text-sm leading-relaxed text-[var(--text-secondary)]">
          This platform is designed to make finding graduate (Master&apos;s and PhD) opportunities at
          Brazilian universities easier, faster, and more accessible. We aggregate information from
          official university sources to help prospective students discover programs, admission calls
          (Editais), eligibility requirements, and application links in one convenient place. While
          we strive for accuracy, we encourage all applicants to verify important information through
          the university&apos;s official website and SIGAA/Edital pages before applying.
        </p>
        <p className="mb-4 text-xs text-[var(--text-muted)]">
          {showClose ? 'Thank you.' : 'Please wait...'}
        </p>
        <button
          onClick={dismiss}
          disabled={!showClose}
          className={`rounded-lg px-6 py-2.5 text-sm font-medium transition-all ${
            showClose
              ? 'bg-[var(--bg-accent)] text-black hover:opacity-90'
              : 'bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed'
          }`}
        >
          {showClose ? 'Close' : `Wait ${secondsLeft}s`}
        </button>
      </div>
    </div>
  )
}
