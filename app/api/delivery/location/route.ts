import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { pusherServer } from '@/lib/pusher'

export async function POST(req: NextRequest) {
  try {
    const { token, lat, lng } = await req.json()

    if (!token || lat === undefined || lng === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Find the workforce member by token
    const worker = await (prisma.workforce as any).findFirst({
      where: { trackingToken: token },
      select: { id: true, name: true, role: true, isTrackingActive: true }
    })

    if (!worker) {
      return NextResponse.json({ error: 'Invalid tracking token' }, { status: 403 })
    }

    if (!worker.isTrackingActive) {
      return NextResponse.json({ error: 'Tracking disabled by admin' }, { status: 403 })
    }

    // 2. Save the location to the database (History)
    const newLocation = await (prisma as any).deliveryLocation.create({
      data: {
        workforceId: worker.id,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      }
    })

    // 3. Broadcast the update via Pusher for real-time dashboard
    try {
      await pusherServer.trigger('delivery-tracking', 'location-update', {
        workforceId: worker.id,
        workerName: worker.name,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        timestamp: (newLocation as any).timestamp
      })
    } catch (pusherError) {
      console.error('Pusher Broadcast Error:', pusherError)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Tracking API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    // 1. Get all workforce members who have locations in the last 4 hours
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000)
    
    const activeLocations = await (prisma as any).deliveryLocation.findMany({
      where: {
        timestamp: { gte: fourHoursAgo }
      },
      orderBy: { timestamp: 'asc' },
      include: {
        workforce: {
          select: { id: true, name: true }
        }
      }
    })

    // 2. Group by worker
    const workers: Record<string, any> = {}
    
    activeLocations.forEach((loc: any) => {
      if (!workers[loc.workforceId]) {
        workers[loc.workforceId] = {
          name: loc.workforce.name,
          currentLocation: { lat: loc.lat, lng: loc.lng },
          history: [],
          lastUpdate: loc.timestamp
        }
      }
      
      workers[loc.workforceId].history.push([loc.lat, loc.lng])
      workers[loc.workforceId].currentLocation = { lat: loc.lat, lng: loc.lng }
      workers[loc.workforceId].lastUpdate = loc.timestamp
    })

    return NextResponse.json({ workers })
  } catch (error) {
    console.error('Tracking History API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
