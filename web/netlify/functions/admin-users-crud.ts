import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

export const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const headers = { 'Content-Type': 'application/json' }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured: missing Supabase env vars' }) }
  }

  // Verify auth token
  const authHeader = event.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing authorization' }) }
  }

  const accessToken = authHeader.slice(7)
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
  if (authError || !user?.email) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid or expired token' }) }
  }

  // Check admin status
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('email')
    .eq('email', user.email)
    .maybeSingle()

  if (!adminUser) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Not an admin' }) }
  }

  if (event.httpMethod === 'GET') {
    const { data, error } = await supabase.auth.admin.listUsers()
    if (error) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) }
    }
    return { statusCode: 200, headers, body: JSON.stringify({ users: data.users }) }
  }

  if (event.httpMethod === 'DELETE') {
    const userId = event.queryStringParameters?.id
    if (!userId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing user id' }) }
    }

    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) }
    }
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) }
  }

  if (event.httpMethod === 'PATCH') {
    const userId = event.queryStringParameters?.id
    if (!userId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing user id' }) }
    }

    let body: { password?: string }
    try {
      body = JSON.parse(event.body ?? '{}')
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) }
    }

    if (!body.password || body.password.length < 6) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Password must be at least 6 characters' }) }
    }

    const { error } = await supabase.auth.admin.updateUserById(userId, { password: body.password })
    if (error) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) }
    }
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
}
