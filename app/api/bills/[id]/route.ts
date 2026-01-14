import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()

    const bill = await prisma.bill.update({
      where: { id: params.id },
      data: {
        paidAmount: data.paidAmount,
        remainingAmount: data.remainingAmount,
        status: data.status,
      },
    })

    await prisma.order.update({
      where: { id: bill.orderId },
      data: {
        advancePaid: data.paidAmount,
        remainingAmount: data.remainingAmount,
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
