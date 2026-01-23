import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isNonEmptyString, isNonNegativeNumber } from '@/lib/validation'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const inventory = await (prisma as any).inventory.findUnique({
      where: { id: params.id },
    })

    if (!inventory) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(inventory)
  } catch (error: any) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory item', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()

    // Validate category if provided
    if (data.category) {
      const validCategories = ['glasses', 'vessels', 'cooking_utensils', 'serving_items', 'storage', 'other']
      if (!validCategories.includes(data.category)) {
        return NextResponse.json(
          { error: 'Invalid category. Must be one of: glasses, vessels, cooking_utensils, serving_items, storage, other' },
          { status: 400 }
        )
      }
    }

    // Validate condition if provided
    if (data.condition) {
      const validConditions = ['good', 'fair', 'damaged', 'repair']
      if (!validConditions.includes(data.condition)) {
        return NextResponse.json(
          { error: 'Invalid condition. Must be one of: good, fair, damaged, repair' },
          { status: 400 }
        )
      }
    }

    if (data.name !== undefined && !isNonEmptyString(data.name)) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (data.unit !== undefined && !isNonEmptyString(data.unit)) {
      return NextResponse.json({ error: 'Unit is required' }, { status: 400 })
    }
    if (data.quantity !== undefined && !isNonNegativeNumber(parseFloat(data.quantity))) {
      return NextResponse.json({ error: 'Quantity must be a valid number' }, { status: 400 })
    }
    if (data.minQuantity !== undefined && data.minQuantity !== null && !isNonNegativeNumber(parseFloat(data.minQuantity))) {
      return NextResponse.json({ error: 'Min quantity must be a valid number' }, { status: 400 })
    }
    if (data.purchasePrice !== undefined && data.purchasePrice !== null && !isNonNegativeNumber(parseFloat(data.purchasePrice))) {
      return NextResponse.json({ error: 'Purchase price must be a valid number' }, { status: 400 })
    }

    // Build update data
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.category !== undefined) updateData.category = data.category
    if (data.quantity !== undefined) updateData.quantity = data.quantity
    if (data.minQuantity !== undefined) updateData.minQuantity = data.minQuantity
    if (data.unit !== undefined) updateData.unit = data.unit
    if (data.condition !== undefined) updateData.condition = data.condition
    if (data.location !== undefined) updateData.location = data.location
    if (data.supplier !== undefined) updateData.supplier = data.supplier
    if (data.purchaseDate !== undefined) updateData.purchaseDate = data.purchaseDate
    if (data.purchasePrice !== undefined) updateData.purchasePrice = data.purchasePrice
    if (data.description !== undefined) updateData.description = data.description
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const inventory = await (prisma as any).inventory.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(inventory)
  } catch (error: any) {
    console.error('Error updating inventory:', error)
    return NextResponse.json(
      { error: 'Failed to update inventory item', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await (prisma as any).inventory.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Inventory item deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting inventory:', error)
    return NextResponse.json(
      { error: 'Failed to delete inventory item', details: error.message },
      { status: 500 }
    )
  }
}
