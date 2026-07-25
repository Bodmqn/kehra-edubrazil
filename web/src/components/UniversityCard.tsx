'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { University } from '@/lib/types'
import { slugify } from '@/lib/utils'
import type { TrackerProgram } from '@/lib/trackerTypes'
import { STORAGE_KEY } from '@/lib/trackerTypes'
import { REGIONS } from '@/lib/constants'
import Badge from './Badge'

interface UniversityCardProps {
  university: University
  programCount?: number
}

const regionColors: Record<string, string> = Object.fromEntries(
  REGIONS.map((r) => [r.key, r.color])
)

export default function UniversityCard({ university, programCount }: UniversityCardProps) {
  const [inTracker] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return false
      const programs: TrackerProgram[] = JSON.parse(raw)
      return programs.some((p) => p.university === university.name)
    } catch {
      return false
    }
  })

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
          {inTracker && (
            <span className="text-xs" title="You have saved programs from this university">🔔</span>
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
