'use client'

import { useEffect, useState, useMemo } from 'react'
import { formatDateTime, formatDate, sanitizeMealLabel } from '@/lib/utils'
import { Order } from '@/types'
import { FaTrash, FaFilePdf, FaFileImage, FaChevronLeft, FaChevronRight, FaEdit, FaFilter, FaChartLine, FaClock, FaCheckCircle, FaTimesCircle, FaEnvelope, FaCalendarAlt } from 'react-icons/fa'
import Link from 'next/link'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import toast from 'react-hot-toast'
import ConfirmModal from '@/components/ConfirmModal'
import MergeOrdersModal from '@/components/MergeOrdersModal'
import { FaLayerGroup } from 'react-icons/fa'
import { buildOrderPdfHtml } from '@/lib/order-pdf-html'

export default function OrdersHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  })
  const [statusConfirm, setStatusConfirm] = useState<{
    isOpen: boolean
    id: string | null
    newStatus: string
    oldStatus: string
  }>({
    isOpen: false,
    id: null,
    newStatus: '',
    oldStatus: '',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [customerSearch, setCustomerSearch] = useState<string>('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [pdfLanguageModal, setPdfLanguageModal] = useState<{ isOpen: boolean; order: any | null }>({
    isOpen: false,
    order: null,
  })
  const [emailModal, setEmailModal] = useState<{ isOpen: boolean; order: any | null }>({
    isOpen: false,
    order: null,
  })
  const [emailSending, setEmailSending] = useState(false)
  const [separationConfirm, setSeparationConfirm] = useState<{
    isOpen: boolean
    orderId: string | null
    sessionKey: string | null
    sessionLabel: string
    date?: string
  }>({
    isOpen: false,
    orderId: null,
    sessionKey: null,
    sessionLabel: '',
  })
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false)
  const [isMerging, setIsMerging] = useState(false)

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
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(order => {
        const mealTypeAmounts = order.mealTypeAmounts as Record<string, { date?: string } | number> | null
        if (!mealTypeAmounts) return false

        const eventDates = Object.values(mealTypeAmounts)
          .map(v => typeof v === 'object' && v !== null ? v.date : null)
          .filter(Boolean) as string[]

        if (eventDates.length === 0) return false

        return eventDates.some(dateStr => {
          const eventDate = new Date(dateStr)
          eventDate.setHours(0, 0, 0, 0)

          if (dateRange.start && dateRange.end) {
            const start = new Date(dateRange.start)
            const end = new Date(dateRange.end)
            start.setHours(0, 0, 0, 0)
            end.setHours(23, 59, 59, 999)
            return eventDate >= start && eventDate <= end
          } else if (dateRange.start) {
            const start = new Date(dateRange.start)
            start.setHours(0, 0, 0, 0)
            return eventDate >= start
          } else if (dateRange.end) {
            const end = new Date(dateRange.end)
            end.setHours(23, 59, 59, 999)
            return eventDate <= end
          }
          return true
        })
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
          console.log(`[Order History] Γ£à Bill created: ${responseData._billId}`)
          toast.success(`Order status updated to ${newStatus}. Bill has been generated!`, {
            duration: 4000,
          })
        } else if (responseData._billError) {
          console.error(`[Order History] Γ¥î Bill creation failed:`, responseData._billError)
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

  const confirmStatusChange = async () => {
    if (!statusConfirm.id || !statusConfirm.newStatus) return

    await handleStatusChange(statusConfirm.id, statusConfirm.newStatus)
    setStatusConfirm({ isOpen: false, id: null, newStatus: '', oldStatus: '' })
  }

  const handleDiscardSession = (orderId: string, sessionKey: string) => {
    const sessionLabel = sanitizeMealLabel(sessionKey)
    setSeparationConfirm({
      isOpen: true,
      orderId,
      sessionKey,
      sessionLabel,
    })
  }

  const handleDiscardDate = (orderId: string, date: string) => {
    setSeparationConfirm({
      isOpen: true,
      orderId,
      sessionKey: null, // null means date-based
      sessionLabel: formatDate(date),
      date,
    })
  }

  const confirmSeparation = async () => {
    const { orderId, sessionKey, date } = separationConfirm
    if (!orderId) return

    try {
      const endpoint = sessionKey ? '/api/orders/discard-session' : '/api/orders/discard-date'
      const body = sessionKey ? { orderId, sessionKey } : { orderId, date }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to separate session')
      }

      toast.success(sessionKey ? 'Session separated successfully' : 'Date group separated successfully')
      setSeparationConfirm({ isOpen: false, orderId: null, sessionKey: null, sessionLabel: '', date: '' })
      loadData()
    } catch (error: any) {
      console.error('Failed to separate:', error)
      toast.error(error.message || 'Failed to separate')
    }
  }

  const handleMergeConfirm = async (primaryOrderId: string) => {
    const secondaryOrderIds = selectedOrderIds.filter(id => id !== primaryOrderId)
    if (secondaryOrderIds.length === 0) {
      toast.error('Please select more than one order to merge')
      return
    }

    setIsMerging(true)
    try {
      const response = await fetch('/api/orders/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryOrderId, secondaryOrderIds })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to merge orders')
      }

      toast.success('Orders merged successfully!')
      setSelectedOrderIds([])
      setIsMergeModalOpen(false)
      loadData()
    } catch (error: any) {
      console.error('Merge error:', error)
      toast.error(error.message || 'Failed to merge orders')
    } finally {
      setIsMerging(false)
    }
  }

  const toggleOrderSelection = (id: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
    )
  }



  const renderOrderToPdf = async (order: any, language: 'english' | 'telugu'): Promise<string | null> => {
    const customer = order.customer
    const supervisor = order.supervisor
    const useEnglish = language === 'english'

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
          <div>Email: pujyasri1989cya@gmail.com, Cell: 9866525102, 9963691393, 9390015302</div>
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

    // Build date-wise structure for merged orders (same as order-pdf-html)
    const getMealTypePriority = (type: string) => {
      const p: Record<string, number> = { 'BREAKFAST': 1, 'LUNCH': 2, 'DINNER': 3, 'SNACKS': 4 }
      return p[type?.toUpperCase()] || 99
    }
    type SessionGroup = { menuType: string; members?: number; services?: string[]; items: any[] }
    const byDate: Record<string, SessionGroup[]> = {}

    order.items.forEach((item: any) => {
      const sessionKey = item.mealType
      const sessionData = sessionKey && mealTypeAmounts?.[sessionKey]
        ? (typeof mealTypeAmounts[sessionKey] === 'object' && mealTypeAmounts[sessionKey] !== null ? mealTypeAmounts[sessionKey] as any : null)
        : null
      const menuType = sessionData?.menuType || item.menuItem?.type || 'OTHER'
      const date = sessionData?.date ? formatDate(sessionData.date) : eventDateDisplay
      const members = sessionData?.numberOfMembers
      const services = sessionData?.services

      const groupKey = sessionKey || `legacy_${menuType}`
      if (!byDate[date]) byDate[date] = []
      let session = byDate[date].find((s: any) => s._key === groupKey)
      if (!session) {
        session = { menuType, members, services, items: [] } as SessionGroup & { _key?: string }
        ;(session as any)._key = groupKey
        byDate[date].push(session)
      }
      session.items.push(item)
      if (members != null) session.members = members
      if (services?.length) session.services = services
    })

    const sortedDates = Object.keys(byDate).sort((a, b) => {
      const da = new Date(a).getTime()
      const db = new Date(b).getTime()
      return isNaN(da) ? 1 : isNaN(db) ? -1 : da - db
    })
    sortedDates.forEach((date) => {
      const sessions = byDate[date].sort((a, b) => getMealTypePriority(a.menuType) - getMealTypePriority(b.menuType))
      htmlContent += `
        <div style="grid-column: span 4; font-weight: 700; font-size: 10px; margin-top: 12px; margin-bottom: 4px; color: #444; text-transform: uppercase; padding-bottom: 2px; border-bottom: 1px solid #ddd; font-family: 'Poppins', sans-serif;">
          📅 ${date}
        </div>
      `
      sessions.forEach((session) => {
        const memberInfo = session.members ? ` (${session.members} Members)` : ''
        htmlContent += `
        <div style="grid-column: span 4; font-weight: 700; font-size: 10px; margin-top: 6px; margin-bottom: 3px; color: #222; text-transform: uppercase; padding-bottom: 2px; font-family: 'Poppins', sans-serif;">
          ${sanitizeMealLabel(session.menuType)}${memberInfo}
        </div>
      `
        session.items.forEach((item: any, index: number) => {
          const itemName = useEnglish
            ? (item.menuItem?.name || item.menuItem?.nameTelugu || 'Unknown Item')
            : (item.menuItem?.nameTelugu || item.menuItem?.name || 'Unknown Item')
          htmlContent += `
          <div style="padding: 2px 4px; font-family: 'Poppins', sans-serif; line-height: 1.3; font-weight: 600;">
            ${index + 1}. ${itemName}${item.customization ? ` (${item.customization})` : ''}
          </div>
        `
        })
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

    // Add stamp below menu (and stalls)
    htmlContent += `
      <div style="margin-top: 25px; display: flex; justify-content: flex-end;">
        <img src="/images/stamp.png" alt="Business Stamp" width="200" height="90" style="width: 200px; height: 90px; transform: rotate(-90deg); object-fit: contain;" crossorigin="anonymous" />
      </div>
    `

    tempDiv.innerHTML = htmlContent
    tempDiv.style.overflow = 'visible'
    document.body.appendChild(tempDiv)
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

    try {
      const w = tempDiv.scrollWidth
      const h = Math.max(tempDiv.scrollHeight + 20, 1)
      const canvas = await html2canvas(tempDiv, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: w,
        height: h,
        windowWidth: w,
        windowHeight: h,
      })

      // Remove temporary element
      document.body.removeChild(tempDiv)

      // Create PDF from canvas (JPEG for smaller size - avoids 413 on email send)
      const imgData = canvas.toDataURL('image/jpeg', 0.85)
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      const dataUrl = pdf.output('datauristring')
      return dataUrl ? dataUrl.split(',')[1] : null
    } catch (error) {
      tempDiv.parentNode?.removeChild(tempDiv)
      console.error('Error generating PDF:', error)
      return null
    }
  }

  const renderOrderToImage = async (order: any, language: 'english' | 'telugu'): Promise<string | null> => {
    if (!order?.items?.length) return null
    const htmlContent = buildOrderPdfHtml(order, {
      useEnglish: language === 'english',
      formatDate,
    })
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.width = '210mm'
    tempDiv.style.padding = '15mm'
    tempDiv.style.fontFamily = 'Poppins, sans-serif'
    tempDiv.style.fontSize = '11px'
    tempDiv.style.lineHeight = '1.6'
    tempDiv.style.background = 'white'
    tempDiv.style.color = '#333'
    tempDiv.innerHTML = htmlContent
    tempDiv.style.overflow = 'visible'
    document.body.appendChild(tempDiv)
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
    try {
      const w = tempDiv.scrollWidth
      const h = Math.max(tempDiv.scrollHeight + 20, 1)
      const canvas = await html2canvas(tempDiv, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: w,
        height: h,
        windowWidth: w,
        windowHeight: h,
      })
      document.body.removeChild(tempDiv)
      return canvas.toDataURL('image/png')
    } catch {
      if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv)
      return null
    }
  }

  const handleGeneratePDF = async (order: any, language: 'english' | 'telugu') => {
    const pdfBase64 = await renderOrderToPdf(order, language)
    if (!pdfBase64) {
      toast.error('Failed to generate PDF. Please try again.')
      return
    }
    const byteChars = atob(pdfBase64)
    const byteNumbers = new Array(byteChars.length)
    for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i)
    const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `order-SKC-ORDER-${(order as any).serialNumber || order.id.slice(0, 8)}.pdf`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`PDF downloaded (${language === 'english' ? 'English' : 'Telugu'})`)
  }

  const handleGenerateImage = async (order: any, language: 'english' | 'telugu' = 'english') => {
    const imageDataUrl = await renderOrderToImage(order, language)
    if (!imageDataUrl) {
      toast.error('Failed to generate image. Please try again.')
      return
    }
    const a = document.createElement('a')
    a.href = imageDataUrl
    a.download = `order-SKC-ORDER-${(order as any).serialNumber || order.id.slice(0, 8)}.png`
    a.click()
    toast.success('Order image downloaded!')
  }

  const handleSendOrderEmail = async (order: any, language: 'english' | 'telugu') => {
    const customerEmail = order.customer?.email
    if (!customerEmail) {
      toast.error('Customer email not available')
      return
    }
    setEmailSending(true)
    try {
      const pdfBase64 = await renderOrderToPdf(order, language)
      if (!pdfBase64) {
        toast.error('Failed to generate PDF. Please try again.')
        return
      }
      const response = await fetch(`/api/orders/${order.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: customerEmail, pdfBase64 }),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to send order email')
      }
      toast.success(`Order sent to ${customerEmail}`)
      setEmailModal({ isOpen: false, order: null })
    } catch (error: any) {
      toast.error(error.message || 'Failed to send order email')
    } finally {
      setEmailSending(false)
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 md:gap-0 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Orders History</h1>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {selectedOrderIds.length > 1 && (
            <button
              onClick={() => setIsMergeModalOpen(true)}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-md animate-in slide-in-from-right-4"
            >
              <FaLayerGroup />
              Merge Selected ({selectedOrderIds.length})
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <FaFilter />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
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
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="flex-1 px-3 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="flex-1 px-3 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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

      {/* Orders - Mobile Card Layout (only on mobile) */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
          No orders found.
        </div>
      ) : (
        <>
        {/* Mobile Cards - visible only below md */}
        <div className="md:hidden space-y-3">
          {paginatedOrders.map((order: any) => {
            const mealTypeAmounts = order.mealTypeAmounts as Record<string, { date: string; numberOfMembers?: number } | number> | null
            const eventDates: string[] = []
            if (mealTypeAmounts) {
              Object.values(mealTypeAmounts).forEach((v) => {
                if (typeof v === 'object' && v !== null && v.date && !eventDates.includes(v.date)) {
                  eventDates.push(v.date)
                }
              })
            }
            eventDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
            const firstDate = eventDates[0] ? new Date(eventDates[0]).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null

            return (
              <div key={order.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{order.customer?.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{order.customer?.phone || ''}</div>
                      {(order as any).eventName && (
                        <div className="text-sm text-gray-700 mt-0.5 truncate">{(order as any).eventName}</div>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.includes(order.id)}
                      onChange={() => toggleOrderSelection(order.id)}
                      className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 flex-shrink-0 mt-0.5"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {firstDate && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
                        <FaCalendarAlt className="text-slate-500" /> {firstDate}
                        {eventDates.length > 1 && <span className="text-slate-500">+{eventDates.length - 1}</span>}
                      </span>
                    )}
                    <select
                      value={order.status}
                      onChange={(e) => {
                        if (e.target.value === order.status) return
                        setStatusConfirm({ isOpen: true, id: order.id, newStatus: e.target.value, oldStatus: order.status })
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full border-0 cursor-pointer touch-manipulation ${order.status === 'completed' ? 'bg-green-100 text-green-800' : order.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                    <Link href={`/orders/summary/${order.id}`} className="p-2.5 bg-blue-50 text-blue-600 rounded-lg touch-manipulation" title="Summary"><FaChartLine /></Link>
                    <Link href={`/orders?edit=${order.id}`} className="p-2.5 bg-yellow-50 text-yellow-600 rounded-lg touch-manipulation" title="Edit"><FaEdit /></Link>
                    <button onClick={() => setPdfLanguageModal({ isOpen: true, order })} className="p-2.5 bg-secondary-50 text-secondary-600 rounded-lg touch-manipulation" title="PDF"><FaFilePdf /></button>
                    <button onClick={() => handleGenerateImage(order, 'english')} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg touch-manipulation" title="Image"><FaFileImage /></button>
                    <button onClick={() => order.customer?.email ? setEmailModal({ isOpen: true, order }) : toast.error('Customer email not available')} className="p-2.5 bg-green-50 text-green-600 rounded-lg touch-manipulation" title="Email"><FaEnvelope /></button>
                    <button onClick={() => handleDelete(order.id)} className="p-2.5 bg-red-50 text-red-600 rounded-lg touch-manipulation" title="Delete"><FaTrash /></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Desktop Table - visible only md and up */}
        <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.length === paginatedOrders.length && paginatedOrders.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrderIds(paginatedOrders.map(o => o.id))
                        } else {
                          setSelectedOrderIds([])
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Dates / Guests</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedOrders.map((order: any) => {
                  // Extract all event dates from meal types
                  const mealTypeAmounts = order.mealTypeAmounts as Record<string, { amount: number; date: string; numberOfMembers?: number } | number> | null
                  let totalMembersAll = 0
                  if (mealTypeAmounts) {
                    Object.values(mealTypeAmounts).forEach((value) => {
                      if (typeof value === 'object' && value !== null && (value as any).numberOfMembers) {
                        totalMembersAll += Number((value as any).numberOfMembers) || 0
                      }
                    })
                  }
                  const eventDates: Array<{ mealType: string; date: string; key: string; members?: number }> = []
                  if (mealTypeAmounts) {
                    Object.entries(mealTypeAmounts).forEach(([key, data]) => {
                      if (typeof data === 'object' && data !== null && data.date) {
                        // Priority: 1. menuType in data, 2. the session key if it's not a UUID/long ID, 3. "Meal"
                        let displayLabel = (data as any).menuType
                        if (!displayLabel) {
                          if (key.length > 20 || key.includes('-') || key.startsWith('session_')) {
                            // Try to extract name from session_NAME_serial
                            if (key.startsWith('session_')) {
                              const parts = key.split('_')
                              if (parts.length > 1 && parts[1] !== 'merged') {
                                displayLabel = parts[1]
                              } else {
                                displayLabel = 'Meal'
                              }
                            } else {
                              displayLabel = 'Meal'
                            }
                          } else {
                            displayLabel = key
                          }
                        }
                        eventDates.push({
                          mealType: displayLabel,
                          date: data.date,
                          key,
                          members: (data as any).numberOfMembers
                        })
                      }
                    })
                  }

                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition-all border-b border-slate-100 group">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.includes(order.id)}
                          onChange={() => toggleOrderSelection(order.id)}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
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
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 space-y-4">
                          {(() => {
                            const isCombinedOrder = eventDates.some(ed => ed.key.startsWith('session_') || ed.key.includes('_merged_'))
                            const groupedByDate: Record<string, typeof eventDates> = {}
                            eventDates.forEach(ed => {
                              if (!groupedByDate[ed.date]) groupedByDate[ed.date] = []
                              groupedByDate[ed.date].push(ed)
                            })

                            const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

                            return sortedDates.length > 0 ? (
                              sortedDates.map((date) => (
                                <div key={date} className="relative group/date">
                                  {/* Date Header / Badge */}
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 shadow-sm">
                                      <FaCalendarAlt className="text-slate-400 text-[10px]" />
                                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">
                                        {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      </span>
                                    </div>

                                    {isCombinedOrder && sortedDates.length > 1 && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDiscardDate(order.id, date);
                                        }}
                                        className="text-red-400 hover:text-red-600 p-0.5 opacity-0 group-hover/date:opacity-100 transition-all hover:scale-110"
                                        title="Separate all sessions on this date"
                                      >
                                        <FaTimesCircle size={14} />
                                      </button>
                                    )}
                                  </div>

                                  {/* Sessions List */}
                                  <div className="flex flex-wrap gap-1.5 pl-1 border-l-2 border-slate-100 ml-1">
                                    {groupedByDate[date].map(({ mealType, key, members }) => (
                                      <div key={key} className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm group/session hover:border-primary-300 transition-colors">
                                        <span className="capitalize text-[11px] font-bold text-slate-700">
                                          {sanitizeMealLabel(mealType)}
                                          {members ? (
                                            <span className="ml-1 text-primary-600 font-black">({members})</span>
                                          ) : order.numberOfMembers ? (
                                            <span className="ml-1 text-slate-400 font-medium">
                                              ({totalMembersAll > 0 ? totalMembersAll : order.numberOfMembers})
                                            </span>
                                          ) : null}
                                        </span>
                                        {isCombinedOrder && eventDates.length > 1 && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDiscardSession(order.id, key);
                                            }}
                                            className="text-slate-300 hover:text-red-500 opacity-0 group-hover/session:opacity-100 transition-all hover:scale-110"
                                            title="Separate only this session"
                                          >
                                            <FaTimesCircle size={12} />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <span className="text-gray-400 italic">No dates set</span>
                            )
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) => {
                            if (e.target.value === order.status) return
                            setStatusConfirm({
                              isOpen: true,
                              id: order.id,
                              newStatus: e.target.value,
                              oldStatus: order.status
                            })
                          }}
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
                            onClick={() => setPdfLanguageModal({ isOpen: true, order })}
                            className="text-secondary-500 hover:text-secondary-700 p-2 hover:bg-secondary-50 rounded"
                            title="Download PDF"
                          >
                            <FaFilePdf />
                          </button>
                          <button
                            onClick={() => handleGenerateImage(order, 'english')}
                            className="text-indigo-600 hover:text-indigo-800 p-2 hover:bg-indigo-50 rounded"
                            title="Download Image (PNG)"
                          >
                            <FaFileImage />
                          </button>
                          <button
                            onClick={() => {
                              if (!order.customer?.email) {
                                toast.error('Customer email not available')
                                return
                              }
                              setEmailModal({ isOpen: true, order })
                            }}
                            className="text-green-600 hover:text-green-800 p-2 hover:bg-green-50 rounded"
                            title="Email Order (Menu + Event Details)"
                          >
                            <FaEnvelope />
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
        </>
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

      <ConfirmModal
        isOpen={statusConfirm.isOpen}
        title="Change Order Status"
        message={
          <div>
            <p>Are you sure you want to change the status from <strong>{statusConfirm.oldStatus?.replace('_', ' ').toUpperCase()}</strong> to <strong>{statusConfirm.newStatus?.replace('_', ' ').toUpperCase()}</strong>?</p>
            {statusConfirm.newStatus === 'in_progress' && <p className="mt-2 text-sm text-yellow-600 font-medium">This will generate a bill if one does not exist.</p>}
            {statusConfirm.newStatus === 'completed' && <p className="mt-2 text-sm text-green-600 font-medium">This will mark the bill as fully PAID.</p>}
          </div>
        }
        confirmText="Yes, Update Status"
        cancelText="Cancel"
        onConfirm={confirmStatusChange}
        onCancel={() => setStatusConfirm({ isOpen: false, id: null, newStatus: '', oldStatus: '' })}
        variant="info"
      />

      {/* PDF Language Selection Modal */}
      {pdfLanguageModal.isOpen && pdfLanguageModal.order && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Download Order PDF</h3>
            <p className="text-sm text-gray-600 mb-4">Do you want the menu items in English or Telugu?</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  handleGeneratePDF(pdfLanguageModal.order, 'english')
                  setPdfLanguageModal({ isOpen: false, order: null })
                }}
                className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
              >
                English
              </button>
              <button
                onClick={() => {
                  handleGeneratePDF(pdfLanguageModal.order, 'telugu')
                  setPdfLanguageModal({ isOpen: false, order: null })
                }}
                className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
              >
                α░ñα▒åα░▓α▒üα░ùα▒ü (Telugu)
              </button>
            </div>
            <button
              onClick={() => setPdfLanguageModal({ isOpen: false, order: null })}
              className="mt-3 w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Email Order Modal */}
      {emailModal.isOpen && emailModal.order && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Email Order to Customer</h3>
            <p className="text-sm text-gray-600 mb-4">
              Send order (menu + event details) to{' '}
              <span className="font-medium text-gray-800">{emailModal.order.customer?.email}</span>
            </p>
            <p className="text-xs text-gray-500 mb-4">Menu items in:</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleSendOrderEmail(emailModal.order, 'english')}
                disabled={emailSending}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {emailSending ? 'Sending...' : 'English'}
              </button>
              <button
                onClick={() => handleSendOrderEmail(emailModal.order, 'telugu')}
                disabled={emailSending}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {emailSending ? 'Sending...' : 'α░ñα▒åα░▓α▒üα░ùα▒ü'}
              </button>
            </div>
            <button
              onClick={() => setEmailModal({ isOpen: false, order: null })}
              disabled={emailSending}
              className="mt-3 w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={separationConfirm.isOpen}
        title="Separate Session"
        message={`Are you sure you want to separate the session "${separationConfirm.sessionLabel}" from this group? It will be removed from this order and become its own separate record in the list.`}
        confirmText="Separate"
        cancelText="Keep in Group"
        onConfirm={confirmSeparation}
        onCancel={() => setSeparationConfirm({ isOpen: false, orderId: null, sessionKey: null, sessionLabel: '', date: '' })}
        variant="warning"
      />

      <MergeOrdersModal
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        selectedOrders={orders.filter(o => selectedOrderIds.includes(o.id))}
        onMerge={handleMergeConfirm}
        isMerging={isMerging}
      />
    </div>
  )
}
