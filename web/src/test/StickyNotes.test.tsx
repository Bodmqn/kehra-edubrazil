import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

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

vi.mock('@/lib/AuthProvider', () => ({
  useAuth: () => ({ user: null, loading: false }),
}))

import StickyNotes from '@/components/tracker/StickyNotes'
import { STICKY_STORAGE_KEY } from '@/lib/stickyNoteService'

function storedNotes(): unknown[] {
  return JSON.parse(localStorage.getItem(STICKY_STORAGE_KEY) ?? '[]')
}

function noteWrapper(): HTMLElement | null {
  const textarea = screen.queryByLabelText('Sticky note content')
  return textarea ? textarea.closest('div') : null
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('StickyNotes', () => {
  it('renders the floating Add Note button with no notes initially', () => {
    render(<StickyNotes />)
    expect(screen.getByLabelText('Add Note')).toBeInTheDocument()
    expect(screen.queryByLabelText('Sticky note content')).not.toBeInTheDocument()
  })

  it('creates a note when the Add Note button is clicked and persists it', async () => {
    render(<StickyNotes />)
    fireEvent.click(screen.getByLabelText('Add Note'))

    const textarea = screen.getByLabelText('Sticky note content')
    expect(textarea).toBeInTheDocument()
    expect(screen.getByTitle('New note')).toBeInTheDocument()

    await act(async () => {})
    expect(storedNotes()).toHaveLength(1)
    expect(storedNotes()[0]).toMatchObject({ content: '', color: 'yellow', minimized: false })
  })

  it('saves typed content to localStorage after the debounce', async () => {
    vi.useFakeTimers()
    render(<StickyNotes />)
    fireEvent.click(screen.getByLabelText('Add Note'))

    const textarea = screen.getByLabelText('Sticky note content')
    fireEvent.change(textarea, { target: { value: 'Send transcripts to USP' } })
    expect(textarea).toHaveValue('Send transcripts to USP')

    await act(async () => {
      vi.advanceTimersByTime(400)
    })
    expect(storedNotes()).toHaveLength(1)
    expect(storedNotes()[0]).toMatchObject({ content: 'Send transcripts to USP' })
  })

  it('minimizes and restores a note', async () => {
    render(<StickyNotes />)
    fireEvent.click(screen.getByLabelText('Add Note'))

    fireEvent.click(screen.getByLabelText('Minimize note'))
    expect(screen.queryByLabelText('Sticky note content')).not.toBeInTheDocument()
    await act(async () => {})
    expect(storedNotes()[0]).toMatchObject({ minimized: true })

    fireEvent.click(screen.getByLabelText('Restore note'))
    expect(screen.getByLabelText('Sticky note content')).toBeInTheDocument()
    await act(async () => {})
    expect(storedNotes()[0]).toMatchObject({ minimized: false })
  })

  it('changes the note color and closes the palette', async () => {
    render(<StickyNotes />)
    fireEvent.click(screen.getByLabelText('Add Note'))

    fireEvent.click(screen.getByLabelText('Change note color'))
    fireEvent.click(screen.getByLabelText('Set note color to Green'))

    expect(screen.queryByLabelText('Set note color to Blue')).not.toBeInTheDocument()
    await act(async () => {})
    expect(storedNotes()[0]).toMatchObject({ color: 'green' })
  })

  it('deletes a note and removes it from storage', async () => {
    render(<StickyNotes />)
    fireEvent.click(screen.getByLabelText('Add Note'))
    expect(screen.getByLabelText('Sticky note content')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Delete note'))
    expect(screen.queryByLabelText('Sticky note content')).not.toBeInTheDocument()
    await act(async () => {})
    expect(storedNotes()).toHaveLength(0)
  })

  it('drags a note by its header and persists the new position', async () => {
    render(<StickyNotes />)
    fireEvent.click(screen.getByLabelText('Add Note'))
    await act(async () => {})

    const wrapper = noteWrapper()
    const header = screen.getByTitle('Drag to move')
    expect(wrapper).not.toBeNull()
    expect(wrapper!.style.left).toBe('752px')
    expect(wrapper!.style.top).toBe('88px')

    fireEvent.pointerDown(header, { button: 0, clientX: 772, clientY: 98 })
    fireEvent.pointerMove(header, { clientX: 720, clientY: 208 })
    fireEvent.pointerUp(header)
    await act(async () => {})

    expect(wrapper!.style.left).toBe('700px')
    expect(wrapper!.style.top).toBe('198px')
    expect(storedNotes()[0]).toMatchObject({ x: 700, y: 198 })
  })

  it('clamps the dragged position to the viewport', () => {
    render(<StickyNotes />)
    fireEvent.click(screen.getByLabelText('Add Note'))

    const header = screen.getByTitle('Drag to move')
    fireEvent.pointerDown(header, { button: 0, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(header, { clientX: -5000, clientY: -5000 })
    fireEvent.pointerUp(header)

    const wrapper = noteWrapper()
    expect(wrapper!.style.left).toBe('0px')
    expect(wrapper!.style.top).toBe('0px')

    fireEvent.pointerDown(header, { button: 0, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(header, { clientX: 99999, clientY: 99999 })
    fireEvent.pointerUp(header)

    expect(wrapper!.style.left).toBe('776px')
    expect(wrapper!.style.top).toBe('738px')
  })

  it('does not start a drag when pressing a header control button', () => {
    render(<StickyNotes />)
    fireEvent.click(screen.getByLabelText('Add Note'))

    const wrapper = noteWrapper()
    const button = screen.getByLabelText('Delete note')
    fireEvent.pointerDown(button, { button: 0, clientX: 10, clientY: 10 })
    fireEvent.pointerMove(button, { clientX: 200, clientY: 200 })
    fireEvent.pointerUp(button)

    expect(wrapper!.style.left).toBe('752px')
    expect(wrapper!.style.top).toBe('88px')
  })
})
