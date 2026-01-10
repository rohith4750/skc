// Server-side email sending utility
// Supports multiple email providers:
// 1. Resend (easy setup, free tier: 100 emails/day)
// 2. Nodemailer/SMTP (completely free, self-hosted, works with Gmail/Outlook)

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const { to, subject, html, text } = options

    // Try Resend first (recommended - simple API, free tier)
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
      
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
      })
      
      console.log(`Email sent successfully to ${to} using Resend`)
      return true
    } catch (error: any) {
      console.error('Resend email error:', error?.message || error)
      // Fall through to try other methods
    }
  }

  // Try Nodemailer/SMTP if configured (Free + Self-hosted option)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const nodemailer = await import('nodemailer')
      
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })

      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
      })

      console.log(`Email sent successfully to ${to} using SMTP`)
      return true
    } catch (error: any) {
      console.error('SMTP email error:', error?.message || error)
      // Fall through
    }
  }

  // No email service configured - log to console
  console.warn('No email service configured. Email not sent.')
  console.log('Email details:', { to, subject, html })
  return false
}
