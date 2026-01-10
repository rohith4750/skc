import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const bills = await prisma.bill.findMany({
      include: {
        order: {
          include: {
            customer: true,
            supervisor: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(bills)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const bill = await prisma.bill.update({
      where: { id: data.id },
      data: {
        paidAmount: data.paidAmount,
        remainingAmount: data.remainingAmount,
        status: data.status,
      }
    })
    
    // Update order
    await prisma.order.update({
      where: { id: bill.orderId },
      data: {
        advancePaid: data.paidAmount,
        remainingAmount: data.remainingAmount,
      }
    })

    return NextResponse.json(bill)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update bill' }, { status: 500 })
  }
}
