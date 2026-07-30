'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAdminSession } from '@/lib/adminClient'
import { supabase } from '@/lib/supabase'

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAdminSession()
  const [stats, setStats] = useState({
    universities: 0,
    programs: 0,
    subscribers: 0,
    activeNotice: false,
    remindersSent: 0,
    trackerPrograms: 0,
    syncedPrograms: 0,
    activeToday: 0,
  })
  const [statsError, setStatsError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAdmin) return
    async function fetchStats() {
      try {
        const [
          { count: uniCount },
          { count: progCount },
          { count: subCount },
          { data: notices },
          { count: reminderCount },
          { count: trackerCount },
          { count: syncedCount },
          { count: todayCount },
        ] = await Promise.all([
          supabase.from('universities').select('*', { count: 'exact', head: true }),
          supabase.from('programs').select('*', { count: 'exact', head: true }),
          supabase.from('email_subscriptions').select('*', { count: 'exact', head: true }),
          supabase.from('general_notices').select('id').eq('active', true).limit(1),
          supabase.from('reminder_logs').select('*', { count: 'exact', head: true }),
          supabase.from('user_reminders').select('*', { count: 'exact', head: true }),
          supabase.from('user_tracker_programs').select('*', { count: 'exact', head: true }),
          supabase.from('user_activity').select('*', { count: 'exact', head: true }).eq('active_date', new Date().toISOString().split('T')[0]),
        ])
        setStats({
          universities: uniCount ?? 0,
          programs: progCount ?? 0,
          subscribers: subCount ?? 0,
          activeNotice: (notices ?? []).length > 0,
          remindersSent: reminderCount ?? 0,
          trackerPrograms: trackerCount ?? 0,
          syncedPrograms: syncedCount ?? 0,
          activeToday: todayCount ?? 0,
        })
        setStatsError(null)
      } catch {
        setStatsError('Failed to load dashboard stats.')
      }
    }
    fetchStats()
  }, [isAdmin])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[var(--text-muted)]">Loading dashboard…</p>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[var(--text-muted)]">Access denied.</p>
      </div>
    )
  }

  const statCards = [
    { label: 'Universities', value: stats.universities, href: '/admin/universities', color: 'var(--bg-primary)' },
    { label: 'Programs', value: stats.programs, href: null, color: 'var(--bg-accent)' },
    { label: 'Subscribers', value: stats.subscribers, href: '/admin/subscribers', color: 'var(--bg-secondary)' },
    { label: 'Reminders Sent', value: stats.remindersSent, href: '/admin/reminder-logs', color: 'var(--warning)' },
    { label: 'Email Reminders', value: stats.trackerPrograms, href: '/admin/tracker', color: 'var(--success)' },
    { label: 'Synced Programs', value: stats.syncedPrograms, href: '/admin/tracker', color: 'var(--bg-accent)' },
    { label: 'Active Notice', value: stats.activeNotice ? 'Yes' : 'No', href: '/admin/notice', color: stats.activeNotice ? 'var(--warning)' : 'var(--text-muted)' },
    { label: 'Active Today', value: stats.activeToday, href: '/admin/user-activity', color: 'var(--bg-primary)' },
  ]

  const quickLinks = [
    { label: 'Edit University URLs', href: '/admin/universities', icon: '🏛️' },
    { label: 'Manage General Notice', href: '/admin/notice', icon: '📢' },
    { label: 'View Subscribers', href: '/admin/subscribers', icon: '📧' },
    { label: 'Scrape Logs', href: '/admin/logs', icon: '📋' },
    { label: 'Trigger Scrape', href: '/admin/trigger', icon: '🔄' },
    { label: 'Reminder Logs', href: '/admin/reminder-logs', icon: '🔔' },
    { label: 'Tracker Overview', href: '/admin/tracker', icon: '📌' },
    { label: 'User Activity', href: '/admin/user-activity', icon: '📈' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Signed in as {user.email}
        </p>
      </div>

      {statsError && (
        <p className="mb-3 text-xs text-[var(--danger)]">{statsError}</p>
      )}

      {/* Stats grid */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 transition-all hover:border-[var(--bg-primary)]/30"
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
                View →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <h2 className="mb-3 text-sm font-semibold text-white">Quick Actions</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg border border-[var(--border)] p-3 text-xs text-[var(--text-secondary)] transition-all hover:border-[var(--bg-primary)]/30 hover:text-white"
            >
              <span className="mr-1.5">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
