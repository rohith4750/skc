import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const inventory = await (prisma as any).inventory.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(inventory)
  } catch (error: any) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data.name || !data.category || !data.unit) {
      return NextResponse.json(
        { error: 'Name, category, and unit are required' },
        { status: 400 }
      )
    }

    // Validate category
    const validCategories = ['glasses', 'vessels', 'cooking_utensils', 'serving_items', 'storage', 'other']
    if (!validCategories.includes(data.category)) {
      return NextResponse.json(
        { error: 'Invalid category. Must be one of: glasses, vessels, cooking_utensils, serving_items, storage, other' },
        { status: 400 }
      )
    }

    // Validate condition
    const validConditions = ['good', 'fair', 'damaged', 'repair']
    if (data.condition && !validConditions.includes(data.condition)) {
      return NextResponse.json(
        { error: 'Invalid condition. Must be one of: good, fair, damaged, repair' },
        { status: 400 }
      )
    }

    // Create inventory item
    const inventory = await (prisma as any).inventory.create({
      data: {
        name: data.name,
        category: data.category,
        quantity: data.quantity || 0,
        unit: data.unit,
        condition: data.condition || 'good',
        location: data.location || null,
        supplier: data.supplier || null,
        purchaseDate: data.purchaseDate || null,
        purchasePrice: data.purchasePrice || null,
        description: data.description || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    })

    return NextResponse.json(inventory, { status: 201 })
  } catch (error: any) {
    console.error('Error creating inventory:', error)
    return NextResponse.json(
      { error: 'Failed to create inventory item', details: error.message },
      { status: 500 }
    )
  }
}
