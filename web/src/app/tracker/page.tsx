'use client'

import { useState, useMemo, useEffect, useSyncExternalStore, useCallback } from 'react'
import type { TrackerProgram } from '@/lib/trackerTypes'
import { STAGES, STORAGE_KEY } from '@/lib/trackerTypes'
import { usePageMeta } from '@/lib/usePageMeta'
import {
  getActiveReminders,
  getDismissedReminders,
  dismissReminder,
  dismissAllReminders,
} from '@/lib/reminderUtils'
import { daysUntil, slugify } from '@/lib/utils'
import { universities } from '@/lib/data'
import Link from 'next/link'
import SearchInput from '@/components/SearchInput'
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
        if (stored) {
          const parsed: TrackerProgram[] = JSON.parse(stored)
          return parsed.map((p) => ({
            id: p.id,
            name: p.name,
            university: p.university,
            universityId: p.universityId,
            deadline: p.deadline ?? null,
            level: p.level ?? '',
            programUrl: p.programUrl ?? null,
            stage: p.stage ?? 'saved',
            priority: p.priority ?? 'medium',
            notes: p.notes ?? '',
            checklist: Array.isArray(p.checklist) ? p.checklist : [],
            reminderDays: Array.isArray(p.reminderDays) ? p.reminderDays : [],
            source: p.source ?? 'manual',
            createdAt: p.createdAt ?? new Date().toISOString(),
            updatedAt: p.updatedAt ?? new Date().toISOString(),
          }))
        }
      } catch { /* ignore */ }
    }
    return []
  })
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'deadline' | 'name' | 'priority' | 'updated'>('deadline')
  const [stageFilter, setStageFilter] = useState<'all' | (typeof STAGES)[number]['key']>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TrackerProgram | null>(null)
  const [email, setEmail] = useState('')
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [emailError, setEmailError] = useState('')
  const [subscriptionToken, setSubscriptionToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('kehra-sub-token')
    return null
  })
  const [subscribedEmail, setSubscribedEmail] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('kehra-sub-email')
    return null
  })
  const [dismissedSet, setDismissedSet] = useState<Set<string>>(() => getDismissedReminders())
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) return Notification.permission
    return 'denied'
  })
  const [formKey, setFormKey] = useState(0)
  const [syncError, setSyncError] = useState('')

  const saveToStorage = (updated: TrackerProgram[]) => {
    setPrograms(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const syncReminderToServer = useCallback(
    async (program: TrackerProgram) => {
      if (!subscriptionToken) return
      setSyncError('')
      const method = program.reminderDays.length === 0 ? 'DELETE' : 'POST'
      const body = method === 'DELETE'
        ? { token: subscriptionToken, programId: program.id }
        : {
            token: subscriptionToken,
            programId: program.id,
            programName: program.name,
            university: program.university,
            deadline: program.deadline,
            reminderDays: program.reminderDays,
            source: program.source ?? 'manual',
          }
      try {
        const resp = await fetch('/.netlify/functions/sync-reminders', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!resp.ok) {
          const result = await resp.json()
          throw new Error(result.error || `Server returned ${resp.status}`)
        }
      } catch (e) {
        setSyncError(e instanceof Error ? e.message : 'Failed to sync reminder')
      }
    },
    [subscriptionToken]
  )

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
    syncReminderToServer(program)
    setModalOpen(false)
    setEditing(null)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this program from your tracker?')) return
    saveToStorage(programs.filter((p) => p.id !== id))
    if (subscriptionToken) {
      try {
        const resp = await fetch('/.netlify/functions/sync-reminders', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: subscriptionToken, programId: id }),
        })
        if (!resp.ok) {
          const result = await resp.json()
          throw new Error(result.error || `Server returned ${resp.status}`)
        }
      } catch (e) {
        setSyncError(e instanceof Error ? e.message : 'Failed to delete reminder')
      }
    }
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
    setFormKey((k) => k + 1)
  }

  const openAddScholarship = () => {
    setEditing({
      id: '',
      name: '',
      university: '',
      deadline: null,
      level: 'Mestrado',
      programUrl: null,
      stage: 'applied',
      priority: 'medium',
      notes: '',
      checklist: [],
      reminderDays: [],
      source: 'scholarship',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    setModalOpen(true)
    setFormKey((k) => k + 1)
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    setEmailStatus('sending')
    setEmailError('')

    try {
      const resp = await fetch('/.netlify/functions/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })
      const result = await resp.json()

      if (!resp.ok) {
        throw new Error(result.error || 'Subscription failed')
      }

      localStorage.setItem('kehra-sub-token', result.token)
      localStorage.setItem('kehra-sub-email', result.email)
      setSubscriptionToken(result.token)
      setSubscribedEmail(result.email)
      setEmailStatus('success')
    } catch (e) {
      setEmailError(e instanceof Error ? e.message : 'Something went wrong')
      setEmailStatus('error')
    }
  }

  const handleUnsubscribe = async () => {
    if (!subscriptionToken) return
    try {
      const resp = await fetch('/.netlify/functions/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: subscriptionToken }),
      })
      if (!resp.ok) throw new Error()
      localStorage.removeItem('kehra-sub-token')
      localStorage.removeItem('kehra-sub-email')
      setSubscriptionToken(null)
      setSubscribedEmail(null)
      setEmailStatus('idle')
      setEmail('')
    } catch {
      alert('Failed to unsubscribe. Please try again.')
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

  const activeReminders = useMemo(() => {
    if (!mounted) return []
    return getActiveReminders(programs).filter((r) => !dismissedSet.has(r.key))
  }, [programs, mounted, dismissedSet])

  useEffect(() => {
    if (!mounted) return
    if (activeReminders.length === 0) return
    if (notifPermission !== 'granted') return
    for (const { program } of activeReminders) {
      const days = daysUntil(program.deadline)
      const label = days !== null && days === 0
        ? 'Deadline is today!'
        : days !== null
          ? `Deadline in ${days} day${days === 1 ? '' : 's'}`
          : 'Reminder'
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`🔔 ${program.name}`, {
          body: `${program.university} — ${label}`,
          tag: `reminder-${program.id}`,
        })
      }
    }
  }, [activeReminders, mounted, notifPermission])

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
        <div className="flex gap-2">
          <button
            onClick={openAddScholarship}
            className="rounded-lg border border-[var(--bg-accent)] px-4 py-2 text-sm font-medium text-[var(--bg-accent)] hover:opacity-90"
          >
            + Add Scholarship
          </button>
          <button
            onClick={openAdd}
            className="rounded-lg bg-[var(--bg-accent)] px-4 py-2 text-sm font-medium text-black hover:opacity-90"
          >
            + Add Program
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4">
        <StatsBar programs={programs} />
      </div>

      {/* Timeline */}
      <div className="mb-4">
        <DeadlineTimeline programs={programs} onSelect={openEdit} />
      </div>

      {/* Reminder Notification Banner */}
      {activeReminders.length > 0 && (
        <div className="mb-4 rounded-xl border border-[var(--bg-accent)]/30 bg-[var(--bg-accent)]/10 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--bg-accent)]">
              🔔 {activeReminders.length} program{activeReminders.length > 1 ? 's' : ''} need attention
            </h3>
            <button
              onClick={() => {
                const keys = activeReminders.map((r) => r.key)
                dismissAllReminders(keys)
                setDismissedSet(new Set([...dismissedSet, ...keys]))
              }}
              className="text-[10px] text-[var(--text-muted)] hover:text-white"
            >
              Dismiss all
            </button>
          </div>
          <div className="space-y-1.5">
            {activeReminders.map((r) => {
              const { program: p } = r
              const days = daysUntil(p.deadline)
              const pUniName = (() => {
                const match = /^(.+?)(?:\s*\(.*\))?$/.exec(p.university)
                const base = match?.[1]?.trim() ?? p.university
                const found = universities.find((u) => u.name === base)
                return found?.name ?? null
              })()
              const pUniSlug = pUniName ? slugify(pUniName) : null
              const pLinkHref = pUniSlug ? `/universities/${pUniSlug}` : '#'
              return (
                <div key={r.key} className="flex items-center justify-between rounded-lg bg-[var(--bg-card)] px-3 py-2">
                  <Link href={pLinkHref} className="min-w-0 text-left">
                    <p className="text-xs font-medium text-white truncate hover:text-[var(--bg-primary)] transition-colors">{p.name}</p>
                    <p className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                      {p.university}
                      {days !== null && (
                        <span className="ml-1">
                          — {days === 0 ? 'Deadline today' : `${days} day${days === 1 ? '' : 's'} left`}
                        </span>
                      )}
                    </p>
                  </Link>
                  <button
                    onClick={() => {
                      dismissReminder(r.key)
                      setDismissedSet(new Set([...dismissedSet, r.key]))
                    }}
                    className="ml-2 shrink-0 rounded p-1 text-[10px] text-[var(--text-muted)] hover:text-white"
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
          {notifPermission !== 'granted' && 'Notification' in window && (
            <button
              onClick={async () => {
                const result = await Notification.requestPermission()
                setNotifPermission(result)
                if (result === 'granted' && activeReminders.length > 0) {
                  for (const { program: p } of activeReminders) {
                    new Notification(`🔔 ${p.name}`, {
                      body: `${p.university} — Reminder active`,
                      tag: `reminder-${p.id}`,
                    })
                  }
                }
              }}
              className="mt-2 text-[10px] text-[var(--bg-primary)] hover:underline"
            >
              {notifPermission === 'denied'
                ? 'Browser notifications are blocked — enable in your browser settings'
                : 'Enable browser notifications for pop-up alerts'}
            </button>
          )}
        </div>
      )}

      {/* Search / Sort / Filter */}
      {programs.length > 0 && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <SearchInput value={search} onChange={setSearch} placeholder="Search programs, universities, notes..." />
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
          {programs.length === 0 ? (
            <button
              onClick={openAdd}
              className="mt-4 rounded-lg bg-[var(--bg-primary)] px-5 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Add Your First Program
            </button>
          ) : (
            <button
              onClick={() => { setSearch(''); setStageFilter('all'); setSortBy('deadline') }}
              className="mt-4 rounded-lg border border-[var(--border)] px-5 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              Clear filters
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
          <div className="flex flex-col gap-2">
            <p className="text-xs text-[var(--success)]">
              ✅ Subscribed{subscribedEmail ? ` as ${subscribedEmail}` : ''}
            </p>
            <button
              onClick={handleUnsubscribe}
              className="self-start text-xs text-[var(--text-muted)] hover:text-[var(--danger)] hover:underline"
            >
              Unsubscribe
            </button>
          </div>
        ) : emailStatus === 'error' ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-[var(--danger)]">
              {emailError || 'Something went wrong. Try again.'}
            </p>
            <button
              onClick={() => { setEmailStatus('idle'); setEmailError('') }}
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
        {syncError && (
          <p className="mt-3 text-xs text-[var(--danger)]">
            Sync error: {syncError}
          </p>
        )}
      </div>

      {/* Modal */}
      <TrackerModal
        key={editing?.id ?? formKey}
        open={modalOpen}
        program={editing}
        onSave={handleSave}
        onClose={() => { setModalOpen(false); setEditing(null) }}
      />
    </div>
  )
}
