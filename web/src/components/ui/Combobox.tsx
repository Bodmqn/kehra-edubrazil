'use client'

import { useState, useRef, useEffect, useMemo } from 'react'

interface ComboboxProps {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  onSelect?: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  id?: string
}

export default function Combobox({
  options,
  value,
  onChange,
  onSelect,
  placeholder,
  required,
  disabled,
  id,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    if (options.length === 0) return []
    if (!value) return options.slice(0, 50)
    const q = value.toLowerCase()
    return options
      .filter((o) => o.label.toLowerCase().includes(q))
      .slice(0, 50)
  }, [options, value])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
            setHighlightedIndex(-1)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setHighlightedIndex((prev) =>
                Math.min(prev + 1, filtered.length - 1)
              )
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setHighlightedIndex((prev) => Math.max(prev - 1, 0))
            } else if (e.key === 'Enter' && highlightedIndex >= 0) {
              e.preventDefault()
              const selected = filtered[highlightedIndex]
              if (selected) {
                onChange(selected.value)
                onSelect?.(selected.value)
                inputRef.current?.blur()
                setOpen(false)
              }
            } else if (e.key === 'Escape') {
              setOpen(false)
            }
          }}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2 text-sm text-white placeholder-[var(--text-muted)] outline-none focus:border-[var(--bg-primary)]"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('')
              setOpen(false)
              inputRef.current?.focus()
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-xs text-[var(--text-muted)] hover:text-white"
            tabIndex={-1}
          >
            ✕
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg-card)] py-1 shadow-xl">
          {filtered.map((opt, i) => (
            <button
              key={`${opt.value}-${i}`}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                onChange(opt.value)
                onSelect?.(opt.value)
                setOpen(false)
              }}
              onMouseEnter={() => setHighlightedIndex(i)}
              className={`block w-full px-3 py-1.5 text-left text-xs transition-colors ${
                i === highlightedIndex
                  ? 'bg-[var(--bg-primary)]/20 text-white'
                  : 'text-[var(--text-secondary)] hover:bg-white/5'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
