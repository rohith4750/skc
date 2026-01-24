import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'
import { isNonEmptyString, isPhone } from '@/lib/validation'

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
    'X-Cors-Debug': 'customer-auth-verify-otp',
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

  const contact = isNonEmptyString((data as any).contact)
    ? ((data as any).contact as string).trim()
    : ''
  const otp = isNonEmptyString((data as any).otp)
    ? ((data as any).otp as string).trim()
    : ''
  const source = isNonEmptyString((data as any).source)
    ? ((data as any).source as string).trim()
    : undefined

  if (!isNonEmptyString(contact) || !isNonEmptyString(otp)) {
    return NextResponse.json(
      { error: 'Contact and OTP are required' },
      { status: 400, headers: corsHeaders ?? undefined },
    )
  }

  if (!isPhone(contact)) {
    return NextResponse.json(
      { error: 'Invalid phone number' },
      { status: 400, headers: corsHeaders ?? undefined },
    )
  }

  const now = new Date()

  try {
    // Find a matching, unexpired OTP
    const existingOtp = await (prisma as any).customerOtp.findFirst({
      where: {
        phone: contact,
        code: otp,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!existingOtp) {
      // Increment attempts for the latest OTP on this phone (if any), but do not leak details to client
      const latestForPhone = await (prisma as any).customerOtp.findFirst({
        where: { phone: contact },
        orderBy: { createdAt: 'desc' },
      })

      if (latestForPhone) {
        await (prisma as any).customerOtp.update({
          where: { id: latestForPhone.id },
          data: { attempts: latestForPhone.attempts + 1 },
        })
      }

      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400, headers: corsHeaders ?? undefined },
      )
    }

    // Mark OTP as verified
    await (prisma as any).customerOtp.update({
      where: { id: existingOtp.id },
      data: {
        verifiedAt: now,
        attempts: existingOtp.attempts + 1,
        source: source ?? existingOtp.source,
      },
    })

    // Look up customer by phone
    const customer = await prisma.customer.findFirst({
      where: { phone: contact },
      orderBy: { createdAt: 'asc' },
    })

    if (!customer) {
      // OTP is correct, but we don't have a customer yet.
      // Let UI decide whether to show "no orders yet" or ask user to place an order first.
      return NextResponse.json(
        {
          success: true,
          token: null,
          customer: null,
          code: 'CUSTOMER_NOT_FOUND',
          message: 'OTP verified, but no customer found for this phone. Please place an order first.',
        },
        { status: 200, headers: corsHeaders ?? undefined },
      )
    }

    const token = randomUUID()
    const sessionTtlDays = 30
    const expiresAt = new Date(now.getTime() + sessionTtlDays * 24 * 60 * 60 * 1000)

    const userAgent = req.headers.get('user-agent') ?? undefined
    const forwardedFor = req.headers.get('x-forwarded-for')
    const realIp = req.headers.get('x-real-ip')
    const ipAddress = (forwardedFor?.split(',')[0] || realIp || undefined) as string | undefined

    await (prisma as any).customerSession.create({
      data: {
        customerId: customer.id,
        token,
        expiresAt,
        userAgent,
        ipAddress,
      },
    })

    const response = NextResponse.json(
      {
        success: true,
        token,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        },
      },
      { status: 200, headers: corsHeaders ?? undefined },
    )

    const secure = process.env.NODE_ENV === 'production'
    const maxAgeSeconds = sessionTtlDays * 24 * 60 * 60

    response.cookies.set('skc_customer_token', token, {
      httpOnly: true,
      secure,
      sameSite: secure ? 'none' : 'lax',
      path: '/',
      maxAge: maxAgeSeconds,
    })

    return response
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Error verifying customer OTP:', error)
    return NextResponse.json(
      { error: 'Failed to verify OTP', details: error?.message || String(error) },
      { status: 500, headers: corsHeaders ?? undefined },
    )
  }
}

