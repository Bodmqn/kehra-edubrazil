import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-32">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--bg-primary)]/10 text-2xl font-bold text-[var(--bg-primary)]">
        404
      </div>
      <h1 className="mt-6 text-2xl font-bold text-white">Page not found</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-[var(--bg-primary)] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Go home
      </Link>
    </div>
  )
}
