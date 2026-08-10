'use client'

import { useEffect, useRef, useState } from 'react'
import type { StickyColor, StickyNote } from '@/lib/stickyNoteService'
import {
  STICKY_COLORS,
  STICKY_NOTE_WIDTH,
  STICKY_NOTE_HEADER_HEIGHT,
  getStickyColor,
  getStickyNotes,
  saveStickyNote,
  deleteStickyNote,
  migrateLocalStickyNotesToSupabase,
  hasLocalStickyNotes,
} from '@/lib/stickyNoteService'
import { useAuth } from '@/lib/AuthProvider'

const BASE_Z = 41
const Z_LEVELS = 8
const SAVE_DEBOUNCE = 400

function uid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

interface DragState {
  id: string
  note: StickyNote
  dx: number
  dy: number
  x: number
  y: number
}

export default function StickyNotes() {
  const { user, loading: authLoading } = useAuth()

  const [notes, setNotes] = useState<StickyNote[]>([])
  const [colorMenuFor, setColorMenuFor] = useState<string | null>(null)

  const notesRef = useRef<StickyNote[]>(notes)
  useEffect(() => {
    notesRef.current = notes
  }, [notes])

  const zCounter = useRef(0)
  const dragRef = useRef<DragState | null>(null)
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const interactedRef = useRef(false)

  const markInteracted = () => {
    interactedRef.current = true
  }

  // Load notes from Supabase (or localStorage) on mount or auth change
  useEffect(() => {
    if (authLoading) return
    ;(async () => {
      try {
        if (user && hasLocalStickyNotes()) {
          await migrateLocalStickyNotesToSupabase()
        }
        const loaded = await getStickyNotes()
        // If the user already added/modified notes before loading finished,
        // don't clobber their in-progress state with the snapshot.
        if (interactedRef.current) return
        const next = loaded.map((n, i) => ({ ...n, z: i }))
        setNotes(next)
        zCounter.current = next.length
      } catch (e) {
        console.error('Failed to load sticky notes:', e)
      }
    })()
  }, [user, authLoading])

  // Flush pending saves on unmount
  useEffect(() => {
    const pending = timers.current
    return () => {
      for (const [id, t] of pending) {
        clearTimeout(t)
        const latest = notesRef.current.find((n) => n.id === id)
        if (latest) void saveStickyNote(latest)
      }
      pending.clear()
    }
  }, [])

  const scheduleSave = (id: string) => {
    const existing = timers.current.get(id)
    if (existing) clearTimeout(existing)
    const t = setTimeout(() => {
      timers.current.delete(id)
      const latest = notesRef.current.find((n) => n.id === id)
      if (latest) void saveStickyNote(latest)
    }, SAVE_DEBOUNCE)
    timers.current.set(id, t)
  }

  const addNote = () => {
    const jitter = (notesRef.current.length % 5) * 22
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
    const vh = typeof window !== 'undefined' ? window.innerHeight : 768
    const note: StickyNote = {
      id: uid(),
      content: '',
      color: 'yellow',
      x: Math.max(8, vw - STICKY_NOTE_WIDTH - 24 - jitter),
      y: Math.min(Math.max(8, vh - 200), 88 + jitter),
      z: zCounter.current++,
      minimized: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setNotes((prev) => [...prev, note])
    markInteracted()
    void saveStickyNote(note)
  }

  const bringToFront = (note: StickyNote) => {
    const z = zCounter.current++
    setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, z } : n)))
  }

  const updateContent = (id: string, content: string) => {
    markInteracted()
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, content, updatedAt: new Date().toISOString() } : n))
    )
    scheduleSave(id)
  }

  const toggleMinimize = (note: StickyNote) => {
    markInteracted()
    const updated = { ...note, minimized: !note.minimized, updatedAt: new Date().toISOString() }
    setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)))
    void saveStickyNote(updated)
  }

  const setNoteColor = (note: StickyNote, color: StickyColor) => {
    markInteracted()
    const updated = { ...note, color, updatedAt: new Date().toISOString() }
    setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)))
    void saveStickyNote(updated)
    setColorMenuFor(null)
  }

  const removeNote = (note: StickyNote) => {
    markInteracted()
    setNotes((prev) => prev.filter((n) => n.id !== note.id))
    setColorMenuFor((cur) => (cur === note.id ? null : cur))
    const t = timers.current.get(note.id)
    if (t) clearTimeout(t)
    timers.current.delete(note.id)
    void deleteStickyNote(note.id)
  }

  const onHeaderPointerDown = (e: React.PointerEvent<HTMLElement>, note: StickyNote) => {
    if (e.button !== 0) return
    if ((e.target as HTMLElement).closest('[data-note-control]')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      id: note.id,
      note,
      dx: e.clientX - note.x,
      dy: e.clientY - note.y,
      x: note.x,
      y: note.y,
    }
    bringToFront(note)
  }

  const onHeaderPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const x = Math.min(
      Math.max(0, e.clientX - drag.dx),
      Math.max(0, window.innerWidth - STICKY_NOTE_WIDTH)
    )
    const y = Math.min(
      Math.max(0, e.clientY - drag.dy),
      Math.max(0, window.innerHeight - STICKY_NOTE_HEADER_HEIGHT)
    )
    drag.x = x
    drag.y = y
    setNotes((prev) => prev.map((n) => (n.id === drag.id ? { ...n, x, y } : n)))
  }

  const endDrag = () => {
    const drag = dragRef.current
    if (!drag) return
    dragRef.current = null
    const current = notesRef.current.find((n) => n.id === drag.id)
    const base = current ?? drag.note
    const moved = drag.x !== drag.note.x || drag.y !== drag.note.y
    const updated = {
      ...base,
      x: drag.x,
      y: drag.y,
      updatedAt: moved ? new Date().toISOString() : base.updatedAt,
    }
    markInteracted()
    setNotes((prev) => prev.map((n) => (n.id === drag.id ? updated : n)))
    if (moved) void saveStickyNote(updated)
  }

  const growTextarea = (el: HTMLTextAreaElement | null) => {
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${el.scrollHeight}px`
  }

  return (
    <>
      {notes.map((note) => {
        const palette = getStickyColor(note.color)
        const z = BASE_Z + (note.z % Z_LEVELS)
        const title =
          note.content.trim().replace(/\s+/g, ' ').slice(0, 28) || 'New note'
        return (
          <div
            key={note.id}
            className="sticky-note--enter fixed flex flex-col overflow-hidden rounded-lg shadow-2xl shadow-black/50"
            style={{ left: note.x, top: note.y, zIndex: z, width: STICKY_NOTE_WIDTH }}
          >
            <header
              className="flex h-[30px] cursor-grab select-none items-center gap-0.5 px-1.5 active:cursor-grabbing"
              style={{ backgroundColor: palette.header, touchAction: 'none' }}
              onPointerDown={(e) => onHeaderPointerDown(e, note)}
              onPointerMove={onHeaderPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              title="Drag to move"
            >
              <span className="min-w-0 flex-1 truncate px-1 text-[11px] font-semibold text-black/60">
                {title}
              </span>
              <button
                data-note-control
                onClick={addNote}
                title="New note"
                aria-label="New sticky note"
                className="flex h-[22px] w-[22px] items-center justify-center rounded text-sm leading-none text-black/60 hover:bg-black/10"
              >
                +
              </button>
              <button
                data-note-control
                onClick={() => setColorMenuFor(colorMenuFor === note.id ? null : note.id)}
                title="Color"
                aria-label="Change note color"
                className="flex h-[22px] w-[22px] items-center justify-center rounded text-sm leading-none text-black/60 hover:bg-black/10"
              >
                ◐
              </button>
              <button
                data-note-control
                onClick={() => toggleMinimize(note)}
                title={note.minimized ? 'Restore' : 'Minimize'}
                aria-label={note.minimized ? 'Restore note' : 'Minimize note'}
                className="flex h-[22px] w-[22px] items-center justify-center rounded text-sm leading-none text-black/60 hover:bg-black/10"
              >
                {note.minimized ? '▢' : '–'}
              </button>
              <button
                data-note-control
                onClick={() => removeNote(note)}
                title="Delete"
                aria-label="Delete note"
                className="flex h-[22px] w-[22px] items-center justify-center rounded text-sm leading-none text-black/60 hover:bg-black/10"
              >
                ×
              </button>
            </header>

            {!note.minimized && (
              <textarea
                className="w-full resize-none px-2.5 py-2 text-[13px] leading-snug text-black/80 outline-none placeholder:text-black/30"
                style={{ backgroundColor: palette.body, minHeight: 96 }}
                value={note.content}
                onChange={(e) => updateContent(note.id, e.target.value)}
                ref={growTextarea}
                placeholder="Type something…"
                aria-label="Sticky note content"
              />
            )}

            {colorMenuFor === note.id && (
              <div className="flex items-center gap-1.5 px-2 py-1.5" style={{ backgroundColor: palette.body }}>
                {STICKY_COLORS.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setNoteColor(note, c.key)}
                    title={c.label}
                    aria-label={`Set note color to ${c.label}`}
                    className={`flex h-5 w-5 items-center justify-center rounded-full border border-black/20 hover:scale-110 transition-transform ${
                      note.color === c.key ? 'ring-1 ring-black/40' : ''
                    }`}
                    style={{ backgroundColor: c.body }}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Floating "Add Note" button */}
      <button
        onClick={addNote}
        title="Add Note"
        aria-label="Add Note"
        className="group fixed bottom-6 left-6 z-50 flex h-11 items-center rounded-full bg-[var(--bg-accent)] px-4 text-black shadow-lg shadow-black/40 transition-transform hover:scale-105 focus-visible:scale-105"
      >
        <span className="text-lg font-bold leading-none">+</span>
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-all duration-200 group-hover:ml-1.5 group-hover:max-w-[80px] group-hover:opacity-100 group-focus-visible:ml-1.5 group-focus-visible:max-w-[80px] group-focus-visible:opacity-100">
          Add Note
        </span>
      </button>
    </>
  )
}
