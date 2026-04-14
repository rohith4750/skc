import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/require-auth'
import { generateId } from '@/lib/utils'
import { transformDecimal } from '@/lib/decimal-utils'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await requireAuth(request)
    if (auth.response) return auth.response

    try {
        const bill = await prisma.bill.findUnique({
            where: { orderId: params.id },
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

        if (!bill) {
            return NextResponse.json({ error: 'Bill not found for this order' }, { status: 404 })
        }

        return NextResponse.json(transformDecimal(bill))
    } catch (error: any) {
        console.error('Bill fetch by Order ID error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch bill', details: error.message },
            { status: 500 }
        )
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await requireAuth(request)
    if (auth.response) return auth.response

    try {
        const orderId = params.id

        // 1. Check if bill already exists
        const existingBill = await prisma.bill.findUnique({
            where: { orderId }
        })

        if (existingBill) {
            return NextResponse.json({ error: 'Bill already exists for this order', bill: transformDecimal(existingBill) })
        }

        // 2. Fetch order
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        })

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        // 3. Create Bill leveraging order financials
        const initialPaymentHistory =
          Number(order.advancePaid) > 0
            ? [
                {
                  id: generateId(),
                  amount: order.advancePaid,
                  totalPaid: order.advancePaid,
                  remainingAmount: order.remainingAmount,
                  status:
                    Number(order.remainingAmount) > 0
                      ? Number(order.advancePaid) > 0
                        ? "partial"
                        : "pending"
                      : "paid",
                  date: order.createdAt.toISOString(),
                  source: "booking",
                  method: "cash",
                  notes: "Initial advance taken at order booking",
                },
              ]
            : [];

        const bill = await prisma.bill.create({
            data: {
              orderId,
              totalAmount: order.totalAmount,
              advancePaid: order.advancePaid,
              remainingAmount: order.remainingAmount,
              paidAmount: order.advancePaid,
              paymentHistory: initialPaymentHistory,
              status:
                Number(order.remainingAmount) > 0
                  ? Number(order.advancePaid) > 0
                    ? "partial"
                    : "pending"
                  : "paid",
            },
            include: {
                order: {
                    include: {
                        customer: true
                    }
                }
            }
        })

        return NextResponse.json(transformDecimal(bill))
    } catch (error: any) {
        console.error('Bill creation error:', error)
        return NextResponse.json(
            { error: 'Failed to create bill', details: error.message },
            { status: 500 }
        )
    }
}
