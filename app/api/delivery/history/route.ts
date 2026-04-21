import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const workforceId = searchParams.get('workforceId')
    const dateStr = searchParams.get('date')

    if (!workforceId || !dateStr) {
      return NextResponse.json({ error: 'Missing workforceId or date' }, { status: 400 })
    }

    const date = new Date(dateStr)
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)

    const locations = await (prisma as any).deliveryLocation.findMany({
      where: {
        workforceId,
        timestamp: {
          gte: start,
          lte: end
        }
      },
      orderBy: { timestamp: 'asc' },
      select: {
        lat: true,
        lng: true,
        timestamp: true
      }
    })

    return NextResponse.json(locations)
  } catch (error) {
    console.error('Tracking History API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
