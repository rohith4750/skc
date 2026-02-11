import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/require-auth'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth.response) return auth.response
  try {
    const alerts: any[] = []
    const now = new Date()

    // 1. LOW STOCK WARNINGS (Using Stock model which has minStock)
    try {
      const allStock = await prisma.stock.findMany({
        where: { isActive: true }
      })
      const lowStock = allStock.filter(item => item.minStock && Number(item.currentStock) <= Number(item.minStock))

      lowStock.forEach(item => {
        const currentStock = Number(item.currentStock)
        const minStock = Number(item.minStock || 0)
        const severity = currentStock === 0 ? 'critical' : currentStock <= minStock / 2 ? 'high' : 'medium'
        alerts.push({
          id: `stock-${item.id}`,
          type: 'low_stock',
          title: currentStock === 0 ? 'Out of Stock!' : 'Low Stock Warning',
          message: `${item.name}: ${currentStock} ${item.unit} remaining (Min: ${minStock})`,
          severity,
          entityId: item.id,
          entityType: 'stock',
          createdAt: now.toISOString(),
          data: {
            itemName: item.name,
            currentQty: currentStock,
            minQty: minStock,
            unit: item.unit,
            category: item.category
          }
        })
      })
    } catch (e) {
      console.log('Could not fetch stock alerts:', e)
    }

    // Also check Inventory items
    try {
      // Get all inventory and filter by minQuantity threshold
      const allInventory = await prisma.inventory.findMany({
        where: { isActive: true }
      })
      const lowInventory = allInventory.filter((item: any) => {
        const minQty = item.minQuantity ?? 10 // Default threshold: 10 if not set
        return item.quantity <= minQty
      })

      lowInventory.forEach((item: any) => {
        const minQty = item.minQuantity ?? 10 // Default threshold: 10 if not set
        const severity = item.quantity === 0 ? 'critical' : item.quantity <= 5 ? 'high' : 'medium'
        alerts.push({
          id: `inventory-${item.id}`,
          type: 'low_stock',
          title: item.quantity === 0 ? 'Out of Stock!' : 'Low Inventory Warning',
          message: `${item.name}: ${item.quantity} ${item.unit} remaining (Min: ${minQty})`,
          severity,
          entityId: item.id,
          entityType: 'inventory',
          createdAt: now.toISOString(),
          data: {
            itemName: item.name,
            currentQty: item.quantity,
            minQty: minQty,
            unit: item.unit,
            category: item.category
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
        const pendingAmount = Number(bill.totalAmount) - Number(bill.paidAmount || 0)
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

    // 3. UPCOMING EVENT ALERTS (Based on recent pending orders)
    try {
      // Get pending/confirmed orders from last 30 days (since there's no eventDate field)
      const thirtyDaysAgo = new Date(now)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const recentOrders = await prisma.order.findMany({
        where: {
          status: {
            in: ['pending', 'in_progress'] // Updated to use Enum values if possible, or string mapping
          },
          createdAt: {
            gte: thirtyDaysAgo
          }
        },
        include: {
          customer: true
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      })

      recentOrders.forEach(order => {
        const daysSinceCreated = Math.floor((now.getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        const severity = daysSinceCreated <= 1 ? 'critical' : daysSinceCreated <= 3 ? 'high' : 'medium'

        alerts.push({
          id: `event-${order.id}`,
          type: 'upcoming_event',
          title: daysSinceCreated <= 1 ? '🔔 Recent Order!' : '📅 Pending Order',
          message: `${order.eventName || 'Order'} - ${order.customer?.name || 'Unknown'} (${order.numberOfMembers || 0} guests)`,
          severity,
          entityId: order.id,
          entityType: 'order',
          createdAt: order.createdAt.toISOString(),
          data: {
            eventName: order.eventName,
            customerName: order.customer?.name,
            createdAt: order.createdAt,
            numberOfMembers: order.numberOfMembers,
            totalAmount: order.totalAmount,
            status: order.status
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
          message: `${username}: ${failures.length} failed attempt(s) in last 24h from ${latestFailure.device || 'Unknown'} (${latestFailure.browser || 'Unknown'})`,
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
