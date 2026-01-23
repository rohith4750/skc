import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isEmail, isNonEmptyString, isPhone, validateRequiredFields } from '@/lib/validation'

const allowedOrigins = new Set([
  'https://www.skconline.in',
  'https://skconline.in',
  'https://www.skccaterers.in',
  'https://skccaterers.in',
])

const allowedMethods = 'POST, OPTIONS'
const allowedHeaders = 'Content-Type'

const buildCorsHeaders = (origin: string | null) => {
  if (!origin) return null
  if (!allowedOrigins.has(origin)) return null

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': allowedMethods,
    'Access-Control-Allow-Headers': allowedHeaders,
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

const normalizeSource = (value: string) => {
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return 'unknown'

  try {
    const url = trimmed.includes('://') ? new URL(trimmed) : new URL(`https://${trimmed}`)
    return url.hostname
  } catch {
    return trimmed
  }
}

const buildSource = (origin: string | null, fallbackHost: string | null, bodySource: unknown) => {
  if (isNonEmptyString(bodySource)) return normalizeSource(bodySource)
  if (isNonEmptyString(origin)) return normalizeSource(origin)
  if (isNonEmptyString(fallbackHost)) return normalizeSource(fallbackHost)
  return 'unknown'
}

const parseBody = async (req: Request) => {
  try {
    return await req.json()
  } catch {
    return null
  }
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get('origin')
  const corsHeaders = buildCorsHeaders(origin)

  if (origin && !corsHeaders) {
    return new NextResponse(null, { status: 403 })
  }

  return new NextResponse(null, { status: 204, headers: corsHeaders ?? undefined })
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin')
  const corsHeaders = buildCorsHeaders(origin)

  if (origin && !corsHeaders) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 })
  }

  const data = await parseBody(req)
  if (!data || typeof data !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400, headers: corsHeaders ?? undefined })
  }

  const missingFields = validateRequiredFields(data, ['name', 'phone', 'email', 'subject', 'message'])
  if (missingFields) {
    return NextResponse.json(
      { error: 'Missing required fields', details: missingFields },
      { status: 400, headers: corsHeaders ?? undefined }
    )
  }

  if (!isEmail(data.email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400, headers: corsHeaders ?? undefined })
  }

  if (!isPhone(data.phone)) {
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400, headers: corsHeaders ?? undefined })
  }

  try {
    const source = buildSource(origin, req.headers.get('host'), data.source)
    const enquiry = await (prisma as any).enquiry.create({
      data: {
        name: (data.name as string).trim(),
        phone: (data.phone as string).trim(),
        email: (data.email as string).trim(),
        subject: (data.subject as string).trim(),
        message: (data.message as string).trim(),
        source,
      },
      select: {
        id: true,
        createdAt: true,
        source: true,
      },
    }) as { id: string; createdAt: Date; source: string }

    return NextResponse.json(
      { success: true, enquiryId: enquiry.id, createdAt: enquiry.createdAt, source: enquiry.source },
      { status: 201, headers: corsHeaders ?? undefined }
    )
  } catch (error) {
    console.error('Error creating enquiry:', error)
    return NextResponse.json({ error: 'Failed to create enquiry' }, { status: 500, headers: corsHeaders ?? undefined })
  }
}
