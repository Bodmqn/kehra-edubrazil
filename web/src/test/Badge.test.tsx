import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Badge from '@/components/Badge'

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>Aberto</Badge>)
    expect(screen.getByText('Aberto')).toBeInTheDocument()
  })

  it('applies status styling for Aberto', () => {
    render(<Badge variant="status">Aberto</Badge>)
    const badge = screen.getByText('Aberto')
    expect(badge.className).toContain('green')
  })

  it('applies status styling for Fechado', () => {
    render(<Badge variant="status">Fechado</Badge>)
    const badge = screen.getByText('Fechado')
    expect(badge.className).toContain('red')
  })

  it('applies status styling for Em Breve', () => {
    render(<Badge variant="status">Em Breve</Badge>)
    const badge = screen.getByText('Em Breve')
    expect(badge.className).toContain('yellow')
  })

  it('renders region variant with custom color', () => {
    render(<Badge variant="region" color="#009739">Norte</Badge>)
    expect(screen.getByText('Norte')).toBeInTheDocument()
  })
})
