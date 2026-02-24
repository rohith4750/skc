import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isPublicPath } from '@/lib/constants'
import * as jose from 'jose'

/**
 * Middleware: Checks JWT tokens from httpOnly cookies
 * - Public paths are allowed through
 * - Protected paths require valid access token
 * - If access token is expired but refresh token exists, redirect to refresh
 * - API routes are protected individually via requireAuth()
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Skip auth check for API routes (they handle their own auth)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Get tokens from cookies
  const accessToken = request.cookies.get('accessToken')?.value
  const refreshToken = request.cookies.get('refreshToken')?.value

  // No tokens at all - redirect to login
  if (!accessToken && !refreshToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verify access token
  if (accessToken) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET)
      await jose.jwtVerify(accessToken, secret)
      // Token is valid, allow request
      return NextResponse.next()
    } catch (error) {
      // Access token is invalid or expired
      console.log('Access token invalid/expired:', error)
    }
  }

  // Access token invalid/expired, but refresh token exists
  if (refreshToken) {
    try {
      // Verify refresh token is at least valid format
      const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET)
      await jose.jwtVerify(refreshToken, refreshSecret)
      
      // Refresh token is valid - redirect to refresh endpoint
      // The frontend will handle calling /api/auth/refresh
      return NextResponse.next()
    } catch (error) {
      // Refresh token also invalid - redirect to login
      console.log('Refresh token invalid/expired:', error)
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      const response = NextResponse.redirect(loginUrl)
      
      // Clear invalid cookies
      response.cookies.delete('accessToken')
      response.cookies.delete('refreshToken')
      
      return response
    }
  }

  // No valid tokens - redirect to login
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('redirect', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|images/).*)',
  ],
}
