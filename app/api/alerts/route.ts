import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const alerts: any[] = []
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dayAfterTomorrow = new Date(today)
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)

    // 1. LOW STOCK WARNINGS
    try {
      // Get all inventory and filter by minQuantity threshold
      const allInventory = await prisma.inventory.findMany()
      const lowStock = allInventory.filter(item => {
        const minQty = item.minQuantity ?? 10 // Default threshold: 10 if not set
        return item.quantity <= minQty
      })
      
      lowStock.forEach(item => {
        const minQty = item.minQuantity ?? 10 // Default threshold: 10 if not set
        const severity = item.quantity === 0 ? 'critical' : item.quantity <= 5 ? 'high' : 'medium'
        alerts.push({
          id: `stock-${item.id}`,
          type: 'low_stock',
          title: item.quantity === 0 ? 'Out of Stock!' : 'Low Stock Warning',
          message: `${item.name}: ${item.quantity} ${item.unit} remaining (Min: ${minQty})`,
          severity,
          entityId: item.id,
          entityType: 'inventory',
          createdAt: now.toISOString(),
          data: {
            itemName: item.name,
            currentQty: item.quantity,
            minQty: minQty,
            unit: item.unit
          }
        })
      })
    } catch (e) {
      console.log('Could not fetch inventory alerts:', e)
    }

    // 2. PAYMENT REMINDERS (Unpaid/Partial Bills)
    try {
      const unpaidBills = await prisma.bill.findMany({
        where: {
          OR: [
            { status: 'pending' },
            { status: 'partial' }
          ]
        },
        include: {
          order: {
            include: {
              customer: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      })

      unpaidBills.forEach(bill => {
        const pendingAmount = bill.totalAmount - (bill.paidAmount || 0)
        const daysSinceCreated = Math.floor((now.getTime() - new Date(bill.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        const severity = daysSinceCreated > 30 ? 'critical' : daysSinceCreated > 14 ? 'high' : daysSinceCreated > 7 ? 'medium' : 'low'
        
        alerts.push({
          id: `payment-${bill.id}`,
          type: 'payment_reminder',
          title: daysSinceCreated > 30 ? 'Overdue Payment!' : 'Payment Pending',
          message: `${bill.order?.customer?.name || 'Unknown'} - ₹${pendingAmount.toLocaleString()} pending (${daysSinceCreated} days)`,
          severity,
          entityId: bill.id,
          entityType: 'bill',
          createdAt: bill.createdAt.toISOString(),
          data: {
            customerName: bill.order?.customer?.name,
            billId: bill.id,
            orderId: bill.orderId,
            totalAmount: bill.totalAmount,
            paidAmount: bill.paidAmount || 0,
            pendingAmount,
            daysPending: daysSinceCreated,
            orderName: bill.order?.eventName
          }
        })
      })
    } catch (e) {
      console.log('Could not fetch payment alerts:', e)
    }

    // 3. UPCOMING EVENT ALERTS
    try {
      const upcomingOrders = await prisma.order.findMany({
        where: {
          eventDate: {
            gte: today,
            lt: dayAfterTomorrow
          },
          status: {
            not: 'cancelled'
          }
        },
        include: {
          customer: true
        },
        orderBy: { eventDate: 'asc' }
      })

      upcomingOrders.forEach(order => {
        const eventDate = new Date(order.eventDate)
        const isToday = eventDate >= today && eventDate < tomorrow
        const severity = isToday ? 'critical' : 'high'
        
        alerts.push({
          id: `event-${order.id}`,
          type: 'upcoming_event',
          title: isToday ? '🔔 Event TODAY!' : '📅 Event Tomorrow',
          message: `${order.eventName} - ${order.customer?.name || 'Unknown'} (${order.numberOfMembers} guests)`,
          severity,
          entityId: order.id,
          entityType: 'order',
          createdAt: now.toISOString(),
          data: {
            eventName: order.eventName,
            customerName: order.customer?.name,
            eventDate: order.eventDate,
            numberOfMembers: order.numberOfMembers,
            venue: order.venue,
            eventType: order.eventType,
            isToday
          }
        })
      })
    } catch (e) {
      console.log('Could not fetch event alerts:', e)
    }

    // 4. FAILED LOGIN ATTEMPTS (Last 24 hours)
    try {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      
      const failedLogins = await (prisma as any).loginAuditLog.findMany({
        where: {
          success: false,
          loginTime: {
            gte: yesterday
          }
        },
        orderBy: { loginTime: 'desc' },
        take: 50
      })

      // Group by username to detect multiple failures
      const failuresByUser: Record<string, any[]> = {}
      failedLogins.forEach((log: any) => {
        if (!failuresByUser[log.username]) {
          failuresByUser[log.username] = []
        }
        failuresByUser[log.username].push(log)
      })

      Object.entries(failuresByUser).forEach(([username, failures]) => {
        const severity = failures.length >= 5 ? 'critical' : failures.length >= 3 ? 'high' : 'medium'
        const latestFailure = failures[0]
        
        alerts.push({
          id: `login-fail-${username}-${latestFailure.id}`,
          type: 'failed_login',
          title: failures.length >= 5 ? '🚨 Multiple Failed Logins!' : 'Failed Login Attempt',
          message: `${username}: ${failures.length} failed attempt(s) in last 24h from ${latestFailure.device} (${latestFailure.browser})`,
          severity,
          entityId: latestFailure.id,
          entityType: 'login_audit',
          createdAt: latestFailure.loginTime,
          data: {
            username,
            failureCount: failures.length,
            lastAttempt: latestFailure.loginTime,
            device: latestFailure.device,
            browser: latestFailure.browser,
            os: latestFailure.os,
            ipAddress: latestFailure.ipAddress,
            reasons: failures.map((f: any) => f.failReason).filter(Boolean)
          }
        })
      })
    } catch (e) {
      console.log('Could not fetch login alerts:', e)
    }

    // Sort all alerts by severity (critical first) then by date
    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
    alerts.sort((a, b) => {
      const severityDiff = (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3)
      if (severityDiff !== 0) return severityDiff
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    // Summary counts
    const summary = {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      low: alerts.filter(a => a.severity === 'low').length,
      byType: {
        low_stock: alerts.filter(a => a.type === 'low_stock').length,
        payment_reminder: alerts.filter(a => a.type === 'payment_reminder').length,
        upcoming_event: alerts.filter(a => a.type === 'upcoming_event').length,
        failed_login: alerts.filter(a => a.type === 'failed_login').length,
      }
    }

    return NextResponse.json({ alerts, summary })
  } catch (error: any) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json({ 
      alerts: [], 
      summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, byType: {} },
      error: 'Failed to fetch alerts' 
    })
  }
}

