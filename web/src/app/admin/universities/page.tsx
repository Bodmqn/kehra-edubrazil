'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import SearchInput from '@/components/SearchInput'
import UniversityModal from '@/components/admin/UniversityModal'
import type { University } from '@/lib/types'

export default function AdminUniversitiesPage() {
  const [universities, setUniversities] = useState<University[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [modalUniversity, setModalUniversity] = useState<University | null>(null)
  const [modalTab, setModalTab] = useState<'details' | 'programs' | 'urls'>('programs')

  useEffect(() => {
    async function fetch() {
      try {
        const { data, error } = await supabase
          .from('universities')
          .select('*')
          .order('sno', { ascending: true })
        if (error) throw error
        if (data) {
          setUniversities(data as University[])
        }
      } catch (e) {
        setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load universities.' })
      }
      setLoading(false)
    }
    fetch()
  }, [])

  const filtered = useMemo(() => {
    if (!search) return universities
    const q = search.toLowerCase()
    return universities.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.acronym.toLowerCase().includes(q) ||
        u.state.toLowerCase().includes(q)
    )
  }, [universities, search])

  const openModal = (u: University, tab: 'details' | 'programs' | 'urls') => {
    setModalTab(tab)
    setModalUniversity(u)
  }

  if (loading) {
    return <p className="text-sm text-[var(--text-muted)]">Loading universities…</p>
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-white">Universities</h1>
      <p className="mb-4 text-xs text-[var(--text-muted)]">
        Click a university to manage its programs, details, and URLs.
      </p>

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, acronym, or state…"
        />
      </div>

      {message && (
        <p
          className={`mb-3 text-xs ${
            message.type === 'success' ? 'text-[var(--success)]' : 'text-[var(--danger)]'
          }`}
        >
          {message.text}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No universities found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--border)] bg-[var(--bg-card)]">
              <tr>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">S.No</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Name</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">State</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">School URL</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">SIGAA URL</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-card)]/50">
                  <td className="px-3 py-2.5 text-[var(--text-muted)]">{u.sno}</td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => openModal(u, 'programs')}
                      className="text-left text-white hover:text-[var(--bg-primary)] transition-colors"
                    >
                      {u.name}
                    </button>
                    <span className="ml-1 text-[var(--text-muted)]">({u.acronym})</span>
                  </td>
                  <td className="px-3 py-2.5 text-[var(--text-muted)]">{u.state}</td>
                  <td className="max-w-[180px] truncate px-3 py-2.5">
                    {u.school_url ? (
                      <a
                        href={u.school_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--bg-primary)] hover:underline"
                      >
                        {u.school_url}
                      </a>
                    ) : (
                      <span className="text-[var(--text-muted)]">—</span>
                    )}
                  </td>
                  <td className="max-w-[180px] truncate px-3 py-2.5">
                    {u.sigaa_url ? (
                      <a
                        href={u.sigaa_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--bg-primary)] hover:underline"
                      >
                        {u.sigaa_url}
                      </a>
                    ) : (
                      <span className="text-[var(--text-muted)]">—</span>
                    )}
                  </td>
                  <td className="flex flex-wrap gap-1 px-3 py-2.5">
                    <button
                      onClick={() => openModal(u, 'details')}
                      className="rounded border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--bg-primary)] hover:text-white"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => openModal(u, 'programs')}
                      className="rounded border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--bg-accent)] hover:text-white"
                    >
                      Programs
                    </button>
                    <button
                      onClick={() => openModal(u, 'urls')}
                      className="rounded border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--text-secondary)] hover:text-white"
                    >
                      URLs
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UniversityModal
        open={!!modalUniversity}
        university={modalUniversity}
        initialTab={modalTab}
        onClose={() => setModalUniversity(null)}
      />
    </div>
  )
}
