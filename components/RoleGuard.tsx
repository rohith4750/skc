'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { hasRole, isAuthenticated, UserRole } from '@/lib/auth'
import toast from 'react-hot-toast'

interface RoleGuardProps {
  children: React.ReactNode
  requiredRole: UserRole | UserRole[]
  fallback?: React.ReactNode
}

export default function RoleGuard({ 
  children, 
  requiredRole,
  fallback 
}: RoleGuardProps) {
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated()) {
      toast.error('Access denied. Please login.')
      router.push('/login')
      return
    }

    if (!hasRole(requiredRole)) {
      toast.error('You do not have permission to access this page.')
      router.push('/')
    }
  }, [requiredRole, router])

  if (!isAuthenticated()) {
    return fallback || null
  }

  if (!hasRole(requiredRole)) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You do not have permission to access this page.</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
