'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated()
      
      // Public pages that don't require authentication
      const publicPages = ['/login', '/reset-password']
      const isPublicPage = publicPages.includes(pathname)
      
      // If on a public page
      if (isPublicPage) {
        // If already authenticated, redirect to dashboard
        if (authenticated && pathname === '/login') {
          router.push('/')
        } else {
          setIsLoading(false)
        }
        return
      }
      
      // If not on a public page and not authenticated, redirect to login
      if (!authenticated) {
        router.push('/login')
        return
      }
      
      // Authenticated and not on a public page
      setIsLoading(false)
    }

    checkAuth()
  }, [pathname, router])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Public pages - render without sidebar
  const publicPages = ['/login', '/reset-password']
  if (publicPages.includes(pathname)) {
    return <>{children}</>
  }

  // Protected pages - render with sidebar, header, and footer
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden pt-16 pb-12">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  )
}
