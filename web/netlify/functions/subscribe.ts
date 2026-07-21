import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

export const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const headers = { 'Content-Type': 'application/json' }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  let body: { email?: string }
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) }
  }

  const email = (body.email || '').trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid email address' }) }
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) }
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Check if already subscribed
  const { data: existing } = await supabase
    .from('email_subscriptions')
    .select('token, email')
    .eq('email', email)
    .maybeSingle()

  if (existing) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ token: existing.token, email: existing.email, existing: true }),
    }
  }

  // Insert new subscription
  const { data, error } = await supabase
    .from('email_subscriptions')
    .insert({ email })
    .select('token, email')
    .single()

  if (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to subscribe' }) }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ token: data.token, email: data.email, existing: false }),
  }
}
