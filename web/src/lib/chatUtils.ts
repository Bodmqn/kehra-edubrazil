export type CommentCategory = 'general' | 'advisory'

export interface ChatComment {
  id: string
  user_id: string
  category: CommentCategory
  body: string
  parent_id: string | null
  created_at: string
  updated_at: string
  user_email?: string | null
}

export interface ThreadedComment extends ChatComment {
  replies: ThreadedComment[]
}

export function buildThreads(comments: ChatComment[], parentId: string | null = null): ThreadedComment[] {
  const children = comments
    .filter((c) => c.parent_id === parentId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))

  return children.map((c) => ({
    ...c,
    replies: buildThreads(comments, c.id),
  }))
}

export function topLevelComments(comments: ChatComment[]): ThreadedComment[] {
  return buildThreads(comments, null)
}

export function countByCategory(comments: ChatComment[]): Record<CommentCategory, number> {
  return comments.reduce(
    (acc, c) => {
      if (c.category === 'general' || c.category === 'advisory') acc[c.category] += 1
      return acc
    },
    { general: 0, advisory: 0 }
  )
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return ''

  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`

  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function maskEmail(email: string): string {
  const [name, domain] = email.split('@')
  if (!domain) return email
  const visible = name.length > 2 ? name.slice(0, 2) : name.slice(0, 1)
  return `${visible}…@${domain}`
}
