import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const workforce = await prisma.workforce.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(workforce)
  } catch (error: any) {
    console.error('Error fetching workforce:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workforce', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data.name || !data.role) {
      return NextResponse.json(
        { error: 'Name and role are required' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['chef', 'supervisor', 'transport']
    if (!validRoles.includes(data.role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: chef, supervisor, transport' },
        { status: 400 }
      )
    }

    // Create workforce member
    const workforce = await prisma.workforce.create({
      data: {
        name: data.name,
        role: data.role,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    })

    return NextResponse.json(workforce, { status: 201 })
  } catch (error: any) {
    console.error('Error creating workforce:', error)
    return NextResponse.json(
      { error: 'Failed to create workforce member', details: error.message },
      { status: 500 }
    )
  }
}
