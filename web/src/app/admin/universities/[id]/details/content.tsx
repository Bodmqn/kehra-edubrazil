'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { University, UniversityDetail } from '@/lib/types'

export default function DetailsContent() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [university, setUniversity] = useState<University | null>(null)
  const [details, setDetails] = useState<UniversityDetail | null>(null)
  const [aboutText, setAboutText] = useState('')
  const [history, setHistory] = useState('')
  const [websiteDescription, setWebsiteDescription] = useState('')
  const [wikipediaUrl, setWikipediaUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    async function fetch() {
      const { data: uni } = await supabase.from('universities').select('*').eq('id', id).single()
      if (!uni) {
        router.push('/admin/universities')
        return
      }
      setUniversity(uni as University)

      const { data: det } = await supabase
        .from('university_details')
        .select('*')
        .eq('university_id', id)
        .maybeSingle()

      if (det) {
        const d = det as UniversityDetail
        setDetails(d)
        setAboutText(d.about_text ?? '')
        setHistory(d.history ?? '')
        setWebsiteDescription(d.website_description ?? '')
        setWikipediaUrl(d.wikipedia_url ?? '')
      }
      setLoading(false)
    }
    fetch()
  }, [id, router])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const payload = {
        university_id: id,
        about_text: aboutText || null,
        history: history || null,
        website_description: websiteDescription || null,
        wikipedia_url: wikipediaUrl || null,
      }

      if (details) {
        const { error } = await supabase
          .from('university_details')
          .update(payload)
          .eq('id', details.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('university_details').insert(payload)
        if (error) throw error
      }

      setMessage({ type: 'success', text: 'Details saved successfully.' })
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save details.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-[var(--text-muted)]">Loading…</p>
  }

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/admin/universities"
          className="text-xs text-[var(--bg-primary)] hover:underline"
        >
          ← Back to Universities
        </Link>
        <h1 className="mt-1 text-xl font-bold text-white">
          {university?.name} ({university?.acronym})
        </h1>
        <p className="text-xs text-[var(--text-muted)]">Edit university details</p>
      </div>

      {message && (
        <p
          className={`mb-3 text-xs ${
            message.type === 'success' ? 'text-[var(--success)]' : 'text-[var(--danger)]'
          }`}
        >
          {message.text}
        </p>
      )}

      <Link
        href={`/admin/universities/${id}/programs`}
        className="mb-4 inline-block rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-white"
      >
        📋 Manage Programs for this University →
      </Link>

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
            About Text
          </label>
          <textarea
            value={aboutText}
            onChange={(e) => setAboutText(e.target.value)}
            rows={5}
            className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2 text-sm text-white placeholder-[var(--text-muted)] outline-none"
            placeholder="Describe what makes this university unique…"
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
            History
          </label>
          <textarea
            value={history}
            onChange={(e) => setHistory(e.target.value)}
            rows={5}
            className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2 text-sm text-white placeholder-[var(--text-muted)] outline-none"
            placeholder="Historical background…"
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
            Website Description
          </label>
          <input
            type="text"
            value={websiteDescription}
            onChange={(e) => setWebsiteDescription(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2 text-sm text-white placeholder-[var(--text-muted)] outline-none"
            placeholder="Short description for the website listing…"
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
            Wikipedia URL
          </label>
          <input
            type="url"
            value={wikipediaUrl}
            onChange={(e) => setWikipediaUrl(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2 text-sm text-white placeholder-[var(--text-muted)] outline-none"
            placeholder="https://en.wikipedia.org/wiki/…"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-[var(--bg-accent)] px-5 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
