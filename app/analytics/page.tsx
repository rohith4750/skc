'use client'

import { useEffect, useState, useMemo } from 'react'
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils'
import { 
  FaChartLine, 
  FaChartBar, 
  FaChartPie, 
  FaMoneyBillWave, 
  FaShoppingCart,
  FaFileInvoiceDollar,
  FaUsers,
  FaCalendarAlt,
  FaArrowUp,
  FaArrowDown,
  FaDollarSign,
  FaWallet,
  FaReceipt,
  FaCreditCard,
  FaDownload,
  FaPercent,
  FaEquals,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaUtensils,
  FaStar,
  FaRetweet,
  FaStopwatch,
  FaCalendarWeek
} from 'react-icons/fa'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface AnalyticsData {
  orders: any[]
  bills: any[]
  expenses: any[]
  customers: any[]
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({
    orders: [],
    bills: [],
    expenses: [],
    customers: []
  })
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState<'all' | 'month' | 'year'>('all')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'operations' | 'customers'>('overview')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      // Add cache-busting parameter to ensure fresh data
      const cacheBuster = `?t=${Date.now()}`
      const [ordersRes, billsRes, expensesRes, customersRes] = await Promise.all([
        fetch(`/api/orders${cacheBuster}`, { cache: 'no-store' }),
        fetch(`/api/bills${cacheBuster}`, { cache: 'no-store' }),
        fetch(`/api/expenses${cacheBuster}`, { cache: 'no-store' }),
        fetch(`/api/customers${cacheBuster}`, { cache: 'no-store' })
      ])

      const [orders, bills, expenses, customers] = await Promise.all([
        ordersRes.ok ? ordersRes.json() : [],
        billsRes.ok ? billsRes.json() : [],
        expensesRes.ok ? expensesRes.json() : [],
        customersRes.ok ? customersRes.json() : []
      ])

      // Ensure bills have the correct status field (use database status directly)
      const normalizedBills = bills.map((bill: any) => ({
        ...bill,
        status: bill.status || 'pending' // Ensure status exists, default to pending if missing
      }))

      setData({ orders, bills: normalizedBills, expenses, customers })
    } catch (error) {
      console.error('Failed to load analytics data:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  // Get previous period data for comparison
  const getPreviousPeriodData = useMemo(() => {
    if (dateFilter === 'month') {
      const monthDate = new Date(selectedMonth + '-01')
      const prevMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1)
      const prevMonthEnd = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0, 23, 59, 59)
      
      return {
        orders: data.orders.filter((o: any) => {
          const date = new Date(o.createdAt)
          return date >= prevMonth && date <= prevMonthEnd
        }),
        bills: data.bills.filter((b: any) => {
          const date = new Date(b.createdAt)
          return date >= prevMonth && date <= prevMonthEnd
        }),
        expenses: data.expenses.filter((e: any) => {
          const date = new Date(e.createdAt)
          return date >= prevMonth && date <= prevMonthEnd
        })
      }
    } else if (dateFilter === 'year') {
      const prevYear = parseInt(selectedYear) - 1
      const prevYearStart = new Date(prevYear, 0, 1)
      const prevYearEnd = new Date(prevYear, 11, 31, 23, 59, 59)
      
      return {
        orders: data.orders.filter((o: any) => {
          const date = new Date(o.createdAt)
          return date >= prevYearStart && date <= prevYearEnd
        }),
        bills: data.bills.filter((b: any) => {
          const date = new Date(b.createdAt)
          return date >= prevYearStart && date <= prevYearEnd
        }),
        expenses: data.expenses.filter((e: any) => {
          const date = new Date(e.createdAt)
          return date >= prevYearStart && date <= prevYearEnd
        })
      }
    }
    return { orders: [], bills: [], expenses: [] }
  }, [data, dateFilter, selectedMonth, selectedYear])

  // Filter data based on date filter
  const filteredData = useMemo(() => {
    let filtered = { ...data }
    
    if (dateFilter === 'month') {
      const monthStart = new Date(selectedMonth + '-01')
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59)
      
      filtered.orders = data.orders.filter((o: any) => {
        const date = new Date(o.createdAt)
        return date >= monthStart && date <= monthEnd
      })
      
      filtered.bills = data.bills.filter((b: any) => {
        const date = new Date(b.createdAt)
        return date >= monthStart && date <= monthEnd
      })
      
      filtered.expenses = data.expenses.filter((e: any) => {
        const date = new Date(e.createdAt)
        return date >= monthStart && date <= monthEnd
      })
    } else if (dateFilter === 'year') {
      const yearStart = new Date(parseInt(selectedYear), 0, 1)
      const yearEnd = new Date(parseInt(selectedYear), 11, 31, 23, 59, 59)
      
      filtered.orders = data.orders.filter((o: any) => {
        const date = new Date(o.createdAt)
        return date >= yearStart && date <= yearEnd
      })
      
      filtered.bills = data.bills.filter((b: any) => {
        const date = new Date(b.createdAt)
        return date >= yearStart && date <= yearEnd
      })
      
      filtered.expenses = data.expenses.filter((e: any) => {
        const date = new Date(e.createdAt)
        return date >= yearStart && date <= yearEnd
      })
    }
    
    return filtered
  }, [data, dateFilter, selectedMonth, selectedYear])

  // Calculate percentage change
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  // Financial Overview with comparison
  const financialMetrics = useMemo(() => {
    const totalRevenue = filteredData.bills.reduce((sum: number, b: any) => sum + (b.paidAmount || 0), 0)
    const totalBilled = filteredData.bills.reduce((sum: number, b: any) => sum + (b.totalAmount || 0), 0)
    const pendingRevenue = filteredData.bills.reduce((sum: number, b: any) => sum + (b.remainingAmount || 0), 0)
    const totalExpenses = filteredData.expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0)
    const paidExpenses = filteredData.expenses.reduce((sum: number, e: any) => sum + (e.paidAmount || 0), 0)
    const profit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100) : 0

    // Previous period
    const prevRevenue = getPreviousPeriodData.bills.reduce((sum: number, b: any) => sum + (b.paidAmount || 0), 0)
    const prevExpenses = getPreviousPeriodData.expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0)
    const prevProfit = prevRevenue - prevExpenses

    return {
      totalRevenue,
      totalBilled,
      pendingRevenue,
      totalExpenses,
      paidExpenses,
      profit,
      profitMargin,
      revenueChange: calculateChange(totalRevenue, prevRevenue),
      expensesChange: calculateChange(totalExpenses, prevExpenses),
      profitChange: calculateChange(profit, prevProfit)
    }
  }, [filteredData, getPreviousPeriodData])

  // Orders Analytics
  const ordersMetrics = useMemo(() => {
    const totalOrders = filteredData.orders.length
    const completedOrders = filteredData.orders.filter((o: any) => o.status === 'completed').length
    const pendingOrders = filteredData.orders.filter((o: any) => o.status === 'pending' || o.status === 'in-progress').length
    const cancelledOrders = filteredData.orders.filter((o: any) => o.status === 'cancelled').length
    const totalOrderValue = filteredData.orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0)
    const avgOrderValue = totalOrders > 0 ? totalOrderValue / totalOrders : 0
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0

    const prevTotalOrders = getPreviousPeriodData.orders.length
    const prevCompletedOrders = getPreviousPeriodData.orders.filter((o: any) => o.status === 'completed').length

    return {
      totalOrders,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      totalOrderValue,
      avgOrderValue,
      completionRate,
      ordersChange: calculateChange(totalOrders, prevTotalOrders),
      completionRateChange: calculateChange(completionRate, prevCompletedOrders / prevTotalOrders * 100)
    }
  }, [filteredData, getPreviousPeriodData])

  // Bills Analytics
  const billsMetrics = useMemo(() => {
    const totalBills = filteredData.bills.length
    const paidBills = filteredData.bills.filter((b: any) => b.status === 'paid').length
    const partialBills = filteredData.bills.filter((b: any) => b.status === 'partial').length
    const pendingBills = filteredData.bills.filter((b: any) => b.status === 'pending').length
    const avgBillAmount = totalBills > 0 ? financialMetrics.totalBilled / totalBills : 0
    const collectionRate = financialMetrics.totalBilled > 0 
      ? (financialMetrics.totalRevenue / financialMetrics.totalBilled) * 100 
      : 0

    return {
      totalBills,
      paidBills,
      partialBills,
      pendingBills,
      avgBillAmount,
      collectionRate
    }
  }, [filteredData, financialMetrics])

  // Expenses Breakdown
  const expensesBreakdown = useMemo(() => {
    const categories: Record<string, number> = {}
    
    filteredData.expenses.forEach((expense: any) => {
      const category = expense.category || 'other'
      categories[category] = (categories[category] || 0) + (expense.amount || 0)
    })

    return Object.entries(categories)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [filteredData])

  // Monthly Trends (last 12 months)
  const monthlyTrends = useMemo(() => {
    const months: Record<string, { revenue: number; expenses: number; orders: number }> = {}
    
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = date.toISOString().slice(0, 7)
      months[monthKey] = { revenue: 0, expenses: 0, orders: 0 }
    }

    data.bills.forEach((bill: any) => {
      const monthKey = new Date(bill.createdAt).toISOString().slice(0, 7)
      if (months[monthKey]) {
        months[monthKey].revenue += bill.paidAmount || 0
      }
    })

    data.expenses.forEach((expense: any) => {
      const monthKey = new Date(expense.createdAt).toISOString().slice(0, 7)
      if (months[monthKey]) {
        months[monthKey].expenses += expense.amount || 0
      }
    })

    data.orders.forEach((order: any) => {
      const monthKey = new Date(order.createdAt).toISOString().slice(0, 7)
      if (months[monthKey]) {
        months[monthKey].orders += 1
      }
    })

    return Object.entries(months).map(([month, data]) => ({
      month,
      ...data,
      profit: data.revenue - data.expenses
    }))
  }, [data])

  // Top Customers
  const topCustomers = useMemo(() => {
    const customerSpending: Record<string, { customer: any; totalSpent: number; orderCount: number }> = {}
    
    filteredData.orders.forEach((order: any) => {
      if (order.customer) {
        const customerId = order.customer.id
        if (!customerSpending[customerId]) {
          customerSpending[customerId] = {
            customer: order.customer,
            totalSpent: 0,
            orderCount: 0
          }
        }
        customerSpending[customerId].totalSpent += order.totalAmount || 0
        customerSpending[customerId].orderCount += 1
      }
    })

    return Object.values(customerSpending)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
  }, [filteredData])

  // Revenue by meal type
  const revenueByMealType = useMemo(() => {
    const mealTypes: Record<string, number> = {}
    
    filteredData.orders.forEach((order: any) => {
      if (order.mealTypeAmounts && typeof order.mealTypeAmounts === 'object') {
        Object.entries(order.mealTypeAmounts).forEach(([mealType, data]: [string, any]) => {
          const amount = typeof data === 'object' ? data.amount : data
          mealTypes[mealType] = (mealTypes[mealType] || 0) + (amount || 0)
        })
      }
    })

    return Object.entries(mealTypes)
      .map(([mealType, amount]) => ({ mealType, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [filteredData])

  // Helper to render trend indicator
  const renderTrend = (change: number, size: 'sm' | 'md' = 'md') => {
    if (change > 0) {
      return (
        <div className={`flex items-center gap-1 text-green-600 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          <FaArrowUp className={size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'} />
          <span>{Math.abs(change).toFixed(1)}%</span>
        </div>
      )
    } else if (change < 0) {
      return (
        <div className={`flex items-center gap-1 text-red-600 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          <FaArrowDown className={size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'} />
          <span>{Math.abs(change).toFixed(1)}%</span>
        </div>
      )
    }
    return (
      <div className={`flex items-center gap-1 text-gray-500 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
        <FaEquals className={size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'} />
        <span>0%</span>
      </div>
    )
  }

  // Simple bar chart component
  const BarChart = ({ data, maxValue, color }: { data: { label: string; value: number }[], maxValue: number, color: string }) => {
    return (
      <div className="space-y-2">
        {data.map((item, index) => {
          const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0
          return (
            <div key={index}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                <span className="text-sm font-bold text-gray-800">{formatCurrency(item.value)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${color}`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Simple line chart component (using bars for simplicity)
  const TrendChart = ({ data, field }: { data: any[], field: 'revenue' | 'expenses' | 'profit' | 'orders' }) => {
    const maxValue = Math.max(...data.map(d => d[field]), 1)
    const chartData = data.slice(-6) // Last 6 months
    
    return (
      <div className="flex items-end justify-between h-48 gap-1">
        {chartData.map((item, index) => {
          const percentage = maxValue > 0 ? (item[field] / maxValue) * 100 : 0
          const label = new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' })
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: '180px' }}>
                <div
                  className={`absolute bottom-0 w-full rounded-t-lg transition-all ${
                    field === 'revenue' ? 'bg-green-500' :
                    field === 'expenses' ? 'bg-red-500' :
                    field === 'profit' ? (item.profit >= 0 ? 'bg-blue-500' : 'bg-orange-500') :
                    'bg-primary-500'
                  }`}
                  style={{ height: `${percentage}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-600 rotate-45 origin-left whitespace-nowrap">{label}</span>
            </div>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Business Analytics & Reports</h1>
          <p className="text-gray-600">Comprehensive overview of your business performance</p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
        >
          <FaDownload /> Refresh Data
        </button>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <label className="text-sm font-medium text-gray-700">Filter Period:</label>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setDateFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateFilter === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setDateFilter('month')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateFilter === 'month'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setDateFilter('year')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateFilter === 'year'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Year
            </button>
          </div>
          {dateFilter === 'month' && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          )}
          {dateFilter === 'year' && (
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              min="2020"
              max={new Date().getFullYear()}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-32"
            />
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: FaChartLine },
            { id: 'financial', label: 'Financial', icon: FaDollarSign },
            { id: 'operations', label: 'Operations', icon: FaShoppingCart },
            { id: 'customers', label: 'Customers', icon: FaUsers }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 bg-primary-50'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <tab.icon />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Key Metrics Cards with Trends */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border-l-4 border-green-500 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 truncate pr-2">Total Revenue</h3>
                <FaDollarSign className="text-green-500 text-xl flex-shrink-0" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 break-words">{formatCurrency(financialMetrics.totalRevenue)}</p>
              {dateFilter !== 'all' && renderTrend(financialMetrics.revenueChange)}
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border-l-4 border-red-500 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 truncate pr-2">Total Expenses</h3>
                <FaMoneyBillWave className="text-red-500 text-xl flex-shrink-0" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 break-words">{formatCurrency(financialMetrics.totalExpenses)}</p>
              {dateFilter !== 'all' && renderTrend(financialMetrics.expensesChange)}
            </div>

            <div className={`bg-white rounded-lg shadow-md p-4 sm:p-6 border-l-4 min-w-0 ${financialMetrics.profit >= 0 ? 'border-blue-500' : 'border-orange-500'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 truncate pr-2">Net Profit</h3>
                <FaChartLine className={financialMetrics.profit >= 0 ? 'text-blue-500' : 'text-orange-500'} />
              </div>
              <p className={`text-xl sm:text-2xl font-bold mb-1 break-words ${financialMetrics.profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {formatCurrency(financialMetrics.profit)}
              </p>
              <div className="flex items-center justify-between flex-wrap gap-1">
                {dateFilter !== 'all' && renderTrend(financialMetrics.profitChange)}
                <span className="text-xs text-gray-500 whitespace-nowrap">Margin: {financialMetrics.profitMargin.toFixed(1)}%</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border-l-4 border-primary-500 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 truncate pr-2">Total Orders</h3>
                <FaShoppingCart className="text-primary-500 text-xl flex-shrink-0" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">{ordersMetrics.totalOrders}</p>
              {dateFilter !== 'all' && renderTrend(ordersMetrics.ordersChange)}
            </div>
          </div>

          {/* Revenue Trend Chart */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 min-w-0">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaChartLine className="text-primary-500" />
              Revenue & Profit Trend (Last 6 Months)
            </h2>
            <TrendChart data={monthlyTrends} field="revenue" />
          </div>

          {/* Enhanced Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-4">Payment Collection</h3>
              <div className="flex items-end justify-between mb-2">
                <span className="text-3xl font-bold text-gray-800">{billsMetrics.collectionRate.toFixed(1)}%</span>
                <FaPercent className="text-gray-400 text-2xl" />
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-primary-500 h-3 rounded-full"
                  style={{ width: `${billsMetrics.collectionRate}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Of total billed amount collected</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 min-w-0">
              <h3 className="text-sm font-medium text-gray-600 mb-4">Order Completion Rate</h3>
              <div className="flex items-end justify-between mb-2">
                <span className="text-3xl font-bold text-gray-800">{ordersMetrics.completionRate.toFixed(1)}%</span>
                <FaCheckCircle className="text-green-500 text-2xl" />
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full"
                  style={{ width: `${ordersMetrics.completionRate}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Orders completed successfully</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 min-w-0">
              <h3 className="text-sm font-medium text-gray-600 mb-4">Profit Margin</h3>
              <div className="flex items-end justify-between mb-2">
                <span className={`text-3xl font-bold ${financialMetrics.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {financialMetrics.profitMargin.toFixed(1)}%
                </span>
                <FaPercent className="text-gray-400 text-2xl" />
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full ${financialMetrics.profitMargin >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(Math.abs(financialMetrics.profitMargin), 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Net profit as % of revenue</p>
            </div>
          </div>
        </>
      )}

      {/* Financial Tab */}
      {activeTab === 'financial' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 min-w-0">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaFileInvoiceDollar className="text-primary-500" />
                Bills Overview
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FaCheckCircle className="text-green-500" />
                    <span className="text-gray-700">Paid</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-green-600">{billsMetrics.paidBills}</span>
                    <p className="text-xs text-gray-500">
                      {financialMetrics.totalBilled > 0 
                        ? ((billsMetrics.paidBills / billsMetrics.totalBills) * 100).toFixed(1) 
                        : 0}%
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FaExclamationTriangle className="text-yellow-500" />
                    <span className="text-gray-700">Partial</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-yellow-600">{billsMetrics.partialBills}</span>
                    <p className="text-xs text-gray-500">
                      {financialMetrics.totalBilled > 0 
                        ? ((billsMetrics.partialBills / billsMetrics.totalBills) * 100).toFixed(1) 
                        : 0}%
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FaClock className="text-red-500" />
                    <span className="text-gray-700">Pending</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-red-600">{billsMetrics.pendingBills}</span>
                    <p className="text-xs text-gray-500">
                      {financialMetrics.totalBilled > 0 
                        ? ((billsMetrics.pendingBills / billsMetrics.totalBills) * 100).toFixed(1) 
                        : 0}%
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Average Bill Amount</span>
                    <span className="font-bold text-gray-800">{formatCurrency(billsMetrics.avgBillAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 min-w-0">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaChartPie className="text-primary-500" />
                Expenses by Category
              </h2>
              {expensesBreakdown.length > 0 ? (
                <BarChart 
                  data={expensesBreakdown.map(e => ({ label: e.category.charAt(0).toUpperCase() + e.category.slice(1), value: e.amount }))}
                  maxValue={Math.max(...expensesBreakdown.map(e => e.amount))}
                  color="bg-red-500"
                />
              ) : (
                <p className="text-gray-500 text-center py-8">No expenses data available</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 min-w-0">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaChartLine className="text-primary-500" />
              Financial Trends (Last 12 Months)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Month</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Revenue</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Expenses</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Profit</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Margin %</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyTrends.map((trend, index) => {
                    const margin = trend.revenue > 0 ? ((trend.profit / trend.revenue) * 100) : 0
                    return (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-700">
                          {new Date(trend.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-green-600">{formatCurrency(trend.revenue)}</td>
                        <td className="py-3 px-4 text-right font-medium text-red-600">{formatCurrency(trend.expenses)}</td>
                        <td className={`py-3 px-4 text-right font-medium ${trend.profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                          {formatCurrency(trend.profit)}
                        </td>
                        <td className={`py-3 px-4 text-right font-medium ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {margin.toFixed(1)}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Operations Tab */}
      {activeTab === 'operations' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 min-w-0">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaShoppingCart className="text-primary-500" />
                Orders Overview
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <FaCheckCircle className="text-green-500 text-xl" />
                    <span className="text-gray-700 font-medium">Completed</span>
                  </div>
                  <span className="font-bold text-green-600 text-xl">{ordersMetrics.completedOrders}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-3">
                    <FaClock className="text-yellow-500 text-xl" />
                    <span className="text-gray-700 font-medium">Pending/In Progress</span>
                  </div>
                  <span className="font-bold text-yellow-600 text-xl">{ordersMetrics.pendingOrders}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-3">
                    <FaTimesCircle className="text-red-500 text-xl" />
                    <span className="text-gray-700 font-medium">Cancelled</span>
                  </div>
                  <span className="font-bold text-red-600 text-xl">{ordersMetrics.cancelledOrders}</span>
                </div>
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Total Order Value</span>
                    <span className="font-bold text-gray-800">{formatCurrency(ordersMetrics.totalOrderValue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Average Order Value</span>
                    <span className="font-bold text-gray-800">{formatCurrency(ordersMetrics.avgOrderValue)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 min-w-0">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaUtensils className="text-primary-500" />
                Revenue by Meal Type
              </h2>
              {revenueByMealType.length > 0 ? (
                <BarChart 
                  data={revenueByMealType.map(r => ({ label: r.mealType.charAt(0).toUpperCase() + r.mealType.slice(1), value: r.amount }))}
                  maxValue={Math.max(...revenueByMealType.map(r => r.amount))}
                  color="bg-primary-500"
                />
              ) : (
                <p className="text-gray-500 text-center py-8">No meal type data available</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 min-w-0">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FaUsers className="text-primary-500" />
            Top Customers by Revenue
          </h2>
          {topCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Rank</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Phone</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Total Spent</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Orders</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Avg/Order</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-800">{item.customer.name}</td>
                      <td className="py-3 px-4 text-gray-600">{item.customer.phone}</td>
                      <td className="py-3 px-4 text-right font-bold text-gray-800">{formatCurrency(item.totalSpent)}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{item.orderCount}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(item.totalSpent / item.orderCount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No customer data available</p>
          )}
        </div>
      )}
    </div>
  )
}
