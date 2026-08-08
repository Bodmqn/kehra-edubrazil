import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

export const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const headers = { 'Content-Type': 'application/json' }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured: missing Supabase env vars' }) }
  }

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

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('email')
    .eq('email', user.email)
    .maybeSingle()

  if (!adminUser) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Not an admin' }) }
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const search = event.queryStringParameters?.search?.toLowerCase() ?? ''

  // Aggregated stats
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: todayCount },
    { count: weekCount },
    { count: monthCount },
    { data: authUsers, error: usersError },
  ] = await Promise.all([
    supabase.from('user_activity').select('*', { count: 'exact', head: true }).eq('active_date', today),
    supabase.from('user_activity').select('*', { count: 'exact', head: true }).gte('active_date', weekAgo.split('T')[0]),
    supabase.from('user_activity').select('*', { count: 'exact', head: true }).gte('active_date', monthAgo.split('T')[0]),
    supabase.auth.admin.listUsers(),
  ])

  if (usersError) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: usersError.message }) }
  }

  // Build activity summary per user
  const { data: activityRows } = await supabase
    .from('user_activity')
    .select('user_id, last_active_at, user_agent, active_date')
    .gte('active_date', monthAgo.split('T')[0])
    .order('last_active_at', { ascending: false })

  const activityMap = new Map<string, { last_active_at: string; user_agent: string; active_days_month: number; active_days_total: number }>()

  // Also get total active days count per user
  const { data: allActivity } = await supabase
    .from('user_activity')
    .select('user_id, active_date')

  const totalDayCount = new Map<string, Set<string>>()
  for (const row of allActivity ?? []) {
    if (!totalDayCount.has(row.user_id)) totalDayCount.set(row.user_id, new Set())
    totalDayCount.get(row.user_id)!.add(row.active_date)
  }

  const monthDayCount = new Map<string, Set<string>>()
  for (const row of activityRows ?? []) {
    if (!monthDayCount.has(row.user_id)) monthDayCount.set(row.user_id, new Set())
    monthDayCount.get(row.user_id)!.add(row.active_date)

    if (!activityMap.has(row.user_id)) {
      activityMap.set(row.user_id, {
        last_active_at: row.last_active_at,
        user_agent: row.user_agent ?? '',
        active_days_month: 0,
        active_days_total: 0,
      })
    }
  }

  for (const [uid, set] of monthDayCount) {
    const entry = activityMap.get(uid)
    if (entry) entry.active_days_month = set.size
  }
  for (const [uid, set] of totalDayCount) {
    const entry = activityMap.get(uid)
    if (entry) entry.active_days_total = set.size
  }

  const totalUsers = authUsers.users.length

  // Combine with auth users
  const usersList = authUsers.users
    .filter((u) => !search || u.email?.toLowerCase().includes(search))
    .map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      activity: activityMap.get(u.id) ?? null,
    }))
    .sort((a, b) => {
      const aTime = a.activity?.last_active_at ?? a.created_at
      const bTime = b.activity?.last_active_at ?? b.created_at
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      stats: {
        activeToday: todayCount ?? 0,
        activeThisWeek: weekCount ?? 0,
        activeThisMonth: monthCount ?? 0,
        totalUsers,
      },
      users: usersList,
    }),
  }
}
