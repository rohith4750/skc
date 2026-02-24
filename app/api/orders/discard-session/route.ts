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
                include: { items: true, bill: true }
            })

            if (!order) {
                throw new Error('Order not found')
            }

            const mealTypeAmounts = (order.mealTypeAmounts as Record<string, any>) || {}

            if (!mealTypeAmounts[sessionKey]) {
                return { status: 'no_change', message: 'Session not found in order' }
            }

            const sessionData = mealTypeAmounts[sessionKey]

            // 1. Remove session from mealTypeAmounts of the group
            const updatedMealTypeAmounts = { ...mealTypeAmounts }
            delete updatedMealTypeAmounts[sessionKey]

            // 2. Create a NEW Standalone Order for this discarded/separated session
            // We transfer the items and the session amount
            const sessionAmount = new Decimal(typeof sessionData === 'object' && sessionData !== null ? (sessionData.amount || 0) : (typeof sessionData === 'number' ? sessionData : 0))

            const newOrder = await tx.order.create({
                data: {
                    customerId: order.customerId,
                    supervisorId: order.supervisorId,
                    eventName: order.eventName,
                    eventType: order.eventType,
                    venue: order.venue,
                    numberOfMembers: typeof sessionData === 'object' && sessionData !== null ? sessionData.numberOfMembers : order.numberOfMembers,
                    mealTypeAmounts: { [sessionKey]: sessionData },
                    totalAmount: sessionAmount,
                    advancePaid: 0, // Separated orders start with 0 advance (or proration if needed, but safer at 0)
                    remainingAmount: sessionAmount,
                    status: 'pending',
                    transportCost: 0,
                    waterBottlesCost: 0,
                    discount: 0,
                    services: typeof sessionData === 'object' && sessionData !== null ? sessionData.services || [] : []
                }
            })

            // 3. Move Order Items to the new order
            await tx.orderItem.updateMany({
                where: {
                    orderId: order.id,
                    mealType: sessionKey
                },
                data: {
                    orderId: newOrder.id
                }
            })

            // 4. Recalculate group order total
            let groupSessionsTotal = new Decimal(0)
            Object.values(updatedMealTypeAmounts).forEach(s => {
                const amount = typeof s === 'object' && s !== null ? (s.amount || 0) : (typeof s === 'number' ? s : 0)
                groupSessionsTotal = groupSessionsTotal.plus(new Decimal(amount))
            })

            const transport = new Decimal(order.transportCost || 0)
            const water = new Decimal(order.waterBottlesCost || 0)
            const discount = new Decimal(order.discount || 0)
            const stallsTotal = ((order.stalls as any[]) || []).reduce((sum: Decimal, s: any) => sum.plus(new Decimal(s.cost || 0)), new Decimal(0))

            const newTotal = Decimal.max(0, groupSessionsTotal.plus(transport).plus(water).plus(stallsTotal).minus(discount))
            const newAdvance = new Decimal(order.advancePaid || 0)

            const updatedOrder = await tx.order.update({
                where: { id: order.id },
                data: {
                    mealTypeAmounts: updatedMealTypeAmounts,
                    totalAmount: newTotal,
                    remainingAmount: Decimal.max(0, newTotal.minus(newAdvance))
                }
            })

            // 5. Update Bill for the group
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

            return { status: 'separated', orderId: order.id, newOrderId: newOrder.id }
        })

        return NextResponse.json({ success: true, result })
    } catch (error: any) {
        console.error('[Discard Session API] Error:', error)
        return NextResponse.json({ error: error.message || 'Failed to discard session' }, { status: 500 })
    }
}
