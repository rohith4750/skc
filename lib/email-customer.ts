/**
 * Customer-facing email templates
 * Professional UI with logo for bills and menu
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://skc-tan.vercel.app'
const LOGO_URL = `${APP_URL}/images/logo.jpg`

export function generateCustomerEmailWrapper(params: {
  title: string
  greeting: string
  content: string
  footerNote?: string
  ctaLabel?: string
  ctaLink?: string
}): string {
  const { title, greeting, content, footerNote, ctaLabel, ctaLink } = params

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #f3f4f6;
      padding: 24px 16px;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .logo-container {
      margin-bottom: 16px;
    }
    .logo {
      width: 88px;
      height: 88px;
      border-radius: 50%;
      border: 3px solid rgba(255,255,255,0.9);
      object-fit: cover;
      display: inline-block;
    }
    .header h1 {
      color: #ffffff;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin: 0;
    }
    .header .tagline {
      color: rgba(255,255,255,0.9);
      font-size: 12px;
      margin-top: 4px;
    }
    .body {
      padding: 32px 24px;
    }
    .greeting {
      font-size: 16px;
      color: #374151;
      margin-bottom: 16px;
    }
    .content {
      font-size: 14px;
      color: #4b5563;
    }
    .content-block {
      margin-bottom: 20px;
    }
    .content-block:last-child {
      margin-bottom: 0;
    }
    .cta-wrapper {
      text-align: center;
      margin: 24px 0 0;
    }
    .cta-btn {
      display: inline-block;
      padding: 12px 28px;
      background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      box-shadow: 0 2px 4px rgba(217, 119, 6, 0.3);
    }
    .footer {
      background: #f9fafb;
      padding: 20px 24px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
    }
    .footer-note {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 8px;
    }
    .footer-contact {
      font-size: 11px;
      color: #9ca3af;
    }
    .footer-contact a {
      color: #d97706;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      <div class="logo-container">
        <img src="${LOGO_URL}" alt="SKC Caterers" class="logo" width="88" height="88" />
      </div>
      <h1>SRIVATSASA & KOWNDINYA CATERERS</h1>
      <p class="tagline">Pure Vegetarian Catering</p>
    </div>

    <div class="body">
      <div class="greeting">${greeting}</div>
      <div class="content">${content}</div>
      ${ctaLabel && ctaLink ? `
      <div class="cta-wrapper">
        <a href="${ctaLink}" class="cta-btn">${ctaLabel}</a>
      </div>
      ` : ''}
    </div>

    <div class="footer">
      ${footerNote ? `<p class="footer-note">${footerNote}</p>` : ''}
      <p class="footer-contact">
        📞 9866652150, 9900119302, 9656501388 &nbsp;|&nbsp;
        📧 <a href="mailto:pujyasri1989cya@gmail.com">pujyasri1989cya@gmail.com</a>
      </p>
    </div>
  </div>
</body>
</html>
`
}

export function generateBillEmailHTML(params: {
  customerName: string
  eventName: string
  total: string
  paid: string
  remaining: string
  billNumber: string
  mealRows?: string
}): string {
  const { customerName, eventName, total, paid, remaining, billNumber, mealRows } = params

  const content = `
    <p>Please find your bill details for <strong>${eventName}</strong>.</p>
    <div style="background:#f9fafb; border-radius:10px; padding:20px; margin:16px 0; border:1px solid #e5e7eb;">
      <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
        <span style="color:#6b7280;">Total Amount</span>
        <strong style="color:#111827;">${total}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
        <span style="color:#6b7280;">Advance Paid</span>
        <strong style="color:#059669;">${paid}</strong>
      </div>
      <div style="display:flex; justify-content:space-between;">
        <span style="color:#6b7280;">Balance Due</span>
        <strong style="color:#b91c1c;">${remaining}</strong>
      </div>
    </div>
    ${mealRows || ''}
    <p style="font-size:12px; color:#6b7280;">Bill No: SKC-${billNumber}</p>
    <p style="margin-top:16px;">Your bill PDF is attached to this email. Please keep it for your records.</p>
  `

  return generateCustomerEmailWrapper({
    title: `Bill - ${eventName}`,
    greeting: `Dear ${customerName},`,
    content,
    footerNote: 'Thank you for choosing SKC Caterers. We look forward to serving you!',
    ctaLabel: 'View Order Details',
    ctaLink: `${APP_URL}/orders`,
  })
}

export function generateMenuEmailHTML(params: {
  customerName?: string
  introMessage?: string
}): string {
  const customerName = params.customerName || 'Valued Customer'
  const introMessage = params.introMessage || 'Please find our complete menu attached for your reference.'

  const content = `
    <p>${introMessage}</p>
    <p>Our menu PDF is attached to this email. You can view, download, or print it for your convenience.</p>
  `

  return generateCustomerEmailWrapper({
    title: 'SKC Caterers - Complete Menu',
    greeting: `Dear ${customerName},`,
    content,
    footerNote: 'Contact us for bookings and custom menu options. We are here to make your event special!',
  })
}
