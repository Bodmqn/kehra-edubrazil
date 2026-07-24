'use client'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  label,
}: SearchInputProps) {
  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label || placeholder}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] py-2.5 pl-10 pr-10 text-sm text-white placeholder-[var(--text-muted)] outline-none transition-colors focus:border-[var(--bg-primary)]/50"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--text-muted)] hover:text-white"
          aria-label="Clear search"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
