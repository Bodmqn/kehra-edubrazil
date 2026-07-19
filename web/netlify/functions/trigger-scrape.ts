import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

export const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const headers = { 'Content-Type': 'application/json' }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  // Verify auth token from the request
  const authHeader = event.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing authorization' }) }
  }

  const accessToken = authHeader.slice(7)
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured: missing Supabase env vars' }) }
  }

  // Verify the user is an admin
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)

  if (authError || !user?.email) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid or expired token' }) }
  }

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('email')
    .eq('email', user.email)
    .maybeSingle()

  if (!adminUser) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Not an admin' }) }
  }

  // Trigger GitHub Actions
  const githubToken = process.env.GITHUB_TOKEN
  if (!githubToken) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured: missing GITHUB_TOKEN' }) }
  }

  try {
    const response = await fetch(
      'https://api.github.com/repos/Bodmqn/kehra-edubrazil/actions/workflows/scrape.yml/dispatches',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'kehra-edubrazil-admin',
        },
        body: JSON.stringify({ ref: 'main' }),
      }
    )

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error')
      return { statusCode: 502, headers, body: JSON.stringify({ error: `GitHub API error: ${response.status} — ${errText}` }) }
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Scrape triggered successfully!' }) }
  } catch (e) {
    return { statusCode: 502, headers, body: JSON.stringify({ error: e instanceof Error ? e.message : 'Network error' }) }
  }
}
