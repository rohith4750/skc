import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'
import { Toaster } from 'sonner'
import AuthGuard from '@/components/AuthGuard'

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins'
})

export const metadata: Metadata = {
  title: 'SKC Caterers - Management System',
  description: 'SKC Caterers - Established 1989. Manage catering services, customers, orders, and bills',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/images/logo-dark.png', type: 'image/png' },
    ],
    shortcut: ['/images/logo-dark.png'],
    apple: [
      { url: '/images/logo-dark.png', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SKC Caterers',
  },
  formatDetection: {
    telephone: true,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport = {
  themeColor: '#ea580c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <AuthGuard>
          {children}
        </AuthGuard>
        <Toaster
          position="top-right"
          richColors
          expand={false}
          closeButton
          toastOptions={{
            style: {
              fontFamily: 'var(--font-poppins)',
              borderRadius: '12px',
            },
          }}
        />
      </body>
    </html>
  )
}
