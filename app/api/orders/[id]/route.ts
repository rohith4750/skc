import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isNonEmptyString, isNonNegativeNumber } from '@/lib/validation'
import { publishNotification } from '@/lib/notifications'
import { transformDecimal } from '@/lib/decimal-utils'
import { sendPaymentReceivedAlert } from '@/lib/email-alerts'

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

    return NextResponse.json(transformDecimal(order))
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
      const status = data.status

      const order = await prisma.order.update({
        where: { id: params.id },
        data: { status: status },
      })

      let bill = await prisma.bill.findUnique({
        where: { orderId: params.id }
      })

      // Create bill ONLY when order starts or completes
      if (!bill && ['in_progress', 'completed'].includes(status)) {
        const initialPaymentHistory = Number(order.advancePaid) > 0 ? [{
          amount: order.advancePaid,
          totalPaid: order.advancePaid,
          remainingAmount: order.remainingAmount,
          status:
            Number(order.remainingAmount) > 0
              ? Number(order.advancePaid) > 0
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
            Number(order.remainingAmount) > 0
              ? Number(order.advancePaid) > 0
                ? 'partial'
                : 'pending'
              : 'paid',
        }

        bill = await prisma.bill.create({
          data: billCreateData,
        })
      }

      // If order completed → mark bill paid
      if (bill && status === 'completed') {
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

      publishNotification({
        type: 'orders',
        title: 'Order status updated',
        message: `Order ${params.id.slice(0, 8).toUpperCase()} · ${status}`,
        entityId: params.id,
        severity: status === 'completed' ? 'success' : 'info',
      })

      // Fetch the updated order with all relations to return complete data
      const updatedOrderWithRelations = await prisma.order.findUnique({
        where: { id: params.id },
        include: {
          customer: true,
          supervisor: true,
          items: {
            include: {
              menuItem: true
            }
          }
        }
      })

      return NextResponse.json({
        order: transformDecimal(updatedOrderWithRelations),
        bill: transformDecimal(bill),
        _billCreated: bill ? true : false,
        _billId: bill?.id,
        _billStatus: bill ? 'created' : 'none'
      })
    }

    if (!isNonEmptyString(data.customerId)) {
      return NextResponse.json({ error: 'Customer is required' }, { status: 400 })
    }

    const totalAmount = parseFloat(data.totalAmount) || 0
    const advancePaid = parseFloat(data.advancePaid) || 0
    const remainingAmount = Math.max(0, parseFloat(data.remainingAmount) || (totalAmount - advancePaid))

    if (!isNonNegativeNumber(totalAmount) || !isNonNegativeNumber(advancePaid) || !isNonNegativeNumber(remainingAmount)) {
      return NextResponse.json({ error: 'Invalid amounts' }, { status: 400 })
    }
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
              mealType: item.mealType || null,
              customization: item.customization || null,
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
        const historyEntries: any[] = []
        const totalAdvanceDelta = Math.max(0, advancePaid - Number(existingOrder.advancePaid || 0))
        const baseAdvanceDelta = Math.max(0, totalAdvanceDelta - additionalPayment)
        const statusLabel = remainingAmount <= 0 ? 'paid' : advancePaid > 0 ? 'partial' : 'pending'

        if (baseAdvanceDelta > 0) {
          historyEntries.push({
            amount: baseAdvanceDelta,
            totalPaid: advancePaid,
            remainingAmount,
            status: statusLabel,
            date: new Date().toISOString(),
            source: Number(existingOrder.advancePaid || 0) === 0 ? 'booking' : 'revision',
            method: paymentMethod,
            notes: paymentNotes || mealTypeNotes || 'Advance updated',
          })
        }

        if (additionalPayment > 0) {
          historyEntries.push({
            amount: additionalPayment,
            totalPaid: advancePaid,
            remainingAmount,
            status: statusLabel,
            date: new Date().toISOString(),
            source: Number(existingOrder.advancePaid || 0) === 0 && baseAdvanceDelta === 0 ? 'booking' : 'payment',
            method: paymentMethod,
            notes: paymentNotes || mealTypeNotes || 'Payment recorded',
          })
        }

        if (mealTypeChanges.length > 0) {
          if (historyEntries.length > 0) {
            const lastEntry = historyEntries[historyEntries.length - 1]
            lastEntry.membersChanged = totalMembersChanged !== 0 ? totalMembersChanged : undefined
            lastEntry.totalPriceChange = totalMemberPriceDifference !== 0 ? totalMemberPriceDifference : undefined
          } else {
            historyEntries.push({
              amount: 0,
              totalPaid: advancePaid,
              remainingAmount,
              status: statusLabel,
              date: new Date().toISOString(),
              source: 'revision',
              method: undefined,
              notes: mealTypeNotes,
              membersChanged: totalMembersChanged !== 0 ? totalMembersChanged : undefined,
              totalPriceChange: totalMemberPriceDifference !== 0 ? totalMemberPriceDifference : undefined,
            })
          }
        }

        const updatedPaymentHistory = historyEntries.length > 0
          ? [...paymentHistory, ...historyEntries]
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

    const customerName = updatedOrder?.customer?.name || 'Customer'
    publishNotification({
      type: 'orders',
      title: 'Order updated',
      message: `${customerName} · Total ${totalAmount.toFixed(2)}`,
      entityId: updatedOrder?.id,
      severity: 'info',
    })

    const totalAdvanceDelta = Math.max(0, advancePaid - Number(existingOrder.advancePaid || 0))
    if (totalAdvanceDelta > 0) {
      publishNotification({
        type: 'payments',
        title: 'Payment received',
        message: `${customerName} · ${totalAdvanceDelta.toFixed(2)}`,
        entityId: updatedOrder?.id,
        severity: 'success',
      })

      // Send payment received email alert to all users
      if (updatedOrder?.id) {
        sendPaymentReceivedAlert(updatedOrder.id, totalAdvanceDelta).catch(error => {
          console.error('Failed to send payment received email alert:', error)
        })
      }
    }

    return NextResponse.json({ order: transformDecimal(updatedOrder), bill: transformDecimal(result.bill) })
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
