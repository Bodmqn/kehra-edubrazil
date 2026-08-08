'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { University, Program, UniversityDetail } from '@/lib/types'

interface Props {
  open: boolean
  university: University | null
  initialTab?: 'details' | 'programs' | 'urls'
  onClose: () => void
}

type Tab = 'details' | 'programs' | 'urls'

interface ProgramForm {
  name: string
  level: 'Mestrado' | 'Doutorado' | 'Ambos'
  field: string
  deadline: string
  status: 'Aberto' | 'Fechado' | 'Em Breve'
  edital_url: string
}

const EMPTY_PROGRAM_FORM: ProgramForm = {
  name: '',
  level: 'Mestrado',
  field: '',
  deadline: '',
  status: 'Aberto',
  edital_url: '',
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'details', label: 'Details' },
  { key: 'programs', label: 'Programs' },
  { key: 'urls', label: 'URLs' },
]

export default function UniversityModal({ open, university, initialTab = 'programs', onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)
  const [loading, setLoading] = useState(true)

  // Details state
  const [details, setDetails] = useState<UniversityDetail | null>(null)
  const [aboutText, setAboutText] = useState('')
  const [history, setHistory] = useState('')
  const [websiteDescription, setWebsiteDescription] = useState('')
  const [wikipediaUrl, setWikipediaUrl] = useState('')

  // Programs state
  const [programs, setPrograms] = useState<Program[]>([])
  const [programForm, setProgramForm] = useState<ProgramForm>(EMPTY_PROGRAM_FORM)
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null)
  const [showProgramForm, setShowProgramForm] = useState(false)

  // URLs state
  const [schoolUrl, setSchoolUrl] = useState('')
  const [sigaaUrl, setSigaaUrl] = useState('')

  // General state
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const resetForm = () => {
    setLoading(true)
    setMessage(null)
    setDetails(null)
    setAboutText('')
    setHistory('')
    setWebsiteDescription('')
    setWikipediaUrl('')
    setPrograms([])
    setProgramForm(EMPTY_PROGRAM_FORM)
    setEditingProgramId(null)
    setShowProgramForm(false)
    setSchoolUrl(university?.school_url ?? '')
    setSigaaUrl(university?.sigaa_url ?? '')
  }

  const fetchData = async () => {
    if (!university) return
    try {
      const [detResult, progResult] = await Promise.all([
        supabase.from('university_details').select('*').eq('university_id', university.id).maybeSingle(),
        supabase.from('programs').select('*').eq('university_id', university.id).order('deadline', { ascending: true }),
      ])

      if (detResult.data) {
        const d = detResult.data as UniversityDetail
        setDetails(d)
        setAboutText(d.about_text ?? '')
        setHistory(d.history ?? '')
        setWebsiteDescription(d.website_description ?? '')
        setWikipediaUrl(d.wikipedia_url ?? '')
      }

      if (progResult.data) {
        setPrograms(progResult.data as Program[])
      }
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load data.' })
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!open || !university) return
    const timer = setTimeout(() => {
      if (initialTab) setActiveTab(initialTab)
      resetForm()
      void fetchData()
    }, 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, university?.id])

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => setActiveTab(initialTab), 0)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // ---- Details ----

  const handleSaveDetails = async () => {
    if (!university) return
    setSaving(true)
    setMessage(null)
    try {
      const payload = {
        university_id: university.id,
        about_text: aboutText || null,
        history: history || null,
        website_description: websiteDescription || null,
        wikipedia_url: wikipediaUrl || null,
      }

      if (details) {
        const { error } = await supabase.from('university_details').update(payload).eq('id', details.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('university_details').insert(payload)
        if (error) throw error
      }

      setMessage({ type: 'success', text: 'Details saved.' })
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save details.' })
    }
    setSaving(false)
  }

  // ---- Programs ----

  const resetProgramForm = () => {
    setProgramForm(EMPTY_PROGRAM_FORM)
    setEditingProgramId(null)
    setShowProgramForm(false)
    setMessage(null)
  }

  const startEditProgram = (p: Program) => {
    setProgramForm({
      name: p.name,
      level: p.level,
      field: p.field ?? '',
      deadline: p.deadline ?? '',
      status: p.status,
      edital_url: p.edital_url ?? '',
    })
    setEditingProgramId(p.id)
    setShowProgramForm(true)
    setMessage(null)
  }

  const handleSaveProgram = async () => {
    if (!university || !programForm.name.trim()) return
    setSaving(true)
    setMessage(null)

    try {
      const payload = {
        university_id: university.id,
        name: programForm.name.trim(),
        level: programForm.level,
        field: programForm.field || null,
        deadline: programForm.deadline || null,
        status: programForm.status,
        edital_url: programForm.edital_url || null,
      }

      if (editingProgramId) {
        const { error } = await supabase.from('programs').update(payload).eq('id', editingProgramId)
        if (error) throw error
        setPrograms((prev) =>
          prev.map((p) => (p.id === editingProgramId ? { ...p, ...(payload as Program) } : p))
        )
        setMessage({ type: 'success', text: 'Program updated.' })
      } else {
        const { data, error } = await supabase.from('programs').insert(payload).select().single()
        if (error) throw error
        setPrograms((prev) => [...prev, data as Program])
        setMessage({ type: 'success', text: 'Program added.' })
      }

      resetProgramForm()
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save program.' })
    }
    setSaving(false)
  }

  const handleDeleteProgram = async (programId: string) => {
    if (!window.confirm('Delete this program? This cannot be undone.')) return
    try {
      const { error } = await supabase.from('programs').delete().eq('id', programId)
      if (error) throw error
      setPrograms((prev) => prev.filter((p) => p.id !== programId))
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to delete program.' })
    }
  }

  // ---- URLs ----

  const handleSaveUrls = async () => {
    if (!university) return
    setSaving(true)
    setMessage(null)
    try {
      const { error } = await supabase
        .from('universities')
        .update({
          school_url: schoolUrl || null,
          sigaa_url: sigaaUrl || null,
        })
        .eq('id', university.id)

      if (error) throw error
      setMessage({ type: 'success', text: 'URLs saved.' })
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save URLs.' })
    }
    setSaving(false)
  }

  // ---- Escape key ----

  useEffect(() => {
    if (!open) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  if (!open || !university) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-4 pb-8">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-3xl rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-white truncate">
              {university.name} <span className="font-normal text-[var(--text-muted)]">({university.acronym})</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-[var(--text-muted)] hover:text-white transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)] px-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setMessage(null) }}
              className={`px-4 py-3 text-xs font-medium transition-colors border-b-2 -mb-[1px] ${
                activeTab === tab.key
                  ? 'border-[var(--bg-primary)] text-white'
                  : 'border-transparent text-[var(--text-muted)] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Message */}
        {message && (
          <div className="px-6 pt-4">
            <p className={`text-xs ${message.type === 'success' ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4">
          {loading ? (
            <p className="text-sm text-[var(--text-muted)]">Loading…</p>
          ) : activeTab === 'details' ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">About Text</label>
                <textarea
                  value={aboutText}
                  onChange={(e) => setAboutText(e.target.value)}
                  rows={5}
                  className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2 text-sm text-white placeholder-[var(--text-muted)] outline-none"
                  placeholder="Describe what makes this university unique…"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">History</label>
                <textarea
                  value={history}
                  onChange={(e) => setHistory(e.target.value)}
                  rows={5}
                  className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2 text-sm text-white placeholder-[var(--text-muted)] outline-none"
                  placeholder="Historical background…"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">Website Description</label>
                <input
                  type="text"
                  value={websiteDescription}
                  onChange={(e) => setWebsiteDescription(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2 text-sm text-white placeholder-[var(--text-muted)] outline-none"
                  placeholder="Short description for the website listing…"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">Wikipedia URL</label>
                <input
                  type="url"
                  value={wikipediaUrl}
                  onChange={(e) => setWikipediaUrl(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2 text-sm text-white placeholder-[var(--text-muted)] outline-none"
                  placeholder="https://en.wikipedia.org/wiki/…"
                />
              </div>
              <button
                onClick={handleSaveDetails}
                disabled={saving}
                className="rounded-lg bg-[var(--bg-accent)] px-5 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Details'}
              </button>
            </div>
          ) : activeTab === 'programs' ? (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs text-[var(--text-muted)]">{programs.length} programs</p>
                <button
                  onClick={() => { resetProgramForm(); setShowProgramForm(true) }}
                  className="rounded-lg bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-medium text-white"
                  style={{ color: 'white' }}
                >
                  + Add Program
                </button>
              </div>

              {showProgramForm && (
                <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] p-4">
                  <h3 className="mb-3 text-sm font-semibold text-white">
                    {editingProgramId ? 'Edit Program' : 'Add Program'}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] text-[var(--text-secondary)]">Name *</label>
                      <input
                        type="text"
                        value={programForm.name}
                        onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                        className="w-full rounded border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1.5 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] text-[var(--text-secondary)]">Level</label>
                      <select
                        value={programForm.level}
                        onChange={(e) => setProgramForm({ ...programForm, level: e.target.value as ProgramForm['level'] })}
                        className="w-full rounded border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1.5 text-xs text-white outline-none"
                      >
                        <option value="Mestrado">Mestrado</option>
                        <option value="Doutorado">Doutorado</option>
                        <option value="Ambos">Ambos</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] text-[var(--text-secondary)]">Field</label>
                      <input
                        type="text"
                        value={programForm.field}
                        onChange={(e) => setProgramForm({ ...programForm, field: e.target.value })}
                        className="w-full rounded border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1.5 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] text-[var(--text-secondary)]">Deadline</label>
                      <input
                        type="date"
                        value={programForm.deadline}
                        onChange={(e) => setProgramForm({ ...programForm, deadline: e.target.value })}
                        className="w-full rounded border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1.5 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] text-[var(--text-secondary)]">Status</label>
                      <select
                        value={programForm.status}
                        onChange={(e) => setProgramForm({ ...programForm, status: e.target.value as ProgramForm['status'] })}
                        className="w-full rounded border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1.5 text-xs text-white outline-none"
                      >
                        <option value="Aberto">Aberto</option>
                        <option value="Fechado">Fechado</option>
                        <option value="Em Breve">Em Breve</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] text-[var(--text-secondary)]">Edital URL</label>
                      <input
                        type="url"
                        value={programForm.edital_url}
                        onChange={(e) => setProgramForm({ ...programForm, edital_url: e.target.value })}
                        className="w-full rounded border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1.5 text-xs text-white outline-none"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={handleSaveProgram}
                      disabled={saving || !programForm.name.trim()}
                      className="rounded bg-[var(--bg-accent)] px-3 py-1.5 text-xs font-medium text-black disabled:opacity-50"
                    >
                      {saving ? 'Saving…' : editingProgramId ? 'Update' : 'Add'}
                    </button>
                    <button
                      onClick={resetProgramForm}
                      className="rounded border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {programs.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No programs for this university yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[var(--border)] bg-[var(--bg-dark)]">
                      <tr>
                        <th className="px-3 py-2 font-medium text-[var(--text-secondary)]">Name</th>
                        <th className="px-3 py-2 font-medium text-[var(--text-secondary)]">Level</th>
                        <th className="px-3 py-2 font-medium text-[var(--text-secondary)]">Field</th>
                        <th className="px-3 py-2 font-medium text-[var(--text-secondary)]">Deadline</th>
                        <th className="px-3 py-2 font-medium text-[var(--text-secondary)]">Status</th>
                        <th className="px-3 py-2 font-medium text-[var(--text-secondary)]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {programs.map((p) => (
                        <tr key={p.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-card)]/50">
                          <td className="max-w-[160px] truncate px-3 py-2 text-white">{p.name}</td>
                          <td className="px-3 py-2 text-[var(--text-muted)]">{p.level}</td>
                          <td className="px-3 py-2 text-[var(--text-muted)]">{p.field || '—'}</td>
                          <td className="px-3 py-2 text-[var(--text-muted)]">{p.deadline || '—'}</td>
                          <td className="px-3 py-2">
                            <span className={`rounded px-1.5 py-0.5 text-[10px] ${
                              p.status === 'Aberto'
                                ? 'bg-[var(--success)]/10 text-[var(--success)]'
                                : p.status === 'Fechado'
                                  ? 'bg-[var(--danger)]/10 text-[var(--danger)]'
                                  : 'bg-[var(--warning)]/10 text-[var(--warning)]'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="flex gap-1 px-3 py-2">
                            <button
                              onClick={() => startEditProgram(p)}
                              className="rounded border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--text-secondary)] hover:text-white"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProgram(p.id)}
                              className="rounded border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--danger)] hover:text-white"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* URLs tab */
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">School URL</label>
                <input
                  type="url"
                  value={schoolUrl}
                  onChange={(e) => setSchoolUrl(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2 text-sm text-white placeholder-[var(--text-muted)] outline-none"
                  placeholder="https://…"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">SIGAA URL</label>
                <input
                  type="url"
                  value={sigaaUrl}
                  onChange={(e) => setSigaaUrl(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2 text-sm text-white placeholder-[var(--text-muted)] outline-none"
                  placeholder="https://…"
                />
              </div>
              <button
                onClick={handleSaveUrls}
                disabled={saving}
                className="rounded-lg bg-[var(--bg-accent)] px-5 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save URLs'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
