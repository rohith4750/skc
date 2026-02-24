/**
 * Auth helpers: delegate to auth-storage.
 * JWT access token is in sessionStorage; login state (user, role, permissions) in localStorage.
 */

import {
  clearAuth as clearAuthStorage,
  isLoggedIn,
  getStoredUser,
  getStoredRole,
  getStoredPermissions,
  type UserRole,
} from '@/lib/auth-storage'

export type { UserRole } from '@/lib/auth-storage'

export interface AuthUser {
  username: string
  role: UserRole
  isAuthenticated: boolean
}

export function getAuth(): AuthUser | null {
  const user = getStoredUser()
  if (!user || !isLoggedIn()) return null
  return {
    username: user.username,
    role: user.role,
    isAuthenticated: true,
  }
}

export { clearAuthStorage as clearAuth }

export function isAuthenticated(): boolean {
  return isLoggedIn()
}

export function getUserRole(): UserRole | null {
  return getStoredRole()
}

export function hasRole(requiredRole: UserRole | UserRole[]): boolean {
  const userRole = getUserRole()
  if (!userRole) return false
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole)
  }
  return userRole === requiredRole
}

export function isSuperAdmin(): boolean {
  return hasRole('super_admin')
}

export function isAdmin(): boolean {
  const role = getUserRole()
  return role === 'admin' || role === 'super_admin'
}

export function getPermissions(): string[] {
  return getStoredPermissions()
}
