'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useRequireAdmin } from '@/lib/adminClient'

const NAV = [
  { label: 'Dashboard', href: '/admin', icon: '📊' },
  { label: 'Universities', href: '/admin/universities', icon: '🏛️' },
  { label: 'Notices', href: '/admin/notice', icon: '📢' },
  { label: 'Subscribers', href: '/admin/subscribers', icon: '📧' },
  { label: 'Scrape Logs', href: '/admin/logs', icon: '📋' },
  { label: 'Trigger Scrape', href: '/admin/trigger', icon: '🔄' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === '/admin/login'

  if (isLogin) return <>{children}</>

  return <AdminShell pathname={pathname}>{children}</AdminShell>
}

function AdminShell({ pathname, children }: { pathname: string; children: React.ReactNode }) {
  const { loading } = useRequireAdmin()

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center px-4 py-32">
        <p className="text-sm text-[var(--text-muted)]">Checking access…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Sidebar */}
      <aside className="mr-6 hidden w-48 shrink-0 sm:block">
        <nav className="space-y-1">
          {NAV.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors ${
                  isActive
                    ? 'bg-[var(--bg-primary)]/10 text-[var(--bg-primary)] font-medium'
                    : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-card)]'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile nav */}
      <div className="mb-6 flex gap-1 overflow-x-auto sm:hidden">
        {NAV.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-[var(--bg-primary)]/10 text-[var(--bg-primary)] font-medium'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              {item.icon} {item.label}
            </Link>
          )
        })}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
