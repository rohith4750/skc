import { NextRequest, NextResponse } from 'next/server'
import { checkTomorrowOrders } from '@/lib/email-alerts'

/**
 * Cron job endpoint to check for tomorrow's orders and send email alerts
 * 
 * This should be called daily (preferably in the evening)
 * You can use:
 * 1. Vercel Cron Jobs (vercel.json)
 * 2. External cron service (cron-job.org, EasyCron)
 * 3. GitHub Actions scheduled workflow
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Add extra security for manual calls
    // Vercel Cron Jobs automatically authenticate, but this protects against manual unauthorized calls
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    // Allow requests from Vercel Cron (no auth header) OR valid manual requests with Bearer token
    const isVercelCron = request.headers.get('user-agent')?.includes('vercel-cron')
    const isAuthorizedManual = cronSecret && authHeader === `Bearer ${cronSecret}`
    
    if (!isVercelCron && !isAuthorizedManual) {
      console.warn('[Cron] Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Cron] Checking tomorrow\'s orders...')
    
    await checkTomorrowOrders()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Tomorrow orders check completed',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[Cron] Error checking tomorrow orders:', error)
    return NextResponse.json(
      { error: 'Failed to check tomorrow orders', details: error.message },
      { status: 500 }
    )
  }
}
