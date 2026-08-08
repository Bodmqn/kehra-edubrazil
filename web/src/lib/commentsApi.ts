import { supabase } from './supabase'
import type { ChatComment, CommentCategory } from './chatUtils'

async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('Authentication required')

  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
    Authorization: `Bearer ${token}`,
  }
  if (init.body) headers['Content-Type'] = 'application/json'

  return fetch(path, { ...init, headers })
}

export async function fetchComments(category?: CommentCategory): Promise<ChatComment[]> {
  const query = category ? `?category=${category}` : ''
  const resp = await authedFetch(`/.netlify/functions/comments-crud${query}`)
  const result = await resp.json()
  if (!resp.ok) throw new Error(result.error || 'Failed to load comments')
  return result.comments as ChatComment[]
}

export async function createComment(input: {
  category: CommentCategory
  body: string
  parent_id?: string | null
}): Promise<ChatComment> {
  const resp = await authedFetch('/.netlify/functions/comments-crud', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  const result = await resp.json()
  if (!resp.ok) throw new Error(result.error || 'Failed to post comment')
  return result.comment as ChatComment
}

export async function updateComment(id: string, body: string): Promise<ChatComment> {
  const resp = await authedFetch(`/.netlify/functions/comments-crud?id=${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ body }),
  })
  const result = await resp.json()
  if (!resp.ok) throw new Error(result.error || 'Failed to update comment')
  return result.comment as ChatComment
}

export async function deleteComment(id: string): Promise<void> {
  const resp = await authedFetch(`/.netlify/functions/comments-crud?id=${id}`, {
    method: 'DELETE',
  })
  const result = await resp.json()
  if (!resp.ok) throw new Error(result.error || 'Failed to delete comment')
}

export async function sendAdminReply(userId: string, body: string): Promise<void> {
  const resp = await authedFetch('/.netlify/functions/admin-messages', {
    method: 'POST',
    body: JSON.stringify({ userId, body }),
  })
  const result = await resp.json()
  if (!resp.ok) throw new Error(result.error || 'Failed to send reply')
}

export async function markThreadRead(userId: string): Promise<void> {
  const resp = await authedFetch(`/.netlify/functions/admin-messages?thread=${userId}`, {
    method: 'PATCH',
  })
  const result = await resp.json()
  if (!resp.ok) throw new Error(result.error || 'Failed to update thread')
}
