'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Order } from '@/types'
import { FaChartLine, FaMoneyBillWave, FaTable, FaCalendarAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa'

export default function OrdersOverviewPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table')
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await fetch('/api/orders', { cache: 'no-store' })
        if (!response.ok) throw new Error('Failed to fetch orders')
        const data = await response.json()
        setOrders(data)
      } catch (error) {
        console.error('Failed to load orders:', error)
        toast.error('Failed to load orders. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [])

  const filteredOrders = useMemo(() => {
    if (!search.trim()) return orders
    const term = search.toLowerCase()
    return orders.filter(order =>
      order.customer?.name?.toLowerCase().includes(term) ||
      order.customer?.phone?.includes(search) ||
      order.customer?.email?.toLowerCase().includes(term) ||
      (order as any).eventName?.toLowerCase().includes(term)
    )
  }, [orders, search])

  // Calendar helper functions
  const getMealColor = (mealType: string) => {
    const type = mealType.toLowerCase()
    if (type.includes('breakfast')) return 'bg-amber-100 text-amber-800 border-amber-200'
    if (type.includes('lunch')) return 'bg-orange-100 text-orange-800 border-orange-200'
    if (type.includes('dinner')) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (type.includes('snacks')) return 'bg-purple-100 text-purple-800 border-purple-200'
    if (type.includes('sweets')) return 'bg-pink-100 text-pink-800 border-pink-200'
    if (type.includes('saree')) return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getMealPriority = (type: string) => {
    const t = type.toLowerCase()
    if (t.includes('breakfast')) return 1
    if (t.includes('lunch')) return 2
    if (t.includes('snacks')) return 3
    if (t.includes('dinner')) return 4
    return 5
  }

  const getMealsForDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`

    const meals: Array<{
      orderId: string
      customerName: string
      mealType: string
    }> = []

    filteredOrders.forEach(order => {
      if (!order.mealTypeAmounts) return
      const mealTypeAmounts = order.mealTypeAmounts as Record<string, any>

      Object.entries(mealTypeAmounts).forEach(([type, data]) => {
        if (!data || typeof data !== 'object' || !data.date) return

        // Extract date part from the stored date
        const mealDate = new Date(data.date)
        const mealYear = mealDate.getFullYear()
        const mealMonth = String(mealDate.getMonth() + 1).padStart(2, '0')
        const mealDay = String(mealDate.getDate()).padStart(2, '0')
        const mealDateStr = `${mealYear}-${mealMonth}-${mealDay}`

        if (mealDateStr === dateStr) {
          meals.push({
            orderId: order.id,
            customerName: order.customer?.name || 'Unknown',
            mealType: type
          })
        }
      })
    })

    return meals
  }

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Previous month's days
    const prevMonthDays = new Date(year, month, 0).getDate()
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false
      })
    }

    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      })
    }

    // Next month's days to fill the grid
    const remainingDays = 42 - days.length // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      })
    }

    return days
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Order Center</h1>
            <p className="text-sm text-gray-500">View orders in table or calendar format.</p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === 'table'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <FaTable /> Table
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === 'calendar'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <FaCalendarAlt /> Calendar
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="w-full md:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, phone, email, or event"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-6">Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-gray-500">No orders found.</div>
      ) : viewMode === 'calendar' ? (
        // Calendar View
        <div className="bg-white rounded-lg shadow-md">
          {/* Calendar Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaChevronLeft className="text-gray-600" />
              </button>
              <h2 className="text-xl font-bold text-gray-800">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaChevronRight className="text-gray-600" />
              </button>
            </div>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
            >
              Today
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-4 overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center font-semibold text-gray-600 text-sm py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {generateCalendarDays().map((dayInfo, index) => {
                  const mealsForDay = getMealsForDate(dayInfo.date)
                  const isToday = dayInfo.date.toDateString() === new Date().toDateString()

                  return (
                    <div
                      key={index}
                      className={`min-h-[120px] p-2 border rounded-lg ${!dayInfo.isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                        } ${isToday ? 'ring-2 ring-primary-500' : ''}`}
                    >
                      <div className={`text-sm font-medium mb-1 ${!dayInfo.isCurrentMonth ? 'text-gray-400' : isToday ? 'text-primary-600 font-bold' : 'text-gray-700'
                        }`}>
                        {dayInfo.date.getDate()}
                      </div>

                      {mealsForDay.length > 0 && (
                        <div className="space-y-4">
                          {(() => {
                            // Group meals by type
                            const grouped: Record<string, typeof mealsForDay> = {}
                            mealsForDay.forEach(meal => {
                              if (!grouped[meal.mealType]) grouped[meal.mealType] = []
                              grouped[meal.mealType].push(meal)
                            })

                            // Sort types by priority
                            const sortedTypes = Object.keys(grouped).sort((a, b) =>
                              getMealPriority(a) - getMealPriority(b)
                            )

                            return sortedTypes.map(type => (
                              <div key={type} className="space-y-1">
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tight mb-1 border-b border-gray-100 pb-0.5">
                                  {type}
                                </div>
                                {grouped[type].map((meal, idx) => (
                                  <Link
                                    key={`${meal.orderId}-${meal.mealType}-${idx}`}
                                    href={`/orders/summary/${meal.orderId}`}
                                    className={`block text-[10px] px-2 py-1.5 rounded-md border shadow-sm transition-all hover:scale-[1.02] truncate flex flex-col gap-0.5 ${getMealColor(meal.mealType)}`}
                                    title={`${meal.mealType}: ${meal.customerName}`}
                                  >
                                    <span className="font-bold opacity-90">{meal.customerName}</span>
                                  </Link>
                                ))}
                              </div>
                            ))
                          })()}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Table View
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collected</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.customer?.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{order.customer?.phone || ''}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{(order as any).eventName || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{formatCurrency(order.totalAmount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-emerald-600">{formatCurrency(order.advancePaid)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-rose-600">{formatCurrency(order.remainingAmount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/orders/summary/${order.id}`}
                          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100"
                        >
                          <FaChartLine /> Summary
                        </Link>
                        <Link
                          href={`/orders/financial/${order.id}`}
                          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100"
                        >
                          <FaMoneyBillWave /> Financial
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
