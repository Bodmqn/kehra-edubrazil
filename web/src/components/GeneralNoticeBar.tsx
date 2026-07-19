'use client'

import { useState, useEffect } from 'react'
import { useActiveNotice } from '@/lib/generalNotices'

const STORAGE_PREFIX = 'kehra-notice-dismissed-'

const TYPE_STYLES = {
  info: {
    bg: 'bg-[var(--bg-secondary)]/10',
    border: 'border-[var(--bg-secondary)]/30',
    text: 'text-[var(--bg-secondary)]',
    icon: 'ℹ️',
  },
  warning: {
    bg: 'bg-[var(--warning)]/10',
    border: 'border-[var(--warning)]/30',
    text: 'text-[var(--warning)]',
    icon: '⚠️',
  },
  alert: {
    bg: 'bg-[var(--danger)]/10',
    border: 'border-[var(--danger)]/30',
    text: 'text-[var(--danger)]',
    icon: '🚨',
  },
}

export default function GeneralNoticeBar() {
  const notice = useActiveNotice()
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (notice) {
      const key = STORAGE_PREFIX + notice.id
      setDismissed(localStorage.getItem(key) === 'true')
    }
  }, [notice])

  const dismiss = () => {
    if (!notice) return
    localStorage.setItem(STORAGE_PREFIX + notice.id, 'true')
    setDismissed(true)
  }

  if (!notice || dismissed) return null

  const style = TYPE_STYLES[notice.type] ?? TYPE_STYLES.info

  return (
    <div className={`border-b ${style.bg} ${style.border}`}>
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        <span className="shrink-0 text-sm">{style.icon}</span>
        <p className={`flex-1 text-xs leading-relaxed ${style.text}`}>
          {notice.message}
        </p>
        <button
          onClick={dismiss}
          className={`shrink-0 rounded p-0.5 text-sm opacity-60 hover:opacity-100 ${style.text}`}
          aria-label="Dismiss notice"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
