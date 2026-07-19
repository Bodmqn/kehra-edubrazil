'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useAllPrograms } from '@/lib/useSupabaseData'
import { usePageMeta } from '@/lib/usePageMeta'
import { REGIONS, UNIVERSITY_TYPES } from '@/lib/constants'
import type { Region, UniversityType } from '@/lib/types'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { slugify, daysUntil, getDeadlineUrgency, formatDate } from '@/lib/utils'
import { useDebounce } from '@/lib/hooks'

interface ProgramResult {
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
  deadline: string | null
  edital_url: string | null
}

const STORAGE_KEY = 'kehra-edubrazil-tracker'

function normalize(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

const EN_TO_PT: Record<string, string[]> = {
  'computer': ['computação', 'computacional', 'informática'],
  'science': ['ciência', 'científico'],
  'engineering': ['engenharia'],
  'mathematics': ['matemática'],
  'math': ['matemática'],
  'physics': ['física'],
  'chemistry': ['química'],
  'biology': ['biologia'],
  'medicine': ['medicina', 'médico'],
  'medical': ['medicina', 'médico'],
  'law': ['direito'],
  'education': ['educação', 'ensino', 'pedagogia'],
  'economics': ['economia'],
  'business': ['administração', 'negócios', 'empresarial'],
  'arts': ['artes'],
  'literature': ['letras', 'literatura'],
  'agriculture': ['agricultura', 'agronomia'],
  'environmental': ['ambiental', 'ecologia'],
  'health': ['saúde'],
  'social': ['social'],
  'humanities': ['humanidades'],
  'linguistics': ['linguística'],
  'language': ['língua', 'linguagem', 'idioma'],
  'master': ['mestrado'],
  'phd': ['doutorado'],
  'doctoral': ['doutorado'],
  'graduate': ['pós-graduação', 'pos-graduacao'],
  'administration': ['administração'],
  'management': ['gestão', 'administração'],
  'accounting': ['contabilidade'],
  'nursing': ['enfermagem'],
  'psychology': ['psicologia'],
  'sociology': ['sociologia'],
  'philosophy': ['filosofia'],
  'history': ['história'],
  'geography': ['geografia'],
  'architecture': ['arquitetura'],
  'urbanism': ['urbanismo'],
  'design': ['design'],
  'music': ['música'],
  'theater': ['teatro'],
  'dance': ['dança'],
  'veterinary': ['veterinária'],
  'zoology': ['zoologia'],
  'botany': ['botânica'],
  'ecology': ['ecologia'],
  'geology': ['geologia'],
  'oceanography': ['oceanografia'],
  'astronomy': ['astronomia'],
  'statistics': ['estatística'],
  'nutrition': ['nutrição'],
  'pharmacy': ['farmácia'],
  'dentistry': ['odontologia'],
  'public': ['público', 'pública'],
  'international': ['internacional'],
  'relations': ['relações', 'relacoe'],
  'political': ['político', 'política', 'ciência política'],
  'anthropology': ['antropologia'],
  'communication': ['comunicação'],
  'journalism': ['jornalismo'],
  'information': ['informação', 'informatica'],
  'technology': ['tecnologia'],
  'applied': ['aplicada', 'aplicado'],
  'production': ['produção'],
  'sanitary': ['sanitária'],
  'animal': ['animal'],
  'plant': ['vegetal', 'plantas'],
  'forest': ['florestal', 'floresta'],
  'food': ['alimentos', 'alimentação'],
  'energy': ['energia'],
  'transport': ['transporte'],
  'materials': ['materiais'],
  'mechanical': ['mecânica'],
  'electrical': ['elétrica'],
  'civil': ['civil'],
  'chemical': ['química'],
  'industrial': ['industrial'],
}

function expandTokens(tokens: string[]): string[] {
  const expanded = new Set(tokens.map(t => normalize(t)))
  tokens.forEach(t => {
    const pt = EN_TO_PT[normalize(t)]
    if (pt) pt.forEach(p => expanded.add(normalize(p)))
  })
  return [...expanded]
}

export default function ProgramsPage() {
  usePageMeta('Program Search', 'Search graduate programs across Brazilian universities')
  const { programs: allPrograms, loading } = useAllPrograms()
  const excludedAcronyms = useMemo(() => new Set(['UFABC']), [])
  const searchablePrograms = useMemo(
    () => allPrograms.filter(p => !excludedAcronyms.has(p.university_acronym)),
    [allPrograms, excludedAcronyms]
  )
  const [level, setLevel] = useState<'Mestrado' | 'Doutorado' | 'Ambos' | ''>('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [region, setRegion] = useState<Region | ''>('')
  const [type, setType] = useState<UniversityType | ''>('')
  const [aiQuery, setAiQuery] = useState('')
  const [openOnly, setOpenOnly] = useState(false)
  const [resultLimit, setResultLimit] = useState(20)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [justSavedId, setJustSavedId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'deadline' | 'name' | 'status'>('status')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set())
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const l = searchParams.get('l')
    const r = searchParams.get('r')
    const t = searchParams.get('t')
    const q = searchParams.get('q')
    const o = searchParams.get('o')
    if (l && ['Mestrado', 'Doutorado', 'Ambos'].includes(l)) setLevel(l as typeof level)
    if (r && REGIONS.some(reg => reg.key === r)) setRegion(r as Region)
    if (t && ['Federal', 'State'].includes(t)) setType(t as UniversityType)
    if (q) setAiQuery(q)
    if (o === '1') setOpenOnly(true)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (level) params.set('l', level)
    if (region) params.set('r', region)
    if (type) params.set('t', type)
    if (aiQuery.trim()) params.set('q', aiQuery.trim())
    if (openOnly) params.set('o', '1')
    const qs = params.toString()
    router.replace(qs ? `/programs?${qs}` : '/programs', { scroll: false })
  }, [level, region, type, aiQuery, openOnly, router])

  const debouncedAiQuery = useDebounce(aiQuery, 300)

  useEffect(() => {
    if (debouncedAiQuery.trim().length >= 2) {
      setShowAutocomplete(true)
    }
  }, [debouncedAiQuery])

  const autocompleteResults = useMemo(() => {
    const q = debouncedAiQuery.trim()
    if (!q || q.length < 2 || !searchablePrograms.length) return []
    const qTokens = q.toLowerCase().split(/\s+/).filter(t => t.length > 1)
    const searchTerms = expandTokens(qTokens)
    if (searchTerms.length === 0) return []
    return searchablePrograms
      .filter(p => {
        const haystack = normalize(`${p.name} ${p.university_name} ${p.university_acronym}`)
        return searchTerms.some(term => haystack.includes(term))
      })
      .slice(0, 8)
      .map(p => ({
        id: p.id,
        programName: p.name,
        universityName: p.university_name,
        universityAcronym: p.university_acronym,
        level: p.level,
        deadline: p.deadline,
        status: p.status,
      }))
  }, [debouncedAiQuery, searchablePrograms])

  const searchTokens = useMemo(() => {
    const q = aiQuery.trim()
    if (!q) return null
    const tokens = q.toLowerCase().split(/\s+/).filter(t => t.length > 1)
    return expandTokens(tokens)
  }, [aiQuery])

  const results = useMemo((): ProgramResult[] => {
    const matches: ProgramResult[] = []

    searchablePrograms.forEach((p) => {
      if (region && p.university_region !== region) return
      if (type && p.university_type !== type) return

      const effectiveStatus = p.deadline && new Date(p.deadline) < new Date() ? 'Fechado' : p.status
      if (openOnly && effectiveStatus !== 'Aberto') return

      if (searchTokens && searchTokens.length > 0) {
        const haystack = normalize(`${p.name} ${p.field || ''} ${p.university_name} ${p.university_acronym}`)
        if (!searchTokens.some(t => haystack.includes(t))) return
      }

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
        status: effectiveStatus,
        deadline: p.deadline,
        edital_url: p.edital_url,
      })
    })

    matches.sort((a, b) => {
      if (sortBy === 'deadline') {
        if (!a.deadline && !b.deadline) return 0
        if (!a.deadline) return 1
        if (!b.deadline) return -1
        return a.deadline.localeCompare(b.deadline)
      }
      if (sortBy === 'name') return a.programName.localeCompare(b.programName)
      const order: Record<string, number> = { Aberto: 0, 'Em Breve': 1, Fechado: 2 }
      return (order[a.status] ?? 3) - (order[b.status] ?? 3)
    })
    return matches
  }, [searchablePrograms, level, region, type, aiQuery, openOnly, searchTokens, sortBy])

  const displayedResults = results.slice(0, resultLimit)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setSavedIds(new Set(JSON.parse(stored).map((p: { id: string }) => p.id)))
    }
  }, [])

  const toggleSave = (program: ProgramResult) => {
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

  const comparedPrograms = useMemo(() => {
    return results.filter(r => compareIds.has(r.id)).slice(0, 3)
  }, [results, compareIds])

  const hasActiveFilters = level || region || type || aiQuery.trim() || openOnly

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Program Search</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Search across {searchablePrograms.length} real graduate programs from {new Set(searchablePrograms.map(p => p.university_name)).size} Brazilian universities
        </p>
      </div>

      {/* Search bar */}
      <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={aiQuery}
            onChange={(e) => {
              setAiQuery(e.target.value)
              setHighlightedIndex(-1)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (highlightedIndex >= 0 && autocompleteResults[highlightedIndex]) {
                  const selected = autocompleteResults[highlightedIndex]
                  setAiQuery(selected.programName)
                }
                setHighlightedIndex(-1)
                setShowAutocomplete(false)
              }
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setHighlightedIndex(prev => Math.min(prev + 1, autocompleteResults.length - 1))
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                setHighlightedIndex(prev => Math.max(prev - 1, -1))
              }
              if (e.key === 'Escape') {
                setShowAutocomplete(false)
                setHighlightedIndex(-1)
              }
            }}
            onFocus={() => setShowAutocomplete(true)}
            onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
            placeholder='Search programs or universities... e.g. "Computer Science"'
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-4 py-3 text-sm text-white placeholder-[var(--text-muted)] outline-none focus:border-[var(--bg-primary)] transition-colors"
          />
          {showAutocomplete && autocompleteResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] shadow-xl" role="listbox">
              {autocompleteResults.map((item, i) => {
                const days = daysUntil(item.deadline)
                const urgency = getDeadlineUrgency(days)
                return (
                  <button
                    key={item.id}
                    role="option"
                    aria-selected={i === highlightedIndex}
                    onClick={() => {
                      setAiQuery(item.programName)
                      setShowAutocomplete(false)
                    }}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                      i === highlightedIndex
                        ? 'bg-[var(--bg-primary)]/10'
                        : 'hover:bg-[var(--bg-dark)]'
                    } ${i > 0 ? 'border-t border-[var(--border)]' : ''}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white truncate">{item.programName}</div>
                      <div className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                        {item.universityName} ({item.universityAcronym})
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0 gap-1">
                      {item.deadline && (
                        <span className="text-[10px]" style={{ color: urgency.color }}>{urgency.label}</span>
                      )}
                      <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-medium ${
                        item.status === 'Aberto'
                          ? 'border-green-500/20 bg-green-500/10 text-green-400'
                          : item.status === 'Em Breve'
                            ? 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400'
                            : 'border-red-500/20 bg-red-500/10 text-red-400'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="mt-3 flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-white transition-colors"
        >
          {showAdvancedFilters ? '▲' : '▼'} Advanced filters
        </button>

        {showAdvancedFilters && (
          <div className="mt-3 space-y-4 border-t border-[var(--border)] pt-4">
            <div>
              <label className="mb-2 block text-[11px] font-medium text-[var(--text-muted)]">Level</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setLevel('')}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                    !level
                      ? 'border-white bg-white/10 text-white'
                      : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-white'
                  }`}
                >
                  Any level
                </button>
                {(['Mestrado', 'Doutorado', 'Ambos'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
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

            <div>
              <label className="mb-2 block text-[11px] font-medium text-[var(--text-muted)]">Region</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setRegion('')}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                    !region
                      ? 'border-white bg-white/10 text-white'
                      : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-white'
                  }`}
                >
                  Any region
                </button>
                {REGIONS.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => setRegion(r.key)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
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

            <div>
              <label className="mb-2 block text-[11px] font-medium text-[var(--text-muted)]">University type</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setType('')}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                    !type
                      ? 'border-white bg-white/10 text-white'
                      : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-white'
                  }`}
                >
                  Any type
                </button>
                {UNIVERSITY_TYPES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setType(t.key)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
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
          </div>
        )}
      </div>

      {/* Active filter bar */}
      {hasActiveFilters && (
        <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-[var(--text-muted)]">Filters:</span>
            {level && <span className="rounded-full bg-[var(--bg-primary)]/10 px-2.5 py-1 text-[11px] text-[var(--bg-primary)]">{level === 'Ambos' ? 'Both' : level}</span>}
            {region && <span className="rounded-full bg-[var(--bg-primary)]/10 px-2.5 py-1 text-[11px] text-[var(--bg-primary)]">{region}</span>}
            {type && <span className="rounded-full bg-[var(--bg-primary)]/10 px-2.5 py-1 text-[11px] text-[var(--bg-primary)]">{type}</span>}
            {openOnly && <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-[11px] text-green-400">Open only</span>}
            {searchTokens && searchTokens.length > 0 && (
              <span className="rounded-full bg-[var(--bg-accent)]/10 px-2.5 py-1 text-[11px] text-[var(--bg-accent)] truncate max-w-[160px]">
                "{aiQuery}"
              </span>
            )}
            <button
              onClick={() => { setLevel(''); setRegion(''); setType(''); setOpenOnly(false); setAiQuery(''); setCompareIds(new Set()); setExpandedId(null); setResultLimit(20); }}
              className="ml-auto text-xs text-[var(--text-muted)] hover:text-white transition-colors"
            >
              Reset
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
              <option value="status">Status (open first)</option>
              <option value="deadline">Deadline (soonest)</option>
              <option value="name">Name A-Z</option>
            </select>
            {compareIds.size >= 2 && (
              <button
                onClick={() => setCompareIds(new Set())}
                className="text-[11px] text-[var(--text-muted)] hover:text-white transition-colors"
              >
                Clear compare
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--bg-primary)]" />
            <p className="text-xs text-[var(--text-muted)]">Loading programs...</p>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
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
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
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
                      {comparedPrograms.map(r => (
                        <th key={r.id} className="py-2 px-3 text-left font-semibold text-white">{r.universityAcronym}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Program', get: (r: ProgramResult) => r.programName },
                      { label: 'University', get: (r: ProgramResult) => `${r.universityName} (${r.universityAcronym})` },
                      { label: 'Level', get: (r: ProgramResult) => r.level },
                      { label: 'Field', get: (r: ProgramResult) => r.field },
                      { label: 'Region', get: (r: ProgramResult) => r.region },
                      { label: 'Status', get: (r: ProgramResult) => r.status },
                      { label: 'Deadline', get: (r: ProgramResult) => r.deadline ? formatDate(r.deadline) : 'TBD' },
                    ].map(row => (
                      <tr key={row.label} className="border-b border-[var(--border)] last:border-0">
                        <td className="py-2 pr-4 text-[var(--text-muted)] whitespace-nowrap">{row.label}</td>
                        {comparedPrograms.map(r => (
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

      {!loading && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16" role="alert">
          <p className="text-sm text-[var(--text-muted)]">
            {hasActiveFilters
              ? 'No programs match your criteria. Try broadening your filters.'
              : 'Start typing above to search across all graduate programs.'}
          </p>
        </div>
      )}
    </div>
  )
}
