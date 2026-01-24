import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isEmail, isNonEmptyString, isPhone } from '@/lib/validation'

const allowedOrigins = new Set([
  'https://www.skconline.in',
  'https://skconline.in',
  'https://www.skccaterers.in',
  'https://skccaterers.in',
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
    'X-Cors-Debug': 'customer-order-create',
  }
}

const parseBody = async (req: NextRequest) => {
  try {
    return await req.json()
  } catch {
    return null
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
  const session = await prisma.customerSession.findUnique({
    where: { token },
    include: { customer: true },
  })

  if (!session || session.revokedAt || session.expiresAt <= now) {
    return null
  }

  return session.customer
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

  const data = await parseBody(request)
  if (!data || typeof data !== 'object') {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400, headers: corsHeaders ?? undefined },
    )
  }

  const {
    eventType,
    eventDate,
    timeSlot,
    guestCount,
    venueType,
    city,
    venueAddress,
    menuPackage,
    specialRequests,
    internalNote,
    customerContact,
    sourceDomain,
    orderSource,
  } = data as any

  const contact = (customerContact ?? {}) as any
  const contactName = isNonEmptyString(contact.name) ? (contact.name as string).trim() : ''
  const contactEmail = isNonEmptyString(contact.email) ? (contact.email as string).trim() : ''
  const contactPhone = isNonEmptyString(contact.phone) ? (contact.phone as string).trim() : ''

  const missing: string[] = []
  if (!isNonEmptyString(eventType)) missing.push('eventType')
  if (!isNonEmptyString(eventDate)) missing.push('eventDate')
  if (!isNonEmptyString(timeSlot)) missing.push('timeSlot')
  if (guestCount === undefined || guestCount === null || Number.isNaN(Number(guestCount))) {
    missing.push('guestCount')
  }
  if (!isNonEmptyString(venueType)) missing.push('venueType')
  if (!isNonEmptyString(city)) missing.push('city')
  if (!isNonEmptyString(venueAddress)) missing.push('venueAddress')
  if (!isNonEmptyString(contactName)) missing.push('customerContact.name')
  if (!isNonEmptyString(contactPhone)) missing.push('customerContact.phone')
  if (!isNonEmptyString(contactEmail)) missing.push('customerContact.email')

  if (missing.length > 0) {
    return NextResponse.json(
      { error: 'Missing required fields', details: missing },
      { status: 400, headers: corsHeaders ?? undefined },
    )
  }

  if (!isPhone(contactPhone)) {
    return NextResponse.json(
      { error: 'Invalid phone number' },
      { status: 400, headers: corsHeaders ?? undefined },
    )
  }

  if (!isEmail(contactEmail)) {
    return NextResponse.json(
      { error: 'Invalid email address' },
      { status: 400, headers: corsHeaders ?? undefined },
    )
  }

  const guestCountNumber = Number(guestCount)
  if (!Number.isFinite(guestCountNumber) || guestCountNumber <= 0) {
    return NextResponse.json(
      { error: 'Invalid guestCount' },
      { status: 400, headers: corsHeaders ?? undefined },
    )
  }

  let parsedEventDate: Date | null = null
  if (isNonEmptyString(eventDate)) {
    const d = new Date(eventDate as string)
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json(
        { error: 'Invalid eventDate format. Expected ISO date string.' },
        { status: 400, headers: corsHeaders ?? undefined },
      )
    }
    parsedEventDate = d
  }

  try {
    // If a customer session exists, prefer that customer.
    const sessionCustomer = await getAuthenticatedCustomer(request)
    let customerId: string

    if (sessionCustomer) {
      customerId = sessionCustomer.id
      // Optionally keep customer master data in sync with latest contact info
      if (
        sessionCustomer.name !== contactName ||
        sessionCustomer.email !== contactEmail ||
        sessionCustomer.phone !== contactPhone
      ) {
        await prisma.customer.update({
          where: { id: sessionCustomer.id },
          data: {
            name: contactName,
            email: contactEmail,
            phone: contactPhone,
          },
        })
      }
    } else {
      // No authenticated session – link by phone if possible, otherwise create a new customer.
      const existing = await prisma.customer.findFirst({
        where: { phone: contactPhone },
        orderBy: { createdAt: 'asc' },
      })

      if (existing) {
        customerId = existing.id
        if (
          existing.name !== contactName ||
          existing.email !== contactEmail
        ) {
          await prisma.customer.update({
            where: { id: existing.id },
            data: {
              name: contactName,
              email: contactEmail,
            },
          })
        }
      } else {
        const address = `${city}${venueAddress ? ` - ${venueAddress}` : ''}`
        const newCustomer = await prisma.customer.create({
          data: {
            name: contactName,
            phone: contactPhone,
            email: contactEmail,
            address: address || 'Not provided',
          },
        })
        customerId = newCustomer.id
      }
    }

    const order = await prisma.order.create({
      data: {
        customerId,
        orderType: 'EVENT',
        orderSource: orderSource === 'ADMIN' ? 'ADMIN' : 'CUSTOMER',
        totalAmount: 0,
        advancePaid: 0,
        remainingAmount: 0,
        status: 'pending',
        eventName: eventType, // Simple default; admin can refine later
        eventType,
        eventDate: parsedEventDate,
        timeSlot: (timeSlot as string).trim(),
        venueType: (venueType as string).trim(),
        venue: `${city}${venueAddress ? ` - ${venueAddress}` : ''}`,
        venueAddress: (venueAddress as string).trim(),
        city: (city as string).trim(),
        menuPackage: isNonEmptyString(menuPackage) ? (menuPackage as string).trim() : null,
        specialRequests: isNonEmptyString(specialRequests) ? (specialRequests as string).trim() : null,
        internalNote: isNonEmptyString(internalNote) ? (internalNote as string).trim() : null,
        sourceDomain: isNonEmptyString(sourceDomain) ? (sourceDomain as string).trim() : null,
        customerContactName: contactName,
        customerContactEmail: contactEmail,
        customerContactPhone: contactPhone,
        numberOfMembers: guestCountNumber,
      },
      include: {
        customer: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        order: {
          id: order.id,
          status: order.status,
          eventType: order.eventType,
          eventDate: order.eventDate ? order.eventDate.toISOString().split('T')[0] : null,
          city: order.city,
          guestCount: order.numberOfMembers,
          timeSlot: order.timeSlot,
          venueType: order.venueType,
          venueAddress: order.venueAddress,
          menuPackage: order.menuPackage,
          specialRequests: order.specialRequests,
          internalNote: order.internalNote,
        },
      },
      { status: 201, headers: corsHeaders ?? undefined },
    )
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Error creating customer order:', error)
    return NextResponse.json(
      { error: 'Failed to create order', details: error?.message || String(error) },
      { status: 500, headers: corsHeaders ?? undefined },
    )
  }
}

