'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAdminSession, signOut } from '@/lib/adminClient'
import { supabase } from '@/lib/supabase'

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAdminSession()
  const [stats, setStats] = useState({
    universities: 0,
    programs: 0,
    subscribers: 0,
    activeNotice: false,
  })

  useEffect(() => {
    if (!isAdmin) return
    async function fetchStats() {
      const [{ count: uniCount }, { count: progCount }, { count: subCount }, { data: notices }] =
        await Promise.all([
          supabase.from('universities').select('*', { count: 'exact', head: true }),
          supabase.from('programs').select('*', { count: 'exact', head: true }),
          supabase.from('email_subscriptions').select('*', { count: 'exact', head: true }),
          supabase.from('general_notices').select('id').eq('active', true).limit(1),
        ])
      setStats({
        universities: uniCount ?? 0,
        programs: progCount ?? 0,
        subscribers: subCount ?? 0,
        activeNotice: (notices ?? []).length > 0,
      })
    }
    fetchStats()
  }, [isAdmin])

  if (loading) {
    return <p className="text-sm text-[var(--text-muted)]">Loading dashboard…</p>
  }

  if (!user || !isAdmin) {
    return <p className="text-sm text-[var(--text-muted)]">Access denied.</p>
  }

  const cards = [
    { label: 'Universities', value: stats.universities, href: '/admin/universities', color: 'var(--bg-primary)' },
    { label: 'Programs', value: stats.programs, href: null, color: 'var(--bg-accent)' },
    { label: 'Subscribers', value: stats.subscribers, href: '/admin/subscribers', color: 'var(--bg-secondary)' },
    { label: 'Active Notice', value: stats.activeNotice ? 'Yes' : 'No', href: '/admin/notice', color: 'var(--warning)' },
  ]

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Signed in as {user.email}
          </p>
        </div>
        <button
          onClick={() => signOut()}
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-white"
        >
          Sign Out
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4"
          >
            <p className="text-2xl font-bold" style={{ color: card.color }}>
              {card.value}
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{card.label}</p>
            {card.href && (
              <Link
                href={card.href}
                className="mt-2 inline-block text-[10px] text-[var(--bg-primary)] hover:underline"
              >
                Manage →
              </Link>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <h2 className="mb-3 text-sm font-semibold text-white">Quick Links</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <Link
            href="/admin/universities"
            className="rounded-lg border border-[var(--border)] p-3 text-xs text-[var(--text-secondary)] hover:border-[var(--bg-primary)]/30 hover:text-white"
          >
            🏛️ Edit University URLs
          </Link>
          <Link
            href="/admin/notice"
            className="rounded-lg border border-[var(--border)] p-3 text-xs text-[var(--text-secondary)] hover:border-[var(--bg-primary)]/30 hover:text-white"
          >
            📢 Manage General Notice
          </Link>
          <Link
            href="/admin/subscribers"
            className="rounded-lg border border-[var(--border)] p-3 text-xs text-[var(--text-secondary)] hover:border-[var(--bg-primary)]/30 hover:text-white"
          >
            📧 View Subscribers
          </Link>
          <Link
            href="/admin/logs"
            className="rounded-lg border border-[var(--border)] p-3 text-xs text-[var(--text-secondary)] hover:border-[var(--bg-primary)]/30 hover:text-white"
          >
            📋 Scrape Logs
          </Link>
        </div>
      </div>
    </div>
  )
}
