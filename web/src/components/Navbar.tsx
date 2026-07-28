'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS } from '@/lib/constants'
import { useTheme } from '@/components/ThemeProvider'
import { useAuth } from '@/lib/AuthProvider'
import LoginModal from '@/components/auth/LoginModal'

export default function Navbar() {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { user, loading: authLoading, signIn, signOut } = useAuth()

  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), [])

  useEffect(() => {
    closeMobileMenu()
  }, [pathname, closeMobileMenu])

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  if (isAdmin) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border)] bg-[var(--bg-dark)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/admin" className="text-xs font-medium text-white">
            Admin Panel
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-1.5 text-white hover:bg-[var(--bg-card-hover)] transition-colors"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
            </button>
            <Link
              href="/"
              className="text-[10px] text-[var(--text-muted)] hover:text-white transition-colors"
            >
              ← Back to site
            </Link>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border)] bg-[var(--bg-dark)]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="EduBrazil Hub + The Kehra home">
          <img
            src="/logo.png"
            alt="EduBrazil Hub + The Kehra"
            className="h-8 w-auto"
          />
        </Link>

        <div className="flex items-center gap-2">
          <nav
            className="hidden lg:flex items-center gap-6"
            aria-label="Main navigation"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`text-sm transition-colors ${
                    isActive
                      ? 'text-white'
                      : 'text-[var(--text-secondary)] hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {!authLoading && (
            user ? (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)] max-w-[120px] truncate">{user.email}</span>
                <button
                  onClick={signOut}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setLoginModalOpen(true)}
                className="hidden sm:inline-flex items-center justify-center rounded-lg border border-[var(--bg-accent)]/30 bg-[var(--bg-accent)]/10 px-3 py-1.5 text-xs text-[var(--bg-accent)] hover:bg-[var(--bg-accent)]/20 transition-colors"
              >
                Sign In
              </button>
            )
          )}

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-2 text-white hover:bg-[var(--bg-card-hover)] transition-colors"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>

          <button
            type="button"
            className="lg:hidden inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-2 text-white hover:bg-[var(--bg-card-hover)] transition-colors"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {isMobileMenuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 top-16 z-40"
            onClick={closeMobileMenu}
            aria-hidden="true"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          </div>
          <div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="fixed top-16 left-0 right-0 z-40 border-b border-[var(--border)] bg-[var(--bg-dark)]"
          >
            <nav className="flex flex-col gap-1 px-4 pb-6 pt-4" aria-label="Mobile navigation">
              {NAV_ITEMS.map((item) => {
                const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    aria-current={isActive ? 'page' : undefined}
                    className={`rounded-lg px-4 py-3 text-sm transition-colors ${
                      isActive
                        ? 'bg-[var(--bg-card)] text-white font-medium'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
              <div className="mt-2 border-t border-[var(--border)] pt-2">
                {user ? (
                  <div className="space-y-1">
                    <p className="px-4 text-xs text-[var(--text-muted)]">{user.email}</p>
                    <button
                      onClick={() => { signOut(); closeMobileMenu() }}
                      className="w-full rounded-lg px-4 py-3 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-white transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setLoginModalOpen(true); closeMobileMenu() }}
                    className="w-full rounded-lg px-4 py-3 text-left text-sm text-[var(--bg-accent)] hover:bg-[var(--bg-accent)]/10 transition-colors"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </nav>
          </div>
        </>
      )}

      <LoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLogin={signIn}
      />
    </header>
  )
}
