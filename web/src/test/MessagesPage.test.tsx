import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  },
}))

const { mockRouter } = vi.hoisted(() => ({
  mockRouter: { back: vi.fn(), push: vi.fn() },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/messages',
}))

vi.mock('@/lib/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'reader@example.com' }, loading: false }),
  useUser: () => ({ id: 'u1', email: 'reader@example.com' }),
}))

import MessagesPage from '@/app/messages/page'

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('MessagesPage', () => {
  it('renders the modal frame with the Messages title and a close button', () => {
    render(<MessagesPage />)
    expect(screen.getByRole('heading', { name: 'Messages' })).toBeInTheDocument()
    expect(screen.getByLabelText('Close messages')).toBeInTheDocument()
    expect(screen.getByText('reader@example.com')).toBeInTheDocument()
  })

  it('closes via the X button by navigating back when there is history', () => {
    vi.spyOn(History.prototype, 'length', 'get').mockReturnValue(2)
    render(<MessagesPage />)

    fireEvent.click(screen.getByLabelText('Close messages'))

    expect(mockRouter.back).toHaveBeenCalled()
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('closes via the backdrop click by navigating back', () => {
    vi.spyOn(History.prototype, 'length', 'get').mockReturnValue(2)
    const { container } = render(<MessagesPage />)

    const overlay = container.firstElementChild
    const backdrop = overlay?.firstElementChild
    expect(backdrop).not.toBeNull()
    fireEvent.click(backdrop!)

    expect(mockRouter.back).toHaveBeenCalled()
  })

  it('goes to the home page when there is no history', () => {
    vi.spyOn(History.prototype, 'length', 'get').mockReturnValue(1)
    render(<MessagesPage />)

    fireEvent.click(screen.getByLabelText('Close messages'))

    expect(mockRouter.push).toHaveBeenCalledWith('/')
    expect(mockRouter.back).not.toHaveBeenCalled()
  })

  it('closes via the Escape key', () => {
    vi.spyOn(History.prototype, 'length', 'get').mockReturnValue(2)
    render(<MessagesPage />)

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(mockRouter.back).toHaveBeenCalled()
  })
})
