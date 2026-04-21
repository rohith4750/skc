import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Fetch orders that are pending or in progress
    const activeOrders = await (prisma as any).order.findMany({
      where: {
        status: { in: ['pending', 'in_progress'] }
      },
      select: {
        id: true,
        eventName: true,
        venue: true,
        customer: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(activeOrders)
  } catch (error) {
    console.error('Delivery Orders API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
