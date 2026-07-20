import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

interface University {
  id: string
  name: string
  acronym: string
}

export const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const headers = { 'Content-Type': 'application/json' }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
  const resendApiKey = process.env.RESEND_API_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured: missing Supabase env vars' }) }
  }

  if (!resendApiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured: missing RESEND_API_KEY' }) }
  }

  // Verify admin if auth header is present (optional — allows manual trigger from admin panel)
  const authHeader = event.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    const accessToken = authHeader.slice(7)
    const authClient = createClient(supabaseUrl, supabaseServiceKey)
    const { data: { user }, error: authError } = await authClient.auth.getUser(accessToken)
    if (!authError && user?.email) {
      const { data: adminUser } = await authClient
        .from('admin_users')
        .select('email')
        .eq('email', user.email)
        .maybeSingle()
      if (!adminUser) {
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'Not an admin' }) }
      }
    }
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Get programs with deadlines in the next 7 days
  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const todayStr = now.toISOString().split('T')[0]
  const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0]

  const { data: programs, error: programsError } = await supabase
    .from('programs')
    .select('name, level, deadline, university_id')
    .gte('deadline', todayStr)
    .lte('deadline', sevenDaysStr)
    .neq('status', 'Fechado')

  if (programsError) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to query programs' }) }
  }

  if (!programs || programs.length === 0) {
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, sent: 0, reason: 'No approaching deadlines' }) }
  }

  // Get university names
  const universityIds = [...new Set(programs.map(p => p.university_id))]
  const { data: universities } = await supabase
    .from('universities')
    .select('id, name, acronym')
    .in('id', universityIds)

  const uniMap = new Map<string, string>()
  if (universities) {
    for (const u of universities as University[]) {
      uniMap.set(u.id, `${u.name} (${u.acronym})`)
    }
  }

  // Build email body
  const lines = programs.map(p => {
    const uniName = uniMap.get(p.university_id) || 'Unknown university'
    const daysLeft = Math.ceil((new Date(p.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return `  • ${p.name} (${p.level}) at ${uniName}\n    Deadline: ${p.deadline} (${daysLeft} day${daysLeft !== 1 ? 's' : ''} away)`
  })

  const emailBody = `Hi there,

Here are the upcoming graduate program deadlines at Brazilian universities:

${lines.join('\n')}

Start preparing your application today!

— Kehra • EduBrazil Hub`

  // Get all subscribers
  const { data: subscribers } = await supabase
    .from('email_subscriptions')
    .select('email, token')

  if (!subscribers || subscribers.length === 0) {
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, sent: 0, reason: 'No subscribers' }) }
  }

  const subscriberEmails = subscribers.map(s => s.email)

  // Send via Resend
  const resendResp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Kehra EduBrazil <onboarding@resend.dev>',
      to: subscriberEmails,
      subject: `📢 ${programs.length} graduate program deadline${programs.length !== 1 ? 's' : ''} approaching this week`,
      text: emailBody,
    }),
  })

  if (!resendResp.ok) {
    const errText = await resendResp.text().catch(() => 'Unknown error')
    return { statusCode: 502, headers, body: JSON.stringify({ error: `Resend API error: ${resendResp.status} — ${errText}` }) }
  }

  // Log the send
  await supabase.from('reminder_logs').insert({
    programs_count: programs.length,
    recipients_count: subscriberEmails.length,
    sent_at: new Date().toISOString(),
  }).maybeSingle()

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, sent: subscriberEmails.length, programs: programs.length }),
  }
}
