import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

export const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const headers = { 'Content-Type': 'application/json' }

  if (event.httpMethod !== 'POST' && event.httpMethod !== 'DELETE') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  let body: Record<string, unknown>
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) }
  }

  const token = body.token as string | undefined
  if (!token) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing token' }) }
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) }
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Verify subscription exists
  const { data: sub } = await supabase
    .from('email_subscriptions')
    .select('token')
    .eq('token', token)
    .maybeSingle()

  if (!sub) {
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Subscription not found' }) }
  }

  if (event.httpMethod === 'DELETE') {
    const programId = body.programId as string | undefined
    if (!programId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing programId' }) }
    }

    const { error } = await supabase
      .from('user_reminders')
      .delete()
      .eq('subscription_token', token)
      .eq('program_id', programId)

    if (error) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to delete reminder' }) }
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) }
  }

  // POST: upsert reminder
  const programId = body.programId as string | undefined
  const programName = body.programName as string | undefined
  const university = body.university as string | undefined
  const deadline = (body.deadline as string) || null
  const reminderDays = body.reminderDays as number[] | undefined

  if (!programId || !programName) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) }
  }

  const { error } = await supabase.from('user_reminders').upsert(
    {
      subscription_token: token,
      program_id: programId,
      program_name: programName,
      university: university || '',
      deadline: deadline ? deadline.split('T')[0] : null,
      reminder_days: reminderDays || [],
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'subscription_token, program_id',
      ignoreDuplicates: false,
    }
  )

  if (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to save reminder' }) }
  }

  return { statusCode: 200, headers, body: JSON.stringify({ success: true }) }
}
