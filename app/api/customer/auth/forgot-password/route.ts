import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email-server'
import { isEmail } from '@/lib/validation'

const allowedOrigins = new Set([
  'https://www.skconline.in',
  'https://skconline.in',
  'https://www.skccaterers.in',
  'https://skccaterers.in',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
])

const allowedMethods = 'POST, OPTIONS'
const allowedHeaders = 'Content-Type, Authorization'

const buildCorsHeaders = (origin: string | null) => {
  if (!origin) return null
  if (!allowedOrigins.has(origin)) return null

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': allowedMethods,
    'Access-Control-Allow-Headers': allowedHeaders,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
    'X-Cors-Debug': 'customer-auth-forgot-password',
  }
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin')
  const corsHeaders = buildCorsHeaders(origin)

  if (origin && !corsHeaders) {
    return new NextResponse(null, { status: 403 })
  }

  return new NextResponse(null, { status: 204, headers: corsHeaders ?? undefined })
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const corsHeaders = buildCorsHeaders(origin)

  if (origin && !corsHeaders) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 })
  }

  try {
    const { email } = await request.json()

    if (!isEmail(email)) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400, headers: corsHeaders ?? undefined },
      )
    }

    const lowerEmail = (email as string).trim().toLowerCase()

    const user = await (prisma as any).customerUser.findFirst({
      where: { email: lowerEmail },
    }) as any

    if (user) {
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString()
      const resetTokenExpiry = new Date()
      resetTokenExpiry.setMinutes(resetTokenExpiry.getMinutes() + 15)

      await (prisma as any).customerUser.update({
        where: { id: user.id },
        data: {
          resetToken: resetCode,
          resetTokenExpiry,
        },
      })

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f97316; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
              .code-box { background-color: #ffffff; border: 3px solid #f97316; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
              .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #f97316; font-family: 'Courier New', monospace; }
              .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
              .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>SKC Caterers</h1>
                <p>Customer Password Reset Code</p>
              </div>
              <div class="content">
                <p>Hello,</p>
                <p>We received a request to reset the password for your SKC Caterers customer account.</p>
                <p>Use the code below to reset your password:</p>
                <div class="code-box">
                  <div class="code">${resetCode}</div>
                </div>
                <div class="warning">
                  <strong>Important:</strong> This code will expire in 15 minutes. If you didn't request a password reset, you can safely ignore this email.
                </div>
                <p>Best regards,<br>SKC Caterers Team</p>
              </div>
              <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; ${new Date().getFullYear()} SKC Caterers. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `

      const emailSent = await sendEmail({
        to: lowerEmail,
        subject: 'Customer Password Reset Code - SKC Caterers',
        html,
        text: `Your customer password reset code is: ${resetCode}`,
      })

      if (!emailSent) {
        console.log(`Customer password reset code for ${lowerEmail}: ${resetCode}`)
        console.warn('Email service not configured. Reset code logged to console.')
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'If a customer account with that email exists, a verification code has been sent.',
      },
      { status: 200, headers: corsHeaders ?? undefined },
    )
  } catch (error: any) {
    console.error('Customer forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: process.env.NODE_ENV === 'development' ? error?.message : undefined },
      { status: 500, headers: corsHeaders ?? undefined },
    )
  }
}

