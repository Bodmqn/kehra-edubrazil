export type TrackerStage = 'saved' | 'applying' | 'applied' | 'interview' | 'accepted' | 'rejected'

export type Priority = 'high' | 'medium' | 'low'

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

export interface TrackerProgram {
  id: string
  name: string
  university: string
  universityId?: string
  deadline: string | null
  level: string
  programUrl: string | null
  stage: TrackerStage
  priority: Priority
  notes: string
  checklist: ChecklistItem[]
  reminderDays: number[]
  source?: 'manual' | 'scholarship'
  createdAt: string
  updatedAt: string
}

export const STAGES: { key: TrackerStage; label: string; color: string }[] = [
  { key: 'saved', label: 'Saved', color: 'var(--text-muted)' },
  { key: 'applying', label: 'Applying', color: 'var(--warning)' },
  { key: 'applied', label: 'Applied', color: 'var(--bg-secondary)' },
  { key: 'interview', label: 'Interview', color: 'var(--bg-accent)' },
  { key: 'accepted', label: 'Accepted', color: 'var(--success)' },
  { key: 'rejected', label: 'Rejected', color: 'var(--danger)' },
]

export const PRIORITIES: { key: Priority; label: string; color: string }[] = [
  { key: 'high', label: 'High', color: 'var(--danger)' },
  { key: 'medium', label: 'Medium', color: 'var(--warning)' },
  { key: 'low', label: 'Low', color: 'var(--text-muted)' },
]

export const DEFAULT_CHECKLIST_ITEMS: { text: string }[] = [
  { text: 'Check program requirements' },
  { text: 'Prepare transcripts' },
  { text: 'Request recommendation letters' },
  { text: 'Write statement of purpose' },
  { text: 'Take language proficiency test' },
  { text: 'Submit application' },
]

export const STORAGE_KEY = 'kehra-edubrazil-tracker'
