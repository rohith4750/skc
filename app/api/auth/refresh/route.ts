import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRefreshToken, createAccessToken } from '@/lib/jwt'

const REFRESH_COOKIE_NAME = 'refreshToken'

/**
 * POST /api/auth/refresh
 * Refreshes the access token using the refresh token from httpOnly cookie
 */
export async function POST(request: NextRequest) {
  try {
    // Get refresh token from httpOnly cookie
    const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token found' },
        { status: 401 }
      )
    }

    // Verify refresh token
    let payload
    try {
      payload = await verifyRefreshToken(refreshToken)
    } catch (error) {
      // Invalid or expired refresh token
      const response = NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      )
      
      // Clear both cookies
      response.cookies.delete('accessToken')
      response.cookies.delete(REFRESH_COOKIE_NAME)
      
      return response
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
      const response = NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 401 }
      )
      
      // Clear both cookies
      response.cookies.delete('accessToken')
      response.cookies.delete(REFRESH_COOKIE_NAME)
      
      return response
    }

    // Create new access token
    const newAccessToken = await createAccessToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    })

    // Return user data
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    })

    // Set new access token in httpOnly cookie
    response.cookies.set('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error('Token refresh error:', error)
    
    const response = NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    )
    
    // Clear both cookies on error
    response.cookies.delete('accessToken')
    response.cookies.delete(REFRESH_COOKIE_NAME)
    
    return response
  }
}
