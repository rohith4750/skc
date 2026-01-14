import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const bills = await prisma.bill.findMany({
      include: {
        order: {
          include: {
            customer: true,
            supervisor: true,
            items: {
              include: {
                menuItem: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Deduplicate bills by orderId (in case of any duplicates)
    const uniqueBills = bills.reduce((acc: any[], bill: any) => {
      const existing = acc.find(b => b.orderId === bill.orderId)
      if (!existing) {
        acc.push(bill)
      } else {
        // If duplicate found, keep the most recent one
        if (new Date(bill.createdAt) > new Date(existing.createdAt)) {
          const index = acc.indexOf(existing)
          acc[index] = bill
        }
      }
      return acc
    }, [])
    
    console.log(`[Bills API] Total bills in DB: ${bills.length}, Unique bills: ${uniqueBills.length}`)
    
    return NextResponse.json(uniqueBills, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (error) {
    console.error('[Bills API] Error fetching bills:', error)
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 })
  }
}

