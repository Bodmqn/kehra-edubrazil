import { describe, it, expect } from 'vitest'
import { slugify, formatDate, daysUntil, getDeadlineUrgency } from '@/lib/utils'

describe('slugify', () => {
  it('converts text to lowercase slug', () => {
    expect(slugify('Universidade de São Paulo')).toBe('universidade-de-sao-paulo')
  })

  it('removes accents', () => {
    expect(slugify('Universidade Federal do Ceará')).toBe('universidade-federal-do-ceara')
  })

  it('handles special characters', () => {
    expect(slugify('UFRJ - Universidade Federal')).toBe('ufrj-universidade-federal')
  })
})

describe('formatDate', () => {
  it('returns TBD for null', () => {
    expect(formatDate(null)).toBe('TBD')
  })

  it('formats ISO date string', () => {
    const result = formatDate('2026-08-15')
    expect(result).toContain('Aug')
    expect(result).toContain('15')
    expect(result).toContain('2026')
  })
})

describe('daysUntil', () => {
  it('returns null for null date', () => {
    expect(daysUntil(null)).toBeNull()
  })

  it('returns positive number for future date', () => {
    const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    expect(daysUntil(future)).toBe(5)
  })

  it('returns negative number for past date', () => {
    expect(daysUntil('2020-01-01')).toBeLessThan(0)
  })
})

describe('getDeadlineUrgency', () => {
  it('returns muted for null', () => {
    const r = getDeadlineUrgency(null)
    expect(r.label).toBe('No deadline')
  })

  it('returns danger for past dates', () => {
    const r = getDeadlineUrgency(-1)
    expect(r.label).toBe('Closed')
    expect(r.color).toContain('danger')
  })

  it('returns danger for <= 7 days', () => {
    const r = getDeadlineUrgency(3)
    expect(r.label).toBe('3 days left')
    expect(r.color).toContain('danger')
  })

  it('returns warning for <= 30 days', () => {
    const r = getDeadlineUrgency(14)
    expect(r.label).toBe('14 days left')
    expect(r.color).toContain('warning')
  })

  it('returns success for > 30 days', () => {
    const r = getDeadlineUrgency(60)
    expect(r.label).toBe('60 days left')
    expect(r.color).toContain('success')
  })
})
