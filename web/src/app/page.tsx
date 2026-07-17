import Link from 'next/link'
import { REGIONS, UNIVERSITY_TYPES } from '@/lib/constants'

export default function HomePage() {
  return (
    <div>
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
              Explore Masters and PhD programs across 109 Brazilian universities.
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
                href="/matching"
                className="rounded-lg border border-[var(--border)] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/5"
              >
                Find Your Match
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { value: '109', label: 'Universities' },
              { value: '5', label: 'Regions' },
              { value: '26+1', label: 'States + DF' },
              { value: 'Live', label: 'Data Updates' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 text-center"
              >
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-[var(--text-muted)]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
            href="/matching"
            className="rounded-lg bg-[var(--bg-accent)] px-6 py-3 text-sm font-medium text-black transition-opacity hover:opacity-90"
          >
            Start Matching
          </Link>
        </div>
      </section>
    </div>
  )
}
