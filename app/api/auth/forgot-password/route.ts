import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
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
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex')
      const resetTokenExpiry = new Date()
      resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1) // Token expires in 1 hour

      // Save reset token to database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry
        }
      })

      // In production, send email with reset link here
      // For now, we'll just log it (you can implement email sending later)
      console.log(`Password reset token for ${email}: ${resetToken}`)
      console.log(`Reset link: /reset-password?token=${resetToken}`)
      
      // TODO: Send email with reset link using your email service
      // await sendPasswordResetEmail(user.email, resetToken)
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    })
  } catch (error: any) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
