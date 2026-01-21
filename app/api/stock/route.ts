import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isNonEmptyString, isNonNegativeNumber } from '@/lib/validation'
import { publishNotification } from '@/lib/notifications'

export async function GET() {
  try {
    const stock = await (prisma as any).stock.findMany({
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get latest transaction
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(stock)
  } catch (error: any) {
    console.error('Error fetching stock:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    if (!isNonEmptyString(data.name) || !isNonEmptyString(data.category) || !isNonEmptyString(data.unit)) {
      return NextResponse.json(
        { error: 'Name, category, and unit are required' },
        { status: 400 }
      )
    }
    if (data.currentStock !== undefined && !isNonNegativeNumber(parseFloat(data.currentStock))) {
      return NextResponse.json({ error: 'Current stock must be a valid number' }, { status: 400 })
    }

    // Validate category
    const validCategories = ['gas', 'store', 'vegetables', 'disposables']
    if (!validCategories.includes(data.category)) {
      return NextResponse.json(
        { error: 'Invalid category. Must be one of: gas, store, vegetables, disposables' },
        { status: 400 }
      )
    }

    // Create stock item
    const stock = await (prisma as any).stock.create({
      data: {
        name: data.name,
        category: data.category,
        unit: data.unit,
        currentStock: data.currentStock || 0,
        minStock: data.minStock || null,
        maxStock: data.maxStock || null,
        price: data.price || null,
        supplier: data.supplier || null,
        location: data.location || null,
        description: data.description || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    })

    // If initial stock is provided, create an initial transaction
    if (data.currentStock && data.currentStock > 0) {
      await (prisma as any).stockTransaction.create({
        data: {
          stockId: stock.id,
          type: 'in',
          quantity: data.currentStock,
          price: data.price || null,
          totalAmount: data.price ? data.currentStock * data.price : null,
          notes: 'Initial stock',
        },
      })
    }

    publishNotification({
      type: 'stock',
      title: 'Stock item created',
      message: `${stock.name} · ${stock.currentStock ?? 0} ${stock.unit || ''}`.trim(),
      entityId: stock.id,
      severity: 'success',
    })

    return NextResponse.json(stock, { status: 201 })
  } catch (error: any) {
    console.error('Error creating stock:', error)
    return NextResponse.json(
      { error: 'Failed to create stock item', details: error.message },
      { status: 500 }
    )
  }
}
