import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()

    const existingBill = await prisma.bill.findUnique({
      where: { id: params.id },
    })

    if (!existingBill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }

    const paidAmount = parseFloat(data.paidAmount) || 0
    const remainingAmount = parseFloat(data.remainingAmount) || 0
    const status = data.status
    const paymentMethod = data.paymentMethod || 'cash'
    const paymentNotes = data.paymentNotes || ''

    const paymentHistory = Array.isArray(existingBill.paymentHistory) ? existingBill.paymentHistory : []
    const deltaPaid = paidAmount - existingBill.paidAmount
    const updatedPaymentHistory = deltaPaid > 0
      ? [
          ...paymentHistory,
          {
            amount: deltaPaid,
            totalPaid: paidAmount,
            remainingAmount,
            status,
            date: new Date().toISOString(),
            source: 'payment',
            method: paymentMethod,
            notes: paymentNotes,
          },
        ]
      : paymentHistory

    const bill = await prisma.bill.update({
      where: { id: params.id },
      data: {
        paidAmount: paidAmount,
        advancePaid: paidAmount,
        remainingAmount: remainingAmount,
        status: status,
        paymentHistory: updatedPaymentHistory,
      },
    })

    await prisma.order.update({
      where: { id: bill.orderId },
      data: {
        advancePaid: paidAmount,
        remainingAmount: remainingAmount,
      },
    })

    const updatedBill = await prisma.bill.findUnique({
      where: { id: params.id },
      include: {
        order: {
          include: {
            customer: true,
            supervisor: true,
            items: {
              include: {
                menuItem: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(updatedBill)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update bill', details: error.message },
      { status: 500 }
    )
  }
}
