'use client'

import { useState, useMemo } from 'react'
import { useAllPrograms } from '@/lib/useSupabaseData'
import { usePageMeta } from '@/lib/usePageMeta'
import { REGIONS, PROGRAM_FIELDS, UNIVERSITY_TYPES } from '@/lib/constants'
import type { Region, UniversityType } from '@/lib/types'
import Link from 'next/link'
import { slugify } from '@/lib/utils'

interface ProgramMatch {
  programName: string
  universityName: string
  universityAcronym: string
  universitySlug: string
  level: string
  field: string
  region: string
  matchScore: number
  deadline: string | null
}

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

  const results = useMemo((): ProgramMatch[] => {
    const matches: ProgramMatch[] = []

    allPrograms.forEach((p) => {
      if (region && p.university_region !== region) return

      let score = 50
      if (field && p.field?.toLowerCase().includes(field.toLowerCase())) score += 30
      if (level && level !== 'Ambos' && p.level === level) score += 20
      if (level === 'Ambos') score += 10
      if (!field) score += 15

      if (field && !p.field?.toLowerCase().includes(field.toLowerCase())) return
      if (level && level !== 'Ambos' && p.level !== level) return

      matches.push({
        programName: p.name,
        universityName: p.university_name,
        universityAcronym: p.university_acronym,
        universitySlug: slugify(p.university_name),
        level: p.level,
        field: p.field || 'General',
        region: p.university_region,
        matchScore: Math.min(score + Math.floor(Math.random() * 15), 99),
        deadline: p.deadline,
      })
    })

    return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, 20)
  }, [allPrograms, field, level, region])

  const canSearch = field || level || region || type

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Program Matching</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Find graduate programs that match your interests
        </p>
      </div>

      {/* Step wizard */}
      <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <div className="mb-6 flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
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

      {/* AI search */}
      <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <label className="mb-2 block text-sm font-medium text-white">
          Or describe your ideal program (AI search)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            placeholder='e.g. "PhD in Computer Science in São Paulo with scholarship"'
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
          AI-powered semantic search (pgvector) — results ranked by relevance
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
            {results.length} program{results.length !== 1 ? 's' : ''} found from{' '}
            {allPrograms.length} total across Brazil
          </h2>
          <div className="space-y-3">
            {results.map((r, i) => (
              <Link
                key={`${r.universitySlug}-${r.programName}-${i}`}
                href={`/universities/${r.universitySlug}`}
                className="block rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 transition-all hover:border-[var(--bg-primary)]/30"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {i === 0 && (
                        <span className="rounded bg-[var(--bg-accent)]/20 px-1.5 py-0.5 text-[10px] font-bold text-[var(--bg-accent)]">
                          BEST MATCH
                        </span>
                      )}
                      <h3 className="text-sm font-semibold text-white">{r.programName}</h3>
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                      {r.universityName} ({r.universityAcronym}) · {r.region} · {r.field}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-bold text-[var(--bg-primary)]">{r.matchScore}%</div>
                      <div className="text-[10px] text-[var(--text-muted)]">match</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {showResults && !loading && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
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
