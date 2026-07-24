import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

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

function daysBetweenUTCDates(dateStr: string): number {
  const deadlineUTC = new Date(dateStr)
  const now = new Date()
  const nowUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  const diff = deadlineUTC.getTime() - nowUTC.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const headers = { 'Content-Type': 'application/json' }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
  const cronSecret = process.env.CRON_SECRET
  const gmailUser = process.env.GMAIL_USER
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD

  if (!supabaseUrl || !supabaseServiceKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured: missing Supabase env vars' }) }
  }

  if (!gmailUser || !gmailAppPassword) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured: missing GMAIL_USER or GMAIL_APP_PASSWORD' }) }
  }

  if (!cronSecret) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured: missing CRON_SECRET' }) }
  }

  // ── Auth: CRON_SECRET header (GitHub Actions) or admin Bearer token ──
  const cronHeader = event.headers['x-cron-secret']
  const isCron = cronHeader === cronSecret

  let isAdmin = false
  const authHeader = event.headers.authorization
  if (authHeader?.startsWith('Bearer ') && !isCron) {
    const accessToken = authHeader.slice(7)
    const authClient = createClient(supabaseUrl, supabaseServiceKey)
    const { data: { user } } = await authClient.auth.getUser(accessToken)
    if (user?.email) {
      const { data: adminUser } = await authClient
        .from('admin_users')
        .select('email')
        .eq('email', user.email)
        .maybeSingle()
      if (adminUser) isAdmin = true
    }
  }

  if (!isCron && !isAdmin) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Not authorized' }) }
  }

  // ── Setup ──
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  })

  let targetedSent = 0
  const errors: string[] = []

  // ── Targeted — per-user reminders from user_reminders ──
  const { data: allReminders } = await supabase
    .from('user_reminders')
    .select('*')

  const dueReminders: UserReminder[] = (allReminders as UserReminder[] || []).filter((r) => {
    if (!r.deadline || !r.reminder_days || r.reminder_days.length === 0) return false
    const diff = daysBetweenUTCDates(r.deadline)
    return r.reminder_days.includes(diff)
  })

  const userReminderMap = new Map<string, UserReminder[]>()
  for (const r of dueReminders) {
    const list = userReminderMap.get(r.subscription_token) || []
    list.push(r)
    userReminderMap.set(r.subscription_token, list)
  }

  const { data: subscribers } = await supabase
    .from('email_subscriptions')
    .select('email, token')

  if (!subscribers || subscribers.length === 0) {
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, sent: 0, reason: 'No subscribers' }) }
  }

  const subscriberMap = new Map(subscribers.map(s => [s.token, s.email]))
  const siteUrl = process.env.URL || process.env.DEPLOY_URL || 'https://edubrazil-kehra.netlify.app'

  async function sendMail(to: string, subject: string, text: string): Promise<boolean> {
    try {
      await transporter.sendMail({
        from: `"EduBrazil Hub + The Kehra" <${gmailUser}>`,
        to,
        subject,
        text,
      })
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      errors.push(`Failed to send to ${to}: ${msg}`)
      console.error('[send-reminders] Error sending to', to, ':', msg)
      return false
    }
  }

  // ── Send targeted ──
  for (const [token, reminders] of userReminderMap) {
    const email = subscriberMap.get(token)
    if (!email) continue

    const lines = reminders.map(r => {
      if (!r.deadline) return `  \u2022 ${r.program_name} at ${r.university}`
      const daysLeft = daysBetweenUTCDates(r.deadline)
      const label = daysLeft <= 0
        ? 'Deadline is today!'
        : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} away`
      return `  \u2022 ${r.program_name} at ${r.university}\n    Deadline: ${r.deadline} (${label})`
    })

    const body = `Hi there,

Here are your personal program reminders from My Tracker:

${lines.join('\n')}

Log in to your tracker to view details and manage your applications.

To unsubscribe, click: ${siteUrl}/unsubscribe?token=${token}

— EduBrazil Hub + The Kehra`

    const ok = await sendMail(
      email,
      `\uD83D\uDD14 ${reminders.length} program reminder${reminders.length !== 1 ? 's' : ''} from your tracker`,
      body
    )

    if (ok) {
      targetedSent++
      const ids = reminders.map(r => r.id)
      await supabase
        .from('user_reminders')
        .update({ last_notified_at: new Date().toISOString() })
        .in('id', ids)
    }
  }

  // ── Log ──
  await supabase.from('reminder_logs').insert({
    programs_count: dueReminders.length,
    recipients_count: targetedSent,
    sent_at: new Date().toISOString(),
  }).maybeSingle()

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      targeted_sent: targetedSent,
      user_reminders: dueReminders.length,
      ...(errors.length > 0 && { errors }),
    }),
  }
}
