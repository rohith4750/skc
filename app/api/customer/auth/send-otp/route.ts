import { NextRequest, NextResponse } from 'next/server'
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
    'X-Cors-Debug': 'customer-auth-send-otp',
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
  const source = isNonEmptyString((data as any).source)
    ? ((data as any).source as string).trim()
    : undefined

  if (!isNonEmptyString(contact)) {
    return NextResponse.json(
      { error: 'Contact (phone) is required' },
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
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000) // 10 minutes
  const code = String(Math.floor(100000 + Math.random() * 900000))

  try {
    // Create OTP entry. We intentionally do not expose whether a customer exists for this phone.
    await prisma.customerOtp.create({
      data: {
        phone: contact,
        code,
        source,
        expiresAt,
      },
    })

    // In production, you should integrate with an SMS provider (e.g., Twilio / WhatsApp)
    // and NOT log OTPs. For now, log only in non-production for debugging.
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log(`[Customer OTP] Phone: ${contact}, Code: ${code}`)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'OTP sent successfully',
        expiresInSeconds: 10 * 60,
        // Helpful for local development only
        ...(process.env.NODE_ENV !== 'production' ? { debugCode: code } : {}),
      },
      { status: 201, headers: corsHeaders ?? undefined },
    )
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Error creating customer OTP:', error)
    return NextResponse.json(
      { error: 'Failed to send OTP', details: error?.message || String(error) },
      { status: 500, headers: corsHeaders ?? undefined },
    )
  }
}

