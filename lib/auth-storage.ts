/**
 * Auth storage: JWT access token in sessionStorage; login state in localStorage.
 * - sessionStorage.authToken: cleared when tab closes
 * - localStorage: isLogin, userRole, permissions, user, optional rememberMe
 */

const AUTH_TOKEN_KEY = 'authToken'
const IS_LOGIN_KEY = 'isLogin'
const USER_ROLE_KEY = 'userRole'
const PERMISSIONS_KEY = 'permissions'
const USER_KEY = 'user'
const REMEMBER_ME_KEY = 'rememberMe'

export type UserRole = 'admin' | 'super_admin' | 'chef' | 'supervisor' | 'transport'

export interface StoredUser {
  id: string
  username: string
  email: string | null
  role: UserRole
}

function getSessionStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  return window.sessionStorage
}

function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

/** Get JWT access token from sessionStorage (cleared when tab closes). */
export function getToken(): string | null {
  const storage = getSessionStorage()
  if (!storage) return null
  return storage.getItem(AUTH_TOKEN_KEY)
}

/** Login state / UI: stored in localStorage. */
export function isLoggedIn(): boolean {
  const storage = getLocalStorage()
  if (!storage) return false
  return storage.getItem(IS_LOGIN_KEY) === 'true'
}

export function getStoredUser(): StoredUser | null {
  const storage = getLocalStorage()
  if (!storage) return null
  const raw = storage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredUser
  } catch {
    return null
  }
}

export function getStoredRole(): UserRole | null {
  const storage = getLocalStorage()
  if (!storage) return null
  const role = storage.getItem(USER_ROLE_KEY)
  if (!role) return null
  return role as UserRole
}

export function getStoredPermissions(): string[] {
  const storage = getLocalStorage()
  if (!storage) return []
  const raw = storage.getItem(PERMISSIONS_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Set auth after login: token in sessionStorage, user/role/permissions in localStorage.
 */
export function setAuth(
  token: string,
  user: StoredUser,
  permissions: string[] = [],
  rememberMe?: boolean
): void {
  const session = getSessionStorage()
  const local = getLocalStorage()
  if (!session || !local) return

  session.setItem(AUTH_TOKEN_KEY, token)
  local.setItem(IS_LOGIN_KEY, 'true')
  local.setItem(USER_ROLE_KEY, user.role)
  local.setItem(USER_KEY, JSON.stringify(user))
  local.setItem(PERMISSIONS_KEY, JSON.stringify(permissions))
  if (rememberMe !== undefined) {
    local.setItem(REMEMBER_ME_KEY, rememberMe ? 'true' : 'false')
  }
}

/**
 * Logout / expire: remove token from sessionStorage and all auth-related keys from localStorage.
 */
export function clearAuth(): void {
  const session = getSessionStorage()
  const local = getLocalStorage()
  if (session) session.removeItem(AUTH_TOKEN_KEY)
  if (local) {
    local.removeItem(IS_LOGIN_KEY)
    local.removeItem(USER_ROLE_KEY)
    local.removeItem(PERMISSIONS_KEY)
    local.removeItem(USER_KEY)
    local.removeItem(REMEMBER_ME_KEY)
  }
}
