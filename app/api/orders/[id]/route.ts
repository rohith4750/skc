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
          include: {
            menuItem: true
          }
        }
      }
    })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    return NextResponse.json(order)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    
    // If only status is being updated (from orders history page)
    if (data.status !== undefined && Object.keys(data).length === 1) {
      const order = await prisma.order.update({
        where: { id: params.id },
        data: {
          status: data.status,
        },
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
      return NextResponse.json(order)
    }
    
    // If only supervisorId is being updated (from orders history page)
    if (data.supervisorId !== undefined && Object.keys(data).length === 1) {
      const order = await prisma.order.update({
        where: { id: params.id },
        data: {
          supervisorId: data.supervisorId || null,
        },
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
      return NextResponse.json(order)
    }

    // Full order update - delete existing items and create new ones
    const order = await prisma.$transaction(async (tx) => {
      // Delete existing order items
      await tx.orderItem.deleteMany({
        where: { orderId: params.id }
      })

      // Update order
      const updatedOrder = await tx.order.update({
        where: { id: params.id },
        data: {
          customerId: data.customerId,
          supervisorId: data.supervisorId || null,
          totalAmount: data.totalAmount,
          advancePaid: data.advancePaid,
          remainingAmount: data.remainingAmount,
          status: data.status || 'pending',
          eventName: data.eventName || null,
          services: data.services && Array.isArray(data.services) && data.services.length > 0 ? data.services : null,
          numberOfMembers: data.numberOfMembers || null,
          mealTypeAmounts: data.mealTypeAmounts && Object.keys(data.mealTypeAmounts).length > 0 ? data.mealTypeAmounts : null,
          stalls: data.stalls && Array.isArray(data.stalls) && data.stalls.length > 0 ? data.stalls : null,
          discount: data.discount || 0,
          items: {
            create: data.items.map((item: any) => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity || 1,
            }))
          }
        },
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

      // Update associated bill
      await tx.bill.updateMany({
        where: { orderId: params.id },
        data: {
          totalAmount: data.totalAmount,
          advancePaid: data.advancePaid,
          remainingAmount: data.remainingAmount,
          paidAmount: data.advancePaid,
          status: data.remainingAmount > 0 ? (data.advancePaid > 0 ? 'partial' : 'pending') : 'paid',
        }
      })

      return updatedOrder
    })

    return NextResponse.json(order)
  } catch (error: any) {
    console.error('Error updating order:', error)
    return NextResponse.json({ 
      error: 'Failed to update order', 
      details: error.message || 'Unknown error' 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.order.delete({
      where: { id: params.id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
  }
}
