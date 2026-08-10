import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  usePathname: () => '/tracker',
}))

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

const mocks = vi.hoisted(() => ({
  fetchComments: vi.fn(),
  createComment: vi.fn(),
  updateComment: vi.fn(),
  deleteComment: vi.fn(),
  fetchUnreadCount: vi.fn(),
  markCommentsRead: vi.fn(),
}))

vi.mock('@/lib/commentsApi', () => ({
  fetchComments: mocks.fetchComments,
  createComment: mocks.createComment,
  updateComment: mocks.updateComment,
  deleteComment: mocks.deleteComment,
  fetchUnreadCount: mocks.fetchUnreadCount,
  markCommentsRead: mocks.markCommentsRead,
}))

vi.mock('@/lib/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'reader@example.com' },
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    resetPassword: vi.fn(),
  }),
}))

import ChatWidget from '@/components/chat/ChatWidget'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.fetchComments.mockResolvedValue([])
  mocks.fetchUnreadCount.mockResolvedValue(0)
  mocks.markCommentsRead.mockResolvedValue(undefined)
})

describe('ChatWidget unread badge', () => {
  it('shows a badge with the unread count for a signed-in user', async () => {
    mocks.fetchUnreadCount.mockResolvedValue(3)
    render(<ChatWidget />)
    expect(await screen.findByText('3')).toBeInTheDocument()
  })

  it('caps the badge display at 99+', async () => {
    mocks.fetchUnreadCount.mockResolvedValue(150)
    render(<ChatWidget />)
    expect(await screen.findByText('99+')).toBeInTheDocument()
  })

  it('shows no badge when there are no unread comments', async () => {
    render(<ChatWidget />)
    await waitFor(() => expect(mocks.fetchUnreadCount).toHaveBeenCalled())
    expect(screen.queryByText('99+')).not.toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Open comments panel')).toBeInTheDocument()
  })

  it('clears the badge and marks comments read when the panel opens', async () => {
    mocks.fetchUnreadCount.mockResolvedValue(5)
    render(<ChatWidget />)
    expect(await screen.findByText('5')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Open comments panel'))

    expect(mocks.markCommentsRead).toHaveBeenCalled()
    await waitFor(() => {
      expect(screen.queryByText('5')).not.toBeInTheDocument()
    })
  })
})
