export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-dark)] py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-[var(--text-muted)]">
            © {new Date().getFullYear()} EduBrazil Hub + The Kehra
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Connecting international students to Brazilian graduate programs
          </p>
        </div>
      </div>
    </footer>
  )
}
