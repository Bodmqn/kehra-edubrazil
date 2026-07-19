'use client'

import { useState, useEffect, useId } from 'react'
import type { TrackerProgram, TrackerStage, Priority, ChecklistItem } from '@/lib/trackerTypes'
import { STAGES, PRIORITIES, DEFAULT_CHECKLIST_ITEMS } from '@/lib/trackerTypes'
import { daysUntil, getDeadlineUrgency } from '@/lib/utils'

interface TrackerModalProps {
  open: boolean
  program?: TrackerProgram | null
  onSave: (program: TrackerProgram) => void
  onClose: () => void
}

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

export default function TrackerModal({ open, program, onSave, onClose }: TrackerModalProps) {
  const isNew = !program
  const formId = useId()

  const [name, setName] = useState(() => program?.name ?? '')
  const [university, setUniversity] = useState(() => program?.university ?? '')
  const [deadline, setDeadline] = useState(() => program?.deadline ?? '')
  const [level, setLevel] = useState(() => program?.level ?? '')
  const [programUrl, setProgramUrl] = useState(() => program?.programUrl ?? '')
  const [stage, setStage] = useState<TrackerStage>(() => program?.stage ?? 'saved')
  const [priority, setPriority] = useState<Priority>(() => program?.priority ?? 'medium')
  const [notes, setNotes] = useState(() => program?.notes ?? '')
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() =>
    program?.checklist && program.checklist.length > 0 ? program.checklist : []
  )

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  const addChecklistItem = (text: string) => {
    if (!text.trim()) return
    setChecklist((prev) => [...prev, { id: generateId(), text: text.trim(), done: false }])
  }

  const removeChecklistItem = (id: string) => {
    setChecklist((prev) => prev.filter((c) => c.id !== id))
  }

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((c) => (c.id === id ? { ...c, done: !c.done } : c))
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !university.trim()) return

    onSave({
      id: program?.id ?? generateId(),
      name: name.trim(),
      university: university.trim(),
      universityId: program?.universityId,
      deadline: deadline || null,
      level: level || 'Mestrado',
      programUrl: programUrl || null,
      stage,
      priority,
      notes: notes.trim(),
      checklist,
      reminderDays: [7, 3, 1],
      createdAt: program?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  if (!open) return null

  const days = daysUntil(deadline || null)
  const urgency = getDeadlineUrgency(days)
  const doneCount = checklist.filter((c) => c.done).length

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-8 pb-8">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {isNew ? 'Add Program' : 'Edit Program'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor={`${formId}-name`} className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
              Program Name *
            </label>
            <input
              id={`${formId}-name`}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Mestrado em Ciência da Computação"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2 text-sm text-white placeholder-[var(--text-muted)] outline-none focus:border-[var(--bg-primary)]"
            />
          </div>

          {/* University */}
          <div>
            <label htmlFor={`${formId}-uni`} className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
              University *
            </label>
            <input
              id={`${formId}-uni`}
              type="text"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              required
              placeholder="e.g. Universidade de São Paulo (USP)"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2 text-sm text-white placeholder-[var(--text-muted)] outline-none focus:border-[var(--bg-primary)]"
            />
          </div>

          {/* Deadline + Level row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={`${formId}-deadline`} className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
                Deadline
              </label>
              <input
                id={`${formId}-deadline`}
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--bg-primary)]"
              />
              {deadline && (
                <p className="mt-0.5 text-[10px]" style={{ color: urgency.color }}>
                  {urgency.label}
                </p>
              )}
            </div>
            <div>
              <label htmlFor={`${formId}-level`} className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
                Level
              </label>
              <select
                id={`${formId}-level`}
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--bg-primary)]"
              >
                <option value="Mestrado">Mestrado (Master)</option>
                <option value="Doutorado">Doutorado (PhD)</option>
                <option value="Ambos">Ambos (Both)</option>
                <option value="Especialização">Especialização (Specialization)</option>
              </select>
            </div>
          </div>

          {/* Program URL */}
          <div>
            <label htmlFor={`${formId}-url`} className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
              Program URL
            </label>
            <input
              id={`${formId}-url`}
              type="url"
              value={programUrl}
              onChange={(e) => setProgramUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2 text-sm text-white placeholder-[var(--text-muted)] outline-none focus:border-[var(--bg-primary)]"
            />
          </div>

          {/* Stage + Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={`${formId}-stage`} className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
                Stage
              </label>
              <select
                id={`${formId}-stage`}
                value={stage}
                onChange={(e) => setStage(e.target.value as TrackerStage)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--bg-primary)]"
              >
                {STAGES.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${formId}-priority`} className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
                Priority
              </label>
              <select
                id={`${formId}-priority`}
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--bg-primary)]"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor={`${formId}-notes`} className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
              Notes
            </label>
            <textarea
              id={`${formId}-notes`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Requirements, contacts, deadlines, anything..."
              className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2 text-sm text-white placeholder-[var(--text-muted)] outline-none focus:border-[var(--bg-primary)]"
            />
          </div>

          {/* Checklist */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                Checklist ({doneCount}/{checklist.length})
              </label>
              {isNew && checklist.length === 0 && (
                <button
                  type="button"
                  onClick={() => setChecklist(DEFAULT_CHECKLIST_ITEMS.map((c) => ({ id: generateId(), text: c.text, done: false })))}
                  className="text-[10px] text-[var(--bg-primary)] hover:underline"
                >
                  Use template
                </button>
              )}
            </div>
            <div className="space-y-1">
              {checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleChecklistItem(item.id)}
                    className="size-3.5 accent-[var(--bg-primary)]"
                  />
                  <span
                    className={`flex-1 text-xs ${item.done ? 'text-[var(--text-muted)] line-through' : 'text-white'}`}
                  >
                    {item.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeChecklistItem(item.id)}
                    className="text-[10px] text-[var(--danger)] hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-1">
              <input
                type="text"
                placeholder="Add item..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addChecklistItem((e.target as HTMLInputElement).value)
                    ;(e.target as HTMLInputElement).value = ''
                  }
                }}
                className="flex-1 rounded border border-[var(--border)] bg-[var(--bg-dark)] px-2 py-1 text-xs text-white placeholder-[var(--text-muted)] outline-none"
              />
              <button
                type="button"
                onClick={(e) => {
                  const input = (e.target as HTMLButtonElement).previousElementSibling as HTMLInputElement
                  addChecklistItem(input.value)
                  input.value = ''
                }}
                className="rounded bg-white/10 px-2 py-1 text-[10px] text-white hover:bg-white/20"
              >
                Add
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-[var(--bg-accent)] px-4 py-2.5 text-sm font-medium text-black hover:opacity-90"
            >
              {isNew ? 'Add Program' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
