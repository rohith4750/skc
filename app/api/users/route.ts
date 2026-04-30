import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { isEmail, isNonEmptyString, validateRequiredFields } from '@/lib/validation'
import { requireAuth } from '@/lib/require-auth'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth.response) return auth.response
  
  const currentUserRole = auth.payload.role

  try {
    const where: any = {}
    
    // If transport_admin, only show transport users
    if (currentUserRole === 'transport_admin') {
      where.role = 'transport'
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
    return NextResponse.json(users)
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth.response) return auth.response
  
  const currentUserRole = auth.payload.role

  try {
    const data = await request.json()

    const missingFields = validateRequiredFields(data, ['username', 'email', 'password', 'role'])
    if (missingFields) {
      return NextResponse.json(
        { error: 'Missing required fields', details: missingFields },
        { status: 400 }
      )
    }

    // Role-based permissions
    if (currentUserRole === 'transport_admin') {
      if (data.role !== 'transport') {
        return NextResponse.json(
          { error: 'Transport Admin can only create users with "transport" role' },
          { status: 403 }
        )
      }
    } else if (currentUserRole !== 'super_admin' && currentUserRole !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions to create users' },
        { status: 403 }
      )
    }

    if (!isEmail(data.email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }
    if (!isNonEmptyString(data.password) || data.password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Validate role
    const validRoles = ['admin', 'super_admin', 'transport_admin', 'transport']
    if (!validRoles.includes(data.role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash,
        role: data.role,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
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

    return NextResponse.json(user, { status: 201 })
  } catch (error: any) {
    console.error('Error creating user:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'User with this username or email already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create user', details: error.message },
      { status: 500 }
    )
  }
}
