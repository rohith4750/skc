'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import Sidebar from '@/components/layout/Sidebar'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated()
      
      // If on login page
      if (pathname === '/login') {
        // If already authenticated, redirect to dashboard
        if (authenticated) {
          router.push('/')
        } else {
          setIsLoading(false)
        }
        return
      }
      
      // If not on login page and not authenticated, redirect to login
      if (!authenticated) {
        router.push('/login')
        return
      }
      
      // Authenticated and not on login page
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

  // Login page - render without sidebar
  if (pathname === '/login') {
    return <>{children}</>
  }

  // Protected pages - render with sidebar
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto lg:ml-0">
        {children}
      </main>
    </div>
  )
}
