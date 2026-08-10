import { supabase } from '@/lib/supabase'

export type StickyColor = 'yellow' | 'green' | 'blue' | 'pink'

export interface StickyNote {
  id: string
  content: string
  color: StickyColor
  x: number
  y: number
  z: number
  minimized: boolean
  archived: boolean
  createdAt: string
  updatedAt: string
}

export const STICKY_STORAGE_KEY = 'kehra-edubrazil-sticky-notes'

export const STICKY_NOTE_WIDTH = 248
export const STICKY_NOTE_HEADER_HEIGHT = 30

const VALID_COLORS: StickyColor[] = ['yellow', 'green', 'blue', 'pink']

export const STICKY_COLORS: { key: StickyColor; label: string; body: string; header: string }[] = [
  { key: 'yellow', label: 'Yellow', body: '#FFF9B8', header: '#FFD52E' },
  { key: 'green', label: 'Green', body: '#B6FCD5', header: '#5BD98A' },
  { key: 'blue', label: 'Blue', body: '#A8DDF0', header: '#58B9D9' },
  { key: 'pink', label: 'Pink', body: '#FFB8DE', header: '#F57CB9' },
]

export function getStickyColor(key: StickyColor) {
  return STICKY_COLORS.find((c) => c.key === key) ?? STICKY_COLORS[0]
}

// Normalizes a raw stored note into a safe StickyNote, clamping position
// into the current viewport so notes can never render unreachable.
export function sanitizeNote(raw: unknown, fallbackIndex: number): StickyNote | null {
  if (!raw || typeof raw !== 'object') return null
  const n = raw as Record<string, unknown>

  const id = typeof n.id === 'string' && n.id !== '' ? n.id : `note-${Date.now()}-${fallbackIndex}`
  const color = VALID_COLORS.includes(n.color as StickyColor) ? (n.color as StickyColor) : 'yellow'
  const content = typeof n.content === 'string' ? n.content : ''
  const minimized = typeof n.minimized === 'boolean' ? n.minimized : false
  const archived = typeof n.archived === 'boolean' ? n.archived : false
  const now = new Date().toISOString()
  const createdAt = typeof n.createdAt === 'string' ? n.createdAt : now
  const updatedAt = typeof n.updatedAt === 'string' ? n.updatedAt : createdAt

  const fallbackX = 24 + (fallbackIndex % 5) * 22
  const fallbackY = 88 + (fallbackIndex % 5) * 22
  const rawX = typeof n.x === 'number' && Number.isFinite(n.x) ? n.x : fallbackX
  const rawY = typeof n.y === 'number' && Number.isFinite(n.y) ? n.y : fallbackY
  const z = typeof n.z === 'number' && Number.isFinite(n.z) ? n.z : fallbackIndex

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768
  const x = Math.min(Math.max(0, rawX), Math.max(0, vw - STICKY_NOTE_WIDTH))
  const y = Math.min(Math.max(0, rawY), Math.max(0, vh - STICKY_NOTE_HEADER_HEIGHT))

  return { id, content, color, x, y, z, minimized, archived, createdAt, updatedAt }
}

function sanitizeList(raw: unknown[]): StickyNote[] {
  return raw
    .map((item, i) => sanitizeNote(item, i))
    .filter((n): n is StickyNote => n !== null)
}

function getFromLocal(): StickyNote[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STICKY_STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored) as StickyNote[]
  } catch {
    return []
  }
}

function saveToLocal(notes: StickyNote[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STICKY_STORAGE_KEY, JSON.stringify(notes))
}

// ---------- User id memoization ----------

let cachedUserId: string | null | undefined

async function getUserId(): Promise<string | null> {
  if (cachedUserId !== undefined) return cachedUserId
  try {
    const { data: { session } } = await supabase.auth.getSession()
    cachedUserId = session?.user?.id ?? null
    return cachedUserId
  } catch {
    cachedUserId = null
    return null
  }
}

// ---------- Change notifications ----------

type Listener = () => void

const listeners = new Set<Listener>()

export function subscribeToStickyChanges(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function notifyStickyChanged() {
  for (const listener of listeners) listener()
}

if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((_event, session) => {
    cachedUserId = session?.user?.id ?? null
    notifyStickyChanged()
  })
}

// ---------- Public API ----------

export async function getStickyNotes(): Promise<StickyNote[]> {
  const userId = await getUserId()
  if (!userId) return sanitizeList(getFromLocal())

  const { data, error } = await supabase
    .from('user_sticky_notes')
    .select('note_data')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to load sticky notes from Supabase:', error)
    return sanitizeList(getFromLocal())
  }

  return sanitizeList((data ?? []).map((r) => r.note_data))
}

export function hasLocalStickyNotes(): boolean {
  if (typeof window === 'undefined') return false
  return getFromLocal().length > 0
}

export async function saveStickyNote(note: StickyNote): Promise<void> {
  const userId = await getUserId()
  if (!userId) {
    const list = getFromLocal()
    const idx = list.findIndex((n) => n.id === note.id)
    if (idx >= 0) {
      list[idx] = note
    } else {
      list.push(note)
    }
    saveToLocal(list)
    notifyStickyChanged()
    return
  }

  const noteData = { ...note, updatedAt: new Date().toISOString() }

  const { error } = await supabase
    .from('user_sticky_notes')
    .upsert(
      {
        user_id: userId,
        note_id: note.id,
        note_data: noteData,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id, note_id',
        ignoreDuplicates: false,
      }
    )

  if (error) {
    console.error('Failed to save sticky note to Supabase:', error)
    // fallback: save to localStorage
    const list = getFromLocal()
    const idx = list.findIndex((n) => n.id === note.id)
    if (idx >= 0) {
      list[idx] = noteData
    } else {
      list.push(noteData)
    }
    saveToLocal(list)
  }
  notifyStickyChanged()
}

export async function deleteStickyNote(noteId: string): Promise<void> {
  const userId = await getUserId()
  if (!userId) {
    saveToLocal(getFromLocal().filter((n) => n.id !== noteId))
    notifyStickyChanged()
    return
  }

  const { error } = await supabase
    .from('user_sticky_notes')
    .delete()
    .eq('user_id', userId)
    .filter('note_data->>id', 'eq', noteId)

  if (error) {
    console.error('Failed to delete sticky note from Supabase:', error)
    saveToLocal(getFromLocal().filter((n) => n.id !== noteId))
  }
  notifyStickyChanged()
}

export async function migrateLocalStickyNotesToSupabase(): Promise<void> {
  const userId = await getUserId()
  if (!userId) return

  const localNotes = getFromLocal()
  if (localNotes.length === 0) return

  const rows = localNotes.map((n) => ({
    user_id: userId,
    note_id: n.id,
    note_data: n,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase.from('user_sticky_notes').upsert(rows, {
    onConflict: 'user_id, note_id',
    ignoreDuplicates: false,
  })

  if (error) {
    console.error('Failed to migrate sticky notes to Supabase:', error)
    return
  }

  localStorage.removeItem(STICKY_STORAGE_KEY)
  notifyStickyChanged()
}
