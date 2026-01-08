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
        }
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
    
    const order = await prisma.order.create({
      data: {
        customerId: data.customerId,
        supervisorId: data.supervisorId,
        totalAmount: data.totalAmount,
        advancePaid: data.advancePaid,
        remainingAmount: data.remainingAmount,
        status: data.status || 'pending',
        mealTypeAmounts: data.mealTypeAmounts && Object.keys(data.mealTypeAmounts).length > 0 ? data.mealTypeAmounts : null,
        stalls: data.stalls && Array.isArray(data.stalls) && data.stalls.length > 0 ? data.stalls : null,
        discount: data.discount || 0,
        items: {
          create: data.items.map((item: any) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity || 1,
          }))
        }
      },
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

    // Create bill
    const bill = await prisma.bill.create({
      data: {
        orderId: order.id,
        totalAmount: data.totalAmount,
        advancePaid: data.advancePaid,
        remainingAmount: data.remainingAmount,
        paidAmount: data.advancePaid,
        status: data.remainingAmount > 0 ? (data.advancePaid > 0 ? 'partial' : 'pending') : 'paid',
      }
    })

    return NextResponse.json({ order, bill })
  } catch (error: any) {
    console.error('Error creating order:', error)
    return NextResponse.json({ 
      error: 'Failed to create order', 
      details: error.message || 'Unknown error' 
    }, { status: 500 })
  }
}
