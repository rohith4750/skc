import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { isEmail, isNonEmptyString } from '@/lib/validation'

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
    'X-Cors-Debug': 'customer-auth-reset-password',
  }
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
    const { email, code, newPassword } = await request.json()

    if (!isEmail(email) || !isNonEmptyString(code) || !isNonEmptyString(newPassword)) {
      return NextResponse.json(
        { error: 'Email, code, and new password are required' },
        { status: 400, headers: corsHeaders ?? undefined },
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400, headers: corsHeaders ?? undefined },
      )
    }

    const lowerEmail = (email as string).trim().toLowerCase()

    const user = await (prisma as any).customerUser.findFirst({
      where: { email: lowerEmail },
    }) as any

    if (!user || !user.resetToken || user.resetToken !== code) {
      return NextResponse.json(
        { error: 'Invalid email or code' },
        { status: 401, headers: corsHeaders ?? undefined },
      )
    }

    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return NextResponse.json(
        { error: 'Code has expired. Please request a new one.' },
        { status: 401, headers: corsHeaders ?? undefined },
      )
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    await (prisma as any).customerUser.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    })

    return NextResponse.json(
      { success: true, message: 'Password reset successfully' },
      { status: 200, headers: corsHeaders ?? undefined },
    )
  } catch (error: any) {
    console.error('Customer reset password error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: process.env.NODE_ENV === 'development' ? error?.message : undefined },
      { status: 500, headers: corsHeaders ?? undefined },
    )
  }
}

