import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/require-auth'

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

        return NextResponse.json(bill)
    } catch (error: any) {
        console.error('Bill fetch by Order ID error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch bill', details: error.message },
            { status: 500 }
        )
    }
}
