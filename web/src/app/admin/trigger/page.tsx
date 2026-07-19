'use client'

const GITHUB_ACTIONS_URL = 'https://github.com/Bodmqn/kehra-edubrazil/actions/workflows/scrape.yml'

export default function AdminTriggerPage() {
  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-white">Trigger Scrape</h1>
      <p className="mb-4 text-xs text-[var(--text-muted)]">
        Manually trigger the SIGAA + custom portal scraper via GitHub Actions.
      </p>

      <div className="max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <p className="mb-4 text-xs leading-relaxed text-[var(--text-secondary)]">
          This runs all scrapers (SIGAA + custom portals) and updates the database.
          Since the site is statically exported, triggering is done directly on GitHub
          — one click away.
        </p>

        <a
          href={GITHUB_ACTIONS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-lg bg-[var(--bg-primary)] px-4 py-2.5 text-center text-sm font-medium text-white hover:opacity-90"
        >
          Open GitHub Actions → Run Workflow
        </a>

        <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] p-3">
          <p className="text-[10px] text-[var(--text-muted)]">
            <strong className="text-[var(--text-secondary)]">Tip:</strong> On the GitHub page, click the
            &quot;Run workflow&quot; dropdown, select <code className="text-[var(--bg-accent)]">main</code>, and
            click the green &quot;Run workflow&quot; button.
          </p>
        </div>

        <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] p-3">
          <p className="text-[10px] text-[var(--text-muted)]">
            🔗{' '}
            <a
              href={GITHUB_ACTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--bg-primary)] hover:underline"
            >
              github.com/Bodmqn/kehra-edubrazil/actions
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
