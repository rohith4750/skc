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
      }
    })
    
    // Update order
    await prisma.order.update({
      where: { id: bill.orderId },
      data: {
        advancePaid: data.paidAmount,
        remainingAmount: data.remainingAmount,
      }
    })

    // Fetch the updated bill with relations (matching GET endpoint structure)
    const updatedBill = await prisma.bill.findUnique({
      where: { id: params.id },
      include: {
        order: {
          include: {
            customer: true,
            supervisor: true
          }
        }
      }
    })

    return NextResponse.json(updatedBill)
  } catch (error: any) {
    console.error('Error updating bill:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ 
        error: 'Bill not found',
        details: `No bill found with id: ${params.id}`
      }, { status: 404 })
    }
    return NextResponse.json({ 
      error: 'Failed to update bill',
      details: error.message || 'Unknown error'
    }, { status: 500 })
  }
}
