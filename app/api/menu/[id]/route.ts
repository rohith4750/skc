import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateRequiredFields } from '@/lib/validation'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const missingFields = validateRequiredFields(data, ['name', 'type'])
    if (missingFields) {
      return NextResponse.json(
        { error: 'Missing required fields', details: missingFields },
        { status: 400 }
      )
    }
    const menuItem = await prisma.menuItem.update({
      where: { id: params.id },
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
        isActive: data.isActive,
      }
    })
    return NextResponse.json(menuItem)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update menu item' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.menuItem.delete({
      where: { id: params.id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete menu item' }, { status: 500 })
  }
}
