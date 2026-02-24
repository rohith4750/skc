import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/auth/validate
 * Validates the current access token and returns user info
 */
export async function GET(request: NextRequest) {
  try {
    // Get access token from httpOnly cookie
    const accessToken = request.cookies.get('accessToken')?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token found', isAuthenticated: false },
        { status: 401 }
      )
    }

    // Verify access token
    let payload
    try {
      payload = await verifyAccessToken(accessToken)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired access token', isAuthenticated: false },
        { status: 401 }
      )
    }

    // Get user from database to ensure they still exist and are active
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
      return NextResponse.json(
        { error: 'User not found or inactive', isAuthenticated: false },
        { status: 401 }
      )
    }

    // Return user data
    return NextResponse.json({
      isAuthenticated: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error: any) {
    console.error('Token validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate token', isAuthenticated: false },
      { status: 500 }
    )
  }
}
