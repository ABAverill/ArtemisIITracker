import type { Metadata } from 'next'
import { Space_Mono } from 'next/font/google'
import './globals.css'

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-space-mono',
})

export const metadata: Metadata = {
  title: 'Artemis II Mission Tracker',
  description: 'Real-time position tracking for NASA\'s Artemis II Orion spacecraft',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceMono.variable} h-full`}>
      <body className="h-full overflow-hidden" style={{ background: '#020510' }}>
        {children}
      </body>
    </html>
  )
}
