'use client'

/**
 * Client-side Auth Context using httpOnly cookies
 * No tokens are stored in localStorage/sessionStorage
 * Tokens are automatically sent with requests via httpOnly cookies
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export type UserRole = 'admin' | 'super_admin'

export interface AuthUser {
  id: string
  username: string
  email: string
  role: UserRole
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check authentication status on mount and periodically
  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/validate', {
        credentials: 'include', // Important: send cookies
      })

      if (response.ok) {
        const data = await response.json()
        if (data.isAuthenticated && data.user) {
          setUser(data.user)
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Refresh access token using refresh token
  const refreshAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Important: send cookies
      })

      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          setUser(data.user)
          return
        }
      }
      
      // Refresh failed
      setUser(null)
      router.push('/login')
    } catch (error) {
      console.error('Token refresh failed:', error)
      setUser(null)
      router.push('/login')
    }
  }, [router])

  // Login function
  const login = useCallback(async (
    username: string,
    password: string,
    rememberMe: boolean = false
  ) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, rememberMe }),
      credentials: 'include', // Important: receive cookies
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Login failed')
    }

    const data = await response.json()
    if (data.user) {
      setUser(data.user)
    }
  }, [])

  // Logout function
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Important: send cookies to be cleared
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      router.push('/login')
    }
  }, [router])

  // Check auth on mount
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Auto-refresh access token every 14 minutes (before 15-minute expiry)
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      refreshAuth()
    }, 14 * 60 * 1000) // 14 minutes

    return () => clearInterval(interval)
  }, [user, refreshAuth])

  // Listen for unauthorized responses and try to refresh
  useEffect(() => {
    const handleUnauthorized = async () => {
      console.log('Unauthorized event detected, attempting refresh...')
      await refreshAuth()
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [refreshAuth])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Helper hooks
export function useRequireAuth() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  return { user, isLoading }
}

export function useRequireRole(allowedRoles: UserRole | UserRole[]) {
  const { user, isLoading } = useRequireAuth()
  const router = useRouter()

  const hasRole = user && (
    Array.isArray(allowedRoles)
      ? allowedRoles.includes(user.role)
      : user.role === allowedRoles
  )

  useEffect(() => {
    if (!isLoading && !hasRole) {
      router.push('/unauthorized')
    }
  }, [isLoading, hasRole, router])

  return { user, isLoading, hasRole }
}
