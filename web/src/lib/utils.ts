export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u201C\u201D]/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'TBD'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const now = new Date()
  const target = new Date(dateStr)
  if (isNaN(target.getTime())) return null
  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function getDeadlineUrgency(days: number | null): { label: string; color: string } {
  if (days === null) return { label: 'No deadline', color: 'var(--text-muted)' }
  if (days < 0) return { label: 'Closed', color: 'var(--danger)' }
  if (days <= 7) return { label: `${days} day${days === 1 ? '' : 's'} left`, color: 'var(--danger)' }
  if (days <= 30) return { label: `${days} days left`, color: 'var(--warning)' }
  return { label: `${days} days left`, color: 'var(--success)' }
}
