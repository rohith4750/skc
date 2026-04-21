import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { workforceId } = await req.json()

    if (!workforceId) {
      return NextResponse.json({ error: 'Missing workforceId' }, { status: 400 })
    }

    // Update the workforce member to stop tracking
    await (prisma as any).workforce.update({
      where: { id: workforceId },
      data: { isTrackingActive: false }
    })

    // Also clear existing locations if you want a clean slate (optional)
    // To keep breadcrumbs of current session but stop future ones, we just update the flag.

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Stop Tracking API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
