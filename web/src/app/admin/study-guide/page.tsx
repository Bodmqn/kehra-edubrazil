'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Section {
  id: string
  section_key: string
  title: string
  content: string
}

export default function AdminStudyGuidePage() {
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [editing, setEditing] = useState<{ key: string; content: string } | null>(null)

  useEffect(() => {
    async function fetch() {
      try {
        const { data, error } = await supabase.from('study_guide_sections').select('*').order('section_key')
        if (error) throw error
        setSections((data ?? []) as Section[])
      } catch (e) {
        setFeedback({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load.' })
      }
      setLoading(false)
    }
    fetch()
  }, [])

  const handleSave = async (section: Section) => {
    setSaving(true)
    setFeedback(null)
    try {
      const { error } = await supabase
        .from('study_guide_sections')
        .update({ content: section.content, updated_at: new Date().toISOString() })
        .eq('id', section.id)
      if (error) throw error
      setSections((prev) => prev.map((s) => (s.id === section.id ? section : s)))
      setEditing(null)
      setFeedback({ type: 'success', text: `${section.title} updated.` })
    } catch (e) {
      setFeedback({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-[var(--text-muted)]">Loading study guide…</p>
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-white">Study Guide</h1>
      <p className="mb-4 text-xs text-[var(--text-muted)]">
        Edit the visa, language, and housing content shown on university detail pages.
      </p>

      {feedback && (
        <p className={`mb-3 text-xs ${feedback.type === 'success' ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
          {feedback.text}
        </p>
      )}

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">{section.title}</h3>
              <button
                onClick={() => setEditing(editing?.key === section.section_key ? null : { key: section.section_key, content: section.content })}
                className="text-[10px] text-[var(--bg-primary)] hover:underline"
              >
                {editing?.key === section.section_key ? 'Cancel' : 'Edit'}
              </button>
            </div>
            {editing?.key === section.section_key ? (
              <div className="space-y-2">
                <textarea
                  value={editing.content}
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                  rows={4}
                  className="w-full resize-none rounded border border-[var(--border)] bg-[var(--bg-dark)] px-2.5 py-1.5 text-xs text-white outline-none"
                />
                <button
                  onClick={() => handleSave({ ...section, content: editing.content })}
                  disabled={saving}
                  className="rounded bg-[var(--bg-accent)] px-3 py-1.5 text-xs font-medium text-black disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{section.content}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
