'use client'

import Link from 'next/link'
import type { TrackerProgram } from '@/lib/trackerTypes'
import { daysUntil, getDeadlineUrgency, formatDate, slugify } from '@/lib/utils'
import { universities } from '@/lib/data'

interface DeadlineTimelineProps {
  programs: TrackerProgram[]
}

const uniAcronym = new Map(universities.map(u => [u.name, u.acronym]))
const uniSlugMap = new Map(universities.map(u => [u.name, slugify(u.name)]))

export default function DeadlineTimeline({ programs }: DeadlineTimelineProps) {
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
            <Link
              key={p.id}
              href={(() => {
                const match = /^(.+?)(?:\s*\(.*\))?$/.exec(p.university)
                const base = match?.[1]?.trim() ?? p.university
                const slug = uniSlugMap.get(base)
                return slug ? `/universities/${slug}` : '#'
              })()}
              className={`flex shrink-0 flex-col items-center justify-end gap-1 rounded-lg px-2 pb-2 transition-all hover:opacity-80 ${size}`}
              style={{ backgroundColor: urgency.color + '15', minWidth: '72px' }}
              title={`${p.name} at ${p.university} — ${formatDate(p.deadline)}`}
            >
              <span className="max-w-[64px] truncate text-[9px] text-[var(--text-secondary)] leading-tight">
                {uniAcronym.get(p.university) || p.university}
              </span>
              <span
                className="text-[10px] font-semibold leading-none"
                style={{ color: urgency.color }}
              >
                {days <= 0 ? '⚠️' : `${days}d`}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
