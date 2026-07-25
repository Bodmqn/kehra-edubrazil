'use client'

import Link from 'next/link'
import type { TrackerProgram } from '@/lib/trackerTypes'
import { STAGES, PRIORITIES } from '@/lib/trackerTypes'
import { daysUntil, getDeadlineUrgency, formatDate, slugify } from '@/lib/utils'
import { universities } from '@/lib/data'
import { getActiveReminders } from '@/lib/reminderUtils'

interface TrackerCardProps {
  program: TrackerProgram
  onEdit: (program: TrackerProgram) => void
  onDelete: (id: string) => void
  onStageChange: (id: string, stage: TrackerProgram['stage']) => void
}

export default function TrackerCard({ program, onEdit, onDelete, onStageChange }: TrackerCardProps) {
  const days = daysUntil(program.deadline)
  const urgency = getDeadlineUrgency(days)
  const stageDef = STAGES.find((s) => s.key === program.stage)
  const priorityDef = PRIORITIES.find((p) => p.key === program.priority)
  const doneCount = program.checklist.filter((c) => c.done).length
  const totalCount = program.checklist.length
  const activeReminders = getActiveReminders([program])
  const hasReminder = program.reminderDays.length > 0
  const isDue = activeReminders.length > 0

  const uniName = (() => {
    const match = /^(.+?)(?:\s*\(.*\))?$/.exec(program.university)
    const base = match?.[1]?.trim() ?? program.university
    const found = universities.find((u) => u.name === base)
    return found?.name ?? null
  })()
  const uniSlug = uniName ? slugify(uniName) : null

  return (
    <div
      className={`group rounded-xl border p-4 transition-all ${
        isDue
          ? 'border-[var(--bg-accent)] bg-[var(--bg-accent)]/5'
          : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--bg-primary)]/30 hover:bg-[var(--bg-card-hover)]'
      }`}
    >
      {/* Header */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          {uniSlug ? (
            <Link href={`/universities/${uniSlug}`} className="block">
              <h4 className="text-sm font-semibold text-white truncate hover:text-[var(--bg-primary)] transition-colors">{program.name}</h4>
            </Link>
          ) : (
            <h4 className="text-sm font-semibold text-white truncate">{program.name}</h4>
          )}
          {uniSlug ? (
            <Link href={`/universities/${uniSlug}`} className="block">
              <p className="mt-0.5 text-[11px] text-[var(--text-muted)] truncate hover:text-[var(--text-secondary)] transition-colors">
                {program.university}
                {program.level ? ` · ${program.level}` : ''}
              </p>
            </Link>
          ) : (
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)] truncate">
              {program.university}
              {program.level ? ` · ${program.level}` : ''}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {hasReminder && (
            <span
              className={`rounded px-1.5 py-0.5 text-[9px] ${isDue ? 'bg-[var(--bg-accent)]/20 text-[var(--bg-accent)]' : 'text-[var(--text-muted)]'}`}
              title={program.reminderDays.map((d) => d === 0 ? 'Same day' : `${d}d before`).join(', ')}
            >
              {isDue ? '🔔' : '🔕'}
            </span>
          )}
          {program.source === 'scholarship' && (
            <span className="rounded bg-[var(--bg-accent)]/10 px-1.5 py-0.5 text-[9px] font-medium text-[var(--bg-accent)]">
              Via Scholarship
            </span>
          )}
          {priorityDef && (
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-medium uppercase"
              style={{ backgroundColor: priorityDef.color + '20', color: priorityDef.color }}
            >
              {priorityDef.label}
            </span>
          )}
        </div>
      </div>

      {/* Deadline */}
      {program.deadline && (
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[11px] text-[var(--text-secondary)]">
            {formatDate(program.deadline)}
          </span>
          <span
            className="text-[10px] font-medium"
            style={{ color: urgency.color }}
          >
            {urgency.label}
          </span>
        </div>
      )}

      {/* Stage + Checklist */}
      <div className="mb-3 flex items-center justify-between">
        <span
          className="rounded px-1.5 py-0.5 text-[9px] font-medium"
          style={{ backgroundColor: (stageDef?.color ?? 'var(--text-muted)') + '20', color: stageDef?.color ?? 'var(--text-muted)' }}
        >
          {stageDef?.label ?? program.stage}
        </span>
        {totalCount > 0 && (
          <span className="text-[10px] text-[var(--text-muted)]">
            {doneCount}/{totalCount} done
          </span>
        )}
      </div>

      {/* Checklist progress bar */}
      {totalCount > 0 && (
        <div className="mb-3 h-1 w-full rounded-full bg-[var(--border)]">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.round((doneCount / totalCount) * 100)}%`,
              backgroundColor: doneCount === totalCount ? 'var(--success)' : 'var(--bg-accent)',
            }}
          />
        </div>
      )}

      {/* Notes indicator */}
      {program.notes && (
        <p className="mb-2 text-[10px] text-[var(--text-muted)] italic truncate">
          &ldquo;{program.notes.slice(0, 60)}{program.notes.length > 60 ? '…' : ''}&rdquo;
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-1">
        {program.stage === 'saved' && (
          <button
            onClick={() => onStageChange(program.id, 'applying')}
            className="rounded bg-white/5 px-2 py-1 text-[10px] text-[var(--text-secondary)] hover:text-white"
          >
            Start Applying
          </button>
        )}
        {program.stage === 'applying' && (
          <>
            <button
              onClick={() => onStageChange(program.id, 'applied')}
              className="rounded bg-white/5 px-2 py-1 text-[10px] text-[var(--text-secondary)] hover:text-white"
            >
              Mark Applied
            </button>
            <button
              onClick={() => onStageChange(program.id, 'interview')}
              className="rounded bg-white/5 px-2 py-1 text-[10px] text-[var(--text-secondary)] hover:text-white"
            >
              Interview
            </button>
          </>
        )}
        {(program.stage === 'applied' || program.stage === 'interview') && (
          <>
            <button
              onClick={() => onStageChange(program.id, 'accepted')}
              className="rounded bg-[var(--success)]/10 px-2 py-1 text-[10px] text-[var(--success)] hover:bg-[var(--success)]/20"
            >
              Accepted
            </button>
            <button
              onClick={() => onStageChange(program.id, 'rejected')}
              className="rounded bg-[var(--danger)]/10 px-2 py-1 text-[10px] text-[var(--danger)] hover:bg-[var(--danger)]/20"
            >
              Rejected
            </button>
          </>
        )}
        {program.stage === 'accepted' && (
          <span className="rounded bg-[var(--success)]/15 px-2 py-1 text-[10px] text-[var(--success)]">
            ✅ Accepted
          </span>
        )}
        {program.stage === 'rejected' && (
          <span className="rounded bg-[var(--danger)]/10 px-2 py-1 text-[10px] text-[var(--danger)]">
            ❌ Rejected
          </span>
        )}
        <button
          onClick={() => onEdit(program)}
          className="ml-auto rounded bg-white/5 px-2 py-1 text-[10px] text-[var(--text-muted)] hover:text-white"
          title="Edit details"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(program.id)}
          className="rounded bg-white/5 px-2 py-1 text-[10px] text-[var(--danger)] hover:bg-[var(--danger)]/10"
          title="Remove program"
        >
          ×
        </button>
      </div>
    </div>
  )
}
