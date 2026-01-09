import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
      include: {
        order: {
          include: {
            customer: true
          }
        }
      }
    })
    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }
    return NextResponse.json(expense)
  } catch (error) {
    console.error('Error fetching expense:', error)
    return NextResponse.json({ error: 'Failed to fetch expense' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const expense = await prisma.expense.update({
      where: { id: params.id },
      data: {
        orderId: data.orderId || null,
        category: data.category,
        amount: data.amount,
        description: data.description || null,
        recipient: data.recipient || null,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
        eventDate: data.eventDate ? new Date(data.eventDate) : null,
        notes: data.notes || null,
        calculationDetails: data.calculationDetails || null,
      },
      include: {
        order: {
          include: {
            customer: true
          }
        }
      }
    })
    return NextResponse.json(expense)
  } catch (error: any) {
    console.error('Error updating expense:', error)
    return NextResponse.json({ 
      error: 'Failed to update expense', 
      details: error.message || 'Unknown error' 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.expense.delete({
      where: { id: params.id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
  }
}
