'use client'

import { useState, useMemo } from 'react'
import { REGIONS, UNIVERSITY_TYPES, ALL_STATES } from '@/lib/constants'
import type { Region, UniversityType } from '@/lib/types'
import SearchInput from '@/components/SearchInput'
import UniversityCard from '@/components/UniversityCard'
import { useUniversities, useProgramCounts } from '@/lib/useSupabaseData'
import { usePageMeta } from '@/lib/usePageMeta'

export default function UniversitiesPage() {
  usePageMeta('Universities', 'Browse all Brazilian universities offering graduate programs')
  const { universities, loading } = useUniversities()
  const programCounts = useProgramCounts()
  const [search, setSearch] = useState('')
  const [selectedRegions, setSelectedRegions] = useState<Region[]>([])
  const [selectedTypes, setSelectedTypes] = useState<UniversityType[]>([])
  const [selectedState, setSelectedState] = useState<string>('')

  const filtered = useMemo(() => {
    return universities.filter((u) => {
      if (search) {
        const q = search.toLowerCase()
        if (
          !u.name.toLowerCase().includes(q) &&
          !u.acronym.toLowerCase().includes(q)
        )
          return false
      }
      if (selectedRegions.length && !selectedRegions.includes(u.region))
        return false
      if (selectedTypes.length && !selectedTypes.includes(u.type)) return false
      if (selectedState && u.state !== selectedState) return false
      return true
    })
  }, [search, selectedRegions, selectedTypes, selectedState])

  const toggleRegion = (region: Region) => {
    setSelectedRegions((prev) =>
      prev.includes(region)
        ? prev.filter((r) => r !== region)
        : [...prev, region],
    )
  }

  const toggleType = (type: UniversityType) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type],
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Universities</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Browse all {universities.length} Brazilian universities offering graduate programs
        </p>
      </div>

      {/* Search + Filters */}
      <div className="mb-6 space-y-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search universities by name or acronym..."
        />

        <div className="flex flex-wrap gap-2">
          {REGIONS.map((region) => (
            <button
              key={region.key}
              onClick={() => toggleRegion(region.key)}
              aria-pressed={selectedRegions.includes(region.key)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                selectedRegions.includes(region.key)
                  ? 'border-[var(--bg-primary)] bg-[var(--bg-primary)]/10 text-[var(--bg-primary)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--bg-primary)]/30'
              }`}
            >
              {region.key}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {UNIVERSITY_TYPES.map((type) => (
            <button
              key={type.key}
              onClick={() => toggleType(type.key)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                selectedTypes.includes(type.key)
                  ? 'border-[var(--bg-secondary)] bg-[var(--bg-secondary)]/10 text-[var(--bg-secondary)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--bg-secondary)]/30'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-xs text-white outline-none"
          >
            <option value="">All States</option>
            {ALL_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          {(search || selectedRegions.length || selectedTypes.length || selectedState) && (
            <button
              onClick={() => {
                setSearch('')
                setSelectedRegions([])
                setSelectedTypes([])
                setSelectedState('')
              }}
              className="text-xs text-[var(--text-muted)] hover:text-white"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
              <div className="mb-3 flex items-start justify-between">
                <div className="h-10 w-10 rounded-lg bg-[var(--border)]" />
                <div className="h-5 w-16 rounded-full bg-[var(--border)]" />
              </div>
              <div className="mb-2 h-4 w-3/4 rounded bg-[var(--border)]" />
              <div className="mb-3 h-3 w-1/2 rounded bg-[var(--border)]" />
              <div className="h-3 w-1/4 rounded bg-[var(--border)]" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <p className="mb-4 text-xs text-[var(--text-muted)]">
            Showing {filtered.length} of {universities.length} universities
          </p>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-sm text-[var(--text-muted)]">No universities match your filters</p>
              <button
                onClick={() => {
                  setSearch('')
                  setSelectedRegions([])
                  setSelectedTypes([])
                  setSelectedState('')
                }}
                className="mt-2 text-xs text-[var(--bg-primary)] hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((u) => (
                <UniversityCard key={u.id} university={u} programCount={programCounts[u.id]} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
