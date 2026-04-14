import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/require-auth'
import { transformDecimal } from '@/lib/decimal-utils'
import { generateId } from '@/lib/utils'

export async function POST(request: NextRequest) {
    const auth = await requireAuth(request)
    if (auth.response) return auth.response

    try {
        const data = await request.json()
        const {
            customer, // { id?, name, phone, email?, address? }
            eventDetails, // { name, date, venue }
            sessions, // Array<{ type, plates, rate, amount, date? }>
            financials, // { transport, discount, advancePaid, paymentMethod }
        } = data

        if (!customer || (!customer.id && !customer.name)) {
            return NextResponse.json({ error: 'Customer details are required' }, { status: 400 })
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Handle Customer
            let customerId = customer.id
            if (!customerId) {
                const existingCustomer = await tx.customer.findFirst({
                    where: { phone: customer.phone }
                })
                if (existingCustomer) {
                    customerId = existingCustomer.id
                } else {
                    const newCustomer = await tx.customer.create({
                        data: {
                            name: customer.name,
                            phone: customer.phone,
                            email: customer.email || '',
                            address: customer.address || '',
                        }
                    })
                    customerId = newCustomer.id
                }
            }

            // 2. Ensure a generic MenuItem exists for Direct Bills
            let genericItem = await tx.menuItem.findFirst({
                where: { name: 'Catering Service' }
            })
            if (!genericItem) {
                genericItem = await tx.menuItem.create({
                    data: {
                        name: 'Catering Service',
                        type: ['other'] as any,
                        description: 'Generic catering service for direct billing',
                        isActive: true
                    }
                })
            }

            // 3. Prepare Order Data
            const totalMealAmount = sessions.reduce((sum: number, s: any) => sum + (parseFloat(s.amount) || 0), 0)
            const transportCost = parseFloat(financials.transport) || 0
            const discount = parseFloat(financials.discount) || 0
            const advancePaid = parseFloat(financials.advancePaid) || 0
            
            const totalAmount = totalMealAmount + transportCost - discount
            const remainingAmount = Math.max(0, totalAmount - advancePaid)

            const mealTypeAmounts: Record<string, any> = {}
            sessions.forEach((s: any, idx: number) => {
                const key = s.type.toLowerCase().replace(/\s+/g, '_') || `session_${idx}`
                mealTypeAmounts[key] = {
                    menuType: s.type,
                    numberOfPlates: parseFloat(s.plates) || 0,
                    platePrice: parseFloat(s.rate) || 0,
                    manualAmount: parseFloat(s.amount) || 0,
                    date: s.date || eventDetails.date,
                    venue: eventDetails.venue
                }
            })

            const order = await tx.order.create({
                data: {
                    customerId,
                    eventName: eventDetails.name,
                    eventDate: eventDetails.date ? new Date(eventDetails.date) : null,
                    venue: eventDetails.venue,
                    totalAmount,
                    advancePaid,
                    remainingAmount,
                    status: 'completed',
                    orderType: 'EVENT',
                    orderSource: 'ADMIN',
                    mealTypeAmounts,
                    events: mealTypeAmounts,
                    transportCost,
                    discount,
                    items: {
                        create: [
                            {
                                menuItemId: genericItem.id,
                                quantity: 1,
                                mealType: 'Direct Bill'
                            }
                        ]
                    }
                }
            })

            // 4. Create Bill
            const initialPaymentHistory = advancePaid > 0 ? [
                {
                    id: generateId(),
                    amount: advancePaid,
                    totalPaid: advancePaid,
                    remainingAmount: remainingAmount,
                    status: remainingAmount === 0 ? 'paid' : 'partial',
                    date: new Date().toISOString(),
                    source: 'direct_bill',
                    method: financials.paymentMethod || 'cash',
                    notes: 'Advance paid during direct bill creation'
                }
            ] : []

            const bill = await tx.bill.create({
                data: {
                    orderId: order.id,
                    totalAmount,
                    advancePaid,
                    remainingAmount,
                    paidAmount: advancePaid,
                    status: remainingAmount === 0 ? 'paid' : (advancePaid > 0 ? 'partial' : 'pending'),
                    paymentHistory: initialPaymentHistory
                },
                include: {
                    order: {
                        include: {
                            customer: true
                        }
                    }
                }
            })

            return bill
        })

        return NextResponse.json(transformDecimal(result))
    } catch (error: any) {
        console.error('Direct bill creation error:', error)
        return NextResponse.json(
            { error: 'Failed to create direct bill', details: error.message },
            { status: 500 }
        )
    }
}
