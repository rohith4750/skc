import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        supervisor: true,
        items: {
          include: { menuItem: true }
        },
        bill: true,
        expenses: true
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()

    // -------- STATUS UPDATE (MOST IMPORTANT PART) --------
    if (data.status && Object.keys(data).length === 1) {
      const order = await prisma.order.update({
        where: { id: params.id },
        data: { status: data.status },
      })

      let bill = await prisma.bill.findUnique({
        where: { orderId: params.id }
      })

      // Create bill ONLY when order starts or completes
      if (!bill && ['in-progress', 'completed'].includes(data.status)) {
        const initialPaymentHistory = order.advancePaid > 0 ? [{
          amount: order.advancePaid,
          totalPaid: order.advancePaid,
          remainingAmount: order.remainingAmount,
          status:
            order.remainingAmount > 0
              ? order.advancePaid > 0
                ? 'partial'
                : 'pending'
              : 'paid',
          date: order.createdAt.toISOString(),
          source: 'booking',
          method: 'cash', // Default for initial advance if not specified
          notes: 'Initial advance taken at order creation',
        }] : []

        const billCreateData: any = {
          orderId: params.id,
          totalAmount: order.totalAmount,
          advancePaid: order.advancePaid,
          remainingAmount: order.remainingAmount,
          paidAmount: order.advancePaid,
          paymentHistory: initialPaymentHistory,
          status:
            order.remainingAmount > 0
              ? order.advancePaid > 0
                ? 'partial'
                : 'pending'
              : 'paid',
        }

        bill = await prisma.bill.create({
          data: billCreateData,
        })
      }

      // If order completed → mark bill paid
      if (bill && data.status === 'completed') {
        bill = await prisma.bill.update({
          where: { id: bill.id },
          data: {
            paidAmount: bill.totalAmount,
            remainingAmount: 0,
            status: 'paid',
          },
        })

        await prisma.order.update({
          where: { id: params.id },
          data: {
            advancePaid: bill.totalAmount,
            remainingAmount: 0,
          },
        })
      }

      return NextResponse.json({ order, bill })
    }

    const totalAmount = parseFloat(data.totalAmount) || 0
    const advancePaid = parseFloat(data.advancePaid) || 0
    const remainingAmount = Math.max(0, parseFloat(data.remainingAmount) || (totalAmount - advancePaid))
    const discount = parseFloat(data.discount) || 0
    const transportCost = parseFloat(data.transportCost) || 0
    const additionalPayment = parseFloat(data.additionalPayment) || 0
    const paymentMethod = data.paymentMethod || 'cash'
    const paymentNotes = data.paymentNotes || ''

    const existingOrder = await prisma.order.findUnique({
      where: { id: params.id },
      include: { bill: true }
    })

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // --- TRACK MEAL TYPE MEMBER CHANGES ---
    const oldMealTypeAmounts = (existingOrder.mealTypeAmounts as Record<string, any>) || {}
    const newMealTypeAmounts = (data.mealTypeAmounts as Record<string, any>) || {}
    const mealTypeChanges: string[] = []
    let totalMemberPriceDifference = 0
    let totalMembersChanged = 0
    
    // Update new meal types with original values if they don't have them
    Object.keys(newMealTypeAmounts).forEach(type => {
      const oldType = oldMealTypeAmounts[type]
      const newType = newMealTypeAmounts[type]
      
      const oldMemberCount = oldType?.numberOfMembers || 0
      const newMemberCount = newType?.numberOfMembers || 0
      const memberDiff = newMemberCount - oldMemberCount
      
      const oldAmount = oldType?.amount || 0
      const newAmount = newType?.amount || 0
      const priceDiff = newAmount - oldAmount
      
      // Keep track of the very first member count set for this meal type
      const originalMembers = oldType?.originalMembers || oldMemberCount || newMemberCount
      newType.originalMembers = originalMembers
      
      if (memberDiff !== 0 && oldMemberCount !== 0) {
        const diffSign = memberDiff > 0 ? '+' : ''
        const priceSign = priceDiff > 0 ? '+' : ''
        mealTypeChanges.push(`${type.charAt(0).toUpperCase() + type.slice(1)}: ${oldMemberCount} → ${newMemberCount} (${diffSign}${memberDiff} members, ${priceSign}${priceDiff.toFixed(2)} price)`)
        totalMemberPriceDifference += priceDiff
        totalMembersChanged += memberDiff
      }
    })

    const mealTypeNotes = mealTypeChanges.length > 0 
      ? `Changes: ${mealTypeChanges.join(' | ')}` 
      : undefined

    const orderUpdateData: any = {
      customerId: data.customerId,
      totalAmount,
      advancePaid,
      remainingAmount,
      status: data.status,
      eventName: data.eventName || null,
      services: data.services && Array.isArray(data.services) && data.services.length > 0 ? data.services : null,
      numberOfMembers: data.numberOfMembers || null,
      mealTypeAmounts: newMealTypeAmounts,
      stalls: data.stalls && Array.isArray(data.stalls) && data.stalls.length > 0 ? data.stalls : null,
      transportCost,
      discount,
    }

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: params.id },
        data: orderUpdateData,
      })

      if (Array.isArray(data.items)) {
        await tx.orderItem.deleteMany({ where: { orderId: params.id } })
        if (data.items.length > 0) {
          await tx.orderItem.createMany({
            data: data.items.map((item: any) => ({
              orderId: params.id,
              menuItemId: item.menuItemId,
              quantity: item.quantity || 1,
            }))
          })
        }
      }

      let bill = await tx.bill.findUnique({
        where: { orderId: params.id },
      })

      if (bill) {
        const paymentHistory = Array.isArray((bill as any).paymentHistory)
          ? (bill as any).paymentHistory
          : []
        const shouldAppendHistory = additionalPayment > 0 || mealTypeChanges.length > 0
        const updatedPaymentHistory = shouldAppendHistory
          ? [
              ...paymentHistory,
              {
                amount: additionalPayment,
                totalPaid: advancePaid,
                remainingAmount,
                status: remainingAmount <= 0 ? 'paid' : advancePaid > 0 ? 'partial' : 'pending',
                date: new Date().toISOString(),
                source: 'revision',
                method: additionalPayment > 0 ? paymentMethod : undefined,
                notes: paymentNotes || mealTypeNotes,
                membersChanged: totalMembersChanged !== 0 ? totalMembersChanged : undefined,
                totalPriceChange: totalMemberPriceDifference !== 0 ? totalMemberPriceDifference : undefined,
              },
            ]
          : paymentHistory

        const billUpdateData: any = {
          totalAmount,
          advancePaid,
          paidAmount: advancePaid,
          remainingAmount,
          status: remainingAmount <= 0 ? 'paid' : advancePaid > 0 ? 'partial' : 'pending',
          paymentHistory: updatedPaymentHistory,
        }

        bill = await tx.bill.update({
          where: { id: bill.id },
          data: billUpdateData,
        })
      }

      return { order, bill }
    })

    const updatedOrder = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        supervisor: true,
        items: {
          include: { menuItem: true }
        },
        bill: true,
      }
    })

    return NextResponse.json({ order: updatedOrder, bill: result.bill })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update order', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id

    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.bill.deleteMany({ where: { orderId } })
      await tx.order.delete({ where: { id: orderId } })
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete order', details: error.message },
      { status: 500 }
    )
  }
}
