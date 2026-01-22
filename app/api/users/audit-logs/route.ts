import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const where = userId ? { userId } : {}
    
    const logs = await (prisma as any).loginAuditLog.findMany({
      where,
      orderBy: { loginTime: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            username: true,
            email: true,
            role: true,
          }
        }
      }
    })
    
    return NextResponse.json(logs)
  } catch (error: any) {
    console.error('Error fetching audit logs:', error)
    // If table doesn't exist, return empty array
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      return NextResponse.json([])
    }
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}

