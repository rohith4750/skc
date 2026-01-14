import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        supervisor: true,
        items: {
          include: { menuItem: true }
        },
        bills: true,
        expenses: true
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()

    // -------- STATUS UPDATE (MOST IMPORTANT PART) --------
    if (data.status && Object.keys(data).length === 1) {
      const order = await prisma.order.update({
        where: { id: params.id },
        data: { status: data.status },
      })

      let bill = await prisma.bill.findUnique({
        where: { orderId: params.id }
      })

      // Create bill ONLY when order starts or completes
      if (!bill && ['in-progress', 'completed'].includes(data.status)) {
        bill = await prisma.bill.create({
          data: {
            orderId: params.id,
            totalAmount: order.totalAmount,
            advancePaid: order.advancePaid,
            remainingAmount: order.remainingAmount,
            paidAmount: order.advancePaid,
            status:
              order.remainingAmount > 0
                ? order.advancePaid > 0
                  ? 'partial'
                  : 'pending'
                : 'paid',
          },
        })
      }

      // If order completed → mark bill paid
      if (bill && data.status === 'completed') {
        bill = await prisma.bill.update({
          where: { id: bill.id },
          data: {
            paidAmount: bill.totalAmount,
            remainingAmount: 0,
            status: 'paid',
          },
        })

        await prisma.order.update({
          where: { id: params.id },
          data: {
            advancePaid: bill.totalAmount,
            remainingAmount: 0,
          },
        })
      }

      return NextResponse.json({ order, bill })
    }

    return NextResponse.json({ error: 'Invalid update' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update order', details: error.message },
      { status: 500 }
    )
  }
}
