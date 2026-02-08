import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type MonthlyTrend = {
  month: string
  revenue: number
  expenses: number
  orders: number
  profit: number
}

const clampNumber = (value: number, min: number, max: number) => {
  if (Number.isNaN(value)) return min
  return Math.min(Math.max(value, min), max)
}

const getMonthKey = (date: Date) => {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

const getMonthStartUtc = (year: number, monthIndex: number) =>
  new Date(Date.UTC(year, monthIndex, 1))

const getMonthDiff = (start: Date, end: Date) => {
  const startTotal = start.getUTCFullYear() * 12 + start.getUTCMonth()
  const endTotal = end.getUTCFullYear() * 12 + end.getUTCMonth()
  return endTotal - startTotal
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const monthsParam = parseInt(searchParams.get('months') || '12', 10)
    const forecastParam = parseInt(searchParams.get('forecastMonths') || '3', 10)

    const months = clampNumber(monthsParam, 3, 36)
    const forecastMonths = clampNumber(forecastParam, 1, 12)

    const now = new Date()
    const nowUtc = getMonthStartUtc(now.getUTCFullYear(), now.getUTCMonth())
    let monthsUsed = months
    let startDate = getMonthStartUtc(
      now.getUTCFullYear(),
      now.getUTCMonth() - (monthsUsed - 1)
    )

    let [expenses, orders] = await Promise.all([
      prisma.expense.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true, amount: true },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true, totalAmount: true },
      }),
    ])

    if (expenses.length === 0 && orders.length === 0) {
      ;[expenses, orders] = await Promise.all([
        prisma.expense.findMany({
          select: { createdAt: true, amount: true },
        }),
        prisma.order.findMany({
          select: { createdAt: true, totalAmount: true },
        }),
      ])

      const earliestExpense = expenses.reduce<Date | null>((earliest, expense) => {
        const date = new Date(expense.createdAt)
        if (!earliest || date < earliest) return date
        return earliest
      }, null)
      const earliestOrder = orders.reduce<Date | null>((earliest, order) => {
        const date = new Date(order.createdAt)
        if (!earliest || date < earliest) return date
        return earliest
      }, null)

      const earliest = [earliestExpense, earliestOrder].filter(Boolean).sort((a, b) => {
        return (a as Date).getTime() - (b as Date).getTime()
      })[0] as Date | undefined

      if (earliest) {
        const earliestMonth = getMonthStartUtc(earliest.getUTCFullYear(), earliest.getUTCMonth())
        const monthDiff = getMonthDiff(earliestMonth, nowUtc)
        monthsUsed = Math.min(months, Math.max(1, monthDiff + 1))
        startDate = getMonthStartUtc(
          now.getUTCFullYear(),
          now.getUTCMonth() - (monthsUsed - 1)
        )
      }
    }

    const monthsMap: Record<string, MonthlyTrend> = {}
    for (let i = monthsUsed - 1; i >= 0; i -= 1) {
      const monthDate = getMonthStartUtc(
        now.getUTCFullYear(),
        now.getUTCMonth() - i
      )
      const monthKey = getMonthKey(monthDate)
      monthsMap[monthKey] = {
        month: monthKey,
        revenue: 0,
        expenses: 0,
        orders: 0,
        profit: 0,
      }
    }

    expenses.forEach((expense) => {
      const key = getMonthKey(new Date(expense.createdAt))
      if (monthsMap[key]) {
        monthsMap[key].expenses += Number(expense.amount) || 0
      }
    })

    orders.forEach((order) => {
      const key = getMonthKey(new Date(order.createdAt))
      if (monthsMap[key]) {
        monthsMap[key].revenue += Number(order.totalAmount) || 0
        monthsMap[key].orders += 1
      }
    })

    const monthlyTrends = Object.values(monthsMap).map((trend) => ({
      ...trend,
      profit: trend.revenue - trend.expenses,
    }))

    if (monthlyTrends.length < 3) {
      return NextResponse.json({
        months: monthsUsed,
        forecastMonths,
        generatedAt: new Date().toISOString(),
        monthlyTrends,
        predictiveAnalysis: null,
      })
    }

    const revenues = monthlyTrends.map((m) => m.revenue)
    const expenseValues = monthlyTrends.map((m) => m.expenses)
    const orderValues = monthlyTrends.map((m) => m.orders)
    const profitValues = monthlyTrends.map((m) => m.profit)

    const revenueGrowthRates: number[] = []
    const expenseGrowthRates: number[] = []
    const orderGrowthRates: number[] = []
    const profitGrowthRates: number[] = []

    for (let i = 1; i < revenues.length; i += 1) {
      if (revenues[i - 1] > 0) {
        revenueGrowthRates.push(((revenues[i] - revenues[i - 1]) / revenues[i - 1]) * 100)
      }
      if (expenseValues[i - 1] > 0) {
        expenseGrowthRates.push(((expenseValues[i] - expenseValues[i - 1]) / expenseValues[i - 1]) * 100)
      }
      if (orderValues[i - 1] > 0) {
        orderGrowthRates.push(((orderValues[i] - orderValues[i - 1]) / orderValues[i - 1]) * 100)
      }
      if (profitValues[i - 1] !== 0) {
        profitGrowthRates.push(
          profitValues[i - 1] > 0
            ? ((profitValues[i] - profitValues[i - 1]) / Math.abs(profitValues[i - 1])) * 100
            : 0
        )
      }
    }

    const average = (values: number[]) =>
      values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0

    const avgRevenueGrowth = average(revenueGrowthRates)
    const avgExpenseGrowth = average(expenseGrowthRates)
    const avgOrderGrowth = average(orderGrowthRates)
    const avgProfitGrowth = average(profitGrowthRates)

    const lastRevenue = revenues[revenues.length - 1]
    const lastExpense = expenseValues[expenseValues.length - 1]
    const lastOrders = orderValues[orderValues.length - 1]

    const forecasts = []
    for (let i = 1; i <= forecastMonths; i += 1) {
      const forecastDate = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const forecastRevenue = lastRevenue * Math.pow(1 + avgRevenueGrowth / 100, i)
      const forecastExpense = lastExpense * Math.pow(1 + avgExpenseGrowth / 100, i)
      const forecastOrders = Math.round(lastOrders * Math.pow(1 + avgOrderGrowth / 100, i))
      const forecastProfit = forecastRevenue - forecastExpense

      forecasts.push({
        month: getMonthKey(forecastDate),
        revenue: forecastRevenue,
        expenses: forecastExpense,
        orders: forecastOrders,
        profit: forecastProfit,
      })
    }

    const projectedAnnualRevenue = lastRevenue * 12 * (1 + avgRevenueGrowth / 100)
    const projectedAnnualExpenses = lastExpense * 12 * (1 + avgExpenseGrowth / 100)
    const projectedAnnualOrders = Math.round(lastOrders * 12 * (1 + avgOrderGrowth / 100))
    const projectedAnnualProfit = projectedAnnualRevenue - projectedAnnualExpenses

    const avgMonthlyExpenses = expenseValues.reduce((sum, value) => sum + value, 0) / expenseValues.length
    const projectedCashFlow = (lastRevenue - avgMonthlyExpenses) * forecastMonths

    return NextResponse.json({
      months: monthsUsed,
      forecastMonths,
      generatedAt: new Date().toISOString(),
      monthlyTrends,
      predictiveAnalysis: {
        avgRevenueGrowth,
        avgExpenseGrowth,
        avgOrderGrowth,
        avgProfitGrowth,
        forecasts,
        projections: {
          annualRevenue: projectedAnnualRevenue,
          annualExpenses: projectedAnnualExpenses,
          annualOrders: projectedAnnualOrders,
          annualProfit: projectedAnnualProfit,
          cashFlow: projectedCashFlow,
        },
        trends: {
          revenueTrend: avgRevenueGrowth > 0 ? 'up' : avgRevenueGrowth < 0 ? 'down' : 'stable',
          expenseTrend: avgExpenseGrowth > 0 ? 'up' : avgExpenseGrowth < 0 ? 'down' : 'stable',
          orderTrend: avgOrderGrowth > 0 ? 'up' : avgOrderGrowth < 0 ? 'down' : 'stable',
          profitTrend: avgProfitGrowth > 0 ? 'up' : avgProfitGrowth < 0 ? 'down' : 'stable',
        },
      },
    })
  } catch (error) {
    console.error('Predictive analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to generate predictive analysis' },
      { status: 500 }
    )
  }
}
