import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isNonEmptyString, isNonNegativeNumber } from '@/lib/validation'
import { publishNotification } from '@/lib/notifications'
import { requireAuth } from '@/lib/require-auth'
import { transformDecimal } from '@/lib/decimal-utils'

const PAYMENT_TOLERANCE = 0.01

const derivePaymentStatus = (paidAmount: number, amount: number): 'pending' | 'partial' | 'paid' => {
  if (paidAmount <= 0) return 'pending'
  if (paidAmount >= amount) return 'paid'
  return 'partial'
}

const parseNonNegativeAmount = (value: unknown): number | null => {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return parsed
}

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
            customer: true,
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    })

    // If orderId is provided and we want to include bulk allocated expenses
    if (orderId && includeBulkAllocated) {
      // Also find bulk expenses that have this orderId in their allocations
      const bulkExpenses = await prisma.expense.findMany({
        where: {
          isBulkExpense: true,
          orderId: null, // Bulk expenses don't have a direct orderId
        },
        include: {
          order: {
            include: {
              customer: true,
            },
          },
        },
      })

      // Filter bulk expenses that have allocation to this orderId
      const relevantBulkExpenses = bulkExpenses.filter((expense) => {
        const allocations = expense.bulkAllocations as any[]
        return allocations?.some((alloc: any) => alloc.orderId === orderId)
      })

      // Combine and remove duplicates
      const expenseIds = new Set(expenses.map((e) => e.id))
      relevantBulkExpenses.forEach((e) => {
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

    const amount = data.amount as number
    const paidAmountInput = data.paidAmount === undefined || data.paidAmount === '' ? 0 : data.paidAmount
    const paidAmount = parseNonNegativeAmount(paidAmountInput)

    if (paidAmount === null) {
      return NextResponse.json({ error: 'Paid amount must be a valid non-negative number' }, { status: 400 })
    }
    if (paidAmount > amount + PAYMENT_TOLERANCE) {
      return NextResponse.json({ error: 'Paid amount cannot exceed total amount' }, { status: 400 })
    }

    const paymentStatus = derivePaymentStatus(paidAmount, amount)

    // Verify order exists if orderId is provided for non-bulk expense
    if (data.orderId && data.isBulkExpense !== true) {
      const orderExists = await prisma.order.findUnique({
        where: { id: data.orderId },
        select: { id: true },
      })
      if (!orderExists) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
    }

    // Validate bulk allocation if present
    const isBulkExpense = data.isBulkExpense === true
    let bulkAllocations: any[] | null = null

    if (isBulkExpense) {
      if (!Array.isArray(data.bulkAllocations) || data.bulkAllocations.length < 2) {
        return NextResponse.json(
          {
            error: 'Bulk expense must have at least 2 event allocations',
          },
          { status: 400 },
        )
      }

      const normalizedAllocations = data.bulkAllocations.map((alloc: any) => ({
        ...alloc,
        orderId: typeof alloc?.orderId === 'string' ? alloc.orderId.trim() : '',
        amount: parseNonNegativeAmount(alloc?.amount),
      }))

      const hasInvalidAllocation = normalizedAllocations.some((alloc: any) => {
        return !isNonEmptyString(alloc.orderId) || alloc.amount === null
      })

      if (hasInvalidAllocation) {
        return NextResponse.json({ error: 'Each allocation must include valid orderId and amount' }, { status: 400 })
      }

      const validAllocations = normalizedAllocations as Array<{ orderId: string; amount: number; [key: string]: any }>
      const uniqueOrderIds = Array.from(new Set(validAllocations.map((alloc) => alloc.orderId)))

      if (uniqueOrderIds.length < 2) {
        return NextResponse.json({ error: 'Bulk expense must include at least 2 different events' }, { status: 400 })
      }

      const existingOrdersCount = await prisma.order.count({
        where: {
          id: {
            in: uniqueOrderIds,
          },
        },
      })

      if (existingOrdersCount !== uniqueOrderIds.length) {
        return NextResponse.json({ error: 'One or more selected events were not found' }, { status: 404 })
      }

      // Validate total allocation matches the amount
      const totalAllocated = validAllocations.reduce((sum, alloc) => sum + alloc.amount, 0)
      if (Math.abs(totalAllocated - amount) > PAYMENT_TOLERANCE) {
        return NextResponse.json(
          {
            error: `Allocation total (${totalAllocated.toFixed(2)}) must match expense amount (${amount.toFixed(2)})`,
          },
          { status: 400 },
        )
      }

      bulkAllocations = validAllocations
    }

    const expense = await prisma.expense.create({
      data: {
        orderId: isBulkExpense ? null : data.orderId || null,
        category: data.category,
        amount,
        paidAmount,
        paymentStatus,
        description: data.description || null,
        recipient: data.recipient || null,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
        eventDate: data.eventDate ? new Date(data.eventDate) : null,
        notes: data.notes || null,
        calculationDetails: data.calculationDetails || null,
        isBulkExpense,
        bulkAllocations: bulkAllocations || undefined,
        allocationMethod: isBulkExpense ? data.allocationMethod || 'manual' : null,
      },
      include: {
        order: {
          include: {
            customer: true,
          },
        },
      },
    })

    const eventCount = isBulkExpense ? bulkAllocations?.length || 0 : 1
    publishNotification({
      type: 'expenses',
      title: isBulkExpense ? 'Bulk expense created' : 'Expense created',
      message: isBulkExpense
        ? `${expense.category} - ${Number(expense.amount || 0).toFixed(2)} (${eventCount} events)`
        : `${expense.category} - ${Number(expense.amount || 0).toFixed(2)}`,
      entityId: expense.id,
      severity: 'warning',
    })

    return NextResponse.json(transformDecimal(expense))
  } catch (error: any) {
    console.error('Error creating expense:', error)
    return NextResponse.json(
      {
        error: 'Failed to create expense',
        details: error.message || 'Unknown error',
      },
      { status: 500 },
    )
  }
}
