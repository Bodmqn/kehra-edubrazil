import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn(),
  },
}))

import {
  getStickyNotes,
  saveStickyNote,
  deleteStickyNote,
  hasLocalStickyNotes,
  migrateLocalStickyNotesToSupabase,
  STICKY_STORAGE_KEY,
} from '@/lib/stickyNoteService'
import type { StickyNote } from '@/lib/stickyNoteService'

function note(partial: Partial<StickyNote> = {}): StickyNote {
  return {
    id: 'n1',
    content: 'Send transcripts',
    color: 'yellow',
    x: 100,
    y: 80,
    z: 0,
    minimized: false,
    archived: false,
    createdAt: '2026-08-10T00:00:00.000Z',
    updatedAt: '2026-08-10T00:00:00.000Z',
    ...partial,
  }
}

beforeEach(() => {
  localStorage.clear()
})

describe('sticky note local storage (signed out)', () => {
  it('saves a note to localStorage and reads it back', async () => {
    await saveStickyNote(note())
    expect(hasLocalStickyNotes()).toBe(true)
    const notes = await getStickyNotes()
    expect(notes).toHaveLength(1)
    expect(notes[0]).toMatchObject({ id: 'n1', content: 'Send transcripts', color: 'yellow' })
  })

  it('returns an empty array when nothing is stored', async () => {
    expect(await getStickyNotes()).toEqual([])
    expect(hasLocalStickyNotes()).toBe(false)
  })

  it('updates an existing note instead of duplicating it', async () => {
    await saveStickyNote(note())
    await saveStickyNote(note({ content: 'Submit application' }))
    const notes = await getStickyNotes()
    expect(notes).toHaveLength(1)
    expect(notes[0].content).toBe('Submit application')
  })

  it('keeps multiple notes in insertion order', async () => {
    await saveStickyNote(note({ id: 'a', content: 'First' }))
    await saveStickyNote(note({ id: 'b', content: 'Second' }))
    expect((await getStickyNotes()).map((n) => n.id)).toEqual(['a', 'b'])
  })

  it('deletes a note from localStorage', async () => {
    await saveStickyNote(note({ id: 'a' }))
    await saveStickyNote(note({ id: 'b' }))
    await deleteStickyNote('a')
    const notes = await getStickyNotes()
    expect(notes.map((n) => n.id)).toEqual(['b'])
  })
})

describe('migration', () => {
  it('is a no-op when signed out (local notes are kept)', async () => {
    await saveStickyNote(note())
    await migrateLocalStickyNotesToSupabase()
    expect(hasLocalStickyNotes()).toBe(true)
    expect(JSON.parse(localStorage.getItem(STICKY_STORAGE_KEY) ?? '[]')).toHaveLength(1)
  })
})

describe('sanitization of corrupted stored data', () => {
  it('fills defaults for partial records and keeps them reachable', async () => {
    localStorage.setItem(
      STICKY_STORAGE_KEY,
      JSON.stringify([{ id: 'partial', x: -500, y: 99999, color: 'neon', content: 42 }])
    )
    const notes = await getStickyNotes()
    expect(notes).toHaveLength(1)
    expect(notes[0]).toMatchObject({
      id: 'partial',
      content: '',
      color: 'yellow',
      minimized: false,
      archived: false,
    })
    expect(notes[0].x).toBeGreaterThanOrEqual(0)
    expect(notes[0].x).toBeLessThanOrEqual(window.innerWidth - 248)
    expect(notes[0].y).toBeLessThanOrEqual(window.innerHeight - 30)
    expect(notes[0].createdAt).toBeTypeOf('string')
    expect(notes[0].updatedAt).toBeTypeOf('string')
  })

  it('drops entries that are not objects', async () => {
    localStorage.setItem(STICKY_STORAGE_KEY, JSON.stringify(['junk', null, 42]))
    expect(await getStickyNotes()).toEqual([])
  })

  it('keeps valid notes untouched', async () => {
    await saveStickyNote(
      note({ id: 'ok', x: 40, y: 60, color: 'blue', content: 'Keep me', archived: true })
    )
    const notes = await getStickyNotes()
    expect(notes).toHaveLength(1)
    expect(notes[0]).toMatchObject({
      id: 'ok',
      x: 40,
      y: 60,
      color: 'blue',
      content: 'Keep me',
      archived: true,
    })
  })
})
