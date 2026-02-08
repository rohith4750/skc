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
    'X-Cors-Debug': 'customer-auth-login',
  }
}

const parseBody = async (req: NextRequest) => {
  try {
    return await req.json()
  } catch {
    return null
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

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin')
  const corsHeaders = buildCorsHeaders(origin)

  if (origin && !corsHeaders) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 })
  }

  const data = await parseBody(req)
  if (!data || typeof data !== 'object') {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400, headers: corsHeaders ?? undefined },
    )
  }

  const identifier = isNonEmptyString((data as any).identifier)
    ? ((data as any).identifier as string).trim()
    : ''
  const password = isNonEmptyString((data as any).password)
    ? ((data as any).password as string).trim()
    : ''

  if (!isNonEmptyString(identifier) || !isNonEmptyString(password)) {
    return NextResponse.json(
      { error: 'Email / username and password are required' },
      { status: 400, headers: corsHeaders ?? undefined },
    )
  }

  const now = new Date()

  try {
    const user = await (prisma as any).customerUser.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { username: identifier.toLowerCase() },
          { phone: identifier },
        ],
      },
      include: {
        customer: true,
      },
    }) as any

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401, headers: corsHeaders ?? undefined },
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401, headers: corsHeaders ?? undefined },
      )
    }

    const sessionTtlDays = 30
    const expiresAt = new Date(now.getTime() + sessionTtlDays * 24 * 60 * 60 * 1000)

    const userAgent = req.headers.get('user-agent') ?? undefined
    const forwardedFor = req.headers.get('x-forwarded-for')
    const realIp = req.headers.get('x-real-ip')
    const ipAddress = (forwardedFor?.split(',')[0] || realIp || undefined) as string | undefined

    const session = await (prisma as any).customerSession.create({
      data: {
        customerId: user.customerId,
        token: crypto.randomUUID(),
        expiresAt,
        userAgent,
        ipAddress,
      },
    }) as any

    const response = NextResponse.json(
      {
        success: true,
        token: session.token,
        customer: {
          id: user.customer?.id ?? user.customerId,
          name: user.customer?.name,
          email: user.customer?.email ?? user.email,
          phone: user.customer?.phone ?? user.phone,
        },
      },
      { status: 200, headers: corsHeaders ?? undefined },
    )

    const secure = process.env.NODE_ENV === 'production'
    const maxAgeSeconds = sessionTtlDays * 24 * 60 * 60

    response.cookies.set('skc_customer_token', session.token, {
      httpOnly: true,
      secure,
      sameSite: secure ? 'none' : 'lax',
      path: '/',
      maxAge: maxAgeSeconds,
    })

    return response
  } catch (error: any) {
    console.error('Customer login error:', error)
    return NextResponse.json(
      { error: 'Failed to login', details: process.env.NODE_ENV === 'development' ? error?.message : undefined },
      { status: 500, headers: corsHeaders ?? undefined },
    )
  }
}

