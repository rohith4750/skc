import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const allowedOrigins = new Set([
  'https://www.skconline.in',
  'https://skconline.in',
  'https://www.skccaterers.in',
  'https://skccaterers.in',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
])

const allowedMethods = 'GET, OPTIONS'
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
    'X-Cors-Debug': 'customer-auth-me',
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

const getAuthenticatedCustomer = async (request: NextRequest) => {
  const token = extractCustomerToken(request)
  if (!token) return null

  const now = new Date()
  const session = await (prisma as any).customerSession.findUnique({
    where: { token },
    include: { customer: true },
  }) as any

  if (!session || session.revokedAt || session.expiresAt <= now) {
    return null
  }

  return session.customer as any
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin')
  const corsHeaders = buildCorsHeaders(origin)

  if (origin && !corsHeaders) {
    return new NextResponse(null, { status: 403 })
  }

  return new NextResponse(null, { status: 204, headers: corsHeaders ?? undefined })
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  const corsHeaders = buildCorsHeaders(origin)

  if (origin && !corsHeaders) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 })
  }

  try {
    const customer = await getAuthenticatedCustomer(request)

    if (!customer) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHENTICATED' },
        { status: 401, headers: corsHeaders ?? undefined },
      )
    }

    const user = await (prisma as any).customerUser.findFirst({
      where: { customerId: customer.id },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        passwordHash: true,
      },
    }) as any

    return NextResponse.json(
      {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        username: user?.username ?? null,
        hasPassword: !!user?.passwordHash,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      },
      { status: 200, headers: corsHeaders ?? undefined },
    )
  } catch (error: any) {
    console.error('Customer me error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile', details: process.env.NODE_ENV === 'development' ? error?.message : undefined },
      { status: 500, headers: corsHeaders ?? undefined },
    )
  }
}

