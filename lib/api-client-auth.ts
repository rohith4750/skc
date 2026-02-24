/**
 * Enhanced API client that automatically handles token refresh
 * Uses httpOnly cookies - no manual token management needed
 */

let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

/**
 * Refresh the access token
 */
async function refreshToken(): Promise<boolean> {
  // If already refreshing, wait for that to complete
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  isRefreshing = true
  refreshPromise = (async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok) {
        console.log('Token refreshed successfully')
        return true
      }

      console.log('Token refresh failed')
      return false
    } catch (error) {
      console.error('Token refresh error:', error)
      return false
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

/**
 * Fetch with automatic token refresh
 * Retries once with refreshed token if the first request returns 401
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Always include credentials to send cookies
  const fetchOptions: RequestInit = {
    ...options,
    credentials: 'include',
  }

  // First attempt
  let response = await fetch(url, fetchOptions)

  // If unauthorized, try to refresh token and retry
  if (response.status === 401) {
    console.log('Got 401, attempting token refresh...')
    
    const refreshed = await refreshToken()
    
    if (refreshed) {
      console.log('Token refreshed, retrying request...')
      // Retry the original request
      response = await fetch(url, fetchOptions)
    } else {
      // Refresh failed, dispatch event for auth context to handle
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }
  }

  return response
}

/**
 * JSON fetch with automatic token refresh
 */
export async function fetchJSON<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetchWithAuth(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * API helper functions
 */
export const api = {
  get: <T = any>(url: string, options?: RequestInit) =>
    fetchJSON<T>(url, { ...options, method: 'GET' }),

  post: <T = any>(url: string, body?: any, options?: RequestInit) =>
    fetchJSON<T>(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = any>(url: string, body?: any, options?: RequestInit) =>
    fetchJSON<T>(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = any>(url: string, body?: any, options?: RequestInit) =>
    fetchJSON<T>(url, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(url: string, options?: RequestInit) =>
    fetchJSON<T>(url, { ...options, method: 'DELETE' }),
}
