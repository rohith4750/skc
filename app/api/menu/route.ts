import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateRequiredFields } from '@/lib/validation'
import { requireAuth } from '@/lib/require-auth'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth.response) return auth.response
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
  const auth = await requireAuth(request)
  if (auth.response) return auth.response
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
        // @ts-ignore
        price: data.price,
        // @ts-ignore
        unit: data.unit,
        isActive: data.isActive !== undefined ? data.isActive : true,
      }
    })
    return NextResponse.json(menuItem)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 })
  }
}
