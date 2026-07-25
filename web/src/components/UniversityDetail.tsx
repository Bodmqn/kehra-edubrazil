'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { slugify } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useUniversities, useUniversityDetails } from '@/lib/useSupabaseData'
import type { University } from '@/lib/types'
import { COST_OF_LIVING } from '@/lib/costOfLiving'
import { availablePrograms as availableProgramsData } from '@/lib/available-programs'
import Badge from '@/components/Badge'
import TabBar from '@/components/TabBar'
import { STORAGE_KEY } from '@/lib/trackerTypes'
import type { TrackerProgram } from '@/lib/trackerTypes'
import TrackerModal from '@/components/tracker/TrackerModal'
import { REGIONS } from '@/lib/constants'

const regionColors: Record<string, string> = Object.fromEntries(
  REGIONS.map((r) => [r.key, r.color])
)

const TABS = [
  { key: 'available', label: 'Available' },
  { key: 'about', label: 'About' },
  { key: 'study-guide', label: 'Study Guide' },
]

interface QuickFact {
  label: string
  value: string
  link?: string
}

interface UniversityDetailProps {
  slug: string
  fallbackUniversity: University | null
}

export default function UniversityDetail({ slug, fallbackUniversity }: UniversityDetailProps) {
  const { universities: liveUniversities } = useUniversities()
  const liveUniversity = liveUniversities.find((u) => slugify(u.name) === slug)
  const university = liveUniversity ?? fallbackUniversity

  const uniId = university?.id ?? null
  const isRealId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uniId ?? '')
  const { details } = useUniversityDetails(isRealId ? uniId : null)
  const [activeTab, setActiveTab] = useState('available')

  const uniAvailablePrograms = useMemo(
    () => (availableProgramsData[slug] ?? []).slice().sort((a, b) => a.name.localeCompare(b.name)),
    [slug]
  )
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null)
  const [studyGuide, setStudyGuide] = useState<Record<string, string>>({})

  useEffect(() => {
    supabase.from('study_guide_sections').select('section_key, content').then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {}
        for (const s of data) map[s.section_key] = s.content
        setStudyGuide(map)
      }
    })
  }, [])

  const [availTypeFilter, setAvailTypeFilter] = useState<'all' | 'Acadêmico' | 'Profissional'>('all')
  const [availLevelFilter, setAvailLevelFilter] = useState<string>('all')
  const [availSearch, setAvailSearch] = useState('')
  const [savedIds, setSavedIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return new Set()
      return new Set((JSON.parse(stored) as { id: string }[]).map((p) => p.id))
    } catch {
      return new Set()
    }
  })

  const [trackerModalProgram, setTrackerModalProgram] = useState<TrackerProgram | null>(null)
  const [trackerModalOpen, setTrackerModalOpen] = useState(false)

  const handleTypeFilter: typeof setAvailTypeFilter = (type) => {
    setAvailTypeFilter(type)
    setAvailLevelFilter('all')
  }

  const programId = (acronym: string, name: string) => slugify(`${acronym}-${name}`)

  const openTrackerModal = (pName: string, pLevel: string) => {
    const id = programId(university?.acronym ?? '', pName)
    const stored = localStorage.getItem(STORAGE_KEY)
    const list: TrackerProgram[] = stored ? JSON.parse(stored) : []
    const existing = list.find((p) => p.id === id)

    if (existing) {
      setTrackerModalProgram(existing)
    } else {
      setTrackerModalProgram({
        id,
        name: pName,
        university: `${university?.name ?? ''} (${university?.acronym ?? ''})`,
        deadline: null,
        level: pLevel,
        programUrl: null,
        stage: 'saved',
        priority: 'medium',
        notes: '',
        checklist: [],
        reminderDays: [],
        source: 'manual',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as TrackerProgram)
    }
    setTrackerModalOpen(true)
  }

  const handleTrackerSave = (program: TrackerProgram) => {
    const stored = localStorage.getItem(STORAGE_KEY)
    let list: TrackerProgram[] = stored ? JSON.parse(stored) : []
    const idx = list.findIndex((p) => p.id === program.id)

    if (idx >= 0) {
      list[idx] = { ...program, updatedAt: new Date().toISOString() }
    } else {
      list = [program, ...list]
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    setSavedIds(new Set(list.map((p) => p.id)))
    setTrackerModalOpen(false)
    setTrackerModalProgram(null)
  }

  const handleQuickRemove = (pName: string) => {
    const id = programId(university?.acronym ?? '', pName)
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return
    const list: TrackerProgram[] = JSON.parse(stored)
    const filtered = list.filter((p) => p.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    setSavedIds(new Set(filtered.map((p) => p.id)))
  }

  const availableLevels = useMemo(() => {
    const filtered = availTypeFilter === 'all'
      ? uniAvailablePrograms
      : uniAvailablePrograms.filter((p) => p.typeLabel === availTypeFilter)
    return [...new Set(filtered.map((p) => p.levelLabel))].sort()
  }, [uniAvailablePrograms, availTypeFilter])

  const filteredAvailable = useMemo(() => {
    let result = uniAvailablePrograms
    if (availTypeFilter !== 'all') result = result.filter((p) => p.typeLabel === availTypeFilter)
    if (availLevelFilter !== 'all') result = result.filter((p) => p.levelLabel === availLevelFilter)
    if (availSearch) {
      const q = availSearch.toLowerCase()
      result = result.filter((p) => p.name.toLowerCase().includes(q))
    }
    return result
  }, [uniAvailablePrograms, availTypeFilter, availLevelFilter, availSearch])

  const academicCount = useMemo(
    () => uniAvailablePrograms.filter((p) => p.typeLabel === 'Acadêmico').length,
    [uniAvailablePrograms]
  )
  const profissionalCount = useMemo(
    () => uniAvailablePrograms.filter((p) => p.typeLabel === 'Profissional').length,
    [uniAvailablePrograms]
  )

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
                  {university.acronym}
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
              <div className="text-lg font-bold text-white">{uniAvailablePrograms.length}</div>
              <div className="text-xs text-[var(--text-muted)]">Programs</div>
            </div>
            <div className="rounded-lg bg-[var(--bg-card)] p-3 text-center">
              <div className="text-lg font-bold text-emerald-400">{academicCount}</div>
              <div className="text-xs text-[var(--text-muted)]">Acadêmico</div>
            </div>
            <div className="rounded-lg bg-[var(--bg-card)] p-3 text-center">
              <div className="text-lg font-bold text-sky-400">{profissionalCount}</div>
              <div className="text-xs text-[var(--text-muted)]">Profissional</div>
            </div>
          </div>
        </div>
      </section>

      {university && (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 mb-6">
          <div className="rounded-xl border-l-4 border-l-[var(--bg-primary)] border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <div className="flex gap-3">
              <span className="text-lg shrink-0 mt-0.5">📋</span>
              <div>
                <p className="text-sm font-semibold text-white">
                  Source: CAPES / Brazilian Ministry of Education (2021–2024)
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                  The programs listed in the Available tab come from the official CAPES graduate course registry. While this is the most comprehensive source available, program details, deadlines, and selection processes may change. Always verify the latest information on the university&apos;s SIGAA portal or official website before applying.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

        <div className="py-6">
          {/* Available Tab */}
          {activeTab === 'available' && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white">Available Programs</h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Graduate programs offered by this university. Click a program to see details.
                </p>
              </div>
              {uniAvailablePrograms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <p className="text-sm text-[var(--text-muted)]">No program data available for this university yet.</p>
                </div>
              ) : (
                <div>
                  <div className="relative mb-4">
                    <input
                      type="text"
                      value={availSearch}
                      onChange={(e) => setAvailSearch(e.target.value)}
                      placeholder="Search programs..."
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 pr-8 text-sm text-white outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--bg-primary)]/50"
                    />
                    {availSearch && (
                      <button
                        onClick={() => setAvailSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors text-lg leading-none"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    {(['all', 'Acadêmico', 'Profissional'] as const).map((type) => (
                      <button
                        key={type}
                                                        onClick={() => handleTypeFilter(type)}
                        aria-pressed={availTypeFilter === type}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                          availTypeFilter === type
                            ? 'border-[var(--bg-primary)] bg-[var(--bg-primary)]/10 text-[var(--bg-primary)]'
                            : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-white'
                        }`}
                      >
                        {type === 'all' ? 'All Types' : type}
                      </button>
                    ))}
                    <span className="mx-1 h-5 w-px bg-[var(--border)]" />
                    {availableLevels.length > 0 && (
                      <>
                        <button
                          onClick={() => setAvailLevelFilter('all')}
                          aria-pressed={availLevelFilter === 'all'}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                            availLevelFilter === 'all'
                              ? 'border-[var(--bg-primary)] bg-[var(--bg-primary)]/10 text-[var(--bg-primary)]'
                              : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-white'
                          }`}
                        >
                          All Levels
                        </button>
                        {availableLevels.map((level) => (
                          <button
                            key={level}
                            onClick={() => setAvailLevelFilter(level)}
                            aria-pressed={availLevelFilter === level}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                              availLevelFilter === level
                                ? 'border-[var(--bg-primary)] bg-[var(--bg-primary)]/10 text-[var(--bg-primary)]'
                                : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-white'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                  {filteredAvailable.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <p className="text-sm text-[var(--text-muted)]">No programs match your filters</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredAvailable.map((p, i) => {
                        const isExpanded = expandedProgram === `${p.name}-${i}`
                        return (
                          <div key={`${p.name}-${i}`} className="rounded-lg border border-[var(--border)] overflow-hidden">
                            <button
                              onClick={() => setExpandedProgram(isExpanded ? null : `${p.name}-${i}`)}
                              className="flex w-full items-center justify-between bg-[var(--bg-card)] px-4 py-3 text-left text-sm font-medium text-white transition-colors hover:bg-[var(--bg-card-hover)]"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="truncate">{p.name}</span>
                                {p.capesScore && (
                                  <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                                    p.capesScore === '7' ? 'bg-yellow-500/20 text-yellow-400' :
                                    p.capesScore === '5' || p.capesScore === '6' ? 'bg-emerald-500/20 text-emerald-400' :
                                    p.capesScore === '4' ? 'bg-sky-500/20 text-sky-400' :
                                    p.capesScore === '3' ? 'bg-gray-500/20 text-gray-400' :
                                    'bg-violet-500/20 text-violet-400'
                                  }`}>
                                    CAPES {p.capesScore}
                                  </span>
                                )}
                              </div>
                              <svg
                                className={`h-4 w-4 text-[var(--text-muted)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            {isExpanded && (
                              <div className="border-t border-[var(--border)] bg-[var(--bg-card)]/50 px-4 py-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-2 flex-1">
                                    <div className="grid grid-cols-3 gap-3 text-sm">
                                      <div>
                                        <span className="text-xs text-[var(--text-muted)]">Level</span>
                                        <p className="font-medium text-white">{p.levelLabel}</p>
                                      </div>
                                      <div>
                                        <span className="text-xs text-[var(--text-muted)]">Type</span>
                                        <p className="font-medium text-white">{p.typeLabel}</p>
                                      </div>
                                      <div>
                                        <span className="text-xs text-[var(--text-muted)]">CAPES Score</span>
                                        <p className="font-medium text-white">{p.capesScore || '—'}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs">
                                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${p.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                      <span className="text-[var(--text-secondary)]">
                                        {p.status === 'active' ? 'Active program' : 'Deactivated program'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="shrink-0 flex items-center gap-1">
                                    {savedIds.has(programId(university?.acronym ?? '', p.name)) ? (
                                      <>
                                        <button
                                          onClick={() => openTrackerModal(p.name, p.levelLabel)}
                                          className="rounded-lg border border-[var(--bg-primary)]/40 bg-[var(--bg-primary)]/10 px-3 py-1.5 text-xs font-medium text-[var(--bg-primary)] transition-all hover:bg-[var(--bg-primary)]/20"
                                        >
                                          Edit in Tracker
                                        </button>
                                        <button
                                          onClick={() => handleQuickRemove(p.name)}
                                          className="rounded-lg border border-red-500/30 p-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-all"
                                          title="Remove from tracker"
                                        >
                                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        onClick={() => openTrackerModal(p.name, p.levelLabel)}
                                        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-all hover:border-[var(--bg-primary)]/30 hover:text-white"
                                      >
                                        Save to Tracker
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
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
                    { label: 'Total Programs', value: String(uniAvailablePrograms.length) },
                    university.sigaa_url
                      ? { label: 'Graduate Portal', value: '', link: university.sigaa_url }
                      : null,
                  ].filter((x): x is QuickFact => x != null).map((f) => (
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
                    {studyGuide.visa || 'Information coming soon.'}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
                  <h4 className="mb-2 text-sm font-semibold text-white">Language Requirements</h4>
                  <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                    {studyGuide.language || 'Information coming soon.'}
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
                    {studyGuide.housing || 'Information coming soon.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      <TrackerModal
        open={trackerModalOpen}
        program={trackerModalProgram}
        onSave={handleTrackerSave}
        onClose={() => { setTrackerModalOpen(false); setTrackerModalProgram(null) }}
      />
    </div>
  )
}
