'use client'

import { useState, useEffect, useSyncExternalStore } from 'react'
import type { Program } from '@/lib/types'
import { formatDate, daysUntil, getDeadlineUrgency } from '@/lib/utils'
import Badge from './Badge'

interface ProgramCardProps {
  program: Program
  universityName?: string
}

export default function ProgramCard({ program }: ProgramCardProps) {
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)

  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(id)
  }, [])

  const days = mounted ? daysUntil(program.deadline) : null
  const urgency = getDeadlineUrgency(days)

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-all hover:border-[var(--bg-primary)]/20">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h4 className="text-sm font-semibold text-white">{program.name}</h4>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {program.field || 'General'} · {program.level}
          </p>
        </div>
        <Badge variant="status">{program.status}</Badge>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          {program.deadline && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-secondary)]">
                Deadline: {formatDate(program.deadline)}
              </span>
              {days !== null && (
                <span
                  className="text-xs font-medium"
                  style={{ color: urgency.color }}
                  aria-live="polite"
                >
                  {urgency.label}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {program.edital_url && (
            <a
              href={program.edital_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--bg-primary)]/30 hover:text-white"
            >
              Edital
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
