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

            for (const order of secondaryOrders) {
                totalAmount = totalAmount.plus(new Decimal(order.totalAmount))
                advancePaid = advancePaid.plus(new Decimal(order.advancePaid))
                transportCost = transportCost.plus(new Decimal(order.transportCost))
                waterBottlesCost = waterBottlesCost.plus(new Decimal(order.waterBottlesCost))
                discount = discount.plus(new Decimal(order.discount))

                // Merge mealTypeAmounts (handle potential date-based keys)
                if (order.mealTypeAmounts && typeof order.mealTypeAmounts === 'object') {
                    Object.entries(order.mealTypeAmounts as Record<string, any>).forEach(([key, value]) => {
                        // If it's a conflict (e.g., both have "Lunch"), we keep them separate by appending a suffix or if they have dates, they should naturally be unique keys if using our new multi-date system
                        const finalKey = mealTypeAmounts[key] ? `${key}_merged_${order.serialNumber}` : key
                        mealTypeAmounts[finalKey] = value
                    })
                }

                // Merge stalls
                if (Array.isArray(order.stalls)) {
                    stalls.push(...order.stalls)
                }

                // Merge services
                if (Array.isArray(order.services)) {
                    services.push(...order.services)
                }
            }

            // 3. Re-link Order Items
            await tx.orderItem.updateMany({
                where: { orderId: { in: secondaryOrderIds } },
                data: { orderId: primaryOrderId }
            })

            // 4. Update Primary Order
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
                const paidAmount = new Decimal(primaryOrder.bill.paidAmount)
                await tx.bill.update({
                    where: { id: primaryOrder.bill.id },
                    data: {
                        totalAmount: updatedPrimary.totalAmount,
                        advancePaid: updatedPrimary.advancePaid,
                        remainingAmount: updatedPrimary.remainingAmount,
                        paidAmount: paidAmount // Preserve existing paid amount
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
