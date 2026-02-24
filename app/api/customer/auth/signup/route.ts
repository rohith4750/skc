import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { isEmail, isNonEmptyString, isPhone } from '@/lib/validation'

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
    'X-Cors-Debug': 'customer-auth-signup',
  }
}

const parseBody = async (req: NextRequest) => {
  try {
    return await req.json()
  } catch {
    return null
  }
}

const extractNameFromEmail = (email: string) => {
  const [localPart] = email.split('@')
  return localPart.replace(/[._]/g, ' ')
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

  const {
    name,
    email,
    phone,
    username,
    password,
    address,
    source,
  } = data as any

  const trimmedName = isNonEmptyString(name) ? (name as string).trim() : ''
  const trimmedEmail = isNonEmptyString(email) ? (email as string).trim().toLowerCase() : ''
  const trimmedPhone = isNonEmptyString(phone) ? (phone as string).trim() : ''
  const trimmedUsername = isNonEmptyString(username) ? (username as string).trim().toLowerCase() : ''
  const trimmedPassword = isNonEmptyString(password) ? (password as string).trim() : ''
  const trimmedAddress = isNonEmptyString(address) ? (address as string).trim() : ''
  const trimmedSource = isNonEmptyString(source) ? (source as string).trim() : undefined

  if (!isNonEmptyString(trimmedEmail) || !isEmail(trimmedEmail)) {
    return NextResponse.json(
      { error: 'Valid email is required' },
      { status: 400, headers: corsHeaders ?? undefined },
    )
  }

  if (!isNonEmptyString(trimmedPhone) || !isPhone(trimmedPhone)) {
    return NextResponse.json(
      { error: 'Valid phone number is required' },
      { status: 400, headers: corsHeaders ?? undefined },
    )
  }

  if (!isNonEmptyString(trimmedUsername)) {
    return NextResponse.json(
      { error: 'Username is required' },
      { status: 400, headers: corsHeaders ?? undefined },
    )
  }

  if (!isNonEmptyString(trimmedPassword) || trimmedPassword.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters' },
      { status: 400, headers: corsHeaders ?? undefined },
    )
  }

  const effectiveName = trimmedName || extractNameFromEmail(trimmedEmail)

  try {
    const existingUser = await (prisma as any).customerUser.findFirst({
      where: {
        OR: [
          { email: trimmedEmail },
          { username: trimmedUsername },
          { phone: trimmedPhone },
        ],
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Account already exists for this email, phone, or username' },
        { status: 409, headers: corsHeaders ?? undefined },
      )
    }

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        OR: [
          { phone: trimmedPhone },
          { email: trimmedEmail },
        ],
      },
      orderBy: { createdAt: 'asc' },
    })

    let customerId: string

    if (existingCustomer) {
      customerId = existingCustomer.id

      if (
        existingCustomer.name !== effectiveName ||
        existingCustomer.email !== trimmedEmail ||
        existingCustomer.phone !== trimmedPhone ||
        (trimmedAddress && existingCustomer.address !== trimmedAddress)
      ) {
        await prisma.customer.update({
          where: { id: existingCustomer.id },
          data: {
            name: effectiveName,
            email: trimmedEmail,
            phone: trimmedPhone,
            address: trimmedAddress || existingCustomer.address,
          },
        })
      }
    } else {
      const created = await prisma.customer.create({
        data: {
          name: effectiveName,
          email: trimmedEmail,
          phone: trimmedPhone,
          address: trimmedAddress || 'Not provided',
          message: trimmedSource,
        },
      })
      customerId = created.id
    }

    const passwordHash = await bcrypt.hash(trimmedPassword, 10)

    const user = await (prisma as any).customerUser.create({
      data: {
        customerId,
        phone: trimmedPhone,
        email: trimmedEmail,
        username: trimmedUsername,
        passwordHash,
      },
      include: {
        customer: true,
      },
    }) as any

    const now = new Date()
    const sessionTtlDays = 30
    const expiresAt = new Date(now.getTime() + sessionTtlDays * 24 * 60 * 60 * 1000)

    const userAgent = req.headers.get('user-agent') ?? undefined
    const forwardedFor = req.headers.get('x-forwarded-for')
    const realIp = req.headers.get('x-real-ip')
    const ipAddress = (forwardedFor?.split(',')[0] || realIp || undefined) as string | undefined

    const session = await (prisma as any).customerSession.create({
      data: {
        customerId,
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
          id: customerId,
          name: user.customer?.name ?? effectiveName,
          email: user.customer?.email ?? trimmedEmail,
          phone: user.customer?.phone ?? trimmedPhone,
        },
      },
      { status: 201, headers: corsHeaders ?? undefined },
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
    console.error('Customer signup error:', error)
    return NextResponse.json(
      { error: 'Failed to create account', details: process.env.NODE_ENV === 'development' ? error?.message : undefined },
      { status: 500, headers: corsHeaders ?? undefined },
    )
  }
}

