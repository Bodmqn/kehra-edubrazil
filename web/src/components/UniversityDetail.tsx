'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { slugify } from '@/lib/utils'
import { getMockPrograms } from '@/lib/mock-programs'
import { useUniversities, usePrograms, useUniversityDetails } from '@/lib/useSupabaseData'
import type { University } from '@/lib/types'
import { COST_OF_LIVING } from '@/lib/costOfLiving'
import Badge from '@/components/Badge'
import TabBar from '@/components/TabBar'
import SearchInput from '@/components/SearchInput'
import ProgramCard from '@/components/ProgramCard'
import { REGIONS } from '@/lib/constants'

const regionColors: Record<string, string> = Object.fromEntries(
  REGIONS.map((r) => [r.key, r.color])
)

const TABS = [
  { key: 'programs', label: 'Programs' },
  { key: 'available', label: 'Available' },
  { key: 'about', label: 'About' },
  { key: 'study-guide', label: 'Study Guide' },
]

interface UniversityDetailProps {
  slug: string
  fallbackUniversity: University | null
}

export default function UniversityDetail({ slug, fallbackUniversity }: UniversityDetailProps) {
  const { universities: liveUniversities, loading: liveLoading } = useUniversities()
  const liveUniversity = liveUniversities.find((u) => slugify(u.name) === slug)
  const university = liveUniversity ?? fallbackUniversity
  const { programs: livePrograms, loading: programsLoading } = usePrograms(university?.id ?? null)
  const { details } = useUniversityDetails(university?.id ?? null)
  const [activeTab, setActiveTab] = useState('programs')
  const [programSearch, setProgramSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState<'all' | 'Mestrado' | 'Doutorado'>('all')
  const [showOpenOnly, setShowOpenOnly] = useState(true)
  const [sortBy, setSortBy] = useState<'name' | 'deadline' | 'status'>('name')

  const showMockPrograms = !programsLoading && livePrograms.length === 0
  const programs = livePrograms.length > 0
    ? livePrograms
    : showMockPrograms && university
      ? getMockPrograms(university.acronym, university.id)
      : []

  const filteredPrograms = useMemo(() => {
    const filtered = programs.filter((p) => {
      if (showOpenOnly && p.status !== 'Aberto') return false
      if (levelFilter !== 'all' && p.level !== levelFilter) return false
      if (programSearch) {
        const q = programSearch.toLowerCase()
        if (!p.name.toLowerCase().includes(q) && !(p.field || '').toLowerCase().includes(q))
          return false
      }
      return true
    })

    filtered.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'deadline') {
        if (!a.deadline && !b.deadline) return 0
        if (!a.deadline) return 1
        if (!b.deadline) return -1
        return a.deadline.localeCompare(b.deadline)
      }
      const order = { Aberto: 0, 'Em Breve': 1, Fechado: 2 }
      return (order[a.status as keyof typeof order] ?? 3) - (order[b.status as keyof typeof order] ?? 3)
    })

    return filtered
  }, [programs, programSearch, levelFilter, showOpenOnly, sortBy])

  const availablePrograms = useMemo(() => {
    const prevYear = new Date().getFullYear() - 1
    const byPrevYear = programs.filter(p => {
      if (!p.deadline) return false
      return new Date(p.deadline).getFullYear() === prevYear
    })
    return byPrevYear.length > 0 ? byPrevYear : programs
  }, [programs])

  if (!university) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <p className="text-sm text-[var(--text-muted)]">University not found</p>
        <Link href="/universities" className="mt-2 text-xs text-[var(--bg-primary)] hover:underline">
          Back to directory
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: `linear-gradient(135deg, ${regionColors[university.region]} 0%, transparent 50%, ${university.type === 'Federal' ? '#002776' : '#009739'} 100%)`,
          }}
        />
        <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <Link
            href="/universities"
            className="mb-4 inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-white"
          >
            ← Back to universities
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--bg-primary)]/10 text-lg font-bold text-[var(--bg-primary)]">
                  {university.acronym.slice(0, 2)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white sm:text-3xl">
                    {university.name}
                  </h1>
                  <div className="mt-1 flex items-start justify-between gap-4 text-sm text-[var(--text-secondary)]">
                    <span className="flex items-center gap-3 flex-wrap">
                      <span>{university.acronym} · {university.type} · {university.state}</span>
                      {university.school_url && (
                        <a
                          href={university.school_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[var(--bg-primary)] hover:underline whitespace-nowrap"
                        >
                          Official website ↗
                        </a>
                      )}
                    </span>
                    {university.sigaa_url && (
                      <a
                        href={university.sigaa_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[var(--success)] hover:underline whitespace-nowrap"
                      >
                        View open selections ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="region" color={regionColors[university.region]}>
                {university.region}
              </Badge>
              <Badge variant="type">{university.type}</Badge>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-6">
            <div className="rounded-lg bg-[var(--bg-card)] p-3 text-center">
              <div className="text-lg font-bold text-white">{programs.length}</div>
              <div className="text-xs text-[var(--text-muted)]">Programs</div>
            </div>
            <div className="rounded-lg bg-[var(--bg-card)] p-3 text-center">
              <div className="text-lg font-bold text-[var(--success)]">
                {programs.filter((p) => p.status === 'Aberto').length}
              </div>
              <div className="text-xs text-[var(--text-muted)]">Open</div>
            </div>
            <div className="rounded-lg bg-[var(--bg-card)] p-3 text-center">
              <div className="text-lg font-bold text-[var(--warning)]">
                {programs.filter((p) => p.status === 'Em Breve').length}
              </div>
              <div className="text-xs text-[var(--text-muted)]">Coming Soon</div>
            </div>
          </div>
        </div>
      </section>

      {university && (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 mb-6">
          <div className="rounded-xl border border-[var(--warning)]/20 bg-[var(--warning)]/5 p-4">
            <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
              <strong className="text-[var(--warning)]">Attention:</strong> Some information displayed for this university may not be 100% accurate or up to date. Our data is automatically collected by a scraping system from the university's official website and SIGAA/Edital pages, and certain details may be incomplete or subject to change.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

        <div className="py-6">
          {/* Programs Tab */}
          {activeTab === 'programs' && (
            <div>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <SearchInput
                    value={programSearch}
                    onChange={setProgramSearch}
                    placeholder="Search programs..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  {(['all', 'Mestrado', 'Doutorado'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setLevelFilter(level)}
                      aria-pressed={levelFilter === level}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                        levelFilter === level
                          ? 'border-[var(--bg-primary)] bg-[var(--bg-primary)]/10 text-[var(--bg-primary)]'
                          : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-white'
                      }`}
                    >
                      {level === 'all' ? 'All' : level}
                    </button>
                  ))}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1.5 text-xs text-white outline-none"
                  >
                    <option value="name">Name A-Z</option>
                    <option value="deadline">Deadline</option>
                    <option value="status">Status</option>
                  </select>
                  <button
                    onClick={() => setShowOpenOnly(!showOpenOnly)}
                    aria-pressed={showOpenOnly}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                      showOpenOnly
                        ? 'border-[var(--success)] bg-[var(--success)]/10 text-[var(--success)]'
                        : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-white'
                    }`}
                  >
                    Open Only
                  </button>
                </div>
              </div>

              {filteredPrograms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <p className="text-sm text-[var(--text-muted)]">No programs match your filters</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPrograms.map((program) => (
                    <ProgramCard key={program.id} program={program} universityName={`${university.name} (${university.acronym})`} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Available Tab */}
          {activeTab === 'available' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white">Available Programs</h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  These programs were offered in recent years and are expected to be available again. Use this as a reference to explore the university's graduate offerings.
                </p>
              </div>
              {['Mestrado', 'Doutorado'].map(level => {
                const levelPrograms = availablePrograms.filter(p => p.level === level)
                if (levelPrograms.length === 0) return null
                return (
                  <div key={level} className="mb-6">
                    <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">{level}</h4>
                    <div className="space-y-2">
                      {levelPrograms.map(p => (
                        <div
                          key={p.id}
                          className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3"
                        >
                          <div className="text-sm font-medium text-white">{p.name}</div>
                          {p.field && (
                            <div className="mt-0.5 text-xs text-[var(--text-muted)]">{p.field}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
              {availablePrograms.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                  <p className="text-sm text-[var(--text-muted)]">No program data available for this university yet.</p>
                </div>
              )}
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-lg font-semibold text-white">About {university.name}</h3>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  {details?.about_text ||
                    `${university.name} (${university.acronym}) is a ${university.type.toLowerCase()} university located in ${university.state}, ${university.region} region of Brazil. It offers graduate programs at the Masters (Mestrado) and PhD (Doutorado) levels through its various departments and research centers.`}
                </p>
                {details?.wikipedia_url && (
                  <a
                    href={details.wikipedia_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--bg-primary)] hover:underline"
                  >
                    Source: Wikipedia ↗
                  </a>
                )}
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-white">Quick Facts</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: 'Type', value: university.type },
                    { label: 'Region', value: university.region },
                    { label: 'State', value: university.state },
                    { label: 'Acronym', value: university.acronym },
                    { label: 'Total Programs', value: String(programs.length) },
                    university.sigaa_url
                      ? { label: 'Graduate Portal', value: '', link: university.sigaa_url }
                      : null,
                  ].filter(Boolean).map((f: any) => (
                    <div
                      key={f.label}
                      className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3"
                    >
                      <div className="text-xs text-[var(--text-muted)]">{f.label}</div>
                      <div className="text-sm font-medium text-white">
                        {f.link ? (
                          <a href={f.link} target="_blank" rel="noopener noreferrer" className="text-[var(--success)] hover:underline">
                            View open selections ↗
                          </a>
                        ) : (
                          f.value
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Study Guide Tab */}
          {activeTab === 'study-guide' && (
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  Study Guide for {university.state}
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Information for international students interested in studying at {university.name}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
                  <h4 className="mb-2 text-sm font-semibold text-white">Visa Process</h4>
                  <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                    International students need a student visa (VITEM IV) to study in Brazil. Apply at
                    the Brazilian consulate in your home country. Required documents include: passport,
                    acceptance letter, proof of financial means, and health insurance.
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
                  <h4 className="mb-2 text-sm font-semibold text-white">Language Requirements</h4>
                  <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                    Most programs require Portuguese proficiency (CELPE-Bras certificate). Some
                    graduate programs offer courses in English or have English-language tracks.
                    Contact the specific program for their language requirements.
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
                  <h4 className="mb-2 text-sm font-semibold text-white">Cost of Living in {university.state}</h4>
                  {(() => {
                    const cost = COST_OF_LIVING[university.state]
                    if (!cost) {
                      return (
                        <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                          Cost of living varies by city. In major cities like São Paulo or Rio de Janeiro,
                          expect monthly expenses of R$ 2,500-4,000 for a single student, including rent,
                          food, transport, and utilities. Smaller cities are more affordable.
                        </p>
                      )
                    }
                    return (
                      <div className="space-y-2">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-[var(--text-secondary)]">Estimated monthly cost</span>
                          <span className="text-sm font-bold text-white">{cost.brlRange}</span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-[var(--text-secondary)]">Approximate USD</span>
                          <span className="text-sm font-bold text-[var(--bg-accent)]">{cost.usdRange}</span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-[var(--text-secondary)]">Cost level</span>
                          <span className="text-xs font-medium text-white">{cost.level}</span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-[var(--text-secondary)]">Capital</span>
                          <span className="text-xs text-white">{cost.capital}</span>
                        </div>
                      </div>
                    )
                  })()}
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
                  <h4 className="mb-2 text-sm font-semibold text-white">Housing</h4>
                  <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                    Options include university housing (when available), shared apartments
                    (república), or private rentals. Websites like QuintoAndar, OLX, and Airbnb
                    are popular for finding accommodation. Start your search 1-2 months before
                    arrival.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
