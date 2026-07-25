'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-32">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--danger)]/10 text-2xl font-bold text-[var(--danger)]">
        !
      </div>
      <h1 className="mt-6 text-2xl font-bold text-white">Something went wrong</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        {error.message || 'An unexpected error occurred.'}
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-[var(--bg-primary)] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        style={{ color: 'white' }}
      >
        Try again
      </button>
    </div>
  )
}
