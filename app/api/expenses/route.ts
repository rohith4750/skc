import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isNonEmptyString, isNonNegativeNumber } from '@/lib/validation'
import { publishNotification } from '@/lib/notifications'
import { requireAuth } from '@/lib/require-auth'
import { transformDecimal } from '@/lib/decimal-utils'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth.response) return auth.response
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const includeBulkAllocated = searchParams.get('includeBulkAllocated') === 'true'

    // Base query for direct orderId match
    let expenses = await prisma.expense.findMany({
      where: orderId ? { orderId } : {},
      include: {
        order: {
          include: {
            customer: true
          }
        }
      },
      orderBy: { paymentDate: 'desc' }
    })

    // If orderId is provided and we want to include bulk allocated expenses
    if (orderId && includeBulkAllocated) {
      // Also find bulk expenses that have this orderId in their allocations
      const bulkExpenses = await prisma.expense.findMany({
        where: {
          isBulkExpense: true,
          orderId: null  // Bulk expenses don't have a direct orderId
        },
        include: {
          order: {
            include: {
              customer: true
            }
          }
        }
      })

      // Filter bulk expenses that have allocation to this orderId
      const relevantBulkExpenses = bulkExpenses.filter(expense => {
        const allocations = expense.bulkAllocations as any[]
        return allocations?.some((alloc: any) => alloc.orderId === orderId)
      })

      // Combine and remove duplicates
      const expenseIds = new Set(expenses.map(e => e.id))
      relevantBulkExpenses.forEach(e => {
        if (!expenseIds.has(e.id)) {
          expenses.push(e)
        }
      })

      // Re-sort by payment date
      expenses.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
    }

    return NextResponse.json(transformDecimal(expenses))
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth.response) return auth.response
  try {
    const data = await request.json()

    if (!isNonEmptyString(data.category)) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }
    if (!isNonNegativeNumber(data.amount)) {
      return NextResponse.json({ error: 'Amount must be a valid number' }, { status: 400 })
    }

    // Verify order exists if orderId is provided
    if (data.orderId) {
      const orderExists = await prisma.order.findUnique({
        where: { id: data.orderId },
        select: { id: true }
      })
      if (!orderExists) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
    }

    // Validate bulk allocation if present
    const isBulkExpense = data.isBulkExpense === true
    let bulkAllocations = null

    if (isBulkExpense) {
      if (!data.bulkAllocations || !Array.isArray(data.bulkAllocations) || data.bulkAllocations.length < 2) {
        return NextResponse.json({
          error: 'Bulk expense must have at least 2 event allocations'
        }, { status: 400 })
      }

      // Validate total allocation matches the amount
      const totalAllocated = data.bulkAllocations.reduce((sum: number, alloc: any) => sum + (alloc.amount || 0), 0)
      if (Math.abs(totalAllocated - data.amount) > 0.01) {
        return NextResponse.json({
          error: `Allocation total (${totalAllocated.toFixed(2)}) must match expense amount (${data.amount.toFixed(2)})`
        }, { status: 400 })
      }

      bulkAllocations = data.bulkAllocations
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
        orderId: isBulkExpense ? null : (data.orderId || null), // Bulk expenses don't have direct orderId
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
        isBulkExpense: isBulkExpense,
        bulkAllocations: bulkAllocations,
        allocationMethod: isBulkExpense ? (data.allocationMethod || 'manual') : null,
      },
      include: {
        order: {
          include: {
            customer: true
          }
        }
      }
    })

    const eventCount = isBulkExpense ? data.bulkAllocations.length : 1
    publishNotification({
      type: 'expenses',
      title: isBulkExpense ? 'Bulk expense created' : 'Expense created',
      message: isBulkExpense
        ? `${expense.category} · ${Number(expense.amount || 0).toFixed(2)} (${eventCount} events)`
        : `${expense.category} · ${Number(expense.amount || 0).toFixed(2)}`,
      entityId: expense.id,
      severity: 'warning',
    })

    return NextResponse.json(transformDecimal(expense))
  } catch (error: any) {
    console.error('Error creating expense:', error)
    return NextResponse.json({
      error: 'Failed to create expense',
      details: error.message || 'Unknown error'
    }, { status: 500 })
  }
}
