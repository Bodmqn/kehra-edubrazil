import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

export const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const headers = { 'Content-Type': 'application/json' }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  let body: { token?: string }
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) }
  }

  const token = body.token || event.queryStringParameters?.token
  if (!token) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing token' }) }
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured: missing Supabase env vars' }) }
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { error } = await supabase
    .from('email_subscriptions')
    .delete()
    .eq('token', token)

  if (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to unsubscribe' }) }
  }

  return { statusCode: 200, headers, body: JSON.stringify({ success: true }) }
}
