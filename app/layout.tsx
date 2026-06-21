import type { Metadata, Viewport } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from './providers'
import './globals.css'

const syne = Syne({ 
  subsets: ["latin"],
  variable: '--font-syne',
});

const dmSans = DM_Sans({ 
  subsets: ["latin"],
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  title: 'BACsmart - AI Tutor pentru BAC',
  description: 'Pregătește-te pentru BAC cu ajutorul inteligenței artificiale',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://v0-bacsmart-app-design.vercel.app'),
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ro" className={`${syne.variable} ${dmSans.variable} bg-background`}>
      <body className="font-sans antialiased bg-background text-foreground">
        <Providers>
          {children}
        </Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
