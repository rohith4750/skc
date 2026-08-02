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
          expand={false}
          closeButton={false}
          duration={3500}
          toastOptions={{
            style: {
              fontFamily: 'var(--font-poppins)',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '14px 18px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)',
            },
            classNames: {
              toast: 'group font-bold text-slate-800 rounded-2xl border border-slate-200/90 shadow-xl bg-white/95 backdrop-blur-md',
              title: 'text-xs font-black uppercase tracking-wider text-slate-900',
              description: 'text-xs font-semibold text-slate-500 mt-0.5',
              actionButton: 'bg-slate-900 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-sm hover:bg-slate-800',
              cancelButton: 'bg-slate-100 text-slate-600 font-bold text-xs px-3.5 py-1.5 rounded-xl hover:bg-slate-200',
              success: '!border-l-4 !border-l-emerald-500 !bg-white !text-slate-900',
              error: '!border-l-4 !border-l-rose-500 !bg-white !text-slate-900',
              info: '!border-l-4 !border-l-indigo-500 !bg-white !text-slate-900',
              warning: '!border-l-4 !border-l-amber-500 !bg-white !text-slate-900',
            },
          }}
        />
      </body>
    </html>
  )
}
