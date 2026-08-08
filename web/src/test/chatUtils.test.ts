import { describe, it, expect } from 'vitest'
import {
  buildThreads,
  topLevelComments,
  countByCategory,
  formatRelativeTime,
  maskEmail,
  type ChatComment,
} from '@/lib/chatUtils'

const base: Omit<ChatComment, 'id' | 'body'> = {
  user_id: 'u1',
  category: 'general',
  parent_id: null,
  created_at: '2026-08-01T10:00:00Z',
  updated_at: '2026-08-01T10:00:00Z',
  user_email: 'a@test.com',
}

function comment(overrides: Partial<ChatComment>): ChatComment {
  return { ...base, id: Math.random().toString(36).slice(2), body: 'hello', ...overrides }
}

describe('topLevelComments', () => {
  it('nests replies under their parent', () => {
    const root = comment({ id: 'root' })
    const reply = comment({ id: 'reply', parent_id: 'root' })
    const nested = comment({ id: 'nested', parent_id: 'reply' })

    const threads = topLevelComments([root, reply, nested])
    expect(threads).toHaveLength(1)
    expect(threads[0].id).toBe('root')
    expect(threads[0].replies[0].id).toBe('reply')
    expect(threads[0].replies[0].replies[0].id).toBe('nested')
  })

  it('keeps orphans out of top level if parent is missing', () => {
    const orphan = comment({ id: 'orphan', parent_id: 'missing' })
    expect(topLevelComments([orphan])).toHaveLength(0)
  })

  it('returns empty array for no comments', () => {
    expect(topLevelComments([])).toHaveLength(0)
  })
})

describe('buildThreads', () => {
  it('sorts replies chronologically', () => {
    const root = comment({ id: 'root' })
    const later = comment({ id: 'later', parent_id: 'root', created_at: '2026-07-02T10:00:00Z' })
    const earlier = comment({ id: 'earlier', parent_id: 'root', created_at: '2026-07-01T10:00:00Z' })

    const threads = buildThreads([root, later, earlier])
    expect(threads[0].replies.map((r) => r.id)).toEqual(['earlier', 'later'])
  })
})

describe('countByCategory', () => {
  it('counts each category', () => {
    const comments = [
      comment({ category: 'general' }),
      comment({ category: 'general' }),
      comment({ category: 'advisory' }),
    ]
    expect(countByCategory(comments)).toEqual({ general: 2, advisory: 1 })
  })

  it('returns zeros for empty input', () => {
    expect(countByCategory([])).toEqual({ general: 0, advisory: 0 })
  })
})

describe('formatRelativeTime', () => {
  it('returns just now for recent timestamps', () => {
    expect(formatRelativeTime(new Date().toISOString())).toBe('just now')
  })

  it('returns minutes for < 1 hour', () => {
    const past = new Date(Date.now() - 5 * 60000).toISOString()
    expect(formatRelativeTime(past)).toBe('5m ago')
  })

  it('returns hours for < 24h', () => {
    const past = new Date(Date.now() - 3 * 3600000).toISOString()
    expect(formatRelativeTime(past)).toBe('3h ago')
  })

  it('returns days for < 7 days', () => {
    const past = new Date(Date.now() - 2 * 24 * 3600000).toISOString()
    expect(formatRelativeTime(past)).toBe('2d ago')
  })

  it('returns empty string for invalid dates', () => {
    expect(formatRelativeTime('not-a-date')).toBe('')
  })
})

describe('maskEmail', () => {
  it('masks everything before the domain', () => {
    expect(maskEmail('johnsmith@example.com')).toBe('jo…@example.com')
  })

  it('passes through emails without a domain', () => {
    expect(maskEmail('nope')).toBe('nope')
  })
})