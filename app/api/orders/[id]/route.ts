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
        },
        bills: true,
        expenses: true
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
      console.log(`[Order API] Status update requested for order ${params.id}: ${data.status}`)
      
      // Update order status
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
      
      console.log(`[Order API] Order status updated successfully. Total amount: ${order.totalAmount}`)
      
      // Generate bill when status changes to "in-progress" or "completed"
      if (data.status === 'in-progress' || data.status === 'completed') {
        console.log(`[Order API] Checking for existing bill for order ${params.id}`)
        
        // Check if bill already exists
        const existingBill = await prisma.bill.findUnique({
          where: { orderId: params.id }
        })
        
        if (!existingBill) {
          console.log(`[Order API] No existing bill found. Creating new bill for order ${params.id}`)
          try {
            // Create bill only if it doesn't exist
            const newBill = await prisma.bill.create({
              data: {
                orderId: params.id,
                totalAmount: order.totalAmount,
                advancePaid: order.advancePaid,
                remainingAmount: order.remainingAmount,
                paidAmount: order.advancePaid,
                status: order.remainingAmount > 0 ? (order.advancePaid > 0 ? 'partial' : 'pending') : 'paid',
              }
            })
            console.log(`[Order API] ✅ Bill created successfully: ${newBill.id} for order ${params.id}`)
          } catch (billError: any) {
            console.error(`[Order API] ❌ Error creating bill for order ${params.id}:`, billError)
            console.error(`[Order API] Error details:`, {
              message: billError.message,
              code: billError.code,
              meta: billError.meta
            })
            // Don't throw - order status was updated successfully, bill creation failed
          }
        } else {
          console.log(`[Order API] Bill already exists: ${existingBill.id} for order ${params.id}`)
          
          if (data.status === 'completed') {
            console.log(`[Order API] Order marked as completed. Updating bill to paid status.`)
            // If status is completed and bill exists, mark it as paid
            await prisma.bill.update({
              where: { id: existingBill.id },
              data: {
                paidAmount: existingBill.totalAmount,
                remainingAmount: 0,
                status: 'paid'
              }
            })
            
            // Update order amounts to match
            await prisma.order.update({
              where: { id: params.id },
              data: {
                advancePaid: existingBill.totalAmount,
                remainingAmount: 0
              }
            })
            console.log(`[Order API] ✅ Bill updated to paid status`)
          }
        }
      }
      
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
    // Delete order and related records in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete related order items (should cascade, but being explicit)
      await tx.orderItem.deleteMany({
        where: { orderId: params.id }
      })
      
      // Delete associated bills first (since orderId is unique/required)
      await tx.bill.deleteMany({
        where: { orderId: params.id }
      })
      
      // Set expenses orderId to null (keep expenses but remove the link to the order)
      await tx.expense.updateMany({
        where: { orderId: params.id },
        data: { orderId: null }
      })
      
      // Finally delete the order
      await tx.order.delete({
        where: { id: params.id }
      })
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting order:', error)
    
    // Handle Prisma-specific errors
    if (error.code === 'P2025') {
      return NextResponse.json({ 
        error: 'Order not found',
        details: `No order found with id: ${params.id}`
      }, { status: 404 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to delete order',
      details: error?.message || String(error),
      code: error?.code
    }, { status: 500 })
  }
}
