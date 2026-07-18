'use client'

import { useState, useMemo, useEffect } from 'react'
import { universities } from '@/lib/data'
import { slugify, formatDate } from '@/lib/utils'
import { getMockPrograms } from '@/lib/mock-programs'
import { REGIONS, UNIVERSITY_TYPES } from '@/lib/constants'
import type { Region, UniversityType } from '@/lib/types'
import SearchInput from '@/components/SearchInput'
import Link from 'next/link'
import { usePageMeta } from '@/lib/usePageMeta'

const regionCoords: Record<string, { lat: number; lng: number }> = {
  Norte: { lat: -3.4653, lng: -62.2159 },
  Nordeste: { lat: -8.0476, lng: -39.5269 },
  'Centro-Oeste': { lat: -15.7801, lng: -47.9292 },
  Sudeste: { lat: -22.9068, lng: -43.1729 },
  Sul: { lat: -27.5954, lng: -48.5482 },
}

// Approximate city coordinates for state capitals (simplified map)
const stateCoords: Record<string, { lat: number; lng: number }> = {
  'Acre': { lat: -9.974, lng: -67.807 },
  'Alagoas': { lat: -9.571, lng: -35.773 },
  'Amapá': { lat: 0.035, lng: -51.050 },
  'Amazonas': { lat: -3.118, lng: -60.021 },
  'Bahia': { lat: -12.971, lng: -38.501 },
  'Ceará': { lat: -3.717, lng: -38.543 },
  'Ceará/Bahia': { lat: -4.004, lng: -38.015 },
  'Distrito Federal': { lat: -15.780, lng: -47.930 },
  'Espírito Santo': { lat: -20.315, lng: -40.308 },
  'Goiás': { lat: -16.679, lng: -49.255 },
  'Maranhão': { lat: -2.529, lng: -44.254 },
  'Mato Grosso': { lat: -15.596, lng: -56.097 },
  'Mato Grosso do Sul': { lat: -20.443, lng: -54.647 },
  'Minas Gerais': { lat: -19.924, lng: -43.935 },
  'Pará': { lat: -1.456, lng: -48.504 },
  'Paraíba': { lat: -7.119, lng: -34.882 },
  'Paraná': { lat: -25.428, lng: -49.267 },
  'Pernambuco': { lat: -8.057, lng: -34.883 },
  'Piauí': { lat: -5.092, lng: -42.803 },
  'Rio de Janeiro': { lat: -22.907, lng: -43.173 },
  'Rio Grande do Norte': { lat: -5.839, lng: -35.201 },
  'Rio Grande do Sul': { lat: -30.035, lng: -51.218 },
  'Rio Grande do Sul/Santa Catarina/Paraná': { lat: -27.097, lng: -52.618 },
  'Rondônia': { lat: -8.761, lng: -63.903 },
  'Roraima': { lat: 2.819, lng: -60.672 },
  'Santa Catarina': { lat: -27.595, lng: -48.548 },
  'São Paulo': { lat: -23.550, lng: -46.633 },
  'Sergipe': { lat: -10.947, lng: -37.073 },
  'Tocantins': { lat: -10.175, lng: -48.332 },
  'Bahia/Pernambuco/Piauí': { lat: -9.400, lng: -40.500 },
}

export default function MapPage() {
  usePageMeta('University Map', 'Explore Brazilian universities across all five regions')
  const [selectedRegion, setSelectedRegion] = useState<Region | ''>('')
  const [selectedType, setSelectedType] = useState<UniversityType | ''>('')
  const [search, setSearch] = useState('')
  const [hoveredUni, setHoveredUni] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return universities.filter((u) => {
      if (selectedRegion && u.region !== selectedRegion) return false
      if (selectedType && u.type !== selectedType) return false
      if (search) {
        const q = search.toLowerCase()
        if (!u.name.toLowerCase().includes(q) && !u.acronym.toLowerCase().includes(q))
          return false
      }
      return true
    })
  }, [selectedRegion, selectedType, search])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Brazil University Map</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Explore universities across all five Brazilian regions
        </p>
      </div>

      {/* Search + Filters */}
      <div className="mb-6 space-y-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search universities..." />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedRegion('')}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
              !selectedRegion
                ? 'border-white bg-white/10 text-white'
                : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            All Regions
          </button>
          {REGIONS.map((r) => (
            <button
              key={r.key}
              onClick={() => setSelectedRegion(r.key)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                selectedRegion === r.key
                  ? 'border-[var(--bg-primary)] bg-[var(--bg-primary)]/10 text-[var(--bg-primary)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              {r.key}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {UNIVERSITY_TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setSelectedType(selectedType === t.key ? '' : t.key)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                selectedType === t.key
                  ? 'border-[var(--bg-secondary)] bg-[var(--bg-secondary)]/10 text-[var(--bg-secondary)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map visualization */}
      <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
        {/* SVG Brazil outline */}
        <div className="relative flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br from-[var(--bg-primary)]/5 to-[var(--bg-secondary)]/5">
          {/* Simple map pins layout */}
          {filtered.map((u) => {
            const coord = stateCoords[u.state] || regionCoords[u.region]
            const isHovered = hoveredUni === u.id
            const programCount = getMockPrograms(u.acronym, u.id).length

            return (
              <Link
                key={u.id}
                href={`/universities/${slugify(u.name)}`}
                className="absolute z-10 transition-transform hover:z-20"
                style={{
                  left: `${((coord.lng + 75) / 75) * 100}%`,
                  top: `${((coord.lat + 35) / 50) * 100}%`,
                  transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                }}
                onMouseEnter={() => setHoveredUni(u.id)}
                onMouseLeave={() => setHoveredUni(null)}
              >
                <div
                  className={`flex h-3 w-3 items-center justify-center rounded-full transition-all ${
                    isHovered ? 'h-4 w-4 ring-2 ring-white/50' : ''
                  }`}
                  style={{
                    backgroundColor:
                      u.type === 'Federal' ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                  }}
                />
              </Link>
            )
          })}

          {/* Region labels */}
          {REGIONS.map((r) => {
            const c = regionCoords[r.key]
            return (
              <div
                key={r.key}
                className="absolute text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]"
                style={{
                  left: `${((c.lng + 75) / 75) * 100}%`,
                  top: `${((c.lat + 35) / 50) * 100}%`,
                }}
              >
                {r.key}
              </div>
            )
          })}
        </div>
      </div>

      {/* Hovered tooltip */}
      {hoveredUni && (() => {
        const u = universities.find((x) => x.id === hoveredUni)
        if (!u) return null
        const programCount = getMockPrograms(u.acronym, u.id).length
        return (
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">{u.name}</h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  {u.acronym} · {u.state} · {programCount} programs
                </p>
              </div>
              <Link
                href={`/universities/${slugify(u.name)}`}
                className="text-xs text-[var(--bg-primary)] hover:underline"
              >
                View Details →
              </Link>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
