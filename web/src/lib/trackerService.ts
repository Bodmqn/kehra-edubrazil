import { supabase } from '@/lib/supabase'
import { STORAGE_KEY } from '@/lib/trackerTypes'
import type { TrackerProgram } from '@/lib/trackerTypes'

function getFromLocal(): TrackerProgram[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored) as TrackerProgram[]
  } catch {
    return []
  }
}

function saveToLocal(programs: TrackerProgram[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(programs))
}

async function getUserId(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user?.id ?? null
  } catch {
    return null
  }
}

// ---------- Public API ----------

export async function getPrograms(): Promise<TrackerProgram[]> {
  const userId = await getUserId()
  if (!userId) return getFromLocal()

  const { data, error } = await supabase
    .from('user_tracker_programs')
    .select('program_data')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to load programs from Supabase:', error)
    return getFromLocal()
  }

  return (data ?? []).map((r) => r.program_data as TrackerProgram)
}

export async function saveProgram(program: TrackerProgram): Promise<void> {
  const userId = await getUserId()
  if (!userId) {
    const list = getFromLocal()
    const idx = list.findIndex((p) => p.id === program.id)
    if (idx >= 0) {
      list[idx] = { ...program, updatedAt: new Date().toISOString() }
    } else {
      list.unshift(program)
    }
    saveToLocal(list)
    return
  }

  const programData = { ...program, updatedAt: new Date().toISOString() }

  const { error } = await supabase
    .from('user_tracker_programs')
    .upsert(
      {
        user_id: userId,
        program_id: program.id,
        program_data: programData,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id, program_id',
        ignoreDuplicates: false,
      }
    )

  if (error) {
    console.error('Failed to save program to Supabase:', error)
    // fallback: save to localStorage
    const list = getFromLocal()
    const idx = list.findIndex((p) => p.id === program.id)
    if (idx >= 0) {
      list[idx] = programData
    } else {
      list.unshift(program)
    }
    saveToLocal(list)
  }
}

export async function deleteProgram(programId: string): Promise<void> {
  const userId = await getUserId()
  if (!userId) {
    saveToLocal(getFromLocal().filter((p) => p.id !== programId))
    return
  }

  const { error } = await supabase
    .from('user_tracker_programs')
    .delete()
    .eq('user_id', userId)
    .filter('program_data->>id', 'eq', programId)

  if (error) {
    console.error('Failed to delete program from Supabase:', error)
    saveToLocal(getFromLocal().filter((p) => p.id !== programId))
  }
}

export async function getSavedInfo(): Promise<{ savedIds: Set<string>; savedReminderIds: Set<string> }> {
  const userId = await getUserId()
  if (!userId) {
    const list = getFromLocal()
    return {
      savedIds: new Set(list.map((p) => p.id)),
      savedReminderIds: new Set(list.filter((p) => p.reminderDays.length > 0).map((p) => p.id)),
    }
  }

  const { data, error } = await supabase
    .from('user_tracker_programs')
    .select('program_data')
    .eq('user_id', userId)

  if (error) {
    console.error('Failed to load saved info from Supabase:', error)
    const list = getFromLocal()
    return {
      savedIds: new Set(list.map((p) => p.id)),
      savedReminderIds: new Set(list.filter((p) => p.reminderDays.length > 0).map((p) => p.id)),
    }
  }

  const programs = (data ?? []).map((r) => r.program_data as TrackerProgram)
  return {
    savedIds: new Set(programs.map((p) => p.id)),
    savedReminderIds: new Set(programs.filter((p) => p.reminderDays.length > 0).map((p) => p.id)),
  }
}

export async function migrateLocalToSupabase(): Promise<void> {
  const userId = await getUserId()
  if (!userId) return

  const localPrograms = getFromLocal()
  if (localPrograms.length === 0) return

  const rows = localPrograms.map((p) => ({
    user_id: userId,
    program_id: p.id,
    program_data: p,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase.from('user_tracker_programs').upsert(rows, {
    onConflict: 'user_id, program_id',
    ignoreDuplicates: false,
  })

  if (error) {
    console.error('Failed to migrate programs to Supabase:', error)
    return
  }

  localStorage.removeItem(STORAGE_KEY)
}
