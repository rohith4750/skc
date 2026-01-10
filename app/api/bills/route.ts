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

