import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/require-auth'

const PAYMENT_METHODS = ['cash', 'upi', 'bank_transfer', 'cheque', 'other']

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth.response) return auth.response
  try {
    const payments = await (prisma as any).workforcePayment.findMany({
      orderBy: { paymentDate: 'desc' },
    })
    return NextResponse.json(payments)
  } catch (error: any) {
    console.error('Failed to fetch workforce payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth.response) return auth.response
  try {
    const data = await request.json()
    const amount = parseFloat(data.amount)
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      )
    }
    const paymentMethod = data.paymentMethod || 'cash'
    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json(
        { error: `Invalid payment method. Must be one of: ${PAYMENT_METHODS.join(', ')}` },
        { status: 400 }
      )
    }
    const role = data.role
    const validRoles = ['supervisor', 'chef', 'labours', 'boys', 'transport', 'gas', 'pan', 'store', 'other']
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      )
    }
    const payment = await (prisma as any).workforcePayment.create({
      data: {
        amount,
        role: role || null,
        paymentMethod,
        notes: data.notes || null,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
      },
    })
    return NextResponse.json(payment, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create workforce payment:', error)
    return NextResponse.json(
      { error: 'Failed to record payment', details: error.message },
      { status: 500 }
    )
  }
}
