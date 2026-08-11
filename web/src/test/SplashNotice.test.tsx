import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    }),
  },
}))

import SplashNotice, { SPLASH_KEY } from '@/components/SplashNotice'

beforeEach(() => {
  localStorage.clear()
  document.body.style.overflow = ''
})

describe('SplashNotice', () => {
  it('renders the notice with Continue and a close button', async () => {
    render(<SplashNotice />)

    expect(await screen.findByText('General Notice')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
    expect(screen.getByLabelText('Close notice')).toBeInTheDocument()
  })

  it('closes via the X button and remembers the dismissal', async () => {
    render(<SplashNotice />)
    await screen.findByText('General Notice')

    fireEvent.click(screen.getByLabelText('Close notice'))

    expect(screen.queryByText('General Notice')).not.toBeInTheDocument()
    expect(localStorage.getItem(SPLASH_KEY)).not.toBeNull()
    expect(document.body.style.overflow).toBe('')
  })

  it('closes via the Escape key', async () => {
    render(<SplashNotice />)
    await screen.findByText('General Notice')

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(screen.queryByText('General Notice')).not.toBeInTheDocument()
    expect(localStorage.getItem(SPLASH_KEY)).not.toBeNull()
  })

  it('does not show again within the dismiss window', async () => {
    localStorage.setItem(SPLASH_KEY, Date.now().toString())

    render(<SplashNotice />)

    expect(screen.queryByText('General Notice')).not.toBeInTheDocument()
  })
})
