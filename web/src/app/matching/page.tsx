'use client'

import { useState, useMemo, useEffect } from 'react'
import { useAllPrograms } from '@/lib/useSupabaseData'
import { usePageMeta } from '@/lib/usePageMeta'
import { REGIONS, PROGRAM_FIELDS, UNIVERSITY_TYPES } from '@/lib/constants'
import type { Region, UniversityType } from '@/lib/types'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { slugify, daysUntil, getDeadlineUrgency, formatDate } from '@/lib/utils'

interface ProgramMatch {
  id: string
  programName: string
  universityName: string
  universityAcronym: string
  universitySlug: string
  universityId: string
  level: string
  field: string
  region: string
  status: string
  matchScore: number
  deadline: string | null
  edital_url: string | null
}

const STORAGE_KEY = 'kehra-edubrazil-tracker'
const SAVED_SEARCH_KEY = 'kehra-edubrazil-matching-saved'

export default function MatchingPage() {
  usePageMeta('Program Matching', 'Find graduate programs that match your interests in Brazil')
  const { programs: allPrograms, loading } = useAllPrograms()
  const [step, setStep] = useState(1)
  const [field, setField] = useState('')
  const [level, setLevel] = useState<'Mestrado' | 'Doutorado' | 'Ambos' | ''>('')
  const [region, setRegion] = useState<Region | ''>('')
  const [type, setType] = useState<UniversityType | ''>('')
  const [aiQuery, setAiQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [openOnly, setOpenOnly] = useState(false)
  const [resultLimit, setResultLimit] = useState(20)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [justSavedId, setJustSavedId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'score' | 'deadline' | 'name' | 'status'>('score')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set())
  const [showRestoreBanner, setShowRestoreBanner] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  // Restore search from URL params on mount
  useEffect(() => {
    const f = searchParams.get('f')
    const l = searchParams.get('l')
    const r = searchParams.get('r')
    const t = searchParams.get('t')
    const q = searchParams.get('q')
    const o = searchParams.get('o')
    if (f || l || r || t || q) {
      if (f) setField(f)
      if (l && ['Mestrado', 'Doutorado', 'Ambos'].includes(l)) setLevel(l as typeof level)
      if (r && REGIONS.some(reg => reg.key === r)) setRegion(r as Region)
      if (t && ['Federal', 'State'].includes(t)) setType(t as UniversityType)
      if (q) setAiQuery(q)
      if (o === '1') setOpenOnly(true)
      setShowResults(true)
    }
  }, [])

  // Push filters to URL when results are active
  useEffect(() => {
    if (!showResults) return
    const params = new URLSearchParams()
    if (field) params.set('f', field)
    if (level) params.set('l', level)
    if (region) params.set('r', region)
    if (type) params.set('t', type)
    if (aiQuery.trim()) params.set('q', aiQuery.trim())
    if (openOnly) params.set('o', '1')
    const qs = params.toString()
    router.replace(qs ? `/matching?${qs}` : '/matching', { scroll: false })
  }, [field, level, region, type, aiQuery, openOnly, showResults, router])

  // Check for saved search on mount
  useEffect(() => {
    const saved = localStorage.getItem(SAVED_SEARCH_KEY)
    if (saved && !showResults) {
      setShowRestoreBanner(true)
    }
  }, [])

  const restoreSearch = () => {
    const saved = localStorage.getItem(SAVED_SEARCH_KEY)
    if (saved) {
      const s = JSON.parse(saved)
      if (s.field) setField(s.field)
      if (s.level) setLevel(s.level)
      if (s.region) setRegion(s.region)
      if (s.type) setType(s.type)
      if (s.aiQuery) setAiQuery(s.aiQuery)
      if (s.openOnly) setOpenOnly(true)
      setShowResults(true)
      setShowRestoreBanner(false)
      localStorage.removeItem(SAVED_SEARCH_KEY)
    }
  }

  const dismissRestore = () => {
    setShowRestoreBanner(false)
    localStorage.removeItem(SAVED_SEARCH_KEY)
  }

  const saveCurrentSearch = () => {
    const data = { field, level, region, type, aiQuery, openOnly }
    localStorage.setItem(SAVED_SEARCH_KEY, JSON.stringify(data))
  }

  const searchTokens = useMemo(() => {
    const q = aiQuery.trim()
    if (!q) return null
    return q.toLowerCase().split(/\s+/).filter(t => t.length > 1)
  }, [aiQuery])

  const results = useMemo((): ProgramMatch[] => {
    const matches: ProgramMatch[] = []

    allPrograms.forEach((p) => {
      if (region && p.university_region !== region) return
      if (type && p.university_type !== type) return
      if (openOnly && p.status !== 'Aberto') return

      if (searchTokens && searchTokens.length > 0) {
        const haystack = `${p.name} ${p.field || ''} ${p.university_name} ${p.university_acronym}`.toLowerCase()
        if (!searchTokens.some(t => haystack.includes(t))) return
      }

      let score = 50
      if (field && p.field?.toLowerCase().includes(field.toLowerCase())) score += 30
      if (level && level !== 'Ambos' && p.level === level) score += 20
      if (level === 'Ambos') score += 10
      if (searchTokens) score += 15

      if (field && !p.field?.toLowerCase().includes(field.toLowerCase())) return
      if (level && level !== 'Ambos' && p.level !== level) return

      matches.push({
        id: p.id,
        programName: p.name,
        universityName: p.university_name,
        universityAcronym: p.university_acronym,
        universitySlug: slugify(p.university_name),
        universityId: p.university_id,
        level: p.level,
        field: p.field || 'General',
        region: p.university_region,
        status: p.status,
        matchScore: Math.min(score, 99),
        deadline: p.deadline,
        edital_url: p.edital_url,
      })
    })

    matches.sort((a, b) => {
      if (sortBy === 'deadline') {
        if (!a.deadline && !b.deadline) return b.matchScore - a.matchScore
        if (!a.deadline) return 1
        if (!b.deadline) return -1
        return a.deadline.localeCompare(b.deadline)
      }
      if (sortBy === 'name') return a.programName.localeCompare(b.programName)
      if (sortBy === 'status') {
        const order: Record<string, number> = { Aberto: 0, 'Em Breve': 1, Fechado: 2 }
        return (order[a.status] ?? 3) - (order[b.status] ?? 3) || b.matchScore - a.matchScore
      }
      return b.matchScore - a.matchScore
    })
    return matches
  }, [allPrograms, field, level, region, type, aiQuery, openOnly, searchTokens, sortBy])

  const displayedResults = results.slice(0, resultLimit)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setSavedIds(new Set(JSON.parse(stored).map((p: { id: string }) => p.id)))
    }
  }, [])

  const toggleSave = (program: ProgramMatch) => {
    const stored = localStorage.getItem(STORAGE_KEY)
    let list: Array<{ id: string; name: string; university: string; deadline: string | null; stage: string }> = stored ? JSON.parse(stored) : []

    const exists = list.some(p => p.id === program.id)
    if (exists) {
      list = list.filter(p => p.id !== program.id)
    } else {
      list.push({
        id: program.id,
        name: program.programName,
        university: `${program.universityName} (${program.universityAcronym})`,
        deadline: program.deadline,
        stage: 'saved',
      })
      setJustSavedId(program.id)
      setTimeout(() => setJustSavedId(null), 2000)
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    setSavedIds(new Set(list.map(p => p.id)))
  }

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < 3) next.add(id)
      return next
    })
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Program Matching</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Find graduate programs that match your interests
        </p>
      </div>

      {/* Restore saved search banner */}
      {showRestoreBanner && (
        <div className="mb-8 rounded-xl border border-[var(--bg-accent)]/20 bg-[var(--bg-accent)]/5 p-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-[var(--text-secondary)]">
              You have a saved search. Want to pick up where you left off?
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={restoreSearch}
                className="rounded-lg bg-[var(--bg-accent)] px-3 py-1.5 text-xs font-medium text-black"
              >
                Restore
              </button>
              <button
                onClick={dismissRestore}
                className="text-xs text-[var(--text-muted)] hover:text-white transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step wizard */}
      {!showResults && (
        <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <div className="mb-6 flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2" role="listitem">
                <div
                  role="step"
                  aria-current={step === s ? 'step' : undefined}
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                    step >= s
                      ? 'bg-[var(--bg-primary)] text-white'
                      : 'border border-[var(--border)] text-[var(--text-muted)]'
                  }`}
                >
                  {s}
                </div>
                {s < 4 && <div className="h-px w-6 bg-[var(--border)]" />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                What field do you want to study?
              </label>
              <select
                value={field}
                onChange={(e) => setField(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-4 py-2.5 text-sm text-white outline-none"
              >
                <option value="">Any field</option>
                {PROGRAM_FIELDS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <button
                onClick={() => setStep(2)}
                className="mt-4 rounded-lg bg-[var(--bg-primary)] px-4 py-2 text-sm font-medium text-white"
              >
                Next →
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Choose level</label>
              <div className="flex gap-2">
                {(['Mestrado', 'Doutorado', 'Ambos'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => { setLevel(l); setStep(3) }}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                      level === l
                        ? 'border-[var(--bg-primary)] bg-[var(--bg-primary)]/10 text-[var(--bg-primary)]'
                        : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-white'
                    }`}
                  >
                    {l === 'Ambos' ? 'Both' : l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Preferred region</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setRegion(''); setStep(4) }}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                    !region
                      ? 'border-white bg-white/10 text-white'
                      : 'border-[var(--border)] text-[var(--text-secondary)]'
                  }`}
                >
                  Any region
                </button>
                {REGIONS.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => { setRegion(r.key); setStep(4) }}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                      region === r.key
                        ? 'border-[var(--bg-primary)] bg-[var(--bg-primary)]/10 text-[var(--bg-primary)]'
                        : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-white'
                    }`}
                  >
                    {r.key}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <label className="mb-2 block text-sm font-medium text-white">University type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => { setType(''); setShowResults(true) }}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                    !type
                      ? 'border-white bg-white/10 text-white'
                      : 'border-[var(--border)] text-[var(--text-secondary)]'
                  }`}
                >
                  Any type
                </button>
                {UNIVERSITY_TYPES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => { setType(t.key); setShowResults(true) }}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                      type === t.key
                        ? 'border-[var(--bg-secondary)] bg-[var(--bg-secondary)]/10 text-[var(--bg-secondary)]'
                        : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active filter bar */}
      {showResults && (
        <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-[var(--text-muted)]">Filters:</span>
            {field && <span className="rounded-full bg-[var(--bg-primary)]/10 px-2.5 py-1 text-[11px] text-[var(--bg-primary)]">{field}</span>}
            {level && <span className="rounded-full bg-[var(--bg-primary)]/10 px-2.5 py-1 text-[11px] text-[var(--bg-primary)]">{level === 'Ambos' ? 'Both' : level}</span>}
            {region && <span className="rounded-full bg-[var(--bg-primary)]/10 px-2.5 py-1 text-[11px] text-[var(--bg-primary)]">{region}</span>}
            {type && <span className="rounded-full bg-[var(--bg-primary)]/10 px-2.5 py-1 text-[11px] text-[var(--bg-primary)]">{type}</span>}
            {searchTokens && searchTokens.length > 0 && (
              <span className="rounded-full bg-[var(--bg-accent)]/10 px-2.5 py-1 text-[11px] text-[var(--bg-accent)] truncate max-w-[160px]">
                "{aiQuery}"
              </span>
            )}
            <button
              onClick={() => { setShowResults(false); setStep(1) }}
              className="ml-auto text-xs text-[var(--text-muted)] hover:text-white transition-colors"
            >
              Change filters
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={openOnly}
                onChange={(e) => setOpenOnly(e.target.checked)}
                className="h-3.5 w-3.5 accent-[var(--bg-primary)]"
              />
              <span className="text-[11px] text-[var(--text-secondary)]">Open programs only</span>
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-2.5 py-1 text-[11px] text-white outline-none"
            >
              <option value="score">Best Match</option>
              <option value="deadline">Deadline (soonest)</option>
              <option value="name">Name A-Z</option>
              <option value="status">Status (open first)</option>
            </select>
            {compareIds.size >= 2 && (
              <button
                onClick={() => setCompareIds(new Set())}
                className="text-[11px] text-[var(--text-muted)] hover:text-white transition-colors"
              >
                Clear compare
              </button>
            )}
            <button
              onClick={saveCurrentSearch}
              className="text-[11px] text-[var(--bg-primary)] hover:underline transition-colors"
              title="Save current filters to restore later"
            >
              Save Search
            </button>
          </div>
        </div>
      )}

      {/* Keyword search */}
      <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <label className="mb-2 block text-sm font-medium text-white">
          Or search by keywords
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setShowResults(true)}
            placeholder='e.g. "PhD in Computer Science in São Paulo"'
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-4 py-2.5 text-sm text-white placeholder-[var(--text-muted)] outline-none"
          />
          <button
            onClick={() => setShowResults(true)}
            className="rounded-lg bg-[var(--bg-accent)] px-4 py-2 text-sm font-medium text-black"
          >
            Search
          </button>
        </div>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Keyword search across program names, fields, and universities
        </p>
      </div>

      {/* Loading */}
      {showResults && loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--bg-primary)]" />
            <p className="text-xs text-[var(--text-muted)]">Loading programs...</p>
          </div>
        </div>
      )}

      {/* Results */}
      {showResults && !loading && results.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">
            {results.length} program{results.length !== 1 ? 's' : ''} found
          </h2>
          <div className="space-y-3">
            {displayedResults.map((r, i) => {
              const days = daysUntil(r.deadline)
              const urgency = getDeadlineUrgency(days)
              const isSaved = savedIds.has(r.id)
              const showSaved = justSavedId === r.id
              const regColor = REGIONS.find(reg => reg.key === r.region)?.color ?? '#666'
              const isExpanded = expandedId === r.id
              const isCompareChecked = compareIds.has(r.id)
              return (
                <div
                  key={`${r.id}`}
                  className={`rounded-xl border bg-[var(--bg-card)] p-4 transition-all ${
                    isCompareChecked
                      ? 'border-[var(--bg-accent)] ring-1 ring-[var(--bg-accent)]/30'
                      : 'border-[var(--border)] hover:border-[var(--bg-primary)]/30'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {/* Compare checkbox */}
                    <label className="mt-1 cursor-pointer shrink-0" title="Select to compare">
                      <input
                        type="checkbox"
                        checked={isCompareChecked}
                        onChange={() => toggleCompare(r.id)}
                        className="h-3.5 w-3.5 accent-[var(--bg-accent)]"
                      />
                    </label>
                    <div className="min-w-0 flex-1">
                      <Link href={`/universities/${r.universitySlug}`}>
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: regColor }}
                          />
                          {i === 0 && (
                            <span className="rounded bg-[var(--bg-accent)]/20 px-1.5 py-0.5 text-[10px] font-bold text-[var(--bg-accent)] shrink-0">
                              BEST MATCH
                            </span>
                          )}
                          <h3 className="text-sm font-semibold text-white hover:text-[var(--bg-primary)] transition-colors truncate">
                            {r.programName}
                          </h3>
                        </div>
                        <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                          {r.universityName} ({r.universityAcronym}) · {r.region} · {r.field}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          {r.deadline && (
                            <span className="text-[11px]" style={{ color: urgency.color }}>
                              {urgency.label} · {formatDate(r.deadline)}
                            </span>
                          )}
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                              r.status === 'Aberto'
                                ? 'border-green-500/20 bg-green-500/10 text-green-400'
                                : r.status === 'Em Breve'
                                  ? 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400'
                                  : 'border-red-500/20 bg-red-500/10 text-red-400'
                            }`}
                          >
                            {r.status}
                          </span>
                        </div>
                      </Link>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="mt-3 border-t border-[var(--border)] pt-3 space-y-1.5">
                          {r.edital_url && (
                            <a
                              href={r.edital_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-[var(--bg-primary)] hover:underline"
                            >
                              View edital ↗
                            </a>
                          )}
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--text-muted)]">
                            <span>Level: {r.level}</span>
                            <span>Field: {r.field}</span>
                            <span>Region: {r.region}</span>
                            <span>Score: {r.matchScore}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-bold text-[var(--bg-primary)]">{r.matchScore}%</div>
                        <div className="text-[10px] text-[var(--text-muted)]">match</div>
                      </div>
                      <button
                        onClick={() => toggleSave(r)}
                        className={`text-xs font-medium transition-colors ${
                          showSaved
                            ? 'text-green-400'
                            : isSaved
                              ? 'text-[var(--bg-primary)]'
                              : 'text-[var(--text-muted)] hover:text-white'
                        }`}
                      >
                        {showSaved ? 'Saved!' : isSaved ? 'Saved ✓' : '+ Save'}
                      </button>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : r.id)}
                        className="text-[10px] text-[var(--text-muted)] hover:text-white transition-colors"
                        aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                      >
                        {isExpanded ? '▲ Less' : '▼ More'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {/* Comparison table */}
          {compareIds.size >= 2 && (
            <div className="mt-8 rounded-xl border border-[var(--bg-accent)]/30 bg-[var(--bg-card)] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Compare Programs</h3>
                <button
                  onClick={() => setCompareIds(new Set())}
                  className="text-xs text-[var(--text-muted)] hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="py-2 pr-4 text-left text-[var(--text-muted)] font-medium">Attribute</th>
                      {results.filter(r => compareIds.has(r.id)).slice(0, 3).map(r => (
                        <th key={r.id} className="py-2 px-3 text-left font-semibold text-white">{r.universityAcronym}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Program', get: (r: ProgramMatch) => r.programName },
                      { label: 'University', get: (r: ProgramMatch) => `${r.universityName} (${r.universityAcronym})` },
                      { label: 'Level', get: (r: ProgramMatch) => r.level },
                      { label: 'Field', get: (r: ProgramMatch) => r.field },
                      { label: 'Region', get: (r: ProgramMatch) => r.region },
                      { label: 'Status', get: (r: ProgramMatch) => r.status },
                      { label: 'Deadline', get: (r: ProgramMatch) => r.deadline ? formatDate(r.deadline) : 'TBD' },
                      { label: 'Score', get: (r: ProgramMatch) => `${r.matchScore}%` },
                    ].map(row => (
                      <tr key={row.label} className="border-b border-[var(--border)] last:border-0">
                        <td className="py-2 pr-4 text-[var(--text-muted)] whitespace-nowrap">{row.label}</td>
                        {results.filter(r => compareIds.has(r.id)).slice(0, 3).map(r => (
                          <td key={r.id} className="py-2 px-3 text-[var(--text-secondary)]">{row.get(r)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {resultLimit < results.length && (
            <button
              onClick={() => setResultLimit(prev => prev + 20)}
              className="mt-4 w-full rounded-lg border border-[var(--border)] py-3 text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              Show {Math.min(20, results.length - resultLimit)} more ({results.length - resultLimit} remaining)
            </button>
          )}
        </div>
      )}

      {showResults && !loading && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16" role="alert">
          <p className="text-sm text-[var(--text-muted)]">
            No programs match your criteria. Try broadening your filters.
          </p>
          <button
            onClick={() => {
              setField('')
              setLevel('')
              setRegion('')
              setType('')
              setShowResults(false)
              setStep(1)
              setCompareIds(new Set())
              setExpandedId(null)
            }}
            className="mt-2 text-xs text-[var(--bg-primary)] hover:underline"
          >
            Reset filters
          </button>
        </div>
      )}
    </div>
  )
}
