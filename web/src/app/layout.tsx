import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SkipLink from '@/components/SkipLink'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'Kehra • EduBrazil Hub — Graduate Programs in Brazil',
    template: '%s • Kehra EduBrazil Hub',
  },
  description:
    'Find Masters and PhD programs across 109 Brazilian universities. Browse, compare, and apply to graduate programs with live deadline tracking.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'Kehra • EduBrazil Hub',
    description: 'Find Masters and PhD programs across 109 Brazilian universities.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Kehra EduBrazil Hub',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--bg-dark)] font-sans text-white">
        <SkipLink />
        <Navbar />
        <main id="main-content" className="pt-16" tabIndex={-1}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
