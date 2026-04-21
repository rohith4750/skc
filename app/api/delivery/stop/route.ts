import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { workforceId, token } = await req.json()

    if (!workforceId && !token) {
      return NextResponse.json({ error: 'Missing workforceId or token' }, { status: 400 })
    }

    if (token) {
      // End session using the tracking token (from driver side)
      await (prisma as any).workforce.update({
        where: { trackingToken: token },
        data: { isTrackingActive: false }
      })
    } else {
      // End session using workforceId (from admin side)
      await (prisma as any).workforce.update({
        where: { id: workforceId },
        data: { isTrackingActive: false }
      })
    }

    // Also clear existing locations if you want a clean slate (optional)
    // To keep breadcrumbs of current session but stop future ones, we just update the flag.

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Stop Tracking API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
