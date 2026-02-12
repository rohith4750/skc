import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { sendEmail } from '@/lib/email-server'
import { generateOrderEmailHTML } from '@/lib/email-order'
import { requireAuth } from '@/lib/require-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(request)
  if (auth.response) return auth.response

  try {
    const data = await request.json().catch(() => ({}))
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        items: { include: { menuItem: true } },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const customerEmail = order.customer?.email
    const to = data.email || customerEmail
    if (!to || typeof to !== 'string' || !to.includes('@')) {
      return NextResponse.json(
        { error: 'Customer email not found. Please ensure the customer has an email.' },
        { status: 400 }
      )
    }

    if (!data.pdfBase64) {
      return NextResponse.json(
        { error: 'Order PDF is required' },
        { status: 400 }
      )
    }

    const mealTypeAmounts = order.mealTypeAmounts as Record<string, { date?: string }> | null
    const eventDates: string[] = []
    if (mealTypeAmounts) {
      Object.values(mealTypeAmounts).forEach((d) => {
        if (d && typeof d === 'object' && d.date) {
          const dateStr = formatDate(d.date)
          if (!eventDates.includes(dateStr)) eventDates.push(dateStr)
        }
      })
    }

    const html = generateOrderEmailHTML({
      customerName: order.customer?.name || 'Customer',
      eventName: order.eventName || undefined,
      eventDate: eventDates.length > 0 ? eventDates.join(', ') : undefined,
      orderId: (order as any).serialNumber?.toString() || order.id.slice(0, 8).toUpperCase(),
    })

    const eventName = order.eventName || 'Catering Event'
    const subject = `Your Order - SKC Caterers · ${eventName}`

    const sent = await sendEmail({
      to,
      subject,
      html,
      text: `Your order from SKC Caterers.\nEvent: ${eventName}\nOrder ID: SKC-ORDER-${(order as any).serialNumber || order.id.slice(0, 8).toUpperCase()}\n\nYour order PDF is attached.`,
      attachments: [
        {
          filename: `SKC-Order-${(order as any).serialNumber || order.id.slice(0, 8)}.pdf`,
          content: data.pdfBase64,
        },
      ],
    })

    if (!sent) {
      return NextResponse.json(
        { error: 'Email service not configured. Please set up RESEND_API_KEY or SMTP in environment.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to send order email:', error)
    return NextResponse.json(
      { error: 'Failed to send order email', details: error.message },
      { status: 500 }
    )
  }
}
