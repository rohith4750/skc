'use client'

import { useEffect, useState, useMemo } from 'react'
import { formatDateTime, formatDate } from '@/lib/utils'
import { Order } from '@/types'
import { FaTrash, FaFilePdf, FaChevronLeft, FaChevronRight, FaEdit, FaFilter, FaChartLine, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa'
import Link from 'next/link'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import toast from 'react-hot-toast'
import ConfirmModal from '@/components/ConfirmModal'

export default function OrdersHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  })
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [customerSearch, setCustomerSearch] = useState<string>('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const response = await fetch('/api/orders')
      if (!response.ok) throw new Error('Failed to fetch orders')
      const allOrders = await response.json() as Order[]
      setOrders(allOrders)
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load data. Please try again.')
    }
  }

  // Filter orders
  const filteredOrders = useMemo(() => {
    let filtered = orders

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    // Customer search filter
    if (customerSearch) {
      const searchLower = customerSearch.toLowerCase()
      filtered = filtered.filter(order =>
        order.customer?.name?.toLowerCase().includes(searchLower) ||
        order.customer?.phone?.includes(customerSearch) ||
        order.customer?.email?.toLowerCase().includes(searchLower) ||
        (order as any).eventName?.toLowerCase().includes(searchLower)
      )
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt)
        const startDate = new Date(dateRange.start)
        return orderDate >= startDate
      })
    }
    if (dateRange.end) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt)
        const endDate = new Date(dateRange.end)
        endDate.setHours(23, 59, 59, 999)
        return orderDate <= endDate
      })
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [orders, statusFilter, customerSearch, dateRange])

  const statusSummary = useMemo(() => {
    const totalOrders = filteredOrders.length
    const pending = filteredOrders.filter((order) => order.status === 'pending').length
    const inProgress = filteredOrders.filter((order) => order.status === 'in_progress').length
    const completed = filteredOrders.filter((order) => order.status === 'completed').length
    const cancelled = filteredOrders.filter((order) => order.status === 'cancelled').length
    return { totalOrders, pending, inProgress, completed, cancelled }
  }, [filteredOrders])

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex)

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, id })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return
    try {
      const response = await fetch(`/api/orders/${deleteConfirm.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.details || 'Failed to delete order')
      }

      await loadData()
      toast.success('Order deleted successfully!')
      setDeleteConfirm({ isOpen: false, id: null })
    } catch (error: any) {
      console.error('Failed to delete order:', error)
      toast.error(error.message || 'Failed to delete order. Please try again.')
      setDeleteConfirm({ isOpen: false, id: null })
    }
  }

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      console.log(`[Order History] Updating order ${orderId} status to ${newStatus}`)
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update status')
      }

      const responseData = await response.json()
      console.log(`[Order History] Order status updated.`, responseData)

      // Reload data to get the latest orders with updated status
      await loadData()

      // If status changed to in_progress or completed, check if bill was created
      if (newStatus === 'in_progress' || newStatus === 'completed') {
        if (responseData._billCreated) {
          console.log(`[Order History] ✅ Bill created: ${responseData._billId}`)
          toast.success(`Order status updated to ${newStatus}. Bill has been generated!`, {
            duration: 4000,
          })
        } else if (responseData._billError) {
          console.error(`[Order History] ❌ Bill creation failed:`, responseData._billError)
          toast.error(`Order status updated, but bill creation failed: ${responseData._billError.message}`, {
            duration: 5000,
          })
        } else if (responseData._billStatus === 'exists') {
          console.log(`[Order History] Bill already exists for this order`)
          toast.success(`Order status updated to ${newStatus}. Bill already exists.`, {
            duration: 4000,
          })
        } else {
          toast.success(`Order status updated to ${newStatus}. Bill has been generated!`, {
            duration: 4000,
          })
        }
      } else {
        toast.success('Order status updated successfully!')
      }
    } catch (error: any) {
      console.error('Failed to update status:', error)
      toast.error(error.message || 'Failed to update order status. Please try again.')
    }
  }


  const handleGeneratePDF = async (order: any) => {
    const customer = order.customer
    const supervisor = order.supervisor

    // Extract event dates from meal types
    const mealTypeAmounts = order.mealTypeAmounts as Record<string, { amount: number; date: string } | number> | null
    const eventDates: string[] = []
    if (mealTypeAmounts) {
      Object.entries(mealTypeAmounts).forEach(([mealType, data]) => {
        if (typeof data === 'object' && data !== null && data.date) {
          const dateStr = formatDate(data.date)
          if (!eventDates.includes(dateStr)) {
            eventDates.push(dateStr)
          }
        }
      })
    }
    const eventDateDisplay = eventDates.length > 0 ? eventDates.join(', ') : formatDate(order.createdAt)

    // Create a temporary HTML element to render Telugu text properly
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.width = '210mm' // A4 width
    tempDiv.style.padding = '15mm'
    tempDiv.style.fontFamily = 'Poppins, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
    tempDiv.style.fontSize = '11px'
    tempDiv.style.lineHeight = '1.6'
    tempDiv.style.background = 'white'
    tempDiv.style.color = '#333'

    let htmlContent = `
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * { font-family: 'Poppins', sans-serif !important; }
        .header { text-align: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #333; }
        .header-top { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 10px; color: #555; font-family: 'Poppins', sans-serif; }
        .header-main { font-size: 32px; font-weight: 700; margin: 15px 0 8px 0; letter-spacing: 2px; color: #1a1a1a; font-family: 'Poppins', sans-serif; }
        .header-subtitle { font-size: 14px; color: #666; margin-bottom: 12px; font-style: italic; font-family: 'Poppins', sans-serif; }
        .header-details { font-size: 9px; line-height: 1.6; color: #444; margin-top: 10px; font-family: 'Poppins', sans-serif; }
        .header-details div { margin-bottom: 3px; }
        .section { margin-bottom: 15px; font-family: 'Poppins', sans-serif; }
        .section-title { font-size: 14px; font-weight: 600; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 2px solid #ddd; color: #222; font-family: 'Poppins', sans-serif; }
        .info-row { margin-bottom: 6px; font-family: 'Poppins', sans-serif; }
        .info-label { font-weight: 600; display: inline-block; width: 120px; font-family: 'Poppins', sans-serif; }
        .menu-item { padding: 2px 4px; font-family: 'Poppins', sans-serif; font-size: 9px; line-height: 1.3; font-weight: 600; }
        .financial-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; font-family: 'Poppins', sans-serif; }
        .financial-row.total { font-weight: 700; font-size: 13px; border-top: 2px solid #333; border-bottom: 2px solid #333; margin-top: 5px; padding-top: 8px; }
        .financial-label { font-weight: 600; }
      </style>
      
      <div class="header">
        <div class="header-top">
          <div>Telidevara Rajendraprasad</div>
          <div>ART FOOD ZONE (A Food Caterers)</div>
        </div>
        <div class="header-main">SRIVATSASA & KOWNDINYA CATERERS</div>
        <div class="header-subtitle">(Pure Vegetarian)</div>
        <div class="header-details">
          <div>Regd. No: 2361930100031</div>
          <div>Plot No. 115, Padmavathi Nagar, Bank Colony, Saheb Nag Vanathalipuram, Hyderabad - 500070.</div>
          <div>Email: pujyasri1989cya@gmail.com, Cell: 98666521502, 9900119302, 9656501388</div>
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
        <div class="section">
          <div class="section-title">Customer Details</div>
          <div class="info-row"><span class="info-label">Name:</span> ${customer?.name || 'N/A'}</div>
          <div class="info-row"><span class="info-label">Phone:</span> ${customer?.phone || 'N/A'}</div>
          <div class="info-row"><span class="info-label">Email:</span> ${customer?.email || 'N/A'}</div>
          <div class="info-row"><span class="info-label">Address:</span> ${customer?.address || 'N/A'}</div>
        </div>
        
        <div class="section">
          <div class="section-title">Order Information</div>
          <div class="info-row"><span class="info-label">Event Date:</span> ${eventDateDisplay}</div>
          <div class="info-row"><span class="info-label">Supervisor:</span> ${supervisor?.name || 'N/A'}</div>
          <div class="info-row"><span class="info-label">Order ID:</span> SKC-ORDER-${(order as any).serialNumber || order.id.slice(0, 8).toUpperCase()}</div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Menu Items</div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; font-size: 9px;">
    `

    // Group items by type
    const itemsByType: Record<string, any[]> = {}
    order.items.forEach((item: any) => {
      const type = item.menuItem?.type || 'OTHER'
      if (!itemsByType[type]) {
        itemsByType[type] = []
      }
      itemsByType[type].push(item)
    })
    
    // Get member count for each meal type
    const getMemberCount = (mealType: string): string => {
      if (mealTypeAmounts) {
        const mealData = mealTypeAmounts[mealType.toLowerCase()] as any
        if (mealData && typeof mealData === 'object' && mealData.numberOfMembers) {
          return ` (${mealData.numberOfMembers} Members)`
        }
      }
      return ''
    }
    
    // Display items grouped by type in compact grid
    Object.keys(itemsByType).forEach((type) => {
      // Add type section with member count
      const memberInfo = getMemberCount(type)
      htmlContent += `
        <div style="grid-column: span 4; font-weight: 700; font-size: 10px; margin-top: 6px; margin-bottom: 3px; color: #222; text-transform: uppercase; padding-bottom: 2px; font-family: 'Poppins', sans-serif;">
          ${type}${memberInfo}
        </div>
      `

      // Add items for this type in grid
      itemsByType[type].forEach((item: any, index: number) => {
        // Use Telugu name if available, otherwise fall back to English name
        const itemName = item.menuItem?.nameTelugu || item.menuItem?.name || 'Unknown Item'
        htmlContent += `
          <div style="padding: 2px 4px; font-family: 'Poppins', sans-serif; line-height: 1.3; font-weight: 600;">
            ${index + 1}. ${itemName}
          </div>
        `
      })
    })

    htmlContent += `
        </div>
      </div>
    `

    // Add stalls if any
    if (order.stalls && Array.isArray(order.stalls) && order.stalls.length > 0) {
      htmlContent += `
        <div class="section">
          <div class="section-title">Stalls</div>
          <div style="font-size: 11px;">
      `
      order.stalls.forEach((stall: any, idx: number) => {
        htmlContent += `<div class="menu-item">${idx + 1}. ${stall.category}${stall.description ? ` - ${stall.description}` : ''}</div>`
      })
      htmlContent += `
          </div>
        </div>
      `
    }

    tempDiv.innerHTML = htmlContent
    document.body.appendChild(tempDiv)

    try {
      // Convert HTML to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      // Remove temporary element
      document.body.removeChild(tempDiv)

      // Create PDF from canvas
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`order-SKC-ORDER-${(order as any).serialNumber || order.id.slice(0, 8)}.pdf`)
    } catch (error) {
      document.body.removeChild(tempDiv)
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF. Please try again.')
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Orders History</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <FaFilter />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500 uppercase">Total</p>
            <FaChartLine className="text-primary-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{statusSummary.totalOrders}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500 uppercase">Pending</p>
            <FaClock className="text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-yellow-600">{statusSummary.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500 uppercase">In Progress</p>
            <FaClock className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600">{statusSummary.inProgress}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500 uppercase">Completed</p>
            <FaCheckCircle className="text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600">{statusSummary.completed}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500 uppercase">Cancelled</p>
            <FaTimesCircle className="text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600">{statusSummary.cancelled}</p>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Customer Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer/Event Search</label>
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search by customer name, phone, email, or event name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setStatusFilter('all')
                setCustomerSearch('')
                setDateRange({ start: '', end: '' })
                setCurrentPage(1)
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
          No orders found.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guests</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedOrders.map((order: any) => {
                  // Extract all event dates from meal types
                  const mealTypeAmounts = order.mealTypeAmounts as Record<string, { amount: number; date: string } | number> | null
                  const eventDates: Array<{ mealType: string; date: string }> = []
                  if (mealTypeAmounts) {
                    Object.entries(mealTypeAmounts).forEach(([mealType, data]) => {
                      if (typeof data === 'object' && data !== null && data.date) {
                        eventDates.push({ mealType, date: data.date })
                      }
                    })
                  }

                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.customer?.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{order.customer?.phone || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {(order as any).eventName || <span className="text-gray-400">-</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {(order as any).eventType || <span className="text-gray-400">-</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-[200px] truncate" title={(order as any).venue || ''}>
                          {(order as any).venue || <span className="text-gray-400">-</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {(order as any).numberOfMembers || <span className="text-gray-400">-</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 space-y-1.5">
                          {eventDates.length > 0 ? (
                            eventDates.map(({ mealType, date }) => (
                              <div key={mealType} className="flex items-center justify-between gap-4 min-w-[200px]">
                                <span className="capitalize text-sm font-semibold text-gray-700">{mealType}:</span>
                                <span className="text-sm text-gray-900 font-medium">{formatDate(date)}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-primary-500 focus:outline-none ${order.status === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                              order.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                                  'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <Link
                            href={`/orders/summary/${order.id}`}
                            className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition-colors"
                            title="Order Summary"
                          >
                            <FaChartLine />
                          </Link>
                          <Link
                            href={`/orders?edit=${order.id}`}
                            className="text-yellow-600 hover:text-yellow-900 p-2 hover:bg-yellow-50 rounded transition-colors"
                            title="Edit Order"
                          >
                            <FaEdit />
                          </Link>
                          <button
                            onClick={() => handleGeneratePDF(order)}
                            className="text-secondary-500 hover:text-secondary-700 p-2 hover:bg-secondary-50 rounded"
                            title="Download PDF"
                          >
                            <FaFilePdf />
                          </button>
                          <button
                            onClick={() => handleDelete(order.id)}
                            className="text-secondary-500 hover:text-secondary-700 p-2 hover:bg-secondary-50 rounded"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {orders.length > itemsPerPage && (
        <div className="mt-4 flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow-md">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(endIndex, orders.length)} of {orders.length} orders
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              <FaChevronLeft />
            </button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                      {page}
                    </button>
                  )
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="px-2 text-gray-400">...</span>
                }
                return null
              })}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Order"
        message="Are you sure you want to delete this order? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
        variant="danger"
      />
    </div>
  )
}
