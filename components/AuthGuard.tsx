'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getToken, isLoggedIn, clearAuth } from '@/lib/auth-storage'
import { isPublicPath } from '@/lib/constants'
import {
  initSessionTimeout,
  clearSessionTimeout,
  setupSessionListeners,
} from '@/lib/session-manager'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const sessionCleanupRef = useRef<(() => void) | null>(null)

  const handleTimeout = () => {
    clearAuth()
    clearSessionTimeout()
    router.push('/login?reason=timeout')
  }

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      const token = getToken()
      const loggedIn = isLoggedIn()
      const isPublic = isPublicPath(pathname)

      if (isPublic) {
        clearSessionTimeout()
        if (sessionCleanupRef.current) {
          sessionCleanupRef.current()
          sessionCleanupRef.current = null
        }
        if (loggedIn && token && pathname === '/login') {
          router.push('/')
          return
        }
        setAuthenticated(false)
        setIsLoading(false)
        return
      }

      if (!token || !loggedIn) {
        clearAuth()
        router.push('/login')
        return
      }

      try {
        const res = await fetch('/api/auth/validate', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (cancelled) return
        if (!res.ok) {
          clearAuth()
          router.push('/login?reason=session_expired')
          return
        }
        setAuthenticated(true)
        setIsLoading(false)
        setTimeout(() => {
          if (cancelled) return
          initSessionTimeout(handleTimeout)
          sessionCleanupRef.current = setupSessionListeners(handleTimeout)
        }, 100)
      } catch {
        if (cancelled) return
        clearAuth()
        router.push('/login?reason=session_expired')
        setIsLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
      if (sessionCleanupRef.current) {
        sessionCleanupRef.current()
        sessionCleanupRef.current = null
      }
      clearSessionTimeout()
    }
  }, [pathname, router])

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

  if (isPublicPath(pathname)) {
    return <>{children}</>
  }

  if (!authenticated) {
    return null
  }

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
