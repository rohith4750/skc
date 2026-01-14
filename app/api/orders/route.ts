import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
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
        bills: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(orders)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Convert amounts to numbers to ensure proper type
    const totalAmount = parseFloat(data.totalAmount) || 0
    const advancePaid = parseFloat(data.advancePaid) || 0
    const remainingAmount = parseFloat(data.remainingAmount) || (totalAmount - advancePaid)
    const discount = parseFloat(data.discount) || 0
    
    // Build order data, only include supervisorId if it has a valid value
    const orderData: any = {
      customerId: data.customerId,
      totalAmount: totalAmount,
      advancePaid: advancePaid,
      remainingAmount: remainingAmount,
      status: data.status || 'pending',
      eventName: data.eventName || null,
      services: data.services && Array.isArray(data.services) && data.services.length > 0 ? data.services : null,
      numberOfMembers: data.numberOfMembers || null,
      mealTypeAmounts: data.mealTypeAmounts && Object.keys(data.mealTypeAmounts).length > 0 ? data.mealTypeAmounts : null,
      stalls: data.stalls && Array.isArray(data.stalls) && data.stalls.length > 0 ? data.stalls : null,
      discount: discount,
      items: {
        create: data.items.map((item: any) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity || 1,
        }))
      }
    }
    
    // Only include supervisorId if it has a valid value (not empty string or null)
    if (data.supervisorId && data.supervisorId.trim && data.supervisorId.trim() !== '') {
      orderData.supervisorId = data.supervisorId
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

    return NextResponse.json({ order }, { status: 201 })
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
