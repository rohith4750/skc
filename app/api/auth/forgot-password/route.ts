import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendEmail } from '@/lib/email-server'
import { isEmail } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!isEmail(email)) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    })

    // For security, always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (user) {
      // Generate 6-digit reset code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString()
      const resetTokenExpiry = new Date()
      resetTokenExpiry.setMinutes(resetTokenExpiry.getMinutes() + 15) // Code expires in 15 minutes

      // Save reset code to database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: resetCode,
          resetTokenExpiry
        }
      })

      // Send password reset code via email
      try {
        const emailSent = await sendEmail({
          to: user.email,
          subject: 'Password Reset Code - SKC Caterers',
          html: `
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
                    <p>Password Reset Code</p>
                  </div>
                  <div class="content">
                    <p>Hello,</p>
                    <p>We received a request to reset your password for your SKC Caterers account.</p>
                    <p>Use the code below to reset your password:</p>
                    <div class="code-box">
                      <div class="code">${resetCode}</div>
                    </div>
                    <div class="warning">
                      <strong>⚠️ Important:</strong> This code will expire in 15 minutes. If you didn't request a password reset, please ignore this email.
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
          `,
          text: `Password Reset Code - SKC Caterers

Hello,

We received a request to reset your password for your SKC Caterers account.

Your password reset code is: ${resetCode}

Important: This code will expire in 15 minutes. If you didn't request a password reset, please ignore this email.

Best regards,
SKC Caterers Team`
        })

        if (!emailSent) {
          // Log to console if email service is not configured
          console.log(`Password reset code for ${email}: ${resetCode}`)
          console.warn('Email service not configured. Reset code logged to console.')
        }
      } catch (emailError: any) {
        // Don't fail the request if email sending fails
        console.error('Email sending error (non-critical):', emailError?.message || emailError)
        console.log(`Password reset code for ${email}: ${resetCode}`)
      }
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a verification code has been sent.'
    })
  } catch (error: any) {
    console.error('Forgot password error:', error)
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    })
    return NextResponse.json(
      { error: 'Internal server error', details: process.env.NODE_ENV === 'development' ? error?.message : undefined },
      { status: 500 }
    )
  }
}
