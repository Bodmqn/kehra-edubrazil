import type { TrackerProgram } from './trackerTypes'
import { daysUntil } from './utils'

export interface ActiveReminder {
  program: TrackerProgram
  key: string
}

export const REMINDER_PRESETS = [
  { label: 'Same day', days: 0 },
  { label: '1d', days: 1 },
  { label: '3d', days: 3 },
  { label: '1w', days: 7 },
  { label: '2w', days: 14 },
  { label: '1m', days: 30 },
] as const

export function getActiveReminders(programs: TrackerProgram[]): ActiveReminder[] {
  const result: ActiveReminder[] = []
  for (const p of programs) {
    if (!p.deadline || p.reminderDays.length === 0) continue
    const days = daysUntil(p.deadline)
    if (days === null) continue
    if (p.reminderDays.includes(days)) {
      result.push({ program: p, key: `${p.id}:${days}` })
    }
  }
  return result
}

export function formatReminderDays(days: number[]): string {
  if (days.length === 0) return 'No reminders'
  const labels: string[] = []
  for (const d of days.sort((a, b) => a - b)) {
    if (d === 0) labels.push('same day')
    else if (d === 1) labels.push('1 day before')
    else labels.push(`${d} days before`)
  }
  return `🔔 ${labels.join(', ')}`
}

export const DISMISSALS_KEY = 'kehra-reminder-dismissals'

export function getDismissedReminders(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(DISMISSALS_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw))
  } catch {
    return new Set()
  }
}

export function dismissReminder(key: string) {
  const dismissed = getDismissedReminders()
  dismissed.add(key)
  localStorage.setItem(DISMISSALS_KEY, JSON.stringify([...dismissed]))
}

export function dismissAllReminders(keys: string[]) {
  const dismissed = getDismissedReminders()
  for (const k of keys) dismissed.add(k)
  localStorage.setItem(DISMISSALS_KEY, JSON.stringify([...dismissed]))
}
