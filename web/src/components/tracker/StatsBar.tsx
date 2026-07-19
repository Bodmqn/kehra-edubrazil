'use client'

import type { TrackerProgram } from '@/lib/trackerTypes'
import { daysUntil } from '@/lib/utils'

interface StatsBarProps {
  programs: TrackerProgram[]
}

export default function StatsBar({ programs }: StatsBarProps) {
  const total = programs.length
  const overdue = programs.filter((p) => {
    if (!p.deadline || p.stage === 'accepted' || p.stage === 'rejected') return false
    const d = daysUntil(p.deadline)
    return d !== null && d < 0
  }).length
  const dueThisMonth = programs.filter((p) => {
    if (!p.deadline) return false
    const d = daysUntil(p.deadline)
    return d !== null && d >= 0 && d <= 30
  }).length
  const inProgress = programs.filter((p) =>
    ['applying', 'interview'].includes(p.stage)
  ).length
  const completed = programs.filter((p) =>
    ['applied', 'accepted'].includes(p.stage)
  ).length

  const stats = [
    { label: 'Total Tracked', value: total, color: 'text-white' },
    { label: 'Overdue', value: overdue, color: 'var(--danger)' },
    { label: 'Due This Month', value: dueThisMonth, color: 'var(--warning)' },
    { label: 'In Progress', value: inProgress, color: 'var(--bg-accent)' },
    { label: 'Completed', value: completed, color: 'var(--success)' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 text-center"
        >
          <p className="text-2xl font-bold" style={{ color: s.color }}>
            {s.value}
          </p>
          <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{s.label}</p>
        </div>
      ))}
    </div>
  )
}
