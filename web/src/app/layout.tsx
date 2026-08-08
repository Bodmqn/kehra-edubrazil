import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SkipLink from '@/components/SkipLink'
import GeneralNoticeBar from '@/components/GeneralNoticeBar'
import { UserHeartbeat } from '@/components/UserHeartbeat'
import ThemeProvider from '@/components/ThemeProvider'
import { AuthProvider } from '@/lib/AuthProvider'
import ForcePasswordChangeGuard from '@/components/ForcePasswordChangeGuard'
import ChatWidget from '@/components/chat/ChatWidget'

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
    default: 'EduBrazil Hub + The Kehra — Graduate Programs in Brazil',
    template: '%s • EduBrazil Hub + The Kehra',
  },
  description:
    'Find Masters and PhD programs across 109 Brazilian universities. Browse, compare, and apply to graduate programs with live deadline tracking.',
  icons: {
    icon: '/logo.png',
  },
  openGraph: {
    title: 'EduBrazil Hub + The Kehra',
    description: 'Find Masters and PhD programs across 109 Brazilian universities.',
    type: 'website',
    locale: 'en_US',
    siteName: 'EduBrazil Hub + The Kehra',
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
      data-theme="dark"
      suppressHydrationWarning
    >
      <body className="min-h-full bg-[var(--bg-dark)] font-sans" style={{ color: 'var(--text-primary)' }}>
        <ThemeProvider>
          <AuthProvider>
            <ForcePasswordChangeGuard />
            <UserHeartbeat />
            <SkipLink />
            <Navbar />
            <GeneralNoticeBar />
            <main id="main-content" className="pt-16" tabIndex={-1}>
              {children}
            </main>
            <Footer />
            <ChatWidget />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
