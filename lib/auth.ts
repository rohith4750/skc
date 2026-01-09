// Simple authentication utility
// In production, replace with proper authentication (JWT, sessions, etc.)

const AUTH_KEY = 'skc_caterers_auth'

export type UserRole = 'admin' | 'super_admin' | 'chef' | 'supervisor' | 'transport'

export interface AuthUser {
  username: string
  role: UserRole
  isAuthenticated: boolean
}

export function setAuth(username: string, role: UserRole = 'admin') {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ 
      username, 
      role,
      isAuthenticated: true, 
      timestamp: Date.now() 
    }))
  }
}

export function getAuth(): AuthUser | null {
  if (typeof window !== 'undefined') {
    const authData = localStorage.getItem(AUTH_KEY)
    if (authData) {
      try {
        const parsed = JSON.parse(authData)
        // Optional: Check if session expired (24 hours)
        const maxAge = 24 * 60 * 60 * 1000 // 24 hours
        if (parsed.timestamp && Date.now() - parsed.timestamp > maxAge) {
          clearAuth()
          return null
        }
        return { 
          username: parsed.username, 
          role: parsed.role || 'admin',
          isAuthenticated: parsed.isAuthenticated 
        }
      } catch {
        return null
      }
    }
  }
  return null
}

export function clearAuth() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_KEY)
  }
}

export function isAuthenticated(): boolean {
  const auth = getAuth()
  return auth?.isAuthenticated === true
}

export function getUserRole(): UserRole | null {
  const auth = getAuth()
  return auth?.role || null
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
