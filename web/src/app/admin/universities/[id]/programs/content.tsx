'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { University, Program } from '@/lib/types'

interface FormState {
  name: string
  level: 'Mestrado' | 'Doutorado' | 'Ambos'
  field: string
  deadline: string
  status: 'Aberto' | 'Fechado' | 'Em Breve'
  edital_url: string
}

const EMPTY_FORM: FormState = {
  name: '',
  level: 'Mestrado',
  field: '',
  deadline: '',
  status: 'Aberto',
  edital_url: '',
}

export default function ProgramsContent() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [university, setUniversity] = useState<University | null>(null)
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    async function fetch() {
      try {
        const { data: uni, error: uniErr } = await supabase.from('universities').select('*').eq('id', id).single()
        if (uniErr || !uni) {
          router.push('/admin/universities')
          return
        }
        setUniversity(uni as University)

        const { data: progs, error: progsErr } = await supabase
          .from('programs')
          .select('*')
          .eq('university_id', id)
          .order('deadline', { ascending: true })

        if (progsErr) throw progsErr
        setPrograms((progs ?? []) as Program[])
      } catch (e) {
        setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load data.' })
      }
      setLoading(false)
    }
    fetch()
  }, [id, router])

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingProgramId(null)
    setShowForm(false)
    setMessage(null)
  }

  const startEdit = (p: Program) => {
    setForm({
      name: p.name,
      level: p.level,
      field: p.field ?? '',
      deadline: p.deadline ?? '',
      status: p.status,
      edital_url: p.edital_url ?? '',
    })
    setEditingProgramId(p.id)
    setShowForm(true)
    setMessage(null)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    setMessage(null)

    try {
      const payload = {
        university_id: id,
        name: form.name.trim(),
        level: form.level,
        field: form.field || null,
        deadline: form.deadline || null,
        status: form.status,
        edital_url: form.edital_url || null,
      }

      if (editingProgramId) {
        const { error } = await supabase.from('programs').update(payload).eq('id', editingProgramId)
        if (error) throw error
        setPrograms((prev) =>
          prev.map((p) => (p.id === editingProgramId ? { ...p, ...(payload as Program) } : p))
        )
        setMessage({ type: 'success', text: 'Program updated.' })
      } else {
        const { data, error } = await supabase
          .from('programs')
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        setPrograms((prev) => [...prev, data as Program])
        setMessage({ type: 'success', text: 'Program added.' })
      }

      resetForm()
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save program.' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (programId: string) => {
    if (!window.confirm('Delete this program? This cannot be undone.')) return
    try {
      const { error } = await supabase.from('programs').delete().eq('id', programId)
      if (error) throw error
      setPrograms((prev) => prev.filter((p) => p.id !== programId))
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to delete program.' })
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
          Programs — {university?.name} ({university?.acronym})
        </h1>
        <p className="text-xs text-[var(--text-muted)]">{programs.length} programs</p>
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

      <button
        onClick={() => { resetForm(); setShowForm(true) }}
        className="mb-4 rounded-lg bg-[var(--bg-primary)] px-4 py-2 text-xs font-medium text-white"
      >
        + Add Program
      </button>

      {showForm && (
        <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <h3 className="mb-3 text-sm font-semibold text-white">
            {editingProgramId ? 'Edit Program' : 'Add Program'}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] text-[var(--text-secondary)]">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded border border-[var(--border)] bg-[var(--bg-dark)] px-2.5 py-1.5 text-xs text-white outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-[var(--text-secondary)]">Level</label>
              <select
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value as FormState['level'] })}
                className="w-full rounded border border-[var(--border)] bg-[var(--bg-dark)] px-2.5 py-1.5 text-xs text-white outline-none"
              >
                <option value="Mestrado">Mestrado</option>
                <option value="Doutorado">Doutorado</option>
                <option value="Ambos">Ambos</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-[var(--text-secondary)]">Field</label>
              <input
                type="text"
                value={form.field}
                onChange={(e) => setForm({ ...form, field: e.target.value })}
                className="w-full rounded border border-[var(--border)] bg-[var(--bg-dark)] px-2.5 py-1.5 text-xs text-white outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-[var(--text-secondary)]">Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full rounded border border-[var(--border)] bg-[var(--bg-dark)] px-2.5 py-1.5 text-xs text-white outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-[var(--text-secondary)]">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as FormState['status'] })}
                className="w-full rounded border border-[var(--border)] bg-[var(--bg-dark)] px-2.5 py-1.5 text-xs text-white outline-none"
              >
                <option value="Aberto">Aberto</option>
                <option value="Fechado">Fechado</option>
                <option value="Em Breve">Em Breve</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-[var(--text-secondary)]">Edital URL</label>
              <input
                type="url"
                value={form.edital_url}
                onChange={(e) => setForm({ ...form, edital_url: e.target.value })}
                className="w-full rounded border border-[var(--border)] bg-[var(--bg-dark)] px-2.5 py-1.5 text-xs text-white outline-none"
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              className="rounded bg-[var(--bg-accent)] px-3 py-1.5 text-xs font-medium text-black disabled:opacity-50"
            >
              {saving ? 'Saving…' : editingProgramId ? 'Update' : 'Add'}
            </button>
            <button
              onClick={resetForm}
              className="rounded border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {programs.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No programs for this university yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--border)] bg-[var(--bg-card)]">
              <tr>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Name</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Level</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Field</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Deadline</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Status</th>
                <th className="px-3 py-2.5 font-medium text-[var(--text-secondary)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {programs.map((p) => (
                <tr key={p.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-card)]/50">
                  <td className="max-w-[200px] truncate px-3 py-2.5 text-white">{p.name}</td>
                  <td className="px-3 py-2.5 text-[var(--text-muted)]">{p.level}</td>
                  <td className="px-3 py-2.5 text-[var(--text-muted)]">{p.field || '—'}</td>
                  <td className="px-3 py-2.5 text-[var(--text-muted)]">{p.deadline || '—'}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] ${
                        p.status === 'Aberto'
                          ? 'bg-[var(--success)]/10 text-[var(--success)]'
                          : p.status === 'Fechado'
                            ? 'bg-[var(--danger)]/10 text-[var(--danger)]'
                            : 'bg-[var(--warning)]/10 text-[var(--warning)]'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="flex gap-1 px-3 py-2.5">
                    <button
                      onClick={() => startEdit(p)}
                      className="rounded border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--text-secondary)] hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="rounded border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--danger)] hover:text-white"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
