'use client'

import Link from 'next/link'
import type { University } from '@/lib/types'
import { slugify } from '@/lib/utils'
import Badge from './Badge'

interface UniversityCardProps {
  university: University
  programCount?: number
}

const regionColors: Record<string, string> = {
  Norte: '#009739',
  Nordeste: '#FEDD00',
  'Centro-Oeste': '#002776',
  Sudeste: '#FF6B35',
  Sul: '#7C3AED',
}

export default function UniversityCard({ university, programCount }: UniversityCardProps) {
  return (
    <Link
      href={`/universities/${slugify(university.name)}`}
      className="group rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-all hover:border-[var(--bg-primary)]/30 hover:bg-[var(--bg-card-hover)]"
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-primary)]/10 text-sm font-bold text-[var(--bg-primary)]">
          {university.acronym.slice(0, 2)}
        </div>
        <Badge variant="region" color={regionColors[university.region]}>
          {university.region}
        </Badge>
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
