import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { isEmail, isNonEmptyString } from '@/lib/validation'

import { requireAuth } from '@/lib/require-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(request)
  if (auth.response) return auth.response
  
  const currentUserRole = auth.payload.role

  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // If transport_admin, only allow seeing transport users
    if (currentUserRole === 'transport_admin' && user.role !== 'transport') {
      return NextResponse.json(
        { error: 'Forbidden - Transport Admin can only access transport users' },
        { status: 403 }
      )
    }

    return NextResponse.json(user)
  } catch (error: any) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(request)
  if (auth.response) return auth.response
  
  const currentUserRole = auth.payload.role

  try {
    const data = await request.json()

    // Get current target user data
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Role-based permissions
    if (currentUserRole === 'transport_admin') {
      // transport_admin can only update 'transport' users
      if (targetUser.role !== 'transport') {
        return NextResponse.json(
          { error: 'Transport Admin can only update users with "transport" role' },
          { status: 403 }
        )
      }
      // transport_admin cannot change role to anything other than 'transport'
      if (data.role && data.role !== 'transport') {
        return NextResponse.json(
          { error: 'Transport Admin can only set role to "transport"' },
          { status: 403 }
        )
      }
    } else if (currentUserRole !== 'super_admin' && currentUserRole !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Validate role if provided
    if (data.role) {
      const validRoles = ['admin', 'super_admin', 'transport_admin', 'transport']
      if (!validRoles.includes(data.role)) {
        return NextResponse.json(
          { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
          { status: 400 }
        )
      }
    }

    if (data.username !== undefined && !isNonEmptyString(data.username)) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }
    if (data.email !== undefined && !isEmail(data.email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }
    if (data.password !== undefined && (!isNonEmptyString(data.password) || data.password.length < 6)) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Build update data
    const updateData: any = {}
    
    if (data.username !== undefined) updateData.username = data.username
    if (data.email !== undefined) updateData.email = data.email
    if (data.role !== undefined) updateData.role = data.role
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    
    // Hash password if provided
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10)
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return NextResponse.json(user)
  } catch (error: any) {
    console.error('Error updating user:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'User with this username or email already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update user', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(request)
  if (auth.response) return auth.response
  
  const currentUserRole = auth.payload.role

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Role-based permissions
    if (currentUserRole === 'transport_admin') {
      if (user.role !== 'transport') {
        return NextResponse.json(
          { error: 'Transport Admin can only delete users with "transport" role' },
          { status: 403 }
        )
      }
    } else if (currentUserRole !== 'super_admin') {
      // Only super_admin can delete other admins
      return NextResponse.json({ error: 'Only Super Admin can delete users' }, { status: 403 })
    }

    // Don't allow deleting super_admin users (safety measure)
    if (user.role === 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot delete super admin users' },
        { status: 403 }
      )
    }

    await prisma.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user', details: error.message },
      { status: 500 }
    )
  }
}
