import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export async function POST(request: NextRequest) {
    try {
        const { orderId, date } = await request.json()

        if (!orderId || !date) {
            return NextResponse.json({ error: 'Order ID and Date are required' }, { status: 400 })
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
            const sessionsToSeparate: Record<string, any> = {}
            const sessionsToKeep: Record<string, any> = {}
            const sessionKeysToSeparate: string[] = []

            Object.entries(mealTypeAmounts).forEach(([key, data]) => {
                if (data && typeof data === 'object' && data.date === date) {
                    sessionsToSeparate[key] = data
                    sessionKeysToSeparate.push(key)
                } else {
                    sessionsToKeep[key] = data
                }
            })

            if (sessionKeysToSeparate.length === 0) {
                return { status: 'no_change', message: 'No sessions found for this date in order' }
            }

            // 1. Create a NEW Standalone Order for this discarded/separated date group
            let totalDateAmount = new Decimal(0)
            Object.values(sessionsToSeparate).forEach(s => {
                const amount = typeof s === 'object' && s !== null ? (s.amount || 0) : (typeof s === 'number' ? s : 0)
                totalDateAmount = totalDateAmount.plus(new Decimal(amount))
            })

            // Collect all services for this date
            const dateServices: string[] = []
            Object.values(sessionsToSeparate).forEach(s => {
                if (s && typeof s === 'object' && Array.isArray(s.services)) {
                    s.services.forEach((service: string) => {
                        if (!dateServices.includes(service)) dateServices.push(service)
                    })
                }
            })

            const newOrder = await tx.order.create({
                data: {
                    customerId: order.customerId,
                    supervisorId: order.supervisorId,
                    eventName: order.eventName,
                    eventType: order.eventType,
                    venue: order.venue,
                    numberOfMembers: order.numberOfMembers, // Fallback to group members or calculate specifically?
                    mealTypeAmounts: sessionsToSeparate,
                    totalAmount: totalDateAmount,
                    advancePaid: 0,
                    remainingAmount: totalDateAmount,
                    status: 'pending',
                    transportCost: 0,
                    waterBottlesCost: 0,
                    discount: 0,
                    services: dateServices
                }
            })

            // 2. Move Order Items to the new order
            await tx.orderItem.updateMany({
                where: {
                    orderId: order.id,
                    mealType: { in: sessionKeysToSeparate }
                },
                data: {
                    orderId: newOrder.id
                }
            })

            // 3. Recalculate group order total
            let groupSessionsTotal = new Decimal(0)
            Object.values(sessionsToKeep).forEach(s => {
                const amount = typeof s === 'object' && s !== null ? (s.amount || 0) : (typeof s === 'number' ? s : 0)
                groupSessionsTotal = groupSessionsTotal.plus(new Decimal(amount))
            })

            const transport = new Decimal(order.transportCost || 0)
            const water = new Decimal(order.waterBottlesCost || 0)
            const discount = new Decimal(order.discount || 0)
            const stallsTotal = ((order.stalls as any[]) || []).reduce((sum, s) => sum.plus(new Decimal(s.cost || 0)), new Decimal(0))

            const newTotal = Decimal.max(0, groupSessionsTotal.plus(transport).plus(water).plus(stallsTotal).minus(discount))
            const newAdvance = new Decimal(order.advancePaid || 0)

            const updatedOrder = await tx.order.update({
                where: { id: order.id },
                data: {
                    mealTypeAmounts: sessionsToKeep,
                    totalAmount: newTotal,
                    remainingAmount: Decimal.max(0, newTotal.minus(newAdvance))
                }
            })

            // 4. Update Bill for the group
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

            return { status: 'separated_date', orderId: order.id, newOrderId: newOrder.id, date }
        })

        return NextResponse.json({ success: true, result })
    } catch (error: any) {
        console.error('[Discard Date API] Error:', error)
        return NextResponse.json({ error: error.message || 'Failed to separate date' }, { status: 500 })
    }
}
