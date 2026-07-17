'use client'

import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { universities as fallbackUniversities } from './data'
import type { University, Program, UniversityDetail } from './types'

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
