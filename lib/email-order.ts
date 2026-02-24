/**
 * Order email template - menu details + event details for customers
 */

import { generateCustomerEmailWrapper } from './email-customer'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://skc-tan.vercel.app'

export function generateOrderEmailHTML(params: {
  customerName: string
  eventName?: string
  eventDate?: string
  orderId: string
}): string {
  const { customerName, eventName, eventDate, orderId } = params

  const content = `
    <p>Please find your order details (menu + event information) attached.</p>
    ${eventName ? `<p><strong>Event:</strong> ${eventName}</p>` : ''}
    ${eventDate ? `<p><strong>Event Date:</strong> ${eventDate}</p>` : ''}
    <p style="font-size:12px; color:#6b7280;">Order ID: SKC-ORDER-${orderId}</p>
    <p style="margin-top:16px;">Your order PDF is attached with the complete menu and event details.</p>
  `

  return generateCustomerEmailWrapper({
    title: 'Your Order - SKC Caterers',
    greeting: `Dear ${customerName},`,
    content,
    footerNote: 'Thank you for choosing SKC Caterers. We look forward to serving you!',
    ctaLabel: 'View Order',
    ctaLink: `${APP_URL}/orders`,
  })
}
