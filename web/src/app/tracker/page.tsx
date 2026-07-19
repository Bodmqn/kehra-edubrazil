'use client'

import { useState, useMemo, useSyncExternalStore } from 'react'
import type { TrackerProgram } from '@/lib/trackerTypes'
import { STAGES, STORAGE_KEY } from '@/lib/trackerTypes'
import { usePageMeta } from '@/lib/usePageMeta'
import { supabase } from '@/lib/supabase'
import StatsBar from '@/components/tracker/StatsBar'
import DeadlineTimeline from '@/components/tracker/DeadlineTimeline'
import TrackerCard from '@/components/tracker/TrackerCard'
import TrackerModal from '@/components/tracker/TrackerModal'

export default function TrackerPage() {
  usePageMeta('My Tracker', 'Track your graduate program applications and deadlines')

  const [programs, setPrograms] = useState<TrackerProgram[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) return JSON.parse(stored)
      } catch { /* ignore */ }
    }
    return []
  })
  const mounted = useSyncExternalStore(() => () => {}, () => true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'deadline' | 'name' | 'priority' | 'updated'>('deadline')
  const [stageFilter, setStageFilter] = useState<'all' | (typeof STAGES)[number]['key']>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TrackerProgram | null>(null)
  const [email, setEmail] = useState('')
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

  const saveToStorage = (updated: TrackerProgram[]) => {
    setPrograms(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const handleSave = (program: TrackerProgram) => {
    const idx = programs.findIndex((p) => p.id === program.id)
    let updated: TrackerProgram[]
    if (idx >= 0) {
      updated = [...programs]
      updated[idx] = { ...program, updatedAt: new Date().toISOString() }
    } else {
      updated = [program, ...programs]
    }
    saveToStorage(updated)
    setModalOpen(false)
    setEditing(null)
  }

  const handleDelete = (id: string) => {
    if (!window.confirm('Remove this program from your tracker?')) return
    saveToStorage(programs.filter((p) => p.id !== id))
  }

  const handleStageChange = (id: string, stage: TrackerProgram['stage']) => {
    saveToStorage(
      programs.map((p) => (p.id === id ? { ...p, stage, updatedAt: new Date().toISOString() } : p))
    )
  }

  const openEdit = (program: TrackerProgram) => {
    setEditing(program)
    setModalOpen(true)
  }

  const openAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setEmailStatus('sending')
    try {
      const { error } = await supabase
        .from('email_subscriptions')
        .insert({ email: email.trim() })
      if (error) throw error
      setEmailStatus('success')
    } catch {
      setEmailStatus('error')
    }
  }

  const filteredPrograms = useMemo(() => {
    return programs
      .filter((p) => {
        if (stageFilter !== 'all' && p.stage !== stageFilter) return false
        if (!search) return true
        const q = search.toLowerCase()
        return (
          p.name.toLowerCase().includes(q) ||
          p.university.toLowerCase().includes(q) ||
          p.notes.toLowerCase().includes(q) ||
          p.level.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name)
        if (sortBy === 'priority') {
          const order = { high: 0, medium: 1, low: 2 }
          return (order[a.priority] ?? 1) - (order[b.priority] ?? 1)
        }
        if (sortBy === 'updated') {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        }
        if (sortBy === 'deadline') {
          if (!a.deadline && !b.deadline) return 0
          if (!a.deadline) return 1
          if (!b.deadline) return -1
          return a.deadline.localeCompare(b.deadline)
        }
        return 0
      })
  }, [programs, stageFilter, search, sortBy])

  if (!mounted) {
    return <div className="mx-auto max-w-5xl px-4 py-8" />
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">My Tracker</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Track, organize, and manage your graduate program applications
          </p>
        </div>
        <button
          onClick={openAdd}
          className="rounded-lg bg-[var(--bg-accent)] px-4 py-2 text-sm font-medium text-black hover:opacity-90"
        >
          + Add Program
        </button>
      </div>

      {/* Stats */}
      <div className="mb-4">
        <StatsBar programs={programs} />
      </div>

      {/* Timeline */}
      <div className="mb-4">
        <DeadlineTimeline programs={programs} onSelect={openEdit} />
      </div>

      {/* Search / Sort / Filter */}
      {programs.length > 0 && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">
              🔍
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search programs, universities, notes..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] py-2 pl-8 pr-3 text-sm text-white placeholder-[var(--text-muted)] outline-none"
            />
          </div>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as 'all' | (typeof STAGES)[number]['key'])}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs text-white outline-none"
          >
            <option value="all">All Stages</option>
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs text-white outline-none"
          >
            <option value="deadline">Sort by Deadline</option>
            <option value="name">Sort by Name</option>
            <option value="priority">Sort by Priority</option>
            <option value="updated">Sort by Recent</option>
          </select>
        </div>
      )}

      {/* Program Grid / Empty State */}
      {filteredPrograms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] py-20">
          <p className="text-sm text-[var(--text-muted)]">
            {programs.length === 0
              ? 'No programs tracked yet. Add your first program to get started!'
              : 'No programs match your filters.'}
          </p>
          {programs.length === 0 && (
            <button
              onClick={openAdd}
              className="mt-4 rounded-lg bg-[var(--bg-primary)] px-5 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Add Your First Program
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Summary line */}
          <p className="mb-3 text-xs text-[var(--text-muted)]">
            Showing {filteredPrograms.length} of {programs.length} program{programs.length !== 1 ? 's' : ''}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPrograms.map((p) => (
              <TrackerCard
                key={p.id}
                program={p}
                onEdit={openEdit}
                onDelete={handleDelete}
                onStageChange={handleStageChange}
              />
            ))}
          </div>
        </>
      )}

      {/* Email Alerts */}
      <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <h3 className="mb-2 text-sm font-semibold text-white">Get Email Reminders</h3>
        <p className="mb-4 text-xs text-[var(--text-secondary)]">
          Receive notifications when deadlines approach or programs update
        </p>
        {emailStatus === 'success' ? (
          <p className="text-xs text-[var(--success)]">✅ You&apos;re subscribed! We&apos;ll send reminders for upcoming deadlines.</p>
        ) : emailStatus === 'error' ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-[var(--danger)]">Something went wrong. Try again or contact support.</p>
            <button
              onClick={() => setEmailStatus('idle')}
              className="self-start text-xs text-[var(--bg-primary)] hover:underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <form onSubmit={handleEmailSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={emailStatus === 'sending'}
              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-4 py-2.5 text-sm text-white placeholder-[var(--text-muted)] outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={emailStatus === 'sending'}
              className="rounded-lg bg-[var(--bg-accent)] px-4 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-50"
            >
              {emailStatus === 'sending' ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>
        )}
      </div>

      {/* Modal */}
      <TrackerModal
        key={editing?.id ?? 'new'}
        open={modalOpen}
        program={editing}
        onSave={handleSave}
        onClose={() => { setModalOpen(false); setEditing(null) }}
      />
    </div>
  )
}
