'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { useRequireAdmin, signOut } from '@/lib/adminClient'

interface NavSection {
  label: string
  items: { label: string; href: string; icon: string }[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', icon: '📊' },
      { label: 'Admin Users', href: '/admin/admin-users', icon: '🔐' },
      { label: 'Users', href: '/admin/users', icon: '👤' },
    ],
  },
  {
    label: 'Universities',
    items: [
      { label: 'All Universities', href: '/admin/universities', icon: '🏛️' },
    ],
  },
  {
    label: 'Communication',
    items: [
      { label: 'Subscribers', href: '/admin/subscribers', icon: '📧' },
      { label: 'General Notice', href: '/admin/notice', icon: '📢' },
      { label: 'Notice History', href: '/admin/notice/history', icon: '📜' },
      { label: 'Splash Notice', href: '/admin/splash-notice', icon: '💬' },
      { label: 'Study Guide', href: '/admin/study-guide', icon: '📖' },
    ],
  },
  {
    label: 'Monitoring',
    items: [
      { label: 'Scrape Logs', href: '/admin/logs', icon: '📋' },
      { label: 'Reminder Logs', href: '/admin/reminder-logs', icon: '🔔' },
      { label: 'Trigger Scrape', href: '/admin/trigger', icon: '🔄' },
    ],
  },
  {
    label: 'Tracker',
    items: [
      { label: 'Tracker Overview', href: '/admin/tracker', icon: '📌' },
    ],
  },
]

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/')
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === '/admin/login'

  if (isLogin) return <>{children}</>

  return <AdminShell pathname={pathname}>{children}</AdminShell>
}

function AdminShell({ pathname, children }: { pathname: string; children: React.ReactNode }) {
  const { loading } = useRequireAdmin()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

  const toggleSection = (label: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center px-4 py-32">
        <p className="text-sm text-[var(--text-muted)]">Checking access…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 -translate-x-full overflow-y-auto border-r border-[var(--border)] bg-[var(--bg-card)] p-4 transition-transform lg:static lg:z-auto lg:mr-6 lg:block lg:w-56 lg:translate-x-0 lg:border lg:rounded-xl ${
          sidebarOpen ? 'translate-x-0' : ''
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <Link href="/admin" className="text-sm font-bold text-white">
            Admin Panel
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-xs text-[var(--text-muted)] hover:text-white lg:hidden"
          >
            ✕
          </button>
        </div>

        <nav className="space-y-4">
          {NAV_SECTIONS.map((section) => {
            const isCollapsed = collapsedSections.has(section.label)
            const hasActive = section.items.some((i) => isActive(pathname, i.href))
            return (
              <div key={section.label}>
                <button
                  onClick={() => toggleSection(section.label)}
                  className={`flex w-full items-center justify-between rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                    hasActive ? 'text-[var(--bg-primary)]' : 'text-[var(--text-muted)]'
                  } hover:text-white`}
                >
                  {section.label}
                  <svg
                    className={`h-3 w-3 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {!isCollapsed && (
                  <div className="mt-1 space-y-0.5">
                    {section.items.map((item) => {
                      const active = isActive(pathname, item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors ${
                            active
                              ? 'bg-[var(--bg-primary)]/10 text-[var(--bg-primary)] font-medium'
                              : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-card-hover)]'
                          }`}
                        >
                          <span className="text-sm">{item.icon}</span>
                          {item.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <button
          onClick={() => signOut()}
          className="mt-6 w-full rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-white"
        >
          Sign Out
        </button>
      </aside>

      {/* Main content */}
      <div className="min-w-0 flex-1">
        {/* Mobile header */}
        <div className="mb-4 flex items-center gap-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg border border-[var(--border)] p-2 text-[var(--text-muted)] hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2 overflow-x-auto">
            {NAV_SECTIONS.flatMap((s) => s.items)
              .filter((i) => isActive(pathname, i.href))
              .map((i) => (
                <span key={i.href} className="text-xs font-medium text-white">
                  {i.label}
                </span>
              ))}
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}
