/**
 * API client: every request sends Authorization: Bearer <accessToken> from getToken().
 * On 401: clearAuth() and redirect to /login?reason=session_expired (no automatic refresh).
 */

import { getToken } from '@/lib/auth-storage'
import { clearAuth } from '@/lib/auth-storage'

const LOGIN_PATH = '/login'

function redirectToLogin(reason: string) {
  clearAuth()
  if (typeof window !== 'undefined') {
    const url = `${LOGIN_PATH}?reason=${encodeURIComponent(reason)}`
    window.location.href = url
  }
}

/**
 * Fetch with Bearer token. On 401, clears auth and redirects to login.
 * Use this for all authenticated API calls (or use fetchWithLoader which will use it).
 */
export async function apiClientFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const token = getToken()
  const headers = new Headers(init?.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(input, { ...init, headers })

  if (response.status === 401) {
    redirectToLogin('session_expired')
    // Return so callers don't double-handle; redirect is in progress
    return response
  }

  return response
}
