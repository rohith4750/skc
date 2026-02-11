import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isNonEmptyString, isPositiveNumber, isNonNegativeNumber, validateEnum } from '@/lib/validation'
import { publishNotification } from '@/lib/notifications'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transactions = await (prisma as any).stockTransaction.findMany({
      where: { stockId: params.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(transactions)
  } catch (error: any) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()

    if (!isNonEmptyString(data.type) || data.quantity === undefined) {
      return NextResponse.json(
        { error: 'Type and quantity are required' },
        { status: 400 }
      )
    }

    if (!validateEnum(data.type, ['in', 'out'])) {
      return NextResponse.json(
        { error: 'Type must be "in" or "out"' },
        { status: 400 }
      )
    }
    const quantity = parseFloat(data.quantity)
    if (!isPositiveNumber(quantity)) {
      return NextResponse.json({ error: 'Quantity must be greater than 0' }, { status: 400 })
    }
    if (data.price !== undefined && data.price !== null && !isNonNegativeNumber(parseFloat(data.price))) {
      return NextResponse.json({ error: 'Price must be a valid number' }, { status: 400 })
    }

    // Get current stock
    const stock = await (prisma as any).stock.findUnique({
      where: { id: params.id },
    })

    if (!stock) {
      return NextResponse.json(
        { error: 'Stock item not found' },
        { status: 404 }
      )
    }

    // Calculate new stock level
    let newStock = Number(stock.currentStock)
    if (data.type === 'in') {
      newStock = Number(stock.currentStock) + quantity
    } else if (data.type === 'out') {
      newStock = Number(stock.currentStock) - quantity
      if (newStock < 0) {
        return NextResponse.json(
          { error: 'Insufficient stock. Available: ' + Number(stock.currentStock) },
          { status: 400 }
        )
      }
    }

    // Calculate total amount if price is provided
    const price = data.price ? parseFloat(data.price) : null
    const totalAmount = price !== null ? quantity * price : null

    // Create transaction
    const transaction = await (prisma as any).stockTransaction.create({
      data: {
        stockId: params.id,
        type: data.type,
        quantity: quantity,
        price: price,
        totalAmount: totalAmount,
        reference: data.reference || null,
        notes: data.notes || null,
      },
    })

    // Update stock level
    await (prisma as any).stock.update({
      where: { id: params.id },
      data: { currentStock: newStock },
    })

    publishNotification({
      type: 'stock',
      title: 'Stock transaction',
      message: `${stock.name} · ${data.type.toUpperCase()} ${quantity} ${stock.unit || ''}`.trim(),
      entityId: transaction.id,
      severity: data.type === 'out' ? 'warning' : 'info',
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error: any) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction', details: error.message },
      { status: 500 }
    )
  }
}
