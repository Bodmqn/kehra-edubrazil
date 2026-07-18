'use client'

import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { universities as fallbackUniversities } from './data'
import type { University, Program, ProgramWithUniversity, UniversityDetail } from './types'

export function useUniversities() {
  const [data, setData] = useState<University[]>(fallbackUniversities)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: supabaseData, error: supabaseError } = await supabase
          .from('universities')
          .select('*')
          .order('sno', { ascending: true })

        if (supabaseError) throw supabaseError

        const mapped = supabaseData.map((u: Record<string, unknown>) => ({
          id: u.id as string,
          sno: u.sno as number,
          name: u.name as string,
          acronym: u.acronym as string,
          region: u.region as University['region'],
          state: u.state as string,
          type: u.type as University['type'],
          sigaa_url: u.sigaa_url as string | null,
          school_url: u.school_url as string | null,
          lat: u.lat as number | null,
          lng: u.lng as number | null,
          logo_url: u.logo_url as string | null,
        }))

        if (mapped.length > 0) {
          setData(mapped)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to fetch universities')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { universities: data, loading, error }
}

export function usePrograms(universityId: string | null) {
  const [data, setData] = useState<Program[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!universityId) return

    async function fetchData() {
      setLoading(true)
      try {
        const { data: programs, error } = await supabase
          .from('programs')
          .select('*')
          .eq('university_id', universityId)
          .order('deadline', { ascending: true })

        if (error) throw error

        setData(programs as Program[])
      } catch (e) {
        console.error('Failed to fetch programs:', e)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [universityId])

  return { programs: data, loading }
}

export function useProgramCounts() {
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    async function fetchCounts() {
      try {
        const { data, error } = await supabase
          .from('programs')
          .select('university_id')

        if (error) throw error

        const map: Record<string, number> = {}
        for (const row of data as { university_id: string }[]) {
          map[row.university_id] = (map[row.university_id] || 0) + 1
        }
        setCounts(map)
      } catch {
        setCounts({})
      }
    }
    fetchCounts()
  }, [])

  return counts
}

export function useAllPrograms() {
  const [data, setData] = useState<ProgramWithUniversity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: programs, error } = await supabase
          .from('programs')
          .select('*, universities(name, acronym, region, type)')
          .order('deadline', { ascending: true, nullsFirst: false })

        if (error) throw error

        const mapped = (programs as Record<string, unknown>[]).map((p) => {
          const uni = p.universities as Record<string, unknown> | null
          return {
            id: p.id as string,
            university_id: p.university_id as string,
            name: p.name as string,
            level: p.level as Program['level'],
            field: p.field as string | null,
            deadline: p.deadline as string | null,
            status: p.status as Program['status'],
            edital_url: p.edital_url as string | null,
            scraped_at: p.scraped_at as string | null,
            university_name: (uni?.name as string) ?? '',
            university_acronym: (uni?.acronym as string) ?? '',
            university_region: (uni?.region as string) ?? '',
            university_type: (uni?.type as string) ?? '',
          }
        })

        setData(mapped)
      } catch {
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { programs: data, loading }
}

export function useUniversityDetails(universityId: string | null) {
  const [data, setData] = useState<UniversityDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!universityId) return

    async function fetchData() {
      setLoading(true)
      try {
        const { data: details, error } = await supabase
          .from('university_details')
          .select('*')
          .eq('university_id', universityId)
          .maybeSingle()

        if (error) throw error

        setData(details as UniversityDetail | null)
      } catch (e) {
        console.error('Failed to fetch university details:', e)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [universityId])

  return { details: data, loading }
}

export function useHomeStats() {
  const [stats, setStats] = useState({
    universityCount: 0,
    programCount: 0,
    openProgramCount: 0,
    approachingDeadlineCount: 0,
    lastScrapeDate: null as string | null,
  })

  useEffect(() => {
    async function fetchStats() {
      try {
        const [
          { count: uniCount },
          { count: progCount },
          { data: logs },
        ] = await Promise.all([
          supabase.from('universities').select('*', { count: 'exact', head: true }),
          supabase.from('programs').select('*', { count: 'exact', head: true }),
          supabase.from('scrape_logs').select('scraped_at').order('scraped_at', { ascending: false }).limit(1),
        ])

        const today = new Date().toISOString().split('T')[0]
        const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        const { count: openCount } = await supabase
          .from('programs')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Aberto')

        const { count: approachingCount } = await supabase
          .from('programs')
          .select('*', { count: 'exact', head: true })
          .gte('deadline', today)
          .lte('deadline', thirtyDays)

        setStats({
          universityCount: uniCount ?? 0,
          programCount: progCount ?? 0,
          openProgramCount: openCount ?? 0,
          approachingDeadlineCount: approachingCount ?? 0,
          lastScrapeDate: logs?.[0]?.scraped_at ?? null,
        })
      } catch {
        setStats({
          universityCount: 109,
          programCount: 0,
          openProgramCount: 0,
          approachingDeadlineCount: 0,
          lastScrapeDate: null,
        })
      }
    }

    fetchStats()
  }, [])

  return stats
}
