import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { isNonEmptyString } from '@/lib/validation'

const allowedOrigins = new Set([
  'https://www.skconline.in',
  'https://skconline.in',
  'https://www.skccaterers.in',
  'https://skccaterers.in',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
])

const allowedMethods = 'POST, OPTIONS'
const allowedHeaders = 'Content-Type, Authorization'

const buildCorsHeaders = (origin: string | null) => {
  if (!origin) return null
  if (!allowedOrigins.has(origin)) return null

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': allowedMethods,
    'Access-Control-Allow-Headers': allowedHeaders,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
    'X-Cors-Debug': 'customer-auth-change-password',
  }
}

const extractCustomerToken = (request: NextRequest): string | null => {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim() || null
  }

  const cookieToken = request.cookies.get('skc_customer_token')?.value
  return cookieToken || null
}

const getAuthenticatedCustomerId = async (request: NextRequest) => {
  const token = extractCustomerToken(request)
  if (!token) return null

  const now = new Date()
  const session = await (prisma as any).customerSession.findUnique({
    where: { token },
  }) as any

  if (!session || session.revokedAt || session.expiresAt <= now) {
    return null
  }

  return session.customerId as string
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin')
  const corsHeaders = buildCorsHeaders(origin)

  if (origin && !corsHeaders) {
    return new NextResponse(null, { status: 403 })
  }

  return new NextResponse(null, { status: 204, headers: corsHeaders ?? undefined })
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const corsHeaders = buildCorsHeaders(origin)

  if (origin && !corsHeaders) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 })
  }

  try {
    const customerId = await getAuthenticatedCustomerId(request)
    if (!customerId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHENTICATED' },
        { status: 401, headers: corsHeaders ?? undefined },
      )
    }

    const { currentPassword, newPassword } = await request.json()

    if (!isNonEmptyString(currentPassword) || !isNonEmptyString(newPassword)) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400, headers: corsHeaders ?? undefined },
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400, headers: corsHeaders ?? undefined },
      )
    }

    const user = await (prisma as any).customerUser.findFirst({
      where: { customerId },
    }) as any

    if (!user) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404, headers: corsHeaders ?? undefined },
      )
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401, headers: corsHeaders ?? undefined },
      )
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    await (prisma as any).customerUser.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
      },
    })

    return NextResponse.json(
      { success: true, message: 'Password updated successfully' },
      { status: 200, headers: corsHeaders ?? undefined },
    )
  } catch (error: any) {
    console.error('Customer change password error:', error)
    return NextResponse.json(
      { error: 'Failed to change password', details: process.env.NODE_ENV === 'development' ? error?.message : undefined },
      { status: 500, headers: corsHeaders ?? undefined },
    )
  }
}

