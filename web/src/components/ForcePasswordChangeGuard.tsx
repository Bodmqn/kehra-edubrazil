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
    // Messages stay accessible during a forced password change
    if (pathname !== '/account' && pathname !== '/messages') {
      router.replace('/account?change=required')
    }
  }, [loading, needsPasswordChange, pathname, router])

  return null
}
