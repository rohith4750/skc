/**
 * API route auth: get Bearer token from request and verify access token.
 * Use in each API route that requires authentication.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken, AccessPayload } from '@/lib/jwt'

/**
 * Get access token from httpOnly cookie
 */
function getAccessTokenFromCookie(request: NextRequest): string | null {
  return request.cookies.get('accessToken')?.value || null
}

/**
 * Legacy: Get bearer token from Authorization header
 * Kept for backward compatibility, but httpOnly cookie is preferred
 */
function getBearerToken(request: NextRequest): string | null {
  const auth = request.headers.get('authorization')
  if (!auth || !auth.startsWith('Bearer ')) return null
  return auth.slice(7).trim() || null
}

/**
 * Require valid access token from httpOnly cookie (or fallback to Bearer header).
 * Returns payload and response.
 * If unauthorized: returns NextResponse.json(..., { status: 401 }) and payload is null.
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ payload: AccessPayload; response: null } | { payload: null; response: NextResponse }> {
  // Try cookie first (preferred method)
  let token = getAccessTokenFromCookie(request)
  
  // Fallback to Authorization header for backward compatibility
  if (!token) {
    token = getBearerToken(request)
  }
  
  if (!token) {
    return {
      payload: null,
      response: NextResponse.json({ error: 'Unauthorized - No access token' }, { status: 401 }),
    }
  }
  
  try {
    const payload = await verifyAccessToken(token)
    return { payload, response: null }
  } catch (error: any) {
    return {
      payload: null,
      response: NextResponse.json(
        { error: 'Unauthorized - Invalid or expired token' },
        { status: 401 }
      ),
    }
  }
}
