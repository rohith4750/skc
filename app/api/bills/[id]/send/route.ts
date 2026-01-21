import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDateTime } from '@/lib/utils'

const getTransporter = () => {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !port || !user || !pass) {
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

const buildBillEmail = (bill: any) => {
  const order = bill.order
  const customer = order?.customer
  const customerName = customer?.name || 'Customer'
  const eventName = order?.eventName || 'Catering Event'
  const total = formatCurrency(bill.totalAmount || 0)
  const paid = formatCurrency(bill.paidAmount || 0)
  const remaining = formatCurrency(bill.remainingAmount || 0)

  const mealTypeAmounts = order?.mealTypeAmounts as Record<string, any> | null
  const mealRows = mealTypeAmounts
    ? Object.entries(mealTypeAmounts).map(([type, data]) => {
        const detail = typeof data === 'object' && data !== null ? data : { amount: Number(data) || 0 }
        const amount = Number(detail.amount || 0)
        const members = detail.numberOfMembers ? ` · Members: ${detail.numberOfMembers}` : ''
        return `<tr>
          <td style="padding:6px 0; text-transform: capitalize;">${type}</td>
          <td style="padding:6px 0; text-align:right;">${formatCurrency(amount)}${members}</td>
        </tr>`
      })
    : []

  const mealTable = mealRows.length > 0
    ? `<table style="width:100%; border-collapse:collapse; margin-top:12px;">
        <thead>
          <tr>
            <th style="text-align:left; font-size:12px; color:#6b7280; padding-bottom:6px;">Meal Type</th>
            <th style="text-align:right; font-size:12px; color:#6b7280; padding-bottom:6px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${mealRows.join('')}
        </tbody>
      </table>`
    : ''

  const subject = `Bill from SKC Caterers · ${eventName}`

  const html = `
    <div style="font-family:Arial,sans-serif; background:#f8fafc; padding:24px;">
      <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:12px; padding:24px; border:1px solid #e5e7eb;">
        <h2 style="margin:0 0 8px; color:#111827;">SKC Caterers</h2>
        <p style="margin:0 0 16px; color:#6b7280;">Bill generated on ${formatDateTime(bill.createdAt)}</p>

        <div style="margin-bottom:16px;">
          <div style="font-size:14px; color:#374151;">Hello ${customerName},</div>
          <div style="font-size:14px; color:#6b7280;">Here is your bill for <strong>${eventName}</strong>.</div>
        </div>

        <div style="background:#f9fafb; border-radius:10px; padding:16px; border:1px solid #e5e7eb;">
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <span style="color:#6b7280;">Total</span>
            <strong style="color:#111827;">${total}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <span style="color:#6b7280;">Paid</span>
            <strong style="color:#111827;">${paid}</strong>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:#6b7280;">Remaining</span>
            <strong style="color:#b91c1c;">${remaining}</strong>
          </div>
        </div>

        ${mealTable}

        <div style="margin-top:20px; font-size:12px; color:#6b7280;">
          Bill ID: ${bill.id.slice(0, 8).toUpperCase()}
        </div>
      </div>
    </div>
  `

  const text = `SKC Caterers\nBill for ${eventName}\nTotal: ${total}\nPaid: ${paid}\nRemaining: ${remaining}\nBill ID: ${bill.id.slice(0, 8).toUpperCase()}`

  return { subject, html, text }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json().catch(() => ({}))
    const bill = await prisma.bill.findUnique({
      where: { id: params.id },
      include: {
        order: {
          include: { customer: true },
        },
      },
    })

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }

    const customerEmail = bill.order?.customer?.email
    const to = data.email || customerEmail
    if (!to) {
      return NextResponse.json({ error: 'Customer email not found' }, { status: 400 })
    }

    const transporter = getTransporter()
    if (!transporter) {
      return NextResponse.json(
        { error: 'SMTP configuration missing' },
        { status: 500 }
      )
    }

    const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@skc.local'
    const { subject, html, text } = buildBillEmail(bill)

    await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to send bill email:', error)
    return NextResponse.json(
      { error: 'Failed to send bill email', details: error.message },
      { status: 500 }
    )
  }
}
