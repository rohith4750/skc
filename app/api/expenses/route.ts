import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isNonEmptyString, isNonNegativeNumber } from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    
    const where = orderId ? { orderId } : {}
    
    const expenses = await prisma.expense.findMany({
      where,
      include: {
        order: {
          include: {
            customer: true
          }
        }
      },
      orderBy: { paymentDate: 'desc' }
    })
    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    if (!isNonEmptyString(data.category)) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }
    if (!isNonNegativeNumber(data.amount)) {
      return NextResponse.json({ error: 'Amount must be a valid number' }, { status: 400 })
    }
    
    // Calculate payment status if not provided
    const paidAmount = data.paidAmount !== undefined ? data.paidAmount : (data.amount || 0)
    let paymentStatus = data.paymentStatus
    
    if (!paymentStatus) {
      if (paidAmount === 0) {
        paymentStatus = 'pending'
      } else if (paidAmount >= data.amount) {
        paymentStatus = 'paid'
      } else {
        paymentStatus = 'partial'
      }
    }
    
    const expense = await prisma.expense.create({
      data: {
        orderId: data.orderId || null,
        category: data.category,
        amount: data.amount,
        paidAmount: paidAmount,
        paymentStatus: paymentStatus,
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
    console.error('Error creating expense:', error)
    return NextResponse.json({ 
      error: 'Failed to create expense', 
      details: error.message || 'Unknown error' 
    }, { status: 500 })
  }
}
