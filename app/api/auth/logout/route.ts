import { NextRequest, NextResponse } from 'next/server'

const REFRESH_COOKIE_NAME = 'refreshToken'

/**
 * POST /api/auth/logout
 * Logs out the user by clearing authentication cookies
 */
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    })

    // Clear access token cookie
    response.cookies.delete('accessToken')
    
    // Clear refresh token cookie
    response.cookies.delete(REFRESH_COOKIE_NAME)

    return response
  } catch (error: any) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    )
  }
}
