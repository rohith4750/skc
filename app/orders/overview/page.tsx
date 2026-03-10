"use client";
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Order } from '@/types'
import { FaChartLine, FaMoneyBillWave, FaTable, FaCalendarAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { getRequest } from '@/lib/api/api'
import { apiUrl } from '@/lib/api/apiUrl'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { FaFilePdf } from 'react-icons/fa'

export default function OrdersOverviewPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table')
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await getRequest({ url: apiUrl.GET_getAllOrders })
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
      memberCount?: number | string
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
            memberCount: data.numberOfMembers || '',
            mealType: (() => {
              let label = data.menuType || type

              // Handle merged labels (e.g., LUNCH_MERGED_7 -> LUNCH)
              if (label.includes('_MERGED_')) {
                label = label.split('_MERGED_')[0]
              }

              // Handle Session IDs and UUIDs
              if (label.toLowerCase().startsWith('session_') || label.length > 20 || /^[0-9a-fA-F-]{36}$/.test(label)) {
                return 'Custom / Other'
              }

              // Capitalize
              return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase()
            })()
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

  const downloadMealReport = async () => {
    setLoading(true)
    const toastId = toast.loading('Generating Meal Report...')

    try {
      // Aggregate data from filtered orders
      const reportData: Record<string, { breakfast: number; lunch: number; dinner: number; snacks: number; other: number }> = {}

      filteredOrders.forEach(order => {
        if (!order.mealTypeAmounts) return
        const mealTypeAmounts = order.mealTypeAmounts as Record<string, any>

        Object.entries(mealTypeAmounts).forEach(([type, data]) => {
          if (!data || typeof data !== 'object' || !data.date) return

          // Extract date part YYYY-MM-DD
          const mealDate = new Date(data.date)
          const dateStr = mealDate.toISOString().split('T')[0]

          if (!reportData[dateStr]) {
            reportData[dateStr] = { breakfast: 0, lunch: 0, dinner: 0, snacks: 0, other: 0 }
          }

          const count = Number(data.numberOfMembers) || 0
          const label = (data.menuType || type).toLowerCase()

          if (label.includes('breakfast')) reportData[dateStr].breakfast += count
          else if (label.includes('lunch')) reportData[dateStr].lunch += count
          else if (label.includes('dinner')) reportData[dateStr].dinner += count
          else if (label.includes('snack')) reportData[dateStr].snacks += count
          else reportData[dateStr].other += count
        })
      })

      const sortedDates = Object.keys(reportData).sort()

      if (sortedDates.length === 0) {
        toast.error('No meal data found for the current filters', { id: toastId })
        return
      }

      // Create HTML for PDF
      const reportHtml = `
        <div style="padding: 40px; font-family: 'Poppins', sans-serif; color: #1a1a1a; background: white;">
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #ce621b; text-transform: uppercase; letter-spacing: 1px;">Meal Count Report</h1>
            <p style="margin: 10px 0 5px 0; font-size: 18px; font-weight: 600; color: #333;">SRIVATSASA & KOWNDINYA CATERERS</p>
            <p style="margin: 0; font-size: 12px; color: #666;">Pure Vegetarian Catering Services</p>
            <p style="margin: 15px 0 0 0; font-size: 11px; color: #999;">Generated on ${new Date().toLocaleString()}</p>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px;">
            <thead>
              <tr style="background-color: #ce621b; color: white;">
                <th style="padding: 12px; text-align: left; border: 1px solid #ce621b;">Date</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ce621b;">Breakfast</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ce621b;">Lunch</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ce621b;">Snacks</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ce621b;">Dinner</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ce621b;">Other</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ce621b; font-weight: bold; background-color: #a84e12;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${sortedDates.map((date, index) => {
        const d = reportData[date]
        const total = d.breakfast + d.lunch + d.dinner + d.snacks + d.other
        const rowBg = index % 2 === 0 ? '#ffffff' : '#fffaf5'
        return `
                  <tr style="background-color: ${rowBg};">
                    <td style="padding: 12px; border: 1px solid #eee; font-weight: 600;">
                      ${new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #eee; color: ${d.breakfast ? '#b45309' : '#ccc'};">
                      ${d.breakfast || '-'}
                    </td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #eee; color: ${d.lunch ? '#c2410c' : '#ccc'};">
                      ${d.lunch || '-'}
                    </td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #eee; color: ${d.snacks ? '#7e22ce' : '#ccc'};">
                      ${d.snacks || '-'}
                    </td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #eee; color: ${d.dinner ? '#1d4ed8' : '#ccc'};">
                      ${d.dinner || '-'}
                    </td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #eee; color: ${d.other ? '#4b5563' : '#ccc'};">
                      ${d.other || '-'}
                    </td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #eee; font-weight: 800; color: #000; background-color: ${index % 2 === 0 ? '#fafafa' : '#f5f5f5'};">
                      ${total}
                    </td>
                  </tr>
                `
      }).join('')}
            </tbody>
            <tfoot>
              <tr style="background-color: #333; color: white; font-weight: bold;">
                <td style="padding: 12px; border: 1px solid #333;">GRAND TOTAL</td>
                <td style="padding: 12px; text-align: center; border: 1px solid #333;">
                  ${sortedDates.reduce((acc, curr) => acc + reportData[curr].breakfast, 0) || '-'}
                </td>
                <td style="padding: 12px; text-align: center; border: 1px solid #333;">
                  ${sortedDates.reduce((acc, curr) => acc + reportData[curr].lunch, 0) || '-'}
                </td>
                <td style="padding: 12px; text-align: center; border: 1px solid #333;">
                  ${sortedDates.reduce((acc, curr) => acc + reportData[curr].snacks, 0) || '-'}
                </td>
                <td style="padding: 12px; text-align: center; border: 1px solid #333;">
                  ${sortedDates.reduce((acc, curr) => acc + reportData[curr].dinner, 0) || '-'}
                </td>
                <td style="padding: 12px; text-align: center; border: 1px solid #333;">
                  ${sortedDates.reduce((acc, curr) => acc + reportData[curr].other, 0) || '-'}
                </td>
                <td style="padding: 12px; text-align: center; border: 1px solid #333; font-size: 16px; background-color: #000;">
                  ${sortedDates.reduce((acc, curr) => {
        const d = reportData[curr]
        return acc + d.breakfast + d.lunch + d.dinner + d.snacks + d.other
      }, 0)}
                </td>
              </tr>
            </tfoot>
          </table>
          
          <div style="margin-top: 50px; border-top: 1px dashed #ccc; padding-top: 20px; display: flex; justify-content: space-between; align-items: center;">
             <div style="font-size: 10px; color: #666;">
                * This report is generated dynamically based on active filters in the Event Planner system.
             </div>
             <div style="text-align: right; font-size: 12px; font-weight: 600;">
                Authorized Signature
                <div style="margin-top: 40px; border-top: 1px solid #000; width: 150px; margin-left: auto;"></div>
             </div>
          </div>
        </div>
      `

      // Render to hidden div
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = reportHtml
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.width = '1000px' // Wider for better table spacing
      document.body.appendChild(tempDiv)

      // Use a small delay for any font rendering
      await new Promise(resolve => setTimeout(resolve, 500))

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      pdf.save(`Meal-Report-${new Date().toISOString().split('T')[0]}.pdf`)

      document.body.removeChild(tempDiv)
      toast.success('Meal Report downloaded successfully!', { id: toastId })
    } catch (error) {
      console.error('Failed to generate report:', error)
      toast.error('Failed to generate report. Please try again.', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Event Planner</h1>
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
            <button
              onClick={downloadMealReport}
              disabled={loading || filteredOrders.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <FaFilePdf /> Meal Report
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
                                    <div className="flex justify-between items-center gap-1">
                                      <span className="font-bold opacity-90 truncate">{meal.customerName}</span>
                                      {meal.memberCount && (
                                        <span className="shrink-0 font-black px-1 py-0.5 bg-white/40 rounded text-[8px]">
                                          {meal.memberCount}
                                        </span>
                                      )}
                                    </div>
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
