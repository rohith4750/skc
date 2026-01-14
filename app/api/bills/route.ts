import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const bills = await prisma.bill.findMany({
      include: {
        order: {
          include: {
            customer: true,
            supervisor: true,
            items: {
              include: {
                menuItem: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    const { searchParams } = new URL(request.url)
    const debug = searchParams.get('debug')

    if (debug === '1') {
      const dbInfo = await (prisma as any).$queryRaw`
        SELECT
          current_database() AS db,
          inet_server_addr() AS host,
          inet_server_port() AS port,
          current_user AS user
      `
      return NextResponse.json(
        { bills, debug: dbInfo?.[0] || null },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
      )
    }

    return NextResponse.json(bills, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    })
  } catch (error) {
    console.error('Bills fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bills' },
      { status: 500 }
    )
  }
}
