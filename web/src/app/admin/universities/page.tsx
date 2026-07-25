'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import SearchInput from '@/components/SearchInput'
import type { University } from '@/lib/types'

export default function AdminUniversitiesPage() {
  const [universities, setUniversities] = useState<University[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editSchoolUrl, setEditSchoolUrl] = useState('')
  const [editSigaaUrl, setEditSigaaUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

  const startEdit = (u: University) => {
    setEditingId(u.id)
    setEditSchoolUrl(u.school_url ?? '')
    setEditSigaaUrl(u.sigaa_url ?? '')
    setMessage(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setMessage(null)
  }

  const saveEdit = async (id: string) => {
    setSaving(true)
    setMessage(null)
    try {
      const { error } = await supabase
        .from('universities')
        .update({
          school_url: editSchoolUrl || null,
          sigaa_url: editSigaaUrl || null,
        })
        .eq('id', id)

      if (error) throw error

      setUniversities((prev) =>
        prev.map((u) =>
          u.id === id
            ? { ...u, school_url: editSchoolUrl || null, sigaa_url: editSigaaUrl || null }
            : u
        )
      )
      setEditingId(null)
      setMessage({ type: 'success', text: 'URLs updated successfully.' })
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to update URLs.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-[var(--text-muted)]">Loading universities…</p>
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-white">Universities</h1>
      <p className="mb-4 text-xs text-[var(--text-muted)]">
        Edit school_url and sigaa_url for any university.
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
                  {editingId === u.id ? (
                    <>
                      <td className="px-3 py-2.5 text-[var(--text-muted)]">{u.sno}</td>
                      <td className="px-3 py-2.5 text-white">{u.name}</td>
                      <td className="px-3 py-2.5 text-[var(--text-muted)]">{u.state}</td>
                      <td className="px-3 py-2.5">
                        <input
                          type="text"
                          value={editSchoolUrl}
                          onChange={(e) => setEditSchoolUrl(e.target.value)}
                          className="w-full rounded border border-[var(--border)] bg-[var(--bg-dark)] px-2 py-1 text-xs text-white outline-none"
                          placeholder="https://…"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="text"
                          value={editSigaaUrl}
                          onChange={(e) => setEditSigaaUrl(e.target.value)}
                          className="w-full rounded border border-[var(--border)] bg-[var(--bg-dark)] px-2 py-1 text-xs text-white outline-none"
                          placeholder="https://…"
                        />
                      </td>
                      <td className="flex gap-1 px-3 py-2.5">
                        <button
                          onClick={() => saveEdit(u.id)}
                          disabled={saving}
                          className="rounded bg-[var(--bg-primary)] px-2 py-1 text-[10px] text-white disabled:opacity-50"
                        >
                          {saving ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="rounded border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--text-secondary)]"
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2.5 text-[var(--text-muted)]">{u.sno}</td>
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/admin/universities/${u.id}/details`}
                          className="text-white hover:text-[var(--bg-primary)]"
                        >
                          {u.name}
                        </Link>
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
                        <Link
                          href={`/admin/universities/${u.id}/details`}
                          className="rounded border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--bg-primary)] hover:text-white"
                        >
                          Details
                        </Link>
                        <Link
                          href={`/admin/universities/${u.id}/programs`}
                          className="rounded border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--bg-accent)] hover:text-white"
                        >
                          Programs
                        </Link>
                        <button
                          onClick={() => startEdit(u)}
                          className="rounded border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--text-secondary)] hover:text-white"
                        >
                          URLs
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
