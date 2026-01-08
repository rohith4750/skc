import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supervisors = await prisma.supervisor.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(supervisors)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch supervisors' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const supervisor = await prisma.supervisor.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        cateringServiceName: data.cateringServiceName,
        isActive: data.isActive !== undefined ? data.isActive : true,
      }
    })
    return NextResponse.json(supervisor)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create supervisor' }, { status: 500 })
  }
}
