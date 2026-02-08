import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'
import { Toaster } from 'react-hot-toast'
import AuthGuard from '@/components/AuthGuard'
import GlobalLoader from '@/components/GlobalLoader'
import GlobalFetchInterceptor from '@/components/GlobalFetchInterceptor'

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins'
})

export const metadata: Metadata = {
  title: 'SKC Caterers - Management System',
  description: 'SKC Caterers - Established 1989. Manage catering services, customers, orders, and bills',
  icons: {
    icon: [
      { url: '/images/logo-dark.png', type: 'image/png' },
    ],
    shortcut: ['/images/logo-dark.png'],
    apple: [
      { url: '/images/logo-dark.png', type: 'image/png' },
    ],
  },
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
        <GlobalFetchInterceptor />
        <GlobalLoader />
        <Toaster
          position="top-center"
          containerClassName="!top-16"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#1f2937',
              padding: '12px 16px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              maxWidth: '90vw',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  )
}
