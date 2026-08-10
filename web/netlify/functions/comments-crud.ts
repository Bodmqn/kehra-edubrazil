import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

interface AuthedUser {
  id: string
  isAdmin: boolean
}

async function getAuthedUser(event: HandlerEvent, supabase: SupabaseClient): Promise<AuthedUser | null> {
  const authHeader = event.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return null

  const accessToken = authHeader.slice(7)
  const { data: { user }, error } = await supabase.auth.getUser(accessToken)
  if (error || !user?.email) return null

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('email')
    .eq('email', user.email)
    .maybeSingle()

  return { id: user.id, isAdmin: !!adminUser }
}

const MAX_BODY = 2000

interface CommentBody {
  category?: 'general' | 'advisory'
  body?: string
  parent_id?: string | null
}

function parseBody(raw: string | null): CommentBody | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as CommentBody
  } catch {
    return null
  }
}

async function resolveUserEmails(ids: string[], supabase: SupabaseClient): Promise<Record<string, string>> {
  const emails: Record<string, string> = {}
  const missing = new Set(ids)
  for (let page = 1; page <= 10 && missing.size > 0; page++) {
    const { data } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    const rows = data.users ?? []
    for (const u of rows) {
      if (missing.has(u.id)) {
        emails[u.id] = u.email ?? 'user'
        missing.delete(u.id)
      }
    }
    if (rows.length < 1000) break
  }
  return emails
}

export const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const headers = { 'Content-Type': 'application/json' }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured: missing Supabase env vars' }) }
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const user = await getAuthedUser(event, supabase)
  if (!user) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Authentication required' }) }
  }

  const { httpMethod } = event

  if (httpMethod === 'GET') {
    const q = event.queryStringParameters ?? {}

    if (q.action === 'unread-count') {
      const { data: readRow } = await supabase
        .from('user_comment_reads')
        .select('last_read_at')
        .eq('user_id', user.id)
        .maybeSingle()

      // No marker yet: count every comment since the beginning of time
      const since = readRow?.last_read_at ?? '1970-01-01T00:00:00.000Z'

      const { count, error } = await supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .neq('user_id', user.id)
        .gt('created_at', since)

      if (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) }
      }
      return { statusCode: 200, headers, body: JSON.stringify({ count: count ?? 0, lastReadAt: since }) }
    }

    let query = supabase
      .from('comments')
      .select('id, user_id, category, body, parent_id, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (q.category === 'general' || q.category === 'advisory') {
      query = query.eq('category', q.category)
    }

    const { data, error } = await query.limit(2000)
    if (error) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) }
    }

    const senderIds = [...new Set<string>((data ?? []).map((c) => c.user_id))]
    const emails = await resolveUserEmails(senderIds, supabase)

    const comments = (data ?? []).map((c) => ({
      ...c,
      user_email: emails[c.user_id] ?? 'user',
    }))
    return { statusCode: 200, headers, body: JSON.stringify({ comments }) }
  }

  if (httpMethod === 'POST') {
    const q = event.queryStringParameters ?? {}

    if (q.action === 'mark-read') {
      const now = new Date().toISOString()
      const { error } = await supabase
        .from('user_comment_reads')
        .upsert(
          { user_id: user.id, last_read_at: now, updated_at: now },
          { onConflict: 'user_id', ignoreDuplicates: false }
        )
      if (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) }
      }
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, lastReadAt: now }) }
    }

    const body = parseBody(event.body ?? '')
    if (!body || typeof body.body !== 'string') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing comment body' }) }
    }
    if (body.body.trim().length === 0 || body.body.length > MAX_BODY) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: `Comment must be between 1 and ${MAX_BODY} characters` }) }
    }
    if (body.category !== 'general' && body.category !== 'advisory') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid category' }) }
    }
    if (body.parent_id != null && typeof body.parent_id !== 'string') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid parent comment' }) }
    }

    // Replies always inherit the parent's category so threads never split across tabs
    let category = body.category
    if (body.parent_id != null) {
      const { data: parent, error: parentError } = await supabase
        .from('comments')
        .select('id, category')
        .eq('id', body.parent_id)
        .maybeSingle()

      if (parentError) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: parentError.message }) }
      }
      if (!parent) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Parent comment not found' }) }
      }
      category = parent.category
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        category,
        body: body.body.trim(),
        parent_id: body.parent_id ?? null,
      })
      .select('id, user_id, category, body, parent_id, created_at, updated_at')
      .single()

    if (error) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) }
    }
    return { statusCode: 200, headers, body: JSON.stringify({ comment: { ...data, user_email: null } }) }
  }

  if (httpMethod === 'PATCH') {
    const commentId = event.queryStringParameters?.id
    if (!commentId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing comment id' }) }
    }
    const body = parseBody(event.body ?? '')
    if (!body || typeof body.body !== 'string' || body.body.trim().length === 0 || body.body.length > MAX_BODY) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: `Comment must be between 1 and ${MAX_BODY} characters` }) }
    }

    const { data: existing, error: fetchError } = await supabase
      .from('comments')
      .select('id, user_id')
      .eq('id', commentId)
      .maybeSingle()

    if (fetchError) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: fetchError.message }) }
    }
    if (!existing) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Comment not found' }) }
    }
    if (existing.user_id !== user.id && !user.isAdmin) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'You can only edit your own comments' }) }
    }

    const { data, error } = await supabase
      .from('comments')
      .update({ body: body.body.trim(), updated_at: new Date().toISOString() })
      .eq('id', commentId)
      .select('id, user_id, category, body, parent_id, created_at, updated_at')
      .single()

    if (error) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) }
    }
    return { statusCode: 200, headers, body: JSON.stringify({ comment: data }) }
  }

  if (httpMethod === 'DELETE') {
    const commentId = event.queryStringParameters?.id
    if (!commentId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing comment id' }) }
    }

    const { data: existing, error: fetchError } = await supabase
      .from('comments')
      .select('id, user_id')
      .eq('id', commentId)
      .maybeSingle()

    if (fetchError) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: fetchError.message }) }
    }
    if (!existing) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Comment not found' }) }
    }
    if (existing.user_id !== user.id && !user.isAdmin) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'You can only delete your own comments' }) }
    }

    const { error } = await supabase.from('comments').delete().eq('id', commentId)
    if (error) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) }
    }
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
}