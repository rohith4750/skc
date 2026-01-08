import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const menuItems = await prisma.menuItem.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(menuItems)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const menuItem = await prisma.menuItem.create({
      data: {
        name: data.name,
        type: data.type,
        description: data.description,
        isActive: data.isActive !== undefined ? data.isActive : true,
      }
    })
    return NextResponse.json(menuItem)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 })
  }
}
