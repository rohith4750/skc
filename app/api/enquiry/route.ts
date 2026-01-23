import { NextRequest, NextResponse } from 'next/server'
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

const getCorsHeaders = (origin: string | null) => {
  if (!origin) return null
  if (!allowedOrigins.has(origin)) return null

  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', origin)
  headers.set('Access-Control-Allow-Methods', allowedMethods)
  headers.set('Access-Control-Allow-Headers', allowedHeaders)
  headers.set('Access-Control-Max-Age', '86400')
  headers.set('Vary', 'Origin')
  return headers
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

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  if (origin && !corsHeaders) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 })
  }
  return new NextResponse(null, { status: 204, headers: corsHeaders ?? undefined })
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  if (origin && !corsHeaders) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 })
  }

  try {
    let data: any
    try {
      data = await request.json()
    } catch {
      const response = NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
      if (corsHeaders) corsHeaders.forEach((value, key) => response.headers.set(key, value))
      return response
    }
    if (!data || typeof data !== 'object') {
      const response = NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
      if (corsHeaders) corsHeaders.forEach((value, key) => response.headers.set(key, value))
      return response
    }
    const missingFields = validateRequiredFields(data, ['name', 'phone', 'email', 'subject', 'message'])
    if (missingFields) {
      const response = NextResponse.json(
        { error: 'Missing required fields', details: missingFields },
        { status: 400 }
      )
      if (corsHeaders) corsHeaders.forEach((value, key) => response.headers.set(key, value))
      return response
    }

    if (!isEmail(data.email)) {
      const response = NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
      if (corsHeaders) corsHeaders.forEach((value, key) => response.headers.set(key, value))
      return response
    }

    if (!isPhone(data.phone)) {
      const response = NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
      if (corsHeaders) corsHeaders.forEach((value, key) => response.headers.set(key, value))
      return response
    }

    const source = buildSource(origin, request.headers.get('host'), data.source)

    const enquiry = await (prisma as any).enquiry.create({
      data: {
        name: data.name.trim(),
        phone: data.phone.trim(),
        email: data.email.trim(),
        subject: data.subject.trim(),
        message: data.message.trim(),
        source,
      },
      select: {
        id: true,
        createdAt: true,
        source: true,
      },
    }) as { id: string; createdAt: Date; source: string }

    const response = NextResponse.json(
      { success: true, enquiryId: enquiry.id, createdAt: enquiry.createdAt, source: enquiry.source },
      { status: 201 }
    )
    if (corsHeaders) corsHeaders.forEach((value, key) => response.headers.set(key, value))
    return response
  } catch (error: any) {
    console.error('Error creating enquiry:', error)
    const response = NextResponse.json(
      { error: 'Failed to create enquiry' },
      { status: 500 }
    )
    if (corsHeaders) corsHeaders.forEach((value, key) => response.headers.set(key, value))
    return response
  }
}
