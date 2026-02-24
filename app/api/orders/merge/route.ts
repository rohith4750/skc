import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export async function POST(request: Request) {
    try {
        const { primaryOrderId, secondaryOrderIds } = await request.json()

        if (!primaryOrderId || !secondaryOrderIds || !Array.isArray(secondaryOrderIds) || secondaryOrderIds.length === 0) {
            return NextResponse.json({ error: 'Missing primary or secondary order IDs' }, { status: 400 })
        }

        // Run the merge in a transaction to ensure atomicity
        const mergedOrder = await prisma.$transaction(async (tx: any) => {
            // 1. Fetch all orders
            const allOrderIds = [primaryOrderId, ...secondaryOrderIds]
            const orders = await tx.order.findMany({
                where: { id: { in: allOrderIds } },
                include: { items: true, bill: true }
            })

            const primaryOrder = orders.find((o: any) => o.id === primaryOrderId)
            const secondaryOrders = orders.filter((o: any) => o.id !== primaryOrderId)

            if (!primaryOrder) throw new Error('Primary order not found')
            if (secondaryOrders.length === 0) throw new Error('No secondary orders found')

            // 2. Consolidate Financials & JSON fields
            let totalAmount = new Decimal(primaryOrder.totalAmount)
            let advancePaid = new Decimal(primaryOrder.advancePaid)
            let transportCost = new Decimal(primaryOrder.transportCost)
            let waterBottlesCost = new Decimal(primaryOrder.waterBottlesCost)
            let discount = new Decimal(primaryOrder.discount)

            const mealTypeAmounts: any = primaryOrder.mealTypeAmounts || {}
            const stalls: any[] = Array.isArray(primaryOrder.stalls) ? primaryOrder.stalls : []
            const services: any[] = Array.isArray(primaryOrder.services) ? primaryOrder.services : []

            // Consolidate Bill Paid Amounts & History
            let totalPaidAmount = new Decimal(primaryOrder.bill?.paidAmount || 0)
            let combinedPaymentHistory = Array.isArray(primaryOrder.bill?.paymentHistory) ? [...primaryOrder.bill.paymentHistory] : []

            // If the primary order didn't have a bill but had an advance, treat it as a payment
            if (!primaryOrder.bill && advancePaid.gt(0)) {
                totalPaidAmount = advancePaid
                combinedPaymentHistory.push({
                    amount: advancePaid.toNumber(),
                    date: primaryOrder.createdAt,
                    source: 'advance',
                    method: 'cash',
                    notes: 'Initial advance'
                })
            }

            for (const order of secondaryOrders) {
                totalAmount = totalAmount.plus(new Decimal(order.totalAmount))
                advancePaid = advancePaid.plus(new Decimal(order.advancePaid))
                transportCost = transportCost.plus(new Decimal(order.transportCost))
                waterBottlesCost = waterBottlesCost.plus(new Decimal(order.waterBottlesCost))
                discount = discount.plus(new Decimal(order.discount))

                // Merge mealTypeAmounts with unique keys
                if (order.mealTypeAmounts && typeof order.mealTypeAmounts === 'object') {
                    for (const [oldKey, value] of Object.entries(order.mealTypeAmounts as Record<string, any>)) {
                        // Create a unique key for the merged session
                        const uniqueSessionId = `session_${Math.random().toString(36).slice(2, 9)}_${order.serialNumber}`;

                        // Ensure the display meal type is preserved
                        const sessionData = { ...value };
                        if (!sessionData.menuType) {
                            sessionData.menuType = oldKey; // Preserve e.g. "Lunch"
                        }

                        mealTypeAmounts[uniqueSessionId] = sessionData;

                        // 3. Re-link Order Items for THIS specific session
                        await tx.orderItem.updateMany({
                            where: {
                                orderId: order.id,
                                mealType: oldKey
                            },
                            data: {
                                orderId: primaryOrderId,
                                mealType: uniqueSessionId
                            }
                        })
                    }
                }

                // Also handle items that might not have a mealType set (fallback)
                await tx.orderItem.updateMany({
                    where: {
                        orderId: order.id,
                        mealType: null
                    },
                    data: {
                        orderId: primaryOrderId
                    }
                })

                // Merge stalls
                if (Array.isArray(order.stalls)) {
                    stalls.push(...order.stalls)
                }

                // Merge services
                if (Array.isArray(order.services)) {
                    services.push(...order.services)
                }

                // Consolidate Payments from Secondary Orders
                const secondaryPaid = new Decimal(order.bill?.paidAmount || 0)
                const secondaryAdvance = new Decimal(order.advancePaid || 0)

                // Use bill's paidAmount if available, otherwise fallback to order's advancePaid
                const paymentToTransfer = secondaryPaid.gt(0) ? secondaryPaid : secondaryAdvance

                if (paymentToTransfer.gt(0)) {
                    totalPaidAmount = totalPaidAmount.plus(paymentToTransfer)

                    if (order.bill?.paymentHistory && Array.isArray(order.bill.paymentHistory)) {
                        combinedPaymentHistory.push(...order.bill.paymentHistory)
                    } else if (secondaryAdvance.gt(0)) {
                        combinedPaymentHistory.push({
                            amount: secondaryAdvance.toNumber(),
                            date: order.createdAt,
                            source: 'advance_transfer',
                            method: 'other',
                            notes: `Transferred from merged Order #${order.serialNumber}`
                        })
                    }
                }
            }

            // 4. Update Primary Order (remaining logic stays similar)
            const updatedPrimary = await tx.order.update({
                where: { id: primaryOrderId },
                data: {
                    totalAmount,
                    advancePaid,
                    remainingAmount: totalAmount.minus(advancePaid),
                    transportCost,
                    waterBottlesCost,
                    discount,
                    mealTypeAmounts,
                    stalls,
                    services,
                }
            })

            // 5. Update/Create Bill for Primary Order
            if (primaryOrder.bill) {
                await tx.bill.update({
                    where: { id: primaryOrder.bill.id },
                    data: {
                        totalAmount: updatedPrimary.totalAmount,
                        advancePaid: updatedPrimary.advancePaid,
                        remainingAmount: updatedPrimary.remainingAmount,
                        paidAmount: totalPaidAmount,
                        paymentHistory: combinedPaymentHistory,
                        status: updatedPrimary.remainingAmount.equals(0) ? 'paid' : totalPaidAmount.gt(0) ? 'partial' : 'pending'
                    }
                })
            } else if (updatedPrimary.status !== 'pending' || totalPaidAmount.gt(0)) {
                // Create bill if none existed but we have payments or status changed
                await tx.bill.create({
                    data: {
                        orderId: primaryOrderId,
                        totalAmount: updatedPrimary.totalAmount,
                        advancePaid: updatedPrimary.advancePaid,
                        remainingAmount: updatedPrimary.remainingAmount,
                        paidAmount: totalPaidAmount,
                        paymentHistory: combinedPaymentHistory,
                        status: updatedPrimary.remainingAmount.equals(0) ? 'paid' : totalPaidAmount.gt(0) ? 'partial' : 'pending'
                    }
                })
            }

            // 6. Delete Secondary Bills then Orders
            await tx.bill.deleteMany({
                where: { orderId: { in: secondaryOrderIds } }
            })

            await tx.order.deleteMany({
                where: { id: { in: secondaryOrderIds } }
            })

            return updatedPrimary
        })

        return NextResponse.json({
            success: true,
            message: `Merged ${secondaryOrderIds.length} orders into primary order #${mergedOrder.serialNumber}`,
            orderId: mergedOrder.id
        })

    } catch (error: any) {
        console.error('[Order Merge API] Error:', error)
        return NextResponse.json({ error: error.message || 'Failed to merge orders' }, { status: 500 })
    }
}
