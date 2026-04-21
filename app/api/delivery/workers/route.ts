import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const workers = await (prisma.workforce as any).findMany({
      where: {
        role: 'transport'
      },
      select: {
        id: true,
        name: true
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(workers)
  } catch (error) {
    console.error('Workforce List API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
