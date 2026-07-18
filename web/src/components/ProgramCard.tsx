'use client'

import { useState, useEffect } from 'react'
import type { Program } from '@/lib/types'
import { formatDate, daysUntil, getDeadlineUrgency } from '@/lib/utils'
import Badge from './Badge'

interface ProgramCardProps {
  program: Program
  universityName?: string
}

export default function ProgramCard({ program, universityName }: ProgramCardProps) {
  const [mounted, setMounted] = useState(false)
  const [saved, setSaved] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('kehra-edubrazil-tracker')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setSaved(parsed.some((p: { id: string }) => p.id === program.id))
      } catch { /* ignore */ }
    }
  }, [program.id])

  useEffect(() => {
    if (!justSaved) return
    const t = setTimeout(() => setJustSaved(false), 2000)
    return () => clearTimeout(t)
  }, [justSaved])

  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(id)
  }, [])

  const days = mounted ? daysUntil(program.deadline) : null
  const urgency = getDeadlineUrgency(days)

  const handleSave = () => {
    const stored = localStorage.getItem('kehra-edubrazil-tracker')
    let list = stored ? JSON.parse(stored) : []
    if (saved) {
      list = list.filter((p: { id: string }) => p.id !== program.id)
      setSaved(false)
    } else {
      list.push({
        id: program.id,
        name: program.name,
        university: universityName || '',
        deadline: program.deadline,
        stage: 'saved',
      })
      setSaved(true)
      setJustSaved(true)
    }
    localStorage.setItem('kehra-edubrazil-tracker', JSON.stringify(list))
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-all hover:border-[var(--bg-primary)]/20">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h4 className="text-sm font-semibold text-white">{program.name}</h4>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {program.field || 'General'} · {program.level}
          </p>
        </div>
        <Badge variant="status">{program.status}</Badge>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          {program.deadline && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-secondary)]">
                Deadline: {formatDate(program.deadline)}
              </span>
              {days !== null && (
                <span
                  className="text-xs font-medium"
                  style={{ color: urgency.color }}
                  aria-live="polite"
                >
                  {urgency.label}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {program.edital_url && (
            <a
              href={program.edital_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--bg-primary)]/30 hover:text-white"
            >
              Edital
            </a>
          )}
          <button
            onClick={handleSave}
            className={`rounded-lg border px-3 py-1.5 text-xs transition-all ${
              justSaved
                ? 'border-[var(--success)] bg-[var(--success)]/10 text-[var(--success)]'
                : saved
                  ? 'border-[var(--bg-accent)] bg-[var(--bg-accent)]/10 text-[var(--bg-accent)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--bg-accent)]/30 hover:text-white'
            }`}
          >
            {justSaved ? 'Saved!' : saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
