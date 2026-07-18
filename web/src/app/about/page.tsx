import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about EduBrazil Hub + The Kehra — the team behind this platform.',
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-white">About Us</h1>

      <p className="mb-10 text-sm leading-relaxed text-[var(--text-secondary)]">
        EduBrazil Hub + The Kehra was born from a simple idea: two teams, each strong in a
        different world, coming together to build something neither could build alone.
      </p>

      {/* EduBrazil */}
      <section className="mb-10 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <div className="mb-4 flex items-center gap-4">
          <img
            src="/EduBrazil.png"
            alt="EduBrazil logo"
            className="h-12 w-auto"
          />
          <div>
            <h2 className="text-lg font-bold text-white">EduBrazil — Study &amp; Scholarship Hub</h2>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
          EduBrazil is a study and scholarship hub dedicated to helping international students find
          their path into Brazilian higher education. From scholarship guidance to community support,
          EduBrazil connects prospective students with real opportunities — including major
          scholarship programs — and keeps a growing community informed through Telegram, WhatsApp,
          and social media, guiding students step by step through the application process.
        </p>
      </section>

      {/* The Kehra */}
      <section className="mb-10 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <div className="mb-4 flex items-center gap-4">
          <img
            src="/TheKehra.png"
            alt="The Kehra logo"
            className="h-12 w-auto"
          />
          <div>
            <h2 className="text-lg font-bold text-white">The Kehra — Automated Trading, Simplified</h2>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
          The Kehra is a trading technology company focused on building Expert Advisors (EAs) for
          MetaTrader 4 &amp; 5 — automated systems that trade Forex, Crypto, and Indices on a
          trader&apos;s behalf. Built on real strategies (from gold scalping to Smart Money Concepts
          frameworks), Kehra&apos;s mission is to remove emotion and guesswork from trading, giving
          people back their time while a tested system works in the background.
        </p>
      </section>

      {/* Why we teamed up */}
      <section className="mb-10 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <h2 className="mb-4 text-lg font-bold text-white">Why We Teamed Up</h2>
        <p className="mb-4 text-sm leading-relaxed text-[var(--text-secondary)]">
          EduBrazil&apos;s deep knowledge of Brazil&apos;s academic system and The Kehra&apos;s
          technical, data-driven engineering background came together to solve a real problem:
          finding and tracking graduate programs across Brazil is hard. There was no single place to
          search, compare, and follow deadlines across the country&apos;s universities.
        </p>
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
          So we built EduBrazil Hub + The Kehra — a platform that lets students explore Masters and
          PhD programs across 109 Brazilian universities, spanning all five regions and both federal
          and state institutions, with live deadline tracking, program matching, and an interactive
          map, all in one place.
        </p>
      </section>

      {/* Closing */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <p className="text-sm leading-relaxed italic text-[var(--text-secondary)]">
          It&apos;s a small but telling example of what happens when an education-focused team and a
          systems-focused team combine forces: EduBrazil brought the on-the-ground academic
          expertise, and The Kehra brought the tools to organize and automate it at scale.
        </p>
        <p className="mt-4 text-xs text-[var(--text-muted)]">
          © 2026 EduBrazil Hub + The Kehra — Connecting international students to Brazilian graduate
          programs.
        </p>
      </section>
    </div>
  )
}
