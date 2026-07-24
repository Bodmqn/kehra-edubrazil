'use client'

import { useState, useEffect, useId, useMemo, useCallback } from 'react'
import type { TrackerProgram, TrackerStage, Priority, ChecklistItem } from '@/lib/trackerTypes'
import { STAGES, PRIORITIES, DEFAULT_CHECKLIST_ITEMS } from '@/lib/trackerTypes'
import { REMINDER_PRESETS } from '@/lib/reminderUtils'
import { daysUntil, getDeadlineUrgency, slugify } from '@/lib/utils'
import { universities } from '@/lib/data'
import { availablePrograms as allProgramsBySlug } from '@/lib/available-programs'
import Combobox from '@/components/ui/Combobox'

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
  const formId = useId()

  const [name, setName] = useState(() => program?.name ?? '')
  const [university, setUniversity] = useState(() => program?.university ?? '')
  const [deadline, setDeadline] = useState(() => program?.deadline ?? '')
  const [level, setLevel] = useState(() => program?.level ?? '')
  const [programUrl, setProgramUrl] = useState(() => program?.programUrl ?? '')
  const [stage, setStage] = useState<TrackerStage>(() => program?.stage ?? 'saved')
  const [priority, setPriority] = useState<Priority>(() => program?.priority ?? 'medium')
  const [notes, setNotes] = useState(() => program?.notes ?? '')
  const [reminderDays, setReminderDays] = useState<number[]>(() =>
    program?.reminderDays && program.reminderDays.length > 0
      ? [...new Set(program.reminderDays)].sort((a, b) => a - b)
      : []
  )
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() =>
    program?.checklist && program.checklist.length > 0 ? program.checklist : []
  )
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null)
  const [editingChecklistText, setEditingChecklistText] = useState('')

  const uniOptions = useMemo(
    () =>
      universities.map((u) => ({
        value: u.name,
        label: `${u.name} (${u.acronym})`,
      })),
    []
  )

  const programOptions = useMemo(() => {
    if (!university) return []
    const slug = slugify(university)
    const programs = allProgramsBySlug[slug]
    if (!programs) return []
    return programs.map((p) => ({ value: p.name, label: p.name }))
  }, [university])

  const levelLabelToFormValue = useCallback((label: string): string => {
    const l = label.toLowerCase()
    if (l.includes('doutorado') && l.includes('mestrado')) return 'Ambos'
    if (l.includes('doutorado')) return 'Doutorado'
    if (l.includes('mestrado')) return 'Mestrado'
    return 'Mestrado'
  }, [])

  const handleUniversitySelect = useCallback((selected: string) => {
    const slug = slugify(selected)
    const programs = allProgramsBySlug[slug]
    if (programs && programs.length === 1) {
      setLevel(levelLabelToFormValue(programs[0].levelLabel))
    }
  }, [levelLabelToFormValue])

  const handleProgramSelect = useCallback(
    (selectedName: string) => {
      if (!university) return
      const slug = slugify(university)
      const programs = allProgramsBySlug[slug]
      if (!programs) return
      const program = programs.find((p) => p.name === selectedName)
      if (program) {
        setLevel(levelLabelToFormValue(program.levelLabel))
      }
    },
    [university, levelLabelToFormValue]
  )

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  const toggleReminderDay = (day: number) => {
    setReminderDays((prev) => {
      if (prev.includes(day)) return prev.filter((d) => d !== day)
      return [...prev, day].sort((a, b) => a - b)
    })
  }

  const addCustomReminderDay = (day: number) => {
    if (day < 0 || day > 365) return
    setReminderDays((prev) => {
      if (prev.includes(day)) return prev
      return [...prev, day].sort((a, b) => a - b)
    })
  }

  const startEditChecklistItem = (id: string, text: string) => {
    setEditingChecklistId(id)
    setEditingChecklistText(text)
  }

  const saveEditChecklistItem = () => {
    if (!editingChecklistId) return
    const trimmed = editingChecklistText.trim()
    if (!trimmed) {
      removeChecklistItem(editingChecklistId)
    } else {
      setChecklist((prev) =>
        prev.map((c) => (c.id === editingChecklistId ? { ...c, text: trimmed } : c))
      )
    }
    setEditingChecklistId(null)
    setEditingChecklistText('')
  }

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
      id: program?.id || generateId(),
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
      reminderDays,
      source: program?.source ?? 'manual',
      createdAt: program?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  if (!open) return null

  const isExistingEntry = !!(program && program.id)
  const modalTitle = isExistingEntry
    ? program.source === 'scholarship' ? 'Edit Scholarship' : 'Edit Program'
    : program?.source === 'scholarship' ? 'Add Scholarship' : 'Add Program'

  const days = daysUntil(deadline || null)
  const urgency = getDeadlineUrgency(days)
  const doneCount = checklist.filter((c) => c.done).length

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-8 pb-8">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{modalTitle}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* University */}
          <div>
            <label htmlFor={`${formId}-uni`} className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
              University *
            </label>
            <Combobox
              id={`${formId}-uni`}
              options={uniOptions}
              value={university}
              onChange={setUniversity}
              onSelect={handleUniversitySelect}
              required
              placeholder="Search or type a university name..."
            />
          </div>

          {/* Name */}
          <div>
            <label htmlFor={`${formId}-name`} className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
              Program Name *
            </label>
            <Combobox
              id={`${formId}-name`}
              options={programOptions}
              value={name}
              onChange={setName}
              onSelect={handleProgramSelect}
              required
              placeholder={
                university
                  ? `Search programs at ${university}...`
                  : 'Select a university first, then search programs'
              }
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
              <button
                type="button"
                onClick={() => {
                  const existingTexts = new Set(checklist.map((c) => c.text.toLowerCase()))
                  const toAdd = DEFAULT_CHECKLIST_ITEMS.filter(
                    (t) => !existingTexts.has(t.text.toLowerCase())
                  )
                  if (toAdd.length === 0) return
                  setChecklist((prev) => [
                    ...prev,
                    ...toAdd.map((c) => ({ id: generateId(), text: c.text, done: false })),
                  ])
                }}
                className="text-[10px] text-[var(--bg-primary)] hover:underline"
              >
                Use template
              </button>
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
                  {editingChecklistId === item.id ? (
                    <input
                      type="text"
                      value={editingChecklistText}
                      onChange={(e) => setEditingChecklistText(e.target.value)}
                      onBlur={saveEditChecklistItem}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEditChecklistItem()
                        if (e.key === 'Escape') setEditingChecklistId(null)
                      }}
                      autoFocus
                      className="flex-1 rounded border border-[var(--bg-primary)] bg-[var(--bg-dark)] px-1.5 py-0.5 text-xs text-white outline-none"
                    />
                  ) : (
                    <span
                      className={`flex-1 cursor-pointer rounded px-1.5 py-0.5 text-xs hover:bg-white/5 ${
                        item.done ? 'text-[var(--text-muted)] line-through' : 'text-white'
                      }`}
                      onClick={() => startEditChecklistItem(item.id, item.text)}
                      title="Click to edit"
                    >
                      {item.text}
                    </span>
                  )}
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

          {/* Reminders */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
              Reminders
            </label>
            <p className="mb-2 text-[10px] text-[var(--text-muted)]">
              Get notified before the deadline{program?.deadline ? '' : ' (set a deadline above)'}
            </p>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {REMINDER_PRESETS.map((preset) => {
                const active = reminderDays.includes(preset.days)
                return (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => toggleReminderDay(preset.days)}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all ${
                      active
                        ? 'border-[var(--bg-accent)] bg-[var(--bg-accent)]/20 text-[var(--bg-accent)]'
                        : 'border-[var(--border)] text-[var(--text-muted)] hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
            <div className="flex gap-1">
              <input
                type="number"
                min={0}
                max={365}
                placeholder="Custom days"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const val = parseInt((e.target as HTMLInputElement).value)
                    if (!isNaN(val)) addCustomReminderDay(val)
                    ;(e.target as HTMLInputElement).value = ''
                  }
                }}
                className="w-24 rounded border border-[var(--border)] bg-[var(--bg-dark)] px-2 py-1 text-xs text-white placeholder-[var(--text-muted)] outline-none"
              />
              <button
                type="button"
                onClick={(e) => {
                  const input = (e.target as HTMLButtonElement).previousElementSibling as HTMLInputElement
                  const val = parseInt(input.value)
                  if (!isNaN(val)) addCustomReminderDay(val)
                  input.value = ''
                }}
                className="rounded bg-white/10 px-2 py-1 text-[10px] text-white hover:bg-white/20"
              >
                Add
              </button>
            </div>
            {reminderDays.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {reminderDays.map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-1 rounded bg-[var(--bg-accent)]/10 px-2 py-0.5 text-[10px] text-[var(--bg-accent)]"
                  >
                    {d === 0 ? 'Same day' : `${d} day${d === 1 ? '' : 's'} before`}
                    <button
                      type="button"
                      onClick={() => setReminderDays((prev) => prev.filter((x) => x !== d))}
                      className="text-[var(--bg-accent)] hover:text-white"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
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
              {isExistingEntry ? 'Save Changes' : modalTitle}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
