import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const where = userId ? { userId } : {}
    
    // Check if model exists on prisma client
    if (!(prisma as any).loginAuditLog) {
      console.log('LoginAuditLog model not found on prisma client - table may not exist yet')
      return NextResponse.json([])
    }
    
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
    // If table doesn't exist or any Prisma error, return empty array
    // This allows the page to load even if the migration hasn't been run yet
    if (
      error.code === 'P2021' || 
      error.code === 'P2010' ||
      error.message?.includes('does not exist') ||
      error.message?.includes('relation') ||
      error.message?.includes('table')
    ) {
      return NextResponse.json([])
    }
    // Return empty array for any error to prevent page from breaking
    return NextResponse.json([])
  }
}

