import { apiClientFetch } from '@/lib/api-client'

/**
 * Fetch with global loader; sends Bearer token and on 401 clears auth and redirects to login.
 */
export const fetchWithLoader = async (input: RequestInfo | URL, init?: RequestInit) => {
  return apiClientFetch(input, init)
}
