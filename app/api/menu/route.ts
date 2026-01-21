import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateRequiredFields } from '@/lib/validation'

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
    const missingFields = validateRequiredFields(data, ['name', 'type'])
    if (missingFields) {
      return NextResponse.json(
        { error: 'Missing required fields', details: missingFields },
        { status: 400 }
      )
    }
    const menuItem = await prisma.menuItem.create({
      data: {
        name: data.name,
        nameTelugu: data.nameTelugu,
        type: data.type,
        description: data.description,
        descriptionTelugu: data.descriptionTelugu,
        isActive: data.isActive !== undefined ? data.isActive : true,
      }
    })
    return NextResponse.json(menuItem)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 })
  }
}
