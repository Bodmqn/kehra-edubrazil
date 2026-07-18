'use client'

import { useState, useEffect } from 'react'
import { formatDate, daysUntil, getDeadlineUrgency } from '@/lib/utils'

interface SavedProgram {
  id: string
  name: string
  university: string
  deadline: string
  stage: 'saved' | 'applying' | 'applied'
}

const STORAGE_KEY = 'kehra-edubrazil-tracker'

export default function TrackerPage() {
  const [programs, setPrograms] = useState<SavedProgram[]>([])
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'deadline' | 'name'>('deadline')
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setPrograms(JSON.parse(stored))
      } catch { /* ignore */ }
    }
  }, [])

  const saveToStorage = (updated: SavedProgram[]) => {
    setPrograms(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const moveTo = (id: string, stage: SavedProgram['stage']) => {
    saveToStorage(programs.map((p) => (p.id === id ? { ...p, stage } : p)))
  }

  const remove = (id: string) => {
    saveToStorage(programs.filter((p) => p.id !== id))
  }

  const addSampleProgram = () => {
    const sample: SavedProgram = {
      id: `sample-${Date.now()}`,
      name: 'Mestrado em Ciência da Computação',
      university: 'Universidade de São Paulo (USP)',
      deadline: '2026-08-15',
      stage: 'saved',
    }
    saveToStorage([...programs, sample])
  }

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setEmailSent(true)
    }
  }

  const columns: { key: SavedProgram['stage']; label: string; color: string }[] = [
    { key: 'saved', label: 'Saved', color: 'var(--bg-primary)' },
    { key: 'applying', label: 'Applying', color: 'var(--bg-accent)' },
    { key: 'applied', label: 'Applied', color: 'var(--bg-secondary)' },
  ]

  const filteredPrograms = programs
    .filter((p) => {
      if (!search) return true
      const q = search.toLowerCase()
      return p.name.toLowerCase().includes(q) || p.university.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'deadline') {
        if (!a.deadline && !b.deadline) return 0
        if (!a.deadline) return 1
        if (!b.deadline) return -1
        return a.deadline.localeCompare(b.deadline)
      }
      return 0
    })

  const approachingDeadlines = filteredPrograms.filter((p) => {
    const days = daysUntil(p.deadline)
    return days !== null && days >= 0 && days <= 30
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">My Tracker</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Track your graduate program applications
          </p>
        </div>
        <button
          onClick={addSampleProgram}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-white"
        >
          + Add Sample
        </button>
      </div>

      {/* Search + Sort */}
      {programs.length > 0 && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved programs..."
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-4 py-2 text-sm text-white placeholder-[var(--text-muted)] outline-none"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs text-white outline-none"
          >
            <option value="deadline">Sort by Deadline</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      )}

      {/* Approaching deadlines */}
      {approachingDeadlines.length > 0 && (
        <div className="mb-6 rounded-xl border border-[var(--warning)]/20 bg-[var(--warning)]/5 p-4">
          <h3 className="mb-2 text-sm font-semibold text-[var(--warning)]">
            ⏰ {approachingDeadlines.length} deadline{approachingDeadlines.length > 1 ? 's' : ''} approaching
          </h3>
          <div className="space-y-1">
            {approachingDeadlines.map((p) => {
              const days = daysUntil(p.deadline)
              const urgency = getDeadlineUrgency(days)
              return (
                <p key={p.id} className="text-xs text-[var(--text-secondary)]">
                  {p.name} at {p.university} — {formatDate(p.deadline)} ({urgency.label})
                </p>
              )
            })}
          </div>
        </div>
      )}

      {/* Kanban board */}
      {programs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] py-20">
          <p className="text-sm text-[var(--text-muted)]">
            No programs saved yet. Browse universities and save programs to track them here.
          </p>
          <button
            onClick={addSampleProgram}
            className="mt-3 rounded-lg bg-[var(--bg-primary)] px-4 py-2 text-xs font-medium text-white"
          >
            Add sample program
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {columns.map((col) => (
            <div key={col.key}>
              <h3
                className="mb-3 text-sm font-semibold"
                style={{ color: col.color }}
              >
                {col.label} ({filteredPrograms.filter((p) => p.stage === col.key).length})
              </h3>
              <div className="space-y-2">
                {filteredPrograms
                  .filter((p) => p.stage === col.key)
                  .map((p) => {
                    const days = daysUntil(p.deadline)
                    const urgency = getDeadlineUrgency(days)
                    return (
                      <div
                        key={p.id}
                        className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3"
                      >
                        <h4 className="text-xs font-semibold text-white">{p.name}</h4>
                        <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                          {p.university}
                        </p>
                        {p.deadline && (
                          <p className="mt-1 text-[10px]" style={{ color: urgency.color }}>
                            Deadline: {formatDate(p.deadline)} ({urgency.label})
                          </p>
                        )}
                        <div className="mt-2 flex gap-1">
                          {col.key === 'saved' && (
                            <button
                              onClick={() => moveTo(p.id, 'applying')}
                              className="rounded bg-white/5 px-2 py-1 text-[10px] text-[var(--text-secondary)] hover:text-white"
                            >
                              Start Applying
                            </button>
                          )}
                          {col.key === 'applying' && (
                            <button
                              onClick={() => moveTo(p.id, 'applied')}
                              className="rounded bg-white/5 px-2 py-1 text-[10px] text-[var(--text-secondary)] hover:text-white"
                            >
                              Mark Applied
                            </button>
                          )}
                          {col.key !== 'saved' && (
                            <button
                              onClick={() => moveTo(p.id, 'saved')}
                              className="rounded bg-white/5 px-2 py-1 text-[10px] text-[var(--text-secondary)] hover:text-white"
                            >
                              ← Back
                            </button>
                          )}
                          <button
                            onClick={() => remove(p.id)}
                            className="rounded bg-white/5 px-2 py-1 text-[10px] text-[var(--danger)] hover:text-white"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Email alerts */}
      <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <h3 className="mb-2 text-sm font-semibold text-white">Get Email Alerts</h3>
        <p className="mb-4 text-xs text-[var(--text-secondary)]">
          Receive notifications when new programs open or deadlines approach
        </p>
        {emailSent ? (
          <p className="text-xs text-[var(--success)]">✅ You&apos;re subscribed! Check your inbox.</p>
        ) : (
          <form onSubmit={handleEmailSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-4 py-2.5 text-sm text-white placeholder-[var(--text-muted)] outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-[var(--bg-accent)] px-4 py-2 text-sm font-medium text-black"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
