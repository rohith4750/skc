import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export async function POST(request: NextRequest) {
    try {
        const { orderId, sessionKey } = await request.json()

        if (!orderId || !sessionKey) {
            return NextResponse.json({ error: 'Order ID and Session Key are required' }, { status: 400 })
        }

        const result = await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: { bill: true }
            })

            if (!order) {
                throw new Error('Order not found')
            }

            const mealTypeAmounts = (order.mealTypeAmounts as Record<string, any>) || {}

            if (!mealTypeAmounts[sessionKey]) {
                return { status: 'no_change', message: 'Session not found in order' }
            }

            // 1. Remove session from mealTypeAmounts
            const updatedMealTypeAmounts = { ...mealTypeAmounts }
            delete updatedMealTypeAmounts[sessionKey]

            // 2. Delete Order Items linked to this session
            await tx.orderItem.deleteMany({
                where: {
                    orderId: order.id,
                    mealType: sessionKey
                }
            })

            // 3. If no sessions left, delete the order and bill, or just keep it empty?
            // The user said "discard thas it", usually implying removing it from the combined view.
            // If it's the LAST session, we might want to delete the whole order, but let's just keep it empty for now or handle appropriately.

            if (Object.keys(updatedMealTypeAmounts).length === 0) {
                // If it was the last session, we might as well delete the order if the user wants it gone.
                // But let's follow the safer path: update it to 0 or delete if that's the intent.
                // For now, let's allow empty sessions but with 0 total if no other costs.
            }

            // 4. Recalculate total
            let sessionsTotal = new Decimal(0)
            Object.values(updatedMealTypeAmounts).forEach(s => {
                const amount = typeof s === 'object' && s !== null ? (s.amount || 0) : (typeof s === 'number' ? s : 0)
                sessionsTotal = sessionsTotal.plus(new Decimal(amount))
            })

            const transport = new Decimal(order.transportCost || 0)
            const water = new Decimal(order.waterBottlesCost || 0)
            const discount = new Decimal(order.discount || 0)
            const stallsTotal = ((order.stalls as any[]) || []).reduce((sum, s) => sum.plus(new Decimal(s.cost || 0)), new Decimal(0))

            const newTotal = Decimal.max(0, sessionsTotal.plus(transport).plus(water).plus(stallsTotal).minus(discount))
            const newAdvance = new Decimal(order.advancePaid || 0)

            const updatedOrder = await tx.order.update({
                where: { id: order.id },
                data: {
                    mealTypeAmounts: updatedMealTypeAmounts,
                    totalAmount: newTotal,
                    remainingAmount: Decimal.max(0, newTotal.minus(newAdvance))
                }
            })

            // 5. Update Bill
            if (order.bill) {
                await tx.bill.update({
                    where: { id: order.bill.id },
                    data: {
                        totalAmount: updatedOrder.totalAmount,
                        remainingAmount: updatedOrder.remainingAmount,
                        status: updatedOrder.remainingAmount.equals(0) ? 'paid' : updatedOrder.advancePaid.gt(0) ? 'partial' : 'pending'
                    }
                })
            }

            return { status: 'updated', orderId: order.id }
        })

        return NextResponse.json({ success: true, result })
    } catch (error: any) {
        console.error('[Discard Session API] Error:', error)
        return NextResponse.json({ error: error.message || 'Failed to discard session' }, { status: 500 })
    }
}
