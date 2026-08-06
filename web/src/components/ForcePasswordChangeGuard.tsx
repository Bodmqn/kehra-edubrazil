'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthProvider'

export default function ForcePasswordChangeGuard() {
  const { loading, needsPasswordChange } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (loading || !needsPasswordChange) return
    if (pathname !== '/account') {
      router.replace('/account?change=required')
    }
  }, [loading, needsPasswordChange, pathname, router])

  return null
}
