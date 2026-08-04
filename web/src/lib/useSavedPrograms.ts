'use client'

import { useCallback, useEffect, useState } from 'react'
import type { TrackerProgram } from '@/lib/trackerTypes'
import { useAuth } from '@/lib/AuthProvider'
import { getPrograms, subscribeToTrackerChanges } from '@/lib/trackerService'

interface CacheEntry {
  key: string
  programs: TrackerProgram[]
}

const listeners = new Set<() => void>()

let cache: CacheEntry | null = null
let inflight: { key: string; promise: Promise<TrackerProgram[]> } | null = null

function broadcast() {
  for (const listener of listeners) listener()
}

function ensureLoaded(key: string): Promise<TrackerProgram[]> {
  if (cache && cache.key === key) return Promise.resolve(cache.programs)
  if (inflight && inflight.key === key) return inflight.promise
  const promise = getPrograms()
  const tracked = promise.finally(() => {
    if (inflight?.promise === tracked) inflight = null
  })
  inflight = { key, promise: tracked }
  return tracked.then((programs) => {
    cache = { key, programs }
    broadcast()
    return programs
  })
}

export function getCachedSavedPrograms(): TrackerProgram[] | null {
  return cache?.programs ?? null
}

export function useSavedPrograms(): {
  programs: TrackerProgram[]
  loading: boolean
} {
  const { user, loading: authLoading } = useAuth()
  const key = user?.id ?? 'local'

  const [programs, setPrograms] = useState<TrackerProgram[]>(() => cache?.programs ?? [])
  const [loading, setLoading] = useState(() => !authLoading && cache?.key !== key)

  const apply = useCallback((next: TrackerProgram[]) => {
    setPrograms(next)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (authLoading) return
    let cancelled = false

    const applyCached = () => {
      if (!cancelled && cache && cache.key === key) apply(cache.programs)
    }

    const sync = () => {
      cache = null
      ensureLoaded(key)
        .then((next) => {
          if (!cancelled) apply(next)
        })
        .catch(() => {
          if (!cancelled) setLoading(false)
        })
    }

    listeners.add(applyCached)
    const unsubscribe = subscribeToTrackerChanges(sync)

    if (!cache || cache.key !== key) {
      void Promise.resolve().then(() => {
        if (!cancelled) setLoading(true)
      })
      sync()
    }

    return () => {
      cancelled = true
      listeners.delete(applyCached)
      unsubscribe()
    }
  }, [key, authLoading, apply])

  return { programs, loading }
}