import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'
import { transformDecimal } from '@/lib/decimal-utils'

export async function POST(request: NextRequest) {
    try {
        const { date, orderIds } = await request.json()

        if (!date) {
            return NextResponse.json({ error: 'Date is required' }, { status: 400 })
        }

        const results = await prisma.$transaction(async (tx) => {
            const orders = await tx.order.findMany({
                where: { id: { in: orderIds || [] } },
                include: { bill: true }
            })

            const processed = []

            for (const order of orders) {
                const mealTypeAmounts = (order.mealTypeAmounts as Record<string, any>) || {}
                const sessionsToKeep: Record<string, any> = {}
                const discardedSessionKeys: string[] = []

                Object.entries(mealTypeAmounts).forEach(([key, data]) => {
                    if (data && typeof data === 'object' && data.date === date) {
                        discardedSessionKeys.push(key)
                    } else {
                        sessionsToKeep[key] = data
                    }
                })

                // If no changes for this order, skip
                if (discardedSessionKeys.length === 0) {
                    processed.push({ id: order.id, status: 'no_change' })
                    continue
                }

                // If no sessions left, delete the order entirely
                if (Object.keys(sessionsToKeep).length === 0) {
                    await tx.bill.deleteMany({ where: { orderId: order.id } })
                    await tx.orderItem.deleteMany({ where: { orderId: order.id } })
                    await tx.order.delete({ where: { id: order.id } })
                    processed.push({ id: order.id, status: 'deleted' })
                } else {
                    // Recalculate total amount for the remaining sessions
                    let newSessionsTotal = new Decimal(0)
                    Object.values(sessionsToKeep).forEach(s => {
                        newSessionsTotal = newSessionsTotal.plus(new Decimal(s.amount || 0))
                    })

                    const transport = new Decimal(order.transportCost || 0)
                    const water = new Decimal(order.waterBottlesCost || 0)
                    const discount = new Decimal(order.discount || 0)
                    const stallsTotal = ((order.stalls as any[]) || []).reduce((sum, s) => sum.plus(new Decimal(s.cost || 0)), new Decimal(0))

                    const newTotal = Decimal.max(0, newSessionsTotal.plus(transport).plus(water).plus(stallsTotal).minus(discount))
                    const newAdvance = new Decimal(order.advancePaid || 0) // Keep advance same for now, or capping it if needed

                    // Update Order Items - Delete sessions linked to discarded keys
                    await tx.orderItem.deleteMany({
                        where: {
                            orderId: order.id,
                            mealType: { in: discardedSessionKeys }
                        }
                    })

                    const updatedOrder = await tx.order.update({
                        where: { id: order.id },
                        data: {
                            mealTypeAmounts: sessionsToKeep,
                            totalAmount: newTotal,
                            remainingAmount: Decimal.max(0, newTotal.minus(newAdvance))
                        }
                    })

                    // Update Bill
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
                    processed.push({ id: order.id, status: 'updated' })
                }
            }
            return processed
        })

        return NextResponse.json({ success: true, processed: results })
    } catch (error: any) {
        console.error('[Bulk Discard API] Error:', error)
        return NextResponse.json({ error: error.message || 'Failed to bulk discard date' }, { status: 500 })
    }
}
