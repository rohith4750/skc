import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isNonEmptyString, isNonNegativeNumber } from '@/lib/validation'
import { publishNotification } from '@/lib/notifications'

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

    if (data.category !== undefined && !isNonEmptyString(data.category)) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }
    if (data.amount !== undefined && !isNonNegativeNumber(data.amount)) {
      return NextResponse.json({ error: 'Amount must be a valid number' }, { status: 400 })
    }
    
    // Handle paidAmount - parse if provided (even if empty string)
    let paidAmount: number | undefined = undefined
    if (data.paidAmount !== undefined) {
      paidAmount = data.paidAmount === '' ? 0 : (parseFloat(data.paidAmount) || 0)
    }
    
    // Calculate payment status if paidAmount is provided
    let paymentStatus = data.paymentStatus
    if (paidAmount !== undefined && !paymentStatus) {
      if (paidAmount === 0) {
        paymentStatus = 'pending'
      } else if (paidAmount >= data.amount) {
        paymentStatus = 'paid'
      } else {
        paymentStatus = 'partial'
      }
    }
    
    // Validate bulk allocation if present
    const isBulkExpense = data.isBulkExpense === true
    let bulkAllocations = null
    
    if (isBulkExpense && data.bulkAllocations) {
      if (!Array.isArray(data.bulkAllocations) || data.bulkAllocations.length < 2) {
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
    
    // Build update data object, only including fields that are provided
    const updateData: any = {}
    
    // For bulk expenses, orderId should be null
    if (data.orderId !== undefined) updateData.orderId = isBulkExpense ? null : (data.orderId || null)
    if (data.category !== undefined) updateData.category = data.category
    if (data.amount !== undefined) updateData.amount = data.amount
    if (paidAmount !== undefined) updateData.paidAmount = paidAmount
    if (paymentStatus) updateData.paymentStatus = paymentStatus
    if (data.description !== undefined) updateData.description = data.description || null
    if (data.recipient !== undefined) updateData.recipient = data.recipient || null
    if (data.paymentDate !== undefined) updateData.paymentDate = data.paymentDate ? new Date(data.paymentDate) : new Date()
    if (data.eventDate !== undefined) updateData.eventDate = data.eventDate ? new Date(data.eventDate) : null
    if (data.notes !== undefined) updateData.notes = data.notes || null
    if (data.calculationDetails !== undefined) updateData.calculationDetails = data.calculationDetails || null
    // Bulk allocation fields
    if (data.isBulkExpense !== undefined) updateData.isBulkExpense = isBulkExpense
    if (bulkAllocations !== null) updateData.bulkAllocations = bulkAllocations
    if (data.allocationMethod !== undefined) updateData.allocationMethod = isBulkExpense ? (data.allocationMethod || 'manual') : null
    
    const expense = await (prisma as any).expense.update({
      where: { id: params.id },
      data: updateData,
      include: {
        order: {
          include: {
            customer: true
          }
        }
      }
    })
    publishNotification({
      type: 'expenses',
      title: 'Expense updated',
      message: `${expense.category} · ${Number(expense.amount || 0).toFixed(2)}`,
      entityId: expense.id,
      severity: 'info',
    })

    return NextResponse.json(expense)
  } catch (error: any) {
    console.error('Error updating expense:', error)
    return NextResponse.json({ 
      error: 'Failed to update expense', 
      details: error.message || 'Unknown error',
      code: error.code
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
