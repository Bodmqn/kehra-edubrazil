import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const MAX_BODY = 4000

async function requireAdmin(event: HandlerEvent, supabase: SupabaseClient): Promise<boolean> {
  const authHeader = event.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return false

  const accessToken = authHeader.slice(7)
  const { data: { user }, error } = await supabase.auth.getUser(accessToken)
  if (error || !user?.email) return false

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('email')
    .eq('email', user.email)
    .maybeSingle()

  return !!adminUser
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

  if (!(await requireAdmin(event, supabase))) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Not an admin' }) }
  }

  const q = event.queryStringParameters ?? {}
  const { httpMethod } = event

  if (httpMethod === 'GET' && !q.thread) {
    // Inbox overview: one row per user thread
    const { data, error } = await supabase
      .from('direct_messages')
      .select('id, user_id, body, is_admin_reply, read_at, created_at')
      .order('created_at', { ascending: true })
      .limit(20000)

    if (error) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) }
    }

    const byUser = new Map<string, { messages: typeof data; unread: number }>()
    for (const m of data ?? []) {
      const entry = byUser.get(m.user_id) ?? { messages: [], unread: 0 }
      entry.messages.push(m)
      if (m.is_admin_reply && !m.read_at) entry.unread += 1
      byUser.set(m.user_id, entry)
    }

    const userIds = [...byUser.keys()]
    const emails: Record<string, string> = {}
    if (userIds.length > 0) {
      const { data: users } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
      for (const u of users.users ?? []) {
        if (userIds.includes(u.id)) emails[u.id] = u.email ?? 'user'
      }
    }

    const threads = [...byUser.entries()]
      .map(([userId, entry]) => {
        const last = entry.messages[entry.messages.length - 1]
        return {
          user_id: userId,
          user_email: emails[userId] ?? 'user',
          unread: entry.unread,
          messages_count: entry.messages.length,
          last_message: last?.body ?? '',
          last_from_admin: last?.is_admin_reply ?? false,
          last_at: last?.created_at ?? null,
        }
      })
      .sort((a, b) => (b.last_at ?? '').localeCompare(a.last_at ?? ''))

    return { statusCode: 200, headers, body: JSON.stringify({ threads }) }
  }

  if (httpMethod === 'GET' && q.thread) {
    const { data, error } = await supabase
      .from('direct_messages')
      .select('id, user_id, sender_id, body, is_admin_reply, read_at, created_at')
      .eq('user_id', q.thread)
      .order('created_at', { ascending: true })

    if (error) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) }
    }

    const { data: user } = await supabase.auth.admin.getUserById(q.thread)
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ messages: data ?? [], user_email: user?.user?.email ?? null }),
    }
  }

  if (httpMethod === 'POST') {
    // Admin reply to a user's thread
    let payload: { userId?: string; body?: string }
    try {
      payload = JSON.parse(event.body ?? '{}')
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) }
    }

    if (!payload.userId || typeof payload.body !== 'string' || payload.body.trim().length === 0 || payload.body.length > MAX_BODY) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: `Reply must be between 1 and ${MAX_BODY} characters` }) }
    }

    const { error } = await supabase.from('direct_messages').insert({
      user_id: payload.userId,
      sender_id: null,
      body: payload.body.trim(),
      is_admin_reply: true,
    })

    if (error) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) }
    }
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) }
  }

  if (httpMethod === 'PATCH') {
    // Mark all admin replies in a thread as read
    if (!q.thread) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing thread user id' }) }
    }
    const { error } = await supabase
      .from('direct_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', q.thread)
      .eq('is_admin_reply', true)
      .is('read_at', null)

    if (error) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) }
    }
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) }
  }

  if (httpMethod === 'DELETE') {
    if (!q.thread) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing thread user id' }) }
    }
    const { error } = await supabase.from('direct_messages').delete().eq('user_id', q.thread)
    if (error) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) }
    }
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
}