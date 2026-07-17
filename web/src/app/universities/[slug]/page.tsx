'use client'

import { useParams } from 'next/navigation'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { universities } from '@/lib/data'
import { slugify } from '@/lib/utils'
import { getMockPrograms } from '@/lib/mock-programs'
import type { Program } from '@/lib/types'
import Badge from '@/components/Badge'
import TabBar from '@/components/TabBar'
import SearchInput from '@/components/SearchInput'
import ProgramCard from '@/components/ProgramCard'

const regionColors: Record<string, string> = {
  Norte: '#009739',
  Nordeste: '#FEDD00',
  'Centro-Oeste': '#002776',
  Sudeste: '#FF6B35',
  Sul: '#7C3AED',
}

const TABS = [
  { key: 'programs', label: 'Programs' },
  { key: 'about', label: 'About' },
  { key: 'study-guide', label: 'Study Guide' },
]

export default function UniversityDetailPage() {
  const params = useParams()
  const slug = params.slug as string

  const university = universities.find((u) => slugify(u.name) === slug)
  const [activeTab, setActiveTab] = useState('programs')
  const [programSearch, setProgramSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState<'all' | 'Mestrado' | 'Doutorado'>('all')
  const [showOpenOnly, setShowOpenOnly] = useState(true)

  const programs = university ? getMockPrograms(university.acronym, university.id) : []

  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      if (showOpenOnly && p.status !== 'Aberto') return false
      if (levelFilter !== 'all' && p.level !== levelFilter) return false
      if (programSearch) {
        const q = programSearch.toLowerCase()
        if (!p.name.toLowerCase().includes(q) && !(p.field || '').toLowerCase().includes(q))
          return false
      }
      return true
    })
  }, [programs, programSearch, levelFilter, showOpenOnly])

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
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {university.acronym} · {university.type} · {university.state}
                  </p>
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
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                        levelFilter === level
                          ? 'border-[var(--bg-primary)] bg-[var(--bg-primary)]/10 text-[var(--bg-primary)]'
                          : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-white'
                      }`}
                    >
                      {level === 'all' ? 'All' : level}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowOpenOnly(!showOpenOnly)}
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
                    <ProgramCard key={program.id} program={program} />
                  ))}
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
                  {university.name} ({university.acronym}) is a {university.type.toLowerCase()} university
                  located in {university.state}, {university.region} region of Brazil. It offers
                  graduate programs at the Masters (Mestrado) and PhD (Doutorado) levels through its
                  various departments and research centers.
                </p>
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
                  ].map((f) => (
                    <div
                      key={f.label}
                      className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3"
                    >
                      <div className="text-xs text-[var(--text-muted)]">{f.label}</div>
                      <div className="text-sm font-medium text-white">{f.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {university.school_url && (
                <a
                  href={university.school_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-white"
                >
                  Visit official website ↗
                </a>
              )}
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
                  <h4 className="mb-2 text-sm font-semibold text-white">Cost of Living</h4>
                  <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                    Cost of living varies by city. In major cities like São Paulo or Rio de Janeiro,
                    expect monthly expenses of R$ 2,500-4,000 for a single student, including rent,
                    food, transport, and utilities. Smaller cities are more affordable.
                  </p>
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
