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

const allowedMethods = 'GET, POST, OPTIONS'
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
    'X-Cors-Debug': 'customer-orders-list',
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

    const orders = await prisma.order.findMany({
      where: {
        customerId: customer.id,
      },
      orderBy: { createdAt: 'desc' },
    })

    const mapped = orders.map((order: any) => ({
      id: order.id,
      eventName: order.eventName,
      eventType: order.eventType,
      eventDate: order.eventDate ? order.eventDate.toISOString().split('T')[0] : null,
      city: order.city,
      guestCount: order.numberOfMembers,
      numberOfMembers: order.numberOfMembers,
      status: order.status,
      timeSlot: order.timeSlot,
      venueType: order.venueType,
      venueAddress: order.venueAddress || order.venue,
      venue: order.venue,
      menuPackage: order.menuPackage,
      specialRequests: order.specialRequests,
      internalNote: order.internalNote,
      sourceDomain: order.sourceDomain,
      mealTypes: order.mealTypeAmounts,
      stalls: order.stalls,
      totalAmount: order.totalAmount,
      advancePaid: order.advancePaid,
      balance: order.remainingAmount,
      createdAt: order.createdAt.toISOString(),
    }))

    return NextResponse.json(
      { orders: mapped },
      { status: 200, headers: corsHeaders ?? undefined },
    )
  } catch (error: any) {
    console.error('Error fetching customer orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error?.message || String(error) },
      { status: 500, headers: corsHeaders ?? undefined },
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()

    const orderData: any = {
      customerId: customer.id,
      eventName: body.eventName || 'Catering Booking',
      orderType: body.orderType === 'LUNCH_PACK' ? 'LUNCH_PACK' : 'EVENT',
      orderSource: 'CUSTOMER',
      eventDate: body.eventDate ? new Date(body.eventDate) : null,
      venue: body.venue || '',
      venueAddress: body.venue || '',
      numberOfMembers: parseInt(body.numberOfMembers) || 0,
      specialRequests: body.specialRequests || '',
      status: 'pending',
      totalAmount: 0,
      advancePaid: 0,
      remainingAmount: 0,
      mealTypeAmounts: body.mealTypes || [],
      stalls: body.stalls || [],
    }

    const newOrder = await prisma.order.create({
      data: orderData,
    })

    return NextResponse.json(
      { success: true, order: newOrder },
      { status: 201, headers: corsHeaders ?? undefined },
    )
  } catch (error: any) {
    console.error('Error creating customer order:', error)
    return NextResponse.json(
      { error: 'Failed to create customer order', details: error?.message || String(error) },
      { status: 500, headers: corsHeaders ?? undefined },
    )
  }
}
