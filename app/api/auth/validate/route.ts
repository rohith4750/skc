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
        permissions: true,
      },
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'User not found or inactive', isAuthenticated: false },
        { status: 401 }
      )
    }

    // Fetch role permissions
    const rolePermissionsRec = await prisma.rolePermission.findUnique({
      where: { role: user.role as any }
    })
    
    let permissionsList: string[] = []
    if (rolePermissionsRec) {
      permissionsList = rolePermissionsRec.permissions
    } else {
      const { menuData } = require('@/constants/menu')
      if (user.role === 'super_admin') {
        permissionsList = menuData.map((m: any) => m.route)
      } else if (user.role === 'admin') {
        permissionsList = menuData
          .filter((m: any) => !['/expenses', '/expenses/store-calculator', '/workforce/outstanding', '/workforce', '/analytics', '/audit-logs', '/enquiries', '/stock', '/inventory'].includes(m.route))
          .map((m: any) => m.route)
      } else if (user.role === 'transport_admin') {
        permissionsList = ['/', '/alerts', '/admin/delivery-map', '/users', '/profile']
      } else if (user.role === 'transport') {
        permissionsList = ['/', '/admin/delivery-map', '/profile']
      } else if (user.role === 'chef' || user.role === 'supervisor') {
        permissionsList = ['/', '/reports/prep-list', '/profile']
      }
    }

    const userPermissions = user.permissions || []
    const mergedPermissions = Array.from(new Set([...permissionsList, ...userPermissions]))

    // Return user data
    return NextResponse.json({
      isAuthenticated: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      permissions: mergedPermissions,
    })
  } catch (error: any) {
    console.error('Token validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate token', isAuthenticated: false },
      { status: 500 }
    )
  }
}
