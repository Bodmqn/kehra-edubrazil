'use client'

import type { Program } from '@/lib/types'
import { formatDate, daysUntil, getDeadlineUrgency } from '@/lib/utils'
import Badge from './Badge'

interface ProgramCardProps {
  program: Program
}

export default function ProgramCard({ program }: ProgramCardProps) {
  const days = daysUntil(program.deadline)
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
          <button className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--bg-accent)]/30 hover:text-white">
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
