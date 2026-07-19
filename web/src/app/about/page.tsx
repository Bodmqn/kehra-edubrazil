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
        <div className="mt-5 flex items-center gap-3">
          <a
            href="https://chat.whatsapp.com/JMkKGhdz53kGQq5b2jfeUu?mode=gi_t"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-white hover:border-[var(--text-secondary)] transition-colors"
            aria-label="Join EduBrazil WhatsApp group"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" style={{ fill: '#25D366' }} aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </a>
          <a
            href="https://www.youtube.com/@EleojoBusayo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-white hover:border-[var(--text-secondary)] transition-colors"
            aria-label="Visit EduBrazil YouTube channel"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" style={{ fill: '#FF0000' }} aria-hidden="true">
              <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            YouTube
          </a>
        </div>
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
