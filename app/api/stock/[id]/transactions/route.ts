import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    if (!data.type || !data.quantity) {
      return NextResponse.json(
        { error: 'Type and quantity are required' },
        { status: 400 }
      )
    }

    if (!['in', 'out'].includes(data.type)) {
      return NextResponse.json(
        { error: 'Type must be "in" or "out"' },
        { status: 400 }
      )
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
    let newStock = stock.currentStock
    if (data.type === 'in') {
      newStock = stock.currentStock + data.quantity
    } else if (data.type === 'out') {
      newStock = stock.currentStock - data.quantity
      if (newStock < 0) {
        return NextResponse.json(
          { error: 'Insufficient stock. Available: ' + stock.currentStock },
          { status: 400 }
        )
      }
    }

    // Calculate total amount if price is provided
    const totalAmount = data.price ? data.quantity * data.price : null

    // Create transaction
    const transaction = await (prisma as any).stockTransaction.create({
      data: {
        stockId: params.id,
        type: data.type,
        quantity: data.quantity,
        price: data.price || null,
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

    return NextResponse.json(transaction, { status: 201 })
  } catch (error: any) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction', details: error.message },
      { status: 500 }
    )
  }
}
