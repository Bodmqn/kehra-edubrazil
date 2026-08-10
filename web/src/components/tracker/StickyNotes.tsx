'use client'

import { useEffect, useRef, useState } from 'react'
import type { StickyColor, StickyNote } from '@/lib/stickyNoteService'
import {
  STICKY_COLORS,
  STICKY_NOTE_WIDTH,
  STICKY_NOTE_DEFAULT_HEIGHT,
  STICKY_NOTE_MIN_WIDTH,
  STICKY_NOTE_MIN_HEIGHT,
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

interface ResizeState {
  id: string
  note: StickyNote
  startX: number
  startY: number
  startW: number
  startH: number
  w: number
  h: number
}

function StickyNoteIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10.5L20 16.5V5a2 2 0 0 0-2-2z" />
      <path d="M15.5 3v4a2 2 0 0 0 2 2h2.5" />
    </svg>
  )
}

export default function StickyNotes() {
  const { user, loading: authLoading } = useAuth()

  const [notes, setNotes] = useState<StickyNote[]>([])
  const [colorMenuFor, setColorMenuFor] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const notesRef = useRef<StickyNote[]>(notes)
  useEffect(() => {
    notesRef.current = notes
  }, [notes])

  const zCounter = useRef(0)
  const dragRef = useRef<DragState | null>(null)
  const resizeRef = useRef<ResizeState | null>(null)
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

  // Close the Add Note menu on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

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
      w: STICKY_NOTE_WIDTH,
      h: STICKY_NOTE_DEFAULT_HEIGHT,
      z: zCounter.current++,
      minimized: false,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setNotes((prev) => [...prev, note])
    markInteracted()
    setMenuOpen(false)
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

  const clearTimer = (id: string) => {
    const t = timers.current.get(id)
    if (t) clearTimeout(t)
    timers.current.delete(id)
  }

  // Permanently delete a note (empty notes on close, or from the menu)
  const removeNote = (note: StickyNote) => {
    markInteracted()
    setNotes((prev) => prev.filter((n) => n.id !== note.id))
    setColorMenuFor((cur) => (cur === note.id ? null : cur))
    clearTimer(note.id)
    void deleteStickyNote(note.id)
  }

  // Close a note: discard empty ones, archive notes with saved content
  const closeNote = (note: StickyNote) => {
    if (note.content.trim() === '') {
      removeNote(note)
      return
    }
    markInteracted()
    const updated = { ...note, archived: true, updatedAt: new Date().toISOString() }
    setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)))
    setColorMenuFor((cur) => (cur === note.id ? null : cur))
    clearTimer(note.id)
    void saveStickyNote(updated)
  }

  // Reopen an archived note from the Add Note menu
  const restoreNote = (note: StickyNote) => {
    markInteracted()
    const activeCount = notes.filter((n) => !n.archived).length
    const jitter = (activeCount % 5) * 22
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
    const vh = typeof window !== 'undefined' ? window.innerHeight : 768
    const updated: StickyNote = {
      ...note,
      archived: false,
      minimized: false,
      x: Math.max(8, vw - STICKY_NOTE_WIDTH - 24 - jitter),
      y: Math.min(Math.max(8, vh - 200), 88 + jitter),
      z: zCounter.current++,
      updatedAt: new Date().toISOString(),
    }
    setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)))
    setMenuOpen(false)
    void saveStickyNote(updated)
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
      Math.max(0, window.innerWidth - drag.note.w)
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

  const onResizePointerDown = (e: React.PointerEvent<HTMLElement>, note: StickyNote) => {
    if (e.button !== 0) return
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    resizeRef.current = {
      id: note.id,
      note,
      startX: e.clientX,
      startY: e.clientY,
      startW: note.w,
      startH: note.h,
      w: note.w,
      h: note.h,
    }
    bringToFront(note)
  }

  const onResizePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const rs = resizeRef.current
    if (!rs) return
    const vw = window.innerWidth
    const vh = window.innerHeight
    const w = Math.min(
      Math.max(STICKY_NOTE_MIN_WIDTH, rs.startW + (e.clientX - rs.startX)),
      Math.max(STICKY_NOTE_MIN_WIDTH, vw - rs.note.x)
    )
    const h = Math.min(
      Math.max(STICKY_NOTE_MIN_HEIGHT, rs.startH + (e.clientY - rs.startY)),
      Math.max(STICKY_NOTE_MIN_HEIGHT, vh - rs.note.y)
    )
    rs.w = w
    rs.h = h
    setNotes((prev) => prev.map((n) => (n.id === rs.id ? { ...n, w, h } : n)))
  }

  const endResize = () => {
    const rs = resizeRef.current
    if (!rs) return
    resizeRef.current = null
    const current = notesRef.current.find((n) => n.id === rs.id)
    const base = current ?? rs.note
    const resized = rs.w !== rs.startW || rs.h !== rs.startH
    const updated = {
      ...base,
      w: rs.w,
      h: rs.h,
      updatedAt: resized ? new Date().toISOString() : base.updatedAt,
    }
    markInteracted()
    setNotes((prev) => prev.map((n) => (n.id === rs.id ? updated : n)))
    if (resized) void saveStickyNote(updated)
  }

  const archivedNotes = notes.filter((n) => n.archived)

  return (
    <>
      {notes
        .filter((n) => !n.archived)
        .map((note) => {
        const palette = getStickyColor(note.color)
        const z = BASE_Z + (note.z % Z_LEVELS)
        const title =
          note.content.trim().replace(/\s+/g, ' ').slice(0, 28) || 'New note'
        return (
          <div
            key={note.id}
            className="sticky-note--enter fixed flex flex-col overflow-hidden rounded-lg shadow-2xl shadow-black/50"
            style={{
              left: note.x,
              top: note.y,
              zIndex: z,
              width: note.w,
              height: note.minimized ? undefined : note.h,
            }}
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
                onClick={() => closeNote(note)}
                title="Close"
                aria-label="Close note"
                className="flex h-[22px] w-[22px] items-center justify-center rounded text-sm leading-none text-black/60 hover:bg-black/10"
              >
                ×
              </button>
            </header>

            {!note.minimized && (
              <textarea
                className="min-h-0 w-full flex-1 resize-none overflow-y-auto px-2.5 py-2 text-[13px] leading-snug text-black/80 outline-none placeholder:text-black/30"
                style={{ backgroundColor: palette.body }}
                value={note.content}
                onChange={(e) => updateContent(note.id, e.target.value)}
                placeholder="Type something…"
                aria-label="Sticky note content"
              />
            )}

            {!note.minimized && (
              <span
                aria-label="Resize note"
                onPointerDown={(e) => onResizePointerDown(e, note)}
                onPointerMove={onResizePointerMove}
                onPointerUp={endResize}
                onPointerCancel={endResize}
                className="absolute bottom-1 right-1 flex h-3.5 w-3.5 cursor-nwse-resize items-center justify-center text-black/40 hover:text-black/70"
                style={{ touchAction: 'none' }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M21 21H9" />
                  <path d="M21 15v6" />
                </svg>
              </span>
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

      {/* Floating "Add Note" button + closed-notes menu */}
      <div ref={menuRef} className="fixed bottom-24 right-6 z-50">
        {menuOpen && (
          <div className="absolute bottom-full right-0 mb-2 w-64 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-dark)] shadow-2xl shadow-black/50">
            <button
              onClick={addNote}
              aria-label="New Note"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-white hover:bg-white/5"
            >
              <span className="text-base font-bold leading-none">+</span>
              New Note
            </button>
            <div className="border-t border-[var(--border)] px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Closed Notes ({archivedNotes.length})
            </div>
            {archivedNotes.length === 0 ? (
              <p className="px-3 pb-3 pt-1 text-xs text-[var(--text-muted)]">No saved notes yet</p>
            ) : (
              <div className="max-h-48 overflow-y-auto pb-1">
                {archivedNotes.map((n) => {
                  const savedTitle = n.content.trim().replace(/\s+/g, ' ').slice(0, 40) || 'Empty note'
                  return (
                    <div key={n.id} className="group flex items-center gap-1 px-2">
                      <button
                        onClick={() => restoreNote(n)}
                        className="min-w-0 flex-1 rounded px-1 py-2 text-left text-xs text-[var(--text-secondary)] transition-colors hover:text-white"
                        title={savedTitle}
                      >
                        <span className="block truncate">{savedTitle}</span>
                      </button>
                      <button
                        onClick={() => removeNote(n)}
                        aria-label={`Delete saved note: ${savedTitle}`}
                        title="Delete forever"
                        className="shrink-0 rounded p-1 text-sm leading-none text-[var(--text-muted)] hover:text-[var(--danger)]"
                      >
                        ×
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Add Note"
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg-accent)] text-black shadow-lg shadow-black/40 transition-all duration-200 hover:scale-105 hover:w-[140px] hover:px-4 focus-visible:scale-105 focus-visible:w-[140px] focus-visible:px-4"
        >
          {archivedNotes.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[10px] font-bold text-white">
              {archivedNotes.length}
            </span>
          )}
          <span className="flex items-center justify-center">
            <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-all duration-200 group-hover:mr-1.5 group-hover:max-w-[80px] group-hover:opacity-100 group-focus-visible:mr-1.5 group-focus-visible:max-w-[80px] group-focus-visible:opacity-100">
              Add Note
            </span>
            <StickyNoteIcon />
          </span>
        </button>
      </div>
    </>
  )
}
