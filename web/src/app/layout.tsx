import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SkipLink from '@/components/SkipLink'
import GeneralNoticeBar from '@/components/GeneralNoticeBar'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://edubrazil-kehra.netlify.app'),
  title: {
    default: 'Kehra • EduBrazil Hub — Graduate Programs in Brazil',
    template: '%s • Kehra EduBrazil Hub',
  },
  description:
    'Find Masters and PhD programs across 109 Brazilian universities. Browse, compare, and apply to graduate programs with live deadline tracking.',
  icons: {
    icon: '/logo.png',
  },
  openGraph: {
    title: 'Kehra • EduBrazil Hub',
    description: 'Find Masters and PhD programs across 109 Brazilian universities.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Kehra EduBrazil Hub',
    images: [{ url: '/logo.png', width: 901, height: 460 }],
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
        <GeneralNoticeBar />
        <main id="main-content" className="pt-16" tabIndex={-1}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
