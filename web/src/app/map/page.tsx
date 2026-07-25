'use client'

import { useState, useMemo } from 'react'
import { universities } from '@/lib/data'
import { slugify } from '@/lib/utils'
import { REGIONS, UNIVERSITY_TYPES } from '@/lib/constants'
import type { Region, UniversityType } from '@/lib/types'
import SearchInput from '@/components/SearchInput'
import Link from 'next/link'
import { usePageMeta } from '@/lib/usePageMeta'

const stateSvgCoords: Record<string, { x: number; y: number }> = {
  'Acre': { x: 136.5, y: 345.5 },
  'Alagoas': { x: 800.6, y: 345.3 },
  'Amapá': { x: 492.7, y: 124 },
  'Amazonas': { x: 215.2, y: 233.1 },
  'Bahia': { x: 697.6, y: 397.7 },
  'Bahia/Pernambuco/Piauí': { x: 709.57, y: 341.33 },
  'Ceará': { x: 741, y: 247.1 },
  'Ceará/Bahia': { x: 719.3, y: 322.4 },
  'Distrito Federal': { x: 573.7, y: 469.3 },
  'Espírito Santo': { x: 724.2, y: 542.5 },
  'Goiás': { x: 526.6, y: 487.8 },
  'Maranhão': { x: 622.9, y: 254.2 },
  'Mato Grosso': { x: 409.9, y: 419.8 },
  'Mato Grosso do Sul': { x: 430.2, y: 562.7 },
  'Minas Gerais': { x: 644.1, y: 527 },
  'Pará': { x: 461.3, y: 259.6 },
  'Paraíba': { x: 811.1, y: 291.7 },
  'Paraná': { x: 489.8, y: 658.5 },
  'Pernambuco': { x: 759.9, y: 315.3 },
  'Piauí': { x: 671.2, y: 311 },
  'Rio de Janeiro': { x: 680.3, y: 610 },
  'Rio Grande do Norte': { x: 798, y: 263.9 },
  'Rio Grande do Sul': { x: 461.1, y: 773.3 },
  'Rio Grande do Sul/Santa Catarina/Paraná': { x: 492.97, y: 716.77 },
  'Rondônia': { x: 259.8, y: 363.7 },
  'Roraima': { x: 300.5, y: 101 },
  'Santa Catarina': { x: 528, y: 718.5 },
  'São Paulo': { x: 560.9, y: 605 },
  'Sergipe': { x: 784.8, y: 359.8 },
  'Tocantins': { x: 562.1, y: 361.7 },
}

const regionSvgCoords: Record<string, { x: number; y: number }> = {
  Norte: { x: 346.87, y: 255.51 },
  Nordeste: { x: 743.01, y: 309.56 },
  'Centro-Oeste': { x: 485.1, y: 484.9 },
  Sudeste: { x: 652.38, y: 571.13 },
  Sul: { x: 492.97, y: 716.77 },
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

      {/* Legend */}
      <div className="mb-4 flex items-center gap-4 text-xs text-[var(--text-secondary)]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: '#E53935' }} />
          Federal University
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: '#26A69A' }} />
          State University
        </span>
      </div>

      {/* Map */}
      <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-dark)]">
        <div className="relative flex aspect-[1000/912] w-full items-center justify-center bg-gradient-to-br from-[var(--bg-primary)]/10 to-[var(--bg-secondary)]/10">
          {/* Brazil state outlines background */}
          <img
            src="/brazil.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full select-none opacity-30"
          />
          {filtered.map((u) => {
            const coord = stateSvgCoords[u.state] || regionSvgCoords[u.region]
            if (!coord) return null
            const isHovered = hoveredUni === u.id

            return (
              <Link
                key={u.id}
                href={`/universities/${slugify(u.name)}`}
                className="absolute z-10"
                style={{ left: `${(coord.x / 1000) * 100}%`, top: `${(coord.y / 912) * 100}%` }}
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
                      u.type === 'Federal' ? '#E53935' : '#26A69A',
                  }}
                />

                {/* Hover label — full name */}
                {isHovered && (
                  <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1 text-xs text-white shadow-lg z-20 pointer-events-none">
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
            const c = regionSvgCoords[r.key]
            if (!c) return null
            return (
              <div
                key={r.key}
                className="absolute text-sm font-bold uppercase tracking-widest text-white/85 drop-shadow-sm pointer-events-none"
                style={{
                  left: `${((c.x + 10) / 1000) * 100}%`,
                  top: `${((c.y - 25) / 912) * 100}%`,
                }}
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
