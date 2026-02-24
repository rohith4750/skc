import { NextRequest, NextResponse } from 'next/server'
import { sendAlertToUsers } from '@/lib/email-alerts'

/**
 * Test endpoint to verify email alerts are working
 * 
 * Usage: GET /api/test/email-alert?type=test
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'test'

    console.log('[Test] Sending test email alert...')

    // Send a test alert
    await sendAlertToUsers({
      type: 'order_created',
      title: 'Test Email Alert',
      message: `This is a test email alert sent at ${new Date().toLocaleString()}. If you receive this, the email system is working correctly!`,
      details: {
        'Test Type': type,
        'Timestamp': new Date().toISOString(),
        'System': 'SKC Caterers Management',
        'Status': 'Email system is operational ✓',
      },
      link: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    })

    return NextResponse.json({
      success: true,
      message: 'Test email alert sent successfully',
      timestamp: new Date().toISOString(),
      note: 'Check the email inboxes of all active internal users',
    })
  } catch (error: any) {
    console.error('[Test] Error sending test email alert:', error)
    return NextResponse.json(
      {
        error: 'Failed to send test email alert',
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
