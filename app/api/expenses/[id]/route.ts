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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request)
  if (auth.response) return auth.response

  try {
    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
      include: {
        order: {
          include: {
            customer: true,
          },
        },
      },
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    return NextResponse.json(transformDecimal(expense))
  } catch (error) {
    console.error('Error fetching expense:', error)
    return NextResponse.json({ error: 'Failed to fetch expense' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request)
  if (auth.response) return auth.response

  try {
    const data = await request.json()

    if (data.category !== undefined && !isNonEmptyString(data.category)) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }
    if (data.amount !== undefined && !isNonNegativeNumber(data.amount)) {
      return NextResponse.json({ error: 'Amount must be a valid number' }, { status: 400 })
    }

    const existingExpense = await prisma.expense.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        amount: true,
        paidAmount: true,
        isBulkExpense: true,
      },
    })

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    const isBulkExpense = data.isBulkExpense !== undefined ? data.isBulkExpense === true : existingExpense.isBulkExpense

    const rawAmount = data.amount !== undefined ? data.amount : Number(existingExpense.amount)
    const amount = parseNonNegativeAmount(rawAmount)
    if (amount === null) {
      return NextResponse.json({ error: 'Amount must be a valid number' }, { status: 400 })
    }

    const rawPaidAmount =
      data.paidAmount !== undefined
        ? (data.paidAmount === '' ? 0 : data.paidAmount)
        : Number(existingExpense.paidAmount ?? 0)
    const paidAmount = parseNonNegativeAmount(rawPaidAmount)
    if (paidAmount === null) {
      return NextResponse.json({ error: 'Paid amount must be a valid non-negative number' }, { status: 400 })
    }
    if (paidAmount > amount + PAYMENT_TOLERANCE) {
      return NextResponse.json({ error: 'Paid amount cannot exceed total amount' }, { status: 400 })
    }

    // Verify order exists if orderId is provided for non-bulk expense
    if (data.orderId && !isBulkExpense) {
      const orderExists = await prisma.order.findUnique({
        where: { id: data.orderId },
        select: { id: true },
      })
      if (!orderExists) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
    }

    let bulkAllocations: any[] | null | undefined = undefined

    if (isBulkExpense) {
      if (data.isBulkExpense === true && data.bulkAllocations === undefined) {
        return NextResponse.json({ error: 'Bulk expense update must include allocations' }, { status: 400 })
      }

      if (data.bulkAllocations !== undefined) {
        if (!Array.isArray(data.bulkAllocations) || data.bulkAllocations.length < 2) {
          return NextResponse.json({ error: 'Bulk expense must have at least 2 event allocations' }, { status: 400 })
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
    } else if (data.bulkAllocations !== undefined && data.bulkAllocations !== null) {
      return NextResponse.json({ error: 'Bulk allocations are allowed only for bulk expenses' }, { status: 400 })
    }

    const updateData: any = {}

    if (data.orderId !== undefined) updateData.orderId = isBulkExpense ? null : data.orderId || null
    else if (data.isBulkExpense === true) updateData.orderId = null

    if (data.category !== undefined) updateData.category = data.category
    if (data.amount !== undefined) updateData.amount = amount
    if (data.paidAmount !== undefined) updateData.paidAmount = paidAmount

    const shouldUpdatePaymentStatus = data.amount !== undefined || data.paidAmount !== undefined || data.paymentStatus !== undefined
    if (shouldUpdatePaymentStatus) {
      updateData.paymentStatus = derivePaymentStatus(paidAmount, amount)
    }

    if (data.description !== undefined) updateData.description = data.description || null
    if (data.recipient !== undefined) updateData.recipient = data.recipient || null
    if (data.paymentDate !== undefined) updateData.paymentDate = data.paymentDate ? new Date(data.paymentDate) : new Date()
    if (data.eventDate !== undefined) updateData.eventDate = data.eventDate ? new Date(data.eventDate) : null
    if (data.notes !== undefined) updateData.notes = data.notes || null
    if (data.calculationDetails !== undefined) updateData.calculationDetails = data.calculationDetails || null

    if (data.isBulkExpense !== undefined) updateData.isBulkExpense = isBulkExpense

    if (bulkAllocations !== undefined) updateData.bulkAllocations = bulkAllocations
    else if (data.isBulkExpense === false) updateData.bulkAllocations = null

    if (data.allocationMethod !== undefined || data.isBulkExpense !== undefined) {
      updateData.allocationMethod = isBulkExpense ? data.allocationMethod || 'manual' : null
    }

    const expense = await prisma.expense.update({
      where: { id: params.id },
      data: updateData,
      include: {
        order: {
          include: {
            customer: true,
          },
        },
      },
    })

    publishNotification({
      type: 'expenses',
      title: 'Expense updated',
      message: `${expense.category} - ${Number(expense.amount || 0).toFixed(2)}`,
      entityId: expense.id,
      severity: 'info',
    })

    return NextResponse.json(transformDecimal(expense))
  } catch (error: any) {
    console.error('Error updating expense:', error)
    return NextResponse.json(
      {
        error: 'Failed to update expense',
        details: error.message || 'Unknown error',
        code: error.code,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(request)
  if (auth.response) return auth.response

  try {
    await prisma.expense.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
  }
}
