'use client'

import { useState, useMemo } from 'react'
import { universities } from '@/lib/data'
import { slugify } from '@/lib/utils'
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

function toPercent(lat: number, lng: number) {
  return {
    left: `${((lng + 75) / 75) * 100}%`,
    top: `${((lat + 35) / 50) * 100}%`,
  }
}

const SHOW_LABELS_THRESHOLD = 15

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

  const showAutoLabels = filtered.length <= SHOW_LABELS_THRESHOLD && filtered.length > 0

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
              aria-pressed={selectedRegion === r.key}
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
              aria-pressed={selectedType === t.key}
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

      {/* Map */}
      <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
        <div className="relative flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br from-[var(--bg-primary)]/5 to-[var(--bg-secondary)]/5">
          {/* Brazil state outlines background */}
          <img
            src="/brazil.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full select-none opacity-15"
          />
          {filtered.map((u) => {
            const coord = stateCoords[u.state] || regionCoords[u.region]
            if (!coord) return null
            const pos = toPercent(coord.lat, coord.lng)
            const isHovered = hoveredUni === u.id

            return (
              <Link
                key={u.id}
                href={`/universities/${slugify(u.name)}`}
                className="absolute z-10"
                style={{ left: pos.left, top: pos.top }}
                aria-label={u.name}
                onMouseEnter={() => setHoveredUni(u.id)}
                onMouseLeave={() => setHoveredUni(null)}
              >
                {/* Dot */}
                <div
                  className={`flex items-center justify-center rounded-full transition-all ${
                    isHovered ? 'h-5 w-5 ring-2 ring-white/50' : 'h-3.5 w-3.5'
                  }`}
                  style={{
                    backgroundColor:
                      u.type === 'Federal' ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                  }}
                />

                {/* Hover label — full name */}
                {isHovered && (
                  <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--bg-dark)] px-2 py-1 text-xs text-white shadow-lg z-20 pointer-events-none">
                    {u.name}
                  </span>
                )}

                {/* Auto-label — acronym when filtered */}
                {!isHovered && showAutoLabels && (
                  <span className="absolute left-full ml-1.5 top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] text-[var(--text-muted)] opacity-70 pointer-events-none">
                    {u.acronym}
                  </span>
                )}
              </Link>
            )
          })}

          {/* Region labels */}
          {REGIONS.map((r) => {
            const c = regionCoords[r.key]
            const pos = toPercent(c.lat, c.lng)
            return (
              <div
                key={r.key}
                className="absolute text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] pointer-events-none"
                style={{ left: pos.left, top: pos.top }}
              >
                {r.key}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
