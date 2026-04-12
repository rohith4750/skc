"use client";
import { useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Order } from '@/types'
import { FaChartLine, FaMoneyBillWave, FaTable, FaCalendarAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { getRequest } from '@/lib/api/api'
import { apiUrl } from '@/lib/api/apiUrl'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { FaFilePdf, FaFileImage, FaChevronDown, FaUtensils } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'

export default function OrdersOverviewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrdersOverviewContent />
    </Suspense>
  )
}

function OrdersOverviewContent() {
  const searchParams = useSearchParams()
  const initialView = searchParams.get('view') === 'calendar' ? 'calendar' : 'table'
  
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>(initialView)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

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
    let filtered = orders

    // Search filter
    if (search.trim()) {
      const term = search.toLowerCase()
      filtered = filtered.filter(order =>
        order.customer?.name?.toLowerCase().includes(term) ||
        order.customer?.phone?.includes(search) ||
        order.customer?.email?.toLowerCase().includes(term) ||
        (order as any).eventName?.toLowerCase().includes(term)
      )
    }

    // Month/Year filter
    filtered = filtered.filter(order => {
      // Check if any meal date matches the selected month/year
      const mealTypeAmounts = order.mealTypeAmounts as Record<string, any>
      if (mealTypeAmounts) {
        const hasMealInPeriod = Object.values(mealTypeAmounts).some(data => {
          if (!data || typeof data !== 'object' || !data.date) return false
          const mealDate = new Date(data.date)
          return mealDate.getMonth() === selectedMonth && mealDate.getFullYear() === selectedYear
        })
        if (hasMealInPeriod) return true
      }

      // Fallback to order creation date if no specific meal dates match or exist
      const orderDate = new Date(order.createdAt)
      return orderDate.getMonth() === selectedMonth && orderDate.getFullYear() === selectedYear
    })

    // Filter out quotations and cancelled orders from original view
    filtered = filtered.filter(order => order.status !== 'quotation' && order.status !== 'cancelled')

    return filtered
  }, [orders, search, selectedMonth, selectedYear])

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
      // Sync dropdowns
      setSelectedMonth(newDate.getMonth())
      setSelectedYear(newDate.getFullYear())
      return newDate
    })
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedMonth(today.getMonth())
    setSelectedYear(today.getFullYear())
  }

  const downloadMealReport = async (format: 'pdf' | 'png') => {
    setLoading(true)
    const toastId = toast.loading(`Generating Meal Report (${format.toUpperCase()})...`)

    try {
      // Aggregate data from filtered orders
      const reportData: Record<string, {
        breakfast: number;
        lunch: number;
        dinner: number;
        snacks: number;
        other: number;
        menuItems: {
          breakfast: Set<string>;
          lunch: Set<string>;
          dinner: Set<string>;
          snacks: Set<string>;
          other: Set<string>
        }
      }> = {}

      filteredOrders.forEach(order => {
        if (!order.mealTypeAmounts) return
        const mealTypeAmounts = order.mealTypeAmounts as Record<string, any>

        Object.entries(mealTypeAmounts).forEach(([type, data]) => {
          if (!data || typeof data !== 'object' || !data.date) return

          // Extract date part YYYY-MM-DD
          const mealDate = new Date(data.date)
          const dateStr = mealDate.toISOString().split('T')[0]

          if (!reportData[dateStr]) {
            reportData[dateStr] = {
              breakfast: 0, lunch: 0, dinner: 0, snacks: 0, other: 0,
              menuItems: {
                breakfast: new Set(),
                lunch: new Set(),
                dinner: new Set(),
                snacks: new Set(),
                other: new Set()
              }
            }
          }

          const count = Number(data.numberOfMembers) || 0
          const label = (data.menuType || type).toLowerCase()

          // Aggregate count and menu items
          let category: 'breakfast' | 'lunch' | 'dinner' | 'snacks' | 'other' = 'other'
          if (label.includes('breakfast')) category = 'breakfast'
          else if (label.includes('lunch')) category = 'lunch'
          else if (label.includes('dinner')) category = 'dinner'
          else if (label.includes('snack')) category = 'snacks'

          reportData[dateStr][category] += count

          // Add menu items for this order that match this category
          const orderItems = (order as any).items || []
          orderItems.forEach((item: any) => {
            const itemMealType = (item.mealType || '').toLowerCase()
            // Try to match item to the current session/type
            if (itemMealType === type.toLowerCase() || itemMealType === label) {
              const itemName = item.menuItem?.name || item.menuItem?.nameTelugu || 'Unknown Item'
              reportData[dateStr].menuItems[category].add(itemName)
            }
          })
        })
      })

      const sortedDates = Object.keys(reportData).sort()

      if (sortedDates.length === 0) {
        toast.error('No meal data found for the current filters', { id: toastId })
        return
      }

      // Create HTML for PDF/Image
      const reportHtml = `
        <div style="padding: 40px; font-family: 'Poppins', sans-serif; color: #1a1a1a; background: white; width: 1000px;">
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #000; padding-bottom: 25px; position: relative; min-height: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
             <img src="${window.location.origin}/images/logo.jpg" alt="Logo" style="position: absolute; left: 0; top: 0; width: 85px; height: 85px; border-radius: 50%; object-fit: contain;" />
             <div style="width: 100%; text-align: center;">
                <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #000; text-transform: uppercase; letter-spacing: 1px;">SRIVATSASA & KOWNDINYA CATERERS</h1>
                <p style="margin: 5px 0 0 0; font-size: 14px; font-weight: 600; color: #666; font-style: italic;">Pure Vegetarian (A Food Caterers)</p>
                <p style="margin: 15px 0 0 0; font-size: 12px; font-weight: 700; background: #000; color: white; display: inline-block; padding: 5px 20px; border-top: 1px solid #000; border-bottom: 1px solid #000; letter-spacing: 2px;">
                  MEAL REPORT: ${new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase()}
                </p>
             </div>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; border: 2px solid #000;">
            <thead>
              <tr style="background-color: #000; color: white;">
                <th style="padding: 15px 10px; text-align: left; border: 1px solid #000; width: 15%;">Date</th>
                <th style="padding: 15px 10px; text-align: left; border: 1px solid #000; width: 65%;">Meal Details & Menu Items</th>
                <th style="padding: 15px 10px; text-align: center; border: 1px solid #000; width: 20%; background-color: #333;">Total Persons</th>
              </tr>
            </thead>
            <tbody>
              ${sortedDates.map((date, index) => {
        const d = reportData[date]
        const total = d.breakfast + d.lunch + d.dinner + d.snacks + d.other
        const rowBg = index % 2 === 0 ? '#ffffff' : '#fff9f2'

        const formatMenuItems = (items: Set<string>) => Array.from(items).join(', ')

        return `
                  <tr style="background-color: ${rowBg};">
                    <td style="padding: 15px 10px; border: 1px solid #edccb5; font-weight: 700; vertical-align: top;">
                      ${new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </td>
                    <td style="padding: 15px 10px; border: 1px solid #edccb5; vertical-align: top;">
                      ${d.breakfast ? `
                        <div style="margin-bottom: 10px;">
                          <div style="font-weight: 800; color: #b45309; text-transform: uppercase; font-size: 11px;">Γÿò BREAKFAST (${d.breakfast})</div>
                          <div style="font-size: 12px; color: #555; margin-left: 5px; font-style: italic;">${formatMenuItems(d.menuItems.breakfast) || 'Standard Menu'}</div>
                        </div>
                      ` : ''}
                      ${d.lunch ? `
                        <div style="margin-bottom: 10px;">
                          <div style="font-weight: 800; color: #c2410c; text-transform: uppercase; font-size: 11px;">ΓÿÇ LUNCH (${d.lunch})</div>
                          <div style="font-size: 12px; color: #555; margin-left: 5px; font-style: italic;">${formatMenuItems(d.menuItems.lunch) || 'Standard Menu'}</div>
                        </div>
                      ` : ''}
                      ${d.snacks ? `
                        <div style="margin-bottom: 10px;">
                          <div style="font-weight: 800; color: #7e22ce; text-transform: uppercase; font-size: 11px;">Γÿò SNACKS (${d.snacks})</div>
                          <div style="font-size: 12px; color: #555; margin-left: 5px; font-style: italic;">${formatMenuItems(d.menuItems.snacks) || 'Standard Menu'}</div>
                        </div>
                      ` : ''}
                      ${d.dinner ? `
                        <div style="margin-bottom: 5px;">
                          <div style="font-weight: 800; color: #1d4ed8; text-transform: uppercase; font-size: 11px;">Γÿ╛ DINNER (${d.dinner})</div>
                          <div style="font-size: 12px; color: #555; margin-left: 5px; font-style: italic;">${formatMenuItems(d.menuItems.dinner) || 'Standard Menu'}</div>
                        </div>
                      ` : ''}
                    </td>
                    <td style="padding: 15px 10px; text-align: center; border: 1px solid #edccb5; font-weight: 800; font-size: 18px; color: #000; vertical-align: middle; background-color: ${index % 2 === 0 ? '#fcfcfc' : '#f7f1eb'};">
                      ${total}
                    </td>
                  </tr>
                `
      }).join('')}
            </tbody>
            <tfoot>
              <tr style="background-color: #1a1a1a; color: white; font-weight: bold;">
                <td colspan="2" style="padding: 15px 20px; border: 1px solid #1a1a1a; text-align: right; font-size: 16px;">MONTHLY GRAND TOTAL</td>
                <td style="padding: 15px 10px; text-align: center; border: 1px solid #1a1a1a; font-size: 22px; background-color: #000; border-left: 2px solid #fff;">
                  ${sortedDates.reduce((acc, curr) => {
        const d = reportData[curr]
        return acc + d.breakfast + d.lunch + d.dinner + d.snacks + d.other
      }, 0)}
                </td>
              </tr>
            </tfoot>
          </table>
          
          <div style="margin-top: 40px; border-top: 1px dashed #ce621b; padding-top: 25px; display: flex; justify-content: space-between; align-items: center;">
             <div style="font-size: 11px; color: #666; max-width: 400px; line-height: 1.5;">
                <strong>Disclaimer:</strong> This report includes person counts and menu items calculated for ${new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}. Generated on ${new Date().toLocaleDateString()}.
             </div>
             <div style="text-align: right; min-width: 200px;">
                <img src="${window.location.origin}/images/stamp.png" style="width: 150px; height: auto; opacity: 0.8; margin-bottom: -10px;" />
                <div style="font-size: 13px; font-weight: 700; color: #000; border-top: 2px solid #000; padding-top: 5px; margin-top: 5px;">Authorized Signature</div>
             </div>
          </div>
        </div>
      `

      // Render to hidden div
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = reportHtml
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.width = '1000px'
      document.body.appendChild(tempDiv)

      // Wait for images to load properly
      const images = tempDiv.getElementsByTagName('img')
      if (images.length > 0) {
        await Promise.all(Array.from(images).map(img => {
          if (img.complete) return Promise.resolve()
          return new Promise((resolve) => {
            img.onload = resolve
            img.onerror = resolve
          })
        }))
      }
      await new Promise(resolve => setTimeout(resolve, 500))

      const canvas = await html2canvas(tempDiv, {
        scale: 3, // High quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      if (format === 'pdf') {
        const imgData = canvas.toDataURL('image/jpeg', 0.95)
        const pdf = new jsPDF('p', 'mm', 'a4')
        const imgWidth = 210
        const imgHeight = (canvas.height * imgWidth) / canvas.width

        // Handle multi-page if needed
        let heightLeft = imgHeight
        let position = 0
        const pageHeight = 295

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight
          pdf.addPage()
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight
        }

        pdf.save(`SKC-Meal-Report-${new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'short' })}-${selectedYear}.pdf`)
      } else {
        const imgData = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.href = imgData
        link.download = `SKC-Meal-Report-${new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'short' })}-${selectedYear}.png`
        link.click()
      }

      document.body.removeChild(tempDiv)
      toast.success(`Meal Report (${format.toUpperCase()}) downloaded!`, { id: toastId })
    } catch (error) {
      console.error('Failed to generate report:', error)
      toast.error('Failed to generate report. Please try again.', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex flex-col gap-8 mb-10">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">
              {viewMode === 'calendar' ? 'Operational Pulse' : 'Strategic Planner'}
            </h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
              Intelligence Dashboard — {new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase()}
            </p>
          </motion.div>

          <div className="flex flex-wrap items-center gap-4">
            {/* View Toggle - V2 Style */}
            <div className="bg-gray-100 p-1.5 rounded-2xl flex items-center shadow-inner">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  viewMode === 'table' ? 'v2-glass bg-white text-gray-900 shadow-xl' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <FaTable size={12} /> Matrix
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  viewMode === 'calendar' ? 'v2-glass bg-white text-gray-900 shadow-xl' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <FaCalendarAlt size={12} /> Pulse
              </button>
            </div>

            {/* Export System */}
            <div className="relative group">
              <button
                disabled={loading || filteredOrders.length === 0}
                className="v2-btn-primary flex items-center gap-3 h-12 px-6 shadow-xl shadow-emerald-900/10 bg-emerald-600 hover:bg-emerald-700"
              >
                <FaFilePdf size={14} /> 
                <span className="text-[10px] font-black tracking-widest">OPS REPORT</span>
                <FaChevronDown size={10} className="opacity-50" />
              </button>

              <div className="absolute right-0 top-full mt-2 w-56 v2-card bg-white p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button
                  onClick={() => downloadMealReport('pdf')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                >
                  <FaFilePdf size={14} className="text-red-500" /> Secure PDF
                </button>
                <button
                  onClick={() => downloadMealReport('png')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                >
                  <FaFileImage size={14} className="text-blue-500" /> High-Res PNG
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Intelligence Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="v2-card p-4 bg-white border-gray-100">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-2 block">Global Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Orders or Customers..."
              className="v2-input h-10 text-[11px] font-black bg-gray-50/50 border-gray-100"
            />
          </div>

          <div className="v2-card p-4 bg-white border-gray-100">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-2 block">Fiscal Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                const m = parseInt(e.target.value); setSelectedMonth(m);
                const newDate = new Date(currentDate); newDate.setMonth(m); newDate.setFullYear(selectedYear); setCurrentDate(newDate);
              }}
              className="v2-input h-10 text-[11px] font-black bg-gray-50/50 border-gray-100"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' }).toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="v2-card p-4 bg-white border-gray-100">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-2 block">Fiscal Year</label>
            <select
              value={selectedYear}
              onChange={(e) => {
                const y = parseInt(e.target.value); setSelectedYear(y);
                const newDate = new Date(currentDate); newDate.setFullYear(y); newDate.setMonth(selectedMonth); setCurrentDate(newDate);
              }}
              className="v2-input h-10 text-[11px] font-black bg-gray-50/50 border-gray-100"
            >
              {Array.from({ length: 5 }).map((_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          </div>

          <div className="v2-card p-4 bg-primary-600 border-none flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-all shadow-lg shadow-primary-900/20" onClick={goToToday}>
             <div className="text-center">
                <div className="text-[10px] font-black text-white/60 uppercase tracking-widest">Return to</div>
                <div className="text-sm font-black text-white uppercase tracking-tighter">Real-Time Now</div>
             </div>
          </div>
        </div>
      </div>


      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-6">Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-gray-500">No orders found.</div>
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === 'calendar' ? (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="v2-card bg-white overflow-hidden shadow-2xl shadow-gray-200/50"
            >
              {/* Pulse Control Hub */}
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-6">
                  <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                    <button
                      onClick={() => navigateMonth('prev')}
                      className="p-3 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-primary-600 transition-all active:scale-95"
                    >
                      <FaChevronLeft size={14} />
                    </button>
                    <button
                      onClick={() => navigateMonth('next')}
                      className="p-3 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-primary-600 transition-all active:scale-95"
                    >
                      <FaChevronRight size={14} />
                    </button>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">
                      {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Operational Horizon</div>
                  </div>
                </div>
                
                <div className="hidden md:flex items-center gap-4">
                  <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Breakfast</span>
                    <div className="w-2 h-2 rounded-full bg-red-500 ml-2" />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Lunch</span>
                    <div className="w-2 h-2 rounded-full bg-blue-500 ml-2" />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Dinner</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-7 bg-gray-50">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                  <div key={day} className="py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 auto-rows-[140px] xl:auto-rows-[180px]">
                {generateCalendarDays().map(({ date, isCurrentMonth }, i) => {
                  const meals = getMealsForDate(date);
                  const isToday = new Date().toDateString() === date.toDateString();
                  
                  return (
                    <div
                      key={i}
                      className={`relative p-3 border-r border-b border-gray-50 group transition-all ${
                        !isCurrentMonth ? 'bg-gray-50/30' : 'bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-sm font-black transition-all ${
                          isToday ? 'w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-900/20' : 
                          isCurrentMonth ? 'text-gray-900' : 'text-gray-300'
                        }`}>
                          {date.getDate()}
                        </span>
                        {meals.length > 0 && isCurrentMonth && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                        )}
                      </div>

                      <div className="space-y-1.5 max-h-[100px] xl:max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                        {meals
                          .sort((a, b) => getMealPriority(a.mealType) - getMealPriority(b.mealType))
                          .map((meal, idx) => {
                            const style = getMealColor(meal.mealType);
                            return (
                              <Link
                                key={`${meal.orderId}-${idx}`}
                                href={`/orders/edit/${meal.orderId}`}
                                className={`block px-2.5 py-1.5 rounded-xl border-l-4 transition-all hover:scale-[1.02] hover:shadow-md ${style}`}
                              >
                                <div className="text-[9px] font-black truncate uppercase leading-none mb-0.5">
                                  {meal.customerName}
                                </div>
                                <div className="flex items-center justify-between gap-1 overflow-hidden">
                                  <span className="text-[8px] font-bold opacity-80 uppercase tracking-tighter truncate">
                                    {meal.mealType}
                                  </span>
                                  {meal.memberCount && (
                                    <span className="text-[8px] font-black text-white px-1.5 rounded bg-black/20">
                                      {meal.memberCount}
                                    </span>
                                  )}
                                </div>
                              </Link>
                            );
                          })}
                      </div>

                      {/* Day Metadata Indicator */}
                      {!isCurrentMonth && (
                        <div className="absolute inset-0 bg-white/40 pointer-events-none" />
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="table"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="v2-card bg-white overflow-hidden shadow-2xl shadow-gray-200/50 p-4"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead>
                    <tr className="bg-gray-50/50 rounded-2xl">
                      {['Customer Instance', 'Event Identity', 'Financial Volume', 'Recovery', 'Deficit', 'Temporal Log', 'Nexus'].map(label => (
                        <th key={label} className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 border-t border-gray-100">
                    {filteredOrders.map((order: any) => (
                      <tr key={order.id} className="group hover:bg-gray-50/50 transition-all duration-300">
                        <td className="px-6 py-5">
                          <div className="text-xs font-black text-gray-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight">{order.customer?.name || 'Unknown'}</div>
                          <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">{order.customer?.phone || 'NO SECURE LINE'}</div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-[10px] font-black text-gray-700 bg-gray-100 px-3 py-1 rounded-lg inline-block uppercase tracking-widest border border-gray-200/50">
                            {(order as any).eventName || 'UNNAMED_SEQ'}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-xs font-black text-gray-900 tracking-tighter">{formatCurrency(order.totalAmount)}</div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-xs font-black text-emerald-600 tracking-tighter">+{formatCurrency(order.advancePaid)}</div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-xs font-black text-rose-600 tracking-tighter">-{formatCurrency(order.remainingAmount)}</div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-tight">
                            {formatDateTime(order.createdAt).split(',')[0]}<br/>
                            <span className="opacity-50 font-bold">{formatDateTime(order.createdAt).split(',')[1]}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/orders/summary/${order.id}`}
                              className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-400 rounded-xl hover:bg-primary-600 hover:text-white transition-all shadow-sm hover:shadow-primary-900/20 active:scale-95"
                              title="Intelligence Summary"
                            >
                              <FaChartLine size={12} />
                            </Link>
                            <Link
                              href={`/orders/financial/${order.id}`}
                              className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-400 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm hover:shadow-emerald-900/20 active:scale-95"
                              title="Financial Matrix"
                            >
                              <FaMoneyBillWave size={12} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
