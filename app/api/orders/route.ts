import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isNonNegativeNumber, isNonEmptyString } from '@/lib/validation'
import { publishNotification } from '@/lib/notifications'
import { requireAuth } from '@/lib/require-auth'
import { transformDecimal } from '@/lib/decimal-utils'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth.response) return auth.response
  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: true,
        supervisor: true,
        items: {
          include: {
            menuItem: true
          }
        },
        bill: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(transformDecimal(orders))
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth.response) return auth.response
  try {
    const data = await request.json()

    if (!isNonEmptyString(data.customerId)) {
      return NextResponse.json({ error: 'Customer is required' }, { status: 400 })
    }
    if (!Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json({ error: 'At least one menu item is required' }, { status: 400 })
    }

    // Verify customer exists
    const customerExists = await prisma.customer.findUnique({
      where: { id: data.customerId },
      select: { id: true }
    })

    if (!customerExists) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Convert amounts to numbers to ensure proper type
    const totalAmount = parseFloat(data.totalAmount) || 0
    const advancePaid = parseFloat(data.advancePaid) || 0
    const remainingAmount = parseFloat(data.remainingAmount) || (totalAmount - advancePaid)

    if (!isNonNegativeNumber(totalAmount) || !isNonNegativeNumber(advancePaid) || !isNonNegativeNumber(remainingAmount)) {
      return NextResponse.json({ error: 'Invalid amounts' }, { status: 400 })
    }
    const discount = parseFloat(data.discount) || 0
    const transportCost = parseFloat(data.transportCost) || 0

    const orderData: any = {
      customerId: data.customerId,
      totalAmount: totalAmount,
      advancePaid: advancePaid,
      remainingAmount: remainingAmount,
      status: data.status === 'in-progress' ? 'in_progress' : (data.status || 'pending'),
      eventName: data.eventName || null,
      services: data.services && Array.isArray(data.services) && data.services.length > 0 ? data.services : null,
      numberOfMembers: data.numberOfMembers || null,
      mealTypeAmounts: data.mealTypeAmounts && Object.keys(data.mealTypeAmounts).length > 0 ? data.mealTypeAmounts : null,
      stalls: data.stalls && Array.isArray(data.stalls) && data.stalls.length > 0 ? data.stalls : null,
      transportCost: transportCost,
      discount: discount,
      items: {
        create: data.items.map((item: any) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity || 1,
          mealType: item.mealType || null, // Store which meal type this item was selected for
        }))
      }
    }

    // Create order only - bills will be generated when status changes to in-progress or completed
    const order = await prisma.order.create({
      data: orderData,
      include: {
        customer: true,
        supervisor: true,
        items: {
          include: {
            menuItem: true
          }
        }
      }
    })

    console.log('Order created successfully:', { orderId: order.id })

    const customerName = order.customer?.name || 'Customer'
    publishNotification({
      type: 'orders',
      title: 'Order created',
      message: `${customerName} · Total ${totalAmount.toFixed(2)}`,
      entityId: order.id,
      severity: 'success',
    })

    if (advancePaid > 0) {
      publishNotification({
        type: 'payments',
        title: 'Advance received',
        message: `${customerName} · Advance ${advancePaid.toFixed(2)}`,
        entityId: order.id,
        severity: 'info',
      })
    }

    return NextResponse.json({ order: transformDecimal(order) }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating order:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    })
    return NextResponse.json({
      error: 'Failed to create order',
      details: error.message || 'Unknown error',
      code: error.code
    }, { status: 500 })
  }
}
