import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isNonEmptyString, isNonNegativeNumber } from '@/lib/validation'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const stock = await (prisma as any).stock.findUnique({
      where: { id: params.id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50, // Get last 50 transactions
        },
      },
    })

    if (!stock) {
      return NextResponse.json(
        { error: 'Stock item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(stock)
  } catch (error: any) {
    console.error('Error fetching stock:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock item', details: error.message },
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
      const validCategories = ['gas', 'store', 'vegetables', 'disposables']
      if (!validCategories.includes(data.category)) {
        return NextResponse.json(
          { error: 'Invalid category. Must be one of: gas, store, vegetables, disposables' },
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
    if (data.minStock !== undefined && !isNonNegativeNumber(parseFloat(data.minStock))) {
      return NextResponse.json({ error: 'Minimum stock must be a valid number' }, { status: 400 })
    }
    if (data.maxStock !== undefined && !isNonNegativeNumber(parseFloat(data.maxStock))) {
      return NextResponse.json({ error: 'Maximum stock must be a valid number' }, { status: 400 })
    }
    if (data.price !== undefined && !isNonNegativeNumber(parseFloat(data.price))) {
      return NextResponse.json({ error: 'Price must be a valid number' }, { status: 400 })
    }

    // Build update data
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.category !== undefined) updateData.category = data.category
    if (data.unit !== undefined) updateData.unit = data.unit
    if (data.minStock !== undefined) updateData.minStock = data.minStock
    if (data.maxStock !== undefined) updateData.maxStock = data.maxStock
    if (data.price !== undefined) updateData.price = data.price
    if (data.supplier !== undefined) updateData.supplier = data.supplier
    if (data.location !== undefined) updateData.location = data.location
    if (data.description !== undefined) updateData.description = data.description
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const stock = await (prisma as any).stock.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(stock)
  } catch (error: any) {
    console.error('Error updating stock:', error)
    return NextResponse.json(
      { error: 'Failed to update stock item', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await (prisma as any).stock.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Stock item deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting stock:', error)
    return NextResponse.json(
      { error: 'Failed to delete stock item', details: error.message },
      { status: 500 }
    )
  }
}
