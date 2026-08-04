'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import type { University } from '@/lib/types'
import { slugify } from '@/lib/utils'
import { REGIONS } from '@/lib/constants'
import { useSavedPrograms } from '@/lib/useSavedPrograms'
import Badge from './Badge'

interface UniversityCardProps {
  university: University
  programCount?: number
}

const regionColors: Record<string, string> = Object.fromEntries(
  REGIONS.map((r) => [r.key, r.color])
)

export default function UniversityCard({ university, programCount }: UniversityCardProps) {
  const { programs } = useSavedPrograms()

  const savedInfo = useMemo(() => {
    const matching = programs.filter((p) => p.university.startsWith(university.name))
    return {
      saved: matching.length > 0,
      reminder: matching.some((p) => p.reminderDays.length > 0),
    }
  }, [programs, university.name])

  return (
    <Link
      href={`/universities/${slugify(university.name)}`}
      className="group rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-all hover:border-[var(--bg-primary)]/30 hover:bg-[var(--bg-card-hover)]"
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex h-10 items-center rounded-lg bg-[var(--bg-primary)]/10 px-2 text-sm font-bold text-[var(--bg-primary)]">
          {university.acronym}
        </div>
        <div className="flex items-center gap-1.5">
          {savedInfo.saved && (
            <span className="text-xs" title="Saved to tracker">💾</span>
          )}
          {savedInfo.reminder && (
            <span className="text-xs" title="Has reminder set">🔔</span>
          )}
          <Badge variant="region" color={regionColors[university.region]}>
            {university.region}
          </Badge>
        </div>
      </div>

      <h3 className="mb-1 text-sm font-semibold text-white group-hover:text-[var(--bg-primary)] transition-colors">
        {university.name}
      </h3>
      <p className="mb-3 text-xs text-[var(--text-muted)]">
        {university.acronym} · {university.state} · {university.type}
      </p>

      <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
        {programCount !== undefined && (
          <span>{programCount} program{programCount !== 1 ? 's' : ''}</span>
        )}
        {university.school_url && (
          <span className="text-[var(--text-muted)]">Visit site ↗</span>
        )}
      </div>
    </Link>
  )
}
