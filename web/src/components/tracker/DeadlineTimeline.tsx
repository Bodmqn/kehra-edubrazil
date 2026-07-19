'use client'

import type { TrackerProgram } from '@/lib/trackerTypes'
import { daysUntil, getDeadlineUrgency, formatDate } from '@/lib/utils'

interface DeadlineTimelineProps {
  programs: TrackerProgram[]
  onSelect: (program: TrackerProgram) => void
}

export default function DeadlineTimeline({ programs, onSelect }: DeadlineTimelineProps) {
  const upcoming = programs
    .filter((p) => {
      if (!p.deadline) return false
      const d = daysUntil(p.deadline)
      return d !== null && d >= -7 && d <= 90
    })
    .sort((a, b) => {
      if (!a.deadline || !b.deadline) return 0
      return a.deadline.localeCompare(b.deadline)
    })
    .slice(0, 12)

  if (upcoming.length === 0) return null

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <h3 className="mb-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
        Upcoming Deadlines
      </h3>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {upcoming.map((p) => {
          const days = daysUntil(p.deadline) ?? 0
          const urgency = getDeadlineUrgency(days)
          const size = days <= 0 ? 'h-12' : days <= 14 ? 'h-10' : days <= 30 ? 'h-8' : 'h-6'
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className={`flex shrink-0 flex-col items-center justify-end gap-1 rounded-lg px-2 pb-2 transition-all hover:opacity-80 ${size}`}
              style={{ backgroundColor: urgency.color + '15', minWidth: '64px' }}
              title={`${p.name} — ${formatDate(p.deadline)}`}
            >
              <span className="max-w-[56px] truncate text-[9px] text-[var(--text-secondary)] leading-tight">
                {p.university.length > 12 ? p.university.slice(0, 10) + '…' : p.university}
              </span>
              <span
                className="text-[10px] font-semibold leading-none"
                style={{ color: urgency.color }}
              >
                {days <= 0 ? '⚠️' : `${days}d`}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
