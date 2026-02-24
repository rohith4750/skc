/**
 * Server-side authentication helpers
 * Use these in Server Components and API Routes to verify authentication
 */

import { cookies } from 'next/headers'
import { verifyAccessToken, type AccessPayload } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

export interface ServerAuthUser {
  id: string
  username: string
  email: string
  role: string
  isAuthenticated: true
}

export interface ServerAuthResult {
  user: ServerAuthUser | null
  isAuthenticated: boolean
  payload: AccessPayload | null
}

/**
 * Get authenticated user from access token cookie (Server Component)
 * Returns null if not authenticated
 */
export async function getServerAuth(): Promise<ServerAuthResult> {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('accessToken')?.value

    if (!accessToken) {
      return { user: null, isAuthenticated: false, payload: null }
    }

    // Verify token
    let payload: AccessPayload
    try {
      payload = await verifyAccessToken(accessToken)
    } catch (error) {
      console.log('Invalid access token:', error)
      return { user: null, isAuthenticated: false, payload: null }
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
      },
    })

    if (!user || !user.isActive) {
      return { user: null, isAuthenticated: false, payload: null }
    }

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isAuthenticated: true,
      },
      isAuthenticated: true,
      payload,
    }
  } catch (error) {
    console.error('getServerAuth error:', error)
    return { user: null, isAuthenticated: false, payload: null }
  }
}

/**
 * Require authentication in Server Component
 * Throws error if not authenticated (for error boundaries)
 */
export async function requireServerAuth(): Promise<ServerAuthUser> {
  const auth = await getServerAuth()
  
  if (!auth.isAuthenticated || !auth.user) {
    throw new Error('Unauthorized - Authentication required')
  }
  
  return auth.user
}

/**
 * Check if user has specific role (Server Component)
 */
export async function hasServerRole(requiredRole: string | string[]): Promise<boolean> {
  const auth = await getServerAuth()
  
  if (!auth.isAuthenticated || !auth.user) {
    return false
  }
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(auth.user.role)
  }
  
  return auth.user.role === requiredRole
}

/**
 * Check if user is super admin (Server Component)
 */
export async function isServerSuperAdmin(): Promise<boolean> {
  return hasServerRole('super_admin')
}

/**
 * Check if user is admin or super admin (Server Component)
 */
export async function isServerAdmin(): Promise<boolean> {
  return hasServerRole(['admin', 'super_admin'])
}
