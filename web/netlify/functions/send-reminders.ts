import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

interface University {
  id: string
  name: string
  acronym: string
}

interface UserReminder {
  id: string
  subscription_token: string
  program_id: string
  program_name: string
  university: string
  deadline: string | null
  reminder_days: number[]
  last_notified_at: string | null
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

  // Verify admin if auth header is present
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
  const today = new Date().toISOString().split('T')[0]
  let totalSent = 0
  let targetedSent = 0

  // ── Part 1: Broadcast — upcoming deadlines from the programs table ──
  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0]

  const { data: programs } = await supabase
    .from('programs')
    .select('name, level, deadline, university_id')
    .gte('deadline', today)
    .lte('deadline', sevenDaysStr)
    .neq('status', 'Fechado')

  let broadcastLines: string[] = []
  if (programs && programs.length > 0) {
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

    broadcastLines = programs.map(p => {
      const uniName = uniMap.get(p.university_id) || 'Unknown university'
      const daysLeft = Math.ceil((new Date(p.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return `  • ${p.name} (${p.level}) at ${uniName}\n    Deadline: ${p.deadline} (${daysLeft} day${daysLeft !== 1 ? 's' : ''} away)`
    })
  }

  // ── Part 2: Targeted — per-user reminders from user_reminders ──
  const { data: allReminders } = await supabase
    .from('user_reminders')
    .select('*')

  const dueReminders: UserReminder[] = (allReminders as UserReminder[] || []).filter((r) => {
    if (!r.deadline || !r.reminder_days || r.reminder_days.length === 0) return false
    const deadlineDate = new Date(r.deadline)
    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)
    const diff = Math.ceil((deadlineDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24))
    return r.reminder_days.includes(diff)
  })

  // Group targeted reminders by subscription token
  const userReminderMap = new Map<string, UserReminder[]>()
  for (const r of dueReminders) {
    const list = userReminderMap.get(r.subscription_token) || []
    list.push(r)
    userReminderMap.set(r.subscription_token, list)
  }

  // Get all subscribers
  const { data: subscribers } = await supabase
    .from('email_subscriptions')
    .select('email, token')

  if (!subscribers || subscribers.length === 0) {
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, sent: 0, reason: 'No subscribers' }) }
  }

  // ── Send emails ──
  const subscriberMap = new Map(subscribers.map(s => [s.token, s.email]))

  // Collect all emails to send (deduplicated)
  const allEmails = new Set<string>()
  for (const s of subscribers) allEmails.add(s.email)

  if (broadcastLines.length > 0) {
    const broadcastBody = `Hi there,

Here are the upcoming graduate program deadlines at Brazilian universities:

${broadcastLines.join('\n')}

Start preparing your application today!

— Kehra • EduBrazil Hub`

    const resendResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Kehra EduBrazil <onboarding@resend.dev>',
        to: [...allEmails],
        subject: `📢 ${broadcastLines.length} graduate program deadline${broadcastLines.length !== 1 ? 's' : ''} approaching this week`,
        text: broadcastBody,
      }),
    })

    if (resendResp.ok) {
      totalSent += allEmails.size
    }
  }

  // Send targeted per-user reminders
  for (const [token, reminders] of userReminderMap) {
    const email = subscriberMap.get(token)
    if (!email) continue

    const lines = reminders.map(r => {
      if (!r.deadline) return `  • ${r.program_name} at ${r.university}`
      const daysLeft = Math.ceil((new Date(r.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      const label = daysLeft <= 0
        ? 'Deadline is today!'
        : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} away`
      return `  • ${r.program_name} at ${r.university}\n    Deadline: ${r.deadline} (${label})`
    })

    const body = `Hi there,

Here are your personal program reminders from My Tracker:

${lines.join('\n')}

Log in to your tracker to view details and manage your applications.

— Kehra • EduBrazil Hub`

    const resendResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Kehra EduBrazil <onboarding@resend.dev>',
        to: [email],
        subject: `🔔 ${reminders.length} program reminder${reminders.length !== 1 ? 's' : ''} from your tracker`,
        text: body,
      }),
    })

    if (resendResp.ok) {
      targetedSent += 1

      // Update last_notified_at for these reminders
      const ids = reminders.map(r => r.id)
      await supabase
        .from('user_reminders')
        .update({ last_notified_at: new Date().toISOString() })
        .in('id', ids)
    }
  }

  // Log the send
  await supabase.from('reminder_logs').insert({
    programs_count: (programs?.length || 0) + dueReminders.length,
    recipients_count: totalSent + targetedSent,
    sent_at: new Date().toISOString(),
  }).maybeSingle()

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      broadcast_sent: totalSent,
      targeted_sent: targetedSent,
      programs: programs?.length || 0,
      user_reminders: dueReminders.length,
    }),
  }
}
