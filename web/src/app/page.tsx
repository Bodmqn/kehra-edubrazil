'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { REGIONS, UNIVERSITY_TYPES, ALL_STATES } from '@/lib/constants'
import { formatDate, slugify, daysUntil, getDeadlineUrgency } from '@/lib/utils'
import { useHomeStats, useAllPrograms } from '@/lib/useSupabaseData'
import { usePageMeta } from '@/lib/usePageMeta'
import SplashNotice from '@/components/SplashNotice'
import type { ProgramWithUniversity } from '@/lib/types'

function useLiveStats() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const stats = useHomeStats()
  return mounted ? stats : { universityCount: 109, programCount: 0, openProgramCount: 0, approachingDeadlineCount: 0, lastScrapeDate: null }
}

export default function HomePage() {
  usePageMeta('Home', 'Find Masters and PhD programs across 109 Brazilian universities')
  const stats = useLiveStats()
  const { programs: allPrograms, loading: programsLoading } = useAllPrograms()
  const [latestPrograms, setLatestPrograms] = useState<ProgramWithUniversity[]>([])

  useEffect(() => {
    if (!programsLoading && allPrograms.length > 0) {
      const now = new Date()
      const upcoming = allPrograms.filter(p => {
        if (!p.deadline) return false
        return new Date(p.deadline) >= now
      })
      const seen = new Set<string>()
      const diversified = upcoming.filter(p => {
        if (seen.size >= 6) return false
        if (seen.has(p.university_id)) return false
        seen.add(p.university_id)
        return true
      })
      setLatestPrograms(diversified.length > 0 ? diversified : upcoming.slice(0, 6))
    }
  }, [allPrograms, programsLoading])

  const statItems = [
    { value: stats.universityCount.toString(), label: 'Universities' },
    { value: '2000+', label: 'Graduate Programs' },
    { value: `${ALL_STATES.length}`, label: 'States + DF' },
  ]

  return (
    <div>
      <SplashNotice />
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-primary)]/5 via-transparent to-[var(--bg-secondary)]/5" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Find Your Graduate Program{' '}
              <span className="text-gradient">in Brazil</span>
            </h1>
            <p className="mb-8 text-lg text-[var(--text-secondary)]">
              Explore Masters and PhD programs across {stats.universityCount} Brazilian universities.
              Track deadlines, compare programs, and apply with confidence.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/universities"
                className="rounded-lg bg-[var(--bg-primary)] px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Browse Universities
              </Link>
              <Link
                href="/map"
                className="rounded-lg border border-[var(--border)] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/5"
              >
                Explore Map
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-live="polite" aria-label="Live statistics">
            {statItems.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 text-center transition-all hover:border-[var(--bg-primary)]/30 hover:bg-[var(--bg-card)]/80"
              >
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-[var(--text-muted)]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Deadlines */}
      {latestPrograms.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Upcoming Deadlines</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Programs with the nearest application deadlines
              </p>
            </div>
            <Link
              href="/universities"
              className="text-xs font-medium text-[var(--bg-primary)] hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {latestPrograms.map((p) => {
              const regColor = REGIONS.find(r => r.key === p.university_region)?.color ?? '#666'
              const days = daysUntil(p.deadline)
              const urgency = getDeadlineUrgency(days)
              return (
              <Link
                key={p.id}
                href={`/universities/${slugify(p.university_name)}`}
                className="group rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-all hover:border-[var(--bg-primary)]/30"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: regColor }}
                      />
                      <h3 className="text-sm font-semibold text-white group-hover:text-[var(--bg-primary)] transition-colors truncate">
                        {p.name}
                      </h3>
                    </div>
                    {p.level && (
                      <p className="mt-0.5 text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                        {p.level}{p.field ? ` · ${p.field}` : ''}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                      p.status === 'Aberto'
                        ? 'border-green-500/20 bg-green-500/10 text-green-400'
                        : p.status === 'Em Breve'
                          ? 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400'
                          : 'border-red-500/20 bg-red-500/10 text-red-400'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] truncate">
                  {p.university_name} ({p.university_acronym})
                </p>
                {p.deadline && (
                  <p className="mt-2 text-xs" style={{ color: urgency.color }}>
                    {urgency.label} · {formatDate(p.deadline)}
                  </p>
                )}
              </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Explore by Region */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="mb-2 text-2xl font-bold text-white">Explore by Region</h2>
        <p className="mb-8 text-sm text-[var(--text-secondary)]">
          Browse universities across all five Brazilian regions
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {REGIONS.map((region) => (
            <Link
              key={region.key}
              href={`/universities?region=${region.key}`}
              className="group rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-all hover:border-[var(--bg-primary)]/30"
            >
              <div
                className="mb-3 h-1.5 w-12 rounded-full"
                style={{ backgroundColor: region.color }}
              />
              <h3 className="text-sm font-semibold text-white group-hover:text-[var(--bg-primary)] transition-colors">
                {region.key}
              </h3>
              <p className="mt-1 text-xs text-[var(--text-muted)]">View universities →</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Explore by Type */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <h2 className="mb-2 text-2xl font-bold text-white">By University Type</h2>
        <p className="mb-8 text-sm text-[var(--text-secondary)]">
          Federal or State universities across Brazil
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {UNIVERSITY_TYPES.map((type) => (
            <Link
              key={type.key}
              href={`/universities?type=${type.key}`}
              className="group rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 transition-all hover:border-[var(--bg-secondary)]/30"
            >
              <h3 className="text-lg font-semibold text-white group-hover:text-[var(--bg-secondary)] transition-colors">
                {type.label} Universities
              </h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Browse all {type.label.toLowerCase()} institutions →
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-2xl font-bold text-white">Ready to find your program?</h2>
          <p className="mb-6 text-sm text-[var(--text-secondary)]">
            Start exploring graduate opportunities across Brazil right now
          </p>
          <Link
            href="/universities"
            className="rounded-lg bg-[var(--bg-accent)] px-6 py-3 text-sm font-medium text-black transition-opacity hover:opacity-90"
          >
            Browse Universities
          </Link>
        </div>
      </section>
    </div>
  )
}
