import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/require-auth'

const WORKFORCE_ROLES = ['supervisor', 'chef', 'labours', 'boys', 'transport', 'gas', 'pan', 'store', 'other']

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth.response) return auth.response
  try {
    const expenses = await (prisma as any).expense.findMany({
      include: {
        order: {
          include: { customer: true },
        },
      },
      orderBy: { paymentDate: 'desc' },
    })

    let workforcePayments: any[] = []
    try {
      workforcePayments = await (prisma as any).workforcePayment.findMany({
        orderBy: { paymentDate: 'desc' },
      })
    } catch {}

    // Group expenses by order (event)
    const orderIdsSet = new Set<string>()
    expenses.forEach((exp: any) => {
      if (exp.orderId) orderIdsSet.add(exp.orderId)
      if (exp.isBulkExpense && exp.bulkAllocations) {
        (exp.bulkAllocations as any[]).forEach((a: any) => a.orderId && orderIdsSet.add(a.orderId))
      }
    })
    const orderIds = Array.from(orderIdsSet)
    const orders = orderIds.length
      ? await (prisma as any).order.findMany({
          where: { id: { in: orderIds } },
          include: { customer: true },
        })
      : []
    const orderById = Object.fromEntries(orders.map((o: any) => [o.id, o]))

    const eventsMap: Record<string, { expenses: any[]; totalAmount: number }> = {}

    expenses.forEach((exp: any) => {
      const amount = Number(exp.amount || 0)
      if (exp.orderId) {
        const key = exp.orderId
        if (!eventsMap[key]) eventsMap[key] = { expenses: [], totalAmount: 0 }
        eventsMap[key].expenses.push(exp)
        eventsMap[key].totalAmount += amount
      } else if (exp.isBulkExpense && exp.bulkAllocations) {
        (exp.bulkAllocations as any[]).forEach((alloc: any) => {
          const oid = alloc.orderId
          if (oid) {
            if (!eventsMap[oid]) eventsMap[oid] = { expenses: [], totalAmount: 0 }
            const allocAmt = Number(alloc.amount || 0)
            eventsMap[oid].expenses.push({ ...exp, allocatedAmount: allocAmt })
            eventsMap[oid].totalAmount += allocAmt
          }
        })
      }
    })

    const events = Object.entries(eventsMap).map(([orderId, data]) => {
      const order = orderById[orderId]
      return {
        orderId,
        eventName: order?.eventName || order?.customer?.name || 'Event',
        eventDate: order?.eventDate,
        customerName: order?.customer?.name,
        expenses: data.expenses,
        totalAmount: data.totalAmount,
      }
    })

    events.sort((a, b) => {
      const da = a.eventDate ? new Date(a.eventDate).getTime() : 0
      const db = b.eventDate ? new Date(b.eventDate).getTime() : 0
      return db - da
    })

    // Group by role
    const byRole: Record<string, { totalDues: number; totalPaidFromExpenses: number; expenses: any[]; payments: any[] }> = {}
    WORKFORCE_ROLES.forEach((r) => {
      byRole[r] = { totalDues: 0, totalPaidFromExpenses: 0, expenses: [], payments: [] }
    })

    expenses.forEach((exp: any) => {
      const cat = (exp.category || 'other').toLowerCase()
      const role = WORKFORCE_ROLES.includes(cat) ? cat : 'other'
      if (!byRole[role]) byRole[role] = { totalDues: 0, totalPaidFromExpenses: 0, expenses: [], payments: [] }
      byRole[role].totalDues += Number(exp.amount || 0)
      byRole[role].totalPaidFromExpenses += Number(exp.paidAmount || 0)
      byRole[role].expenses.push(exp)
    })

    workforcePayments.forEach((p: any) => {
      const role = p.role && WORKFORCE_ROLES.includes(p.role.toLowerCase()) ? p.role.toLowerCase() : 'other'
      if (!byRole[role]) byRole[role] = { totalDues: 0, totalPaidFromExpenses: 0, expenses: [], payments: [] }
      byRole[role].payments.push(p)
    })

    const roleSummary = Object.entries(byRole).map(([role, data]) => {
      const totalPayments = data.payments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0)
      const totalPaid = data.totalPaidFromExpenses + totalPayments
      const outstanding = Math.max(0, data.totalDues - totalPaid)
      return {
        role,
        totalDues: data.totalDues,
        totalPaidFromExpenses: data.totalPaidFromExpenses,
        totalPayments,
        totalPaid,
        outstanding,
        expenseCount: data.expenses.length,
        paymentCount: data.payments.length,
        expenses: data.expenses,
        payments: data.payments,
      }
    })

    const totalOutstanding = roleSummary.reduce((s, r) => s + r.outstanding, 0)
    const totalDues = roleSummary.reduce((s, r) => s + r.totalDues, 0)
    const totalPaid = roleSummary.reduce((s, r) => s + r.totalPaid, 0)

    return NextResponse.json({
      events,
      roleSummary,
      totalOutstanding,
      totalDues,
      totalPaid,
    })
  } catch (error: any) {
    console.error('Failed to fetch outstanding:', error)
    return NextResponse.json(
      { error: 'Failed to fetch outstanding', details: error.message },
      { status: 500 }
    )
  }
}
