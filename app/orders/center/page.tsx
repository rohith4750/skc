"use client";
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { formatDateTime, formatDate, formatCurrency, sanitizeMealLabel , getOrderDate} from '@/lib/utils'
import { Order } from '@/types'
import {
  FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaFilePdf, FaFileImage,
  FaEnvelope, FaChartLine, FaCheckCircle, FaClock, FaTimesCircle,
  FaLayerGroup, FaCalendarAlt, FaHistory, FaMapMarkerAlt, FaUsers,
  FaBars, FaTimes, FaUtensils, FaChevronLeft, FaChevronRight
} from 'react-icons/fa'
import Link from 'next/link'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import toast from 'react-hot-toast'
import ConfirmModal from '@/components/ConfirmModal'
import MergeOrdersModal from '@/components/MergeOrdersModal'
import { buildOrderPdfHtml } from '@/lib/order-pdf-html'

export default function OrderCenterPage() {
  const router = useRouter()
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
  const [selectedMonth, setSelectedMonth] = useState<number>(0) // 0 for All Months
  const [selectedYear, setSelectedYear] = useState<number>(0) // 0 for All Years
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
  const [previewOrder, setPreviewOrder] = useState<any | null>(null)

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
    } else {
      // Default view for Order Center is everything EXCEPT completed/cancelled
      filtered = filtered.filter(order => ['pending', 'in_progress'].includes(order.status))
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

    // Month/Year filter - skip if 0
    filtered = filtered.filter(order => {
      const orderDate = new Date(getOrderDate(order))
      const monthMatch = selectedMonth === 0 || (orderDate.getMonth() + 1) === selectedMonth
      const yearMatch = selectedYear === 0 || orderDate.getFullYear() === selectedYear
      return monthMatch && yearMatch
    })

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [orders, statusFilter, customerSearch, selectedMonth, selectedYear])

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



  // Shared HTML generator for Menu (PDF & Image)
  const generateMenuHtml = (order: any, language: 'english' | 'telugu') => {
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

    // Helper to resolve a displayable menu type name
    const resolveMenuType = (sessionKey: string, sessionData: any, item?: any): string => {
      // 1. Priority: stored menuType in session data
      if (sessionData?.menuType) return sessionData.menuType

      // 2. Fallback: parse from session key (session_LUNCH_serial or Lunch_merged)
      if (sessionKey && !/^[0-9a-f-]{36}$/i.test(sessionKey)) {
        if (sessionKey.startsWith('session_')) {
          const parts = sessionKey.split('_')
          if (parts.length > 1 && parts[1] !== 'merged') return parts[1]
        }
        const clean = sessionKey.split('_')[0]
        if (['breakfast', 'lunch', 'dinner', 'snacks', 'tiffins', 'sweets'].includes(clean.toLowerCase())) return clean
      }

      // 3. Last fallback: Item's own type if it's a string or the first element of array
      const itemType = item?.menuItem?.type
      if (Array.isArray(itemType) && itemType.length > 0) return itemType[0]
      if (typeof itemType === 'string') return itemType

      return 'OTHER'
    }

    // Build date-wise structure for merged orders (same as order-pdf-html)
    const getMealTypePriority = (type: string) => {
      const p: Record<string, number> = { 'BREAKFAST': 1, 'LUNCH': 2, 'DINNER': 3, 'SNACKS': 4 }
      return p[type?.toUpperCase()] || 99
    }
    type SessionGroup = { menuType: string; members?: number; services?: string[]; items: any[] }
    const byDate: Record<string, SessionGroup[]> = {}

    if (mealTypeAmounts) {
      Object.entries(mealTypeAmounts).forEach(([key, data]) => {
        const d = typeof data === 'object' && data !== null && (data as any).date ? String((data as any).date).split('T')[0] : null
        if (d) {
          if (!byDate[d]) byDate[d] = []
          const sessionData = typeof data === 'object' ? data : null
          const menuType = resolveMenuType(key, sessionData)
          const groupKey = key || `legacy_${menuType}`
          if (!byDate[d].some((s: any) => s._key === groupKey)) {
            const session = { menuType, members: (data as any)?.numberOfMembers, services: (data as any)?.services, items: [] } as SessionGroup & { _key?: string }
              ; (session as any)._key = groupKey
            byDate[d].push(session)
          }
        }
      })
    }

    const resolveSessionData = (sk: string): { data: any; resolvedKey: string } | null => {
      const key = typeof sk === 'string' ? sk.trim() : ''
      if (!key || !mealTypeAmounts) return null
      const direct = mealTypeAmounts[key]
      if (typeof direct === 'object' && direct !== null) return { data: direct, resolvedKey: key }
      const keyLower = key.toLowerCase()
      const found = Object.entries(mealTypeAmounts).find(([k]) => k.toLowerCase() === keyLower)
      if (found) {
        const v = found[1]
        return (typeof v === 'object' && v !== null) ? { data: v, resolvedKey: found[0] } : null
      }
      return null
    }

    order.items.forEach((item: any) => {
      const sessionKey = item.mealType || ''
      const resolved = resolveSessionData(sessionKey)
      const sessionData = resolved?.data ?? null
      const resolvedKey = resolved?.resolvedKey || sessionKey

      const menuType = resolveMenuType(sessionKey, sessionData, item)
      const rawDate = sessionData?.date ? String(sessionData.date).split('T')[0] : null
      const dateKey = rawDate || eventDateDisplay
      const members = sessionData?.numberOfMembers
      const services = sessionData?.services

      const groupKey = resolvedKey || `legacy_${menuType}`
      if (!byDate[dateKey]) byDate[dateKey] = []
      let session = byDate[dateKey].find((s: any) => s._key === groupKey)
      if (!session) {
        session = { menuType, members, services, items: [] } as SessionGroup & { _key?: string }
          ; (session as any)._key = groupKey
        byDate[dateKey].push(session)
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
    sortedDates.forEach((dateKey) => {
      const sessions = byDate[dateKey]
        .filter((s: any) => s.items.length > 0)
        .sort((a: any, b: any) => getMealTypePriority(a.menuType) - getMealTypePriority(b.menuType))
      if (sessions.length === 0) return
      const dateDisplay = /^\d{4}-\d{2}-\d{2}/.test(dateKey) ? formatDate(dateKey) : dateKey
      htmlContent += `
        <div style="grid-column: span 4; font-weight: 700; font-size: 10px; margin-top: 12px; margin-bottom: 4px; color: #444; text-transform: uppercase; padding-bottom: 2px; border-bottom: 1px solid #ddd; font-family: 'Poppins', sans-serif;">
          📅 ${dateDisplay}
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

    // Add Footer Stamp
    htmlContent += `
      <div style="margin-top: 30px; text-align: center; width: 100%;">
        <img src="${window.location.origin}/images/stamp.png" style="width: 300px; max-width: 90%; height: auto; display: block; margin: 0 auto;" alt="Stamp" />
      </div>
    `

    return htmlContent
  }

  const renderOrderToPdf = async (order: any, language: 'english' | 'telugu'): Promise<string | null> => {
    const htmlContent = generateMenuHtml(order, language)

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

    tempDiv.innerHTML = htmlContent
    tempDiv.style.overflow = 'visible'
    document.body.appendChild(tempDiv)

    // Wait for images to load
    const images = tempDiv.getElementsByTagName('img')
    if (images.length > 0) {
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve()
        return new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = resolve
        })
      }))
    }
    await new Promise(r => setTimeout(r, 200)) // Layout buffer

    try {
      const w = tempDiv.scrollWidth
      const h = Math.max(tempDiv.scrollHeight + 20, 1)
      const canvas = await html2canvas(tempDiv, {
        scale: 2.5, // High quality
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

  const renderOrderToImage = async (order: any, language: 'english' | 'telugu', showFinancials = false): Promise<string | null> => {
    if (!order?.items?.length) return null
    // Use the SAME menu layout as PDF (ignore showFinancials for now as user wants Menu list)
    const htmlContent = generateMenuHtml(order, language)

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

    // Wait for images
    const images = tempDiv.getElementsByTagName('img')
    if (images.length > 0) {
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve()
        return new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = resolve
        })
      }))
    }
    await new Promise(r => setTimeout(r, 200)) // Layout buffer

    try {
      const w = tempDiv.scrollWidth
      const h = Math.max(tempDiv.scrollHeight + 20, 1)
      const canvas = await html2canvas(tempDiv, {
        scale: 2.5, // High quality
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
    const freshOrder = await fetch(`/api/orders/${order.id}`).then(r => r.ok ? r.json() : order).catch(() => order)
    const orderToUse = freshOrder?.items?.length ? freshOrder : order
    const pdfBase64 = await renderOrderToPdf(orderToUse, language)
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
    const freshOrder = await fetch(`/api/orders/${order.id}`).then(r => r.ok ? r.json() : order).catch(() => order)
    const orderToUse = freshOrder?.items?.length ? freshOrder : order
    const imageDataUrl = await renderOrderToImage(orderToUse, language, true)
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
      const freshOrder = await fetch(`/api/orders/${order.id}`).then(r => r.ok ? r.json() : order).catch(() => order)
      const orderToUse = freshOrder?.items?.length ? freshOrder : order
      const pdfBase64 = await renderOrderToPdf(orderToUse, language)
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

  const handleOpenPreview = async (order: any) => {
    setPreviewOrder({ ...order, loading: true })
    const freshOrder = await fetch(`/api/orders/${order.id}`).then(r => r.ok ? r.json() : order).catch(() => order)
    setPreviewOrder(freshOrder)
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-slate-50/50 min-h-screen pt-16 lg:pt-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Order Hub</h1>
          <p className="text-slate-500 mt-1">Operational command center for all catering events</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 active:scale-95 transition-all shadow-sm text-sm"
          >
            <FaFilter className="w-4 h-4 text-slate-400" />
            <span>Filters</span>
          </button>

          <Link
            href="/orders"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 active:scale-95 transition-all shadow-sm text-sm font-bold"
          >
            <FaPlus className="w-3 h-3 text-indigo-500" />
            New Order
          </Link>

          {selectedOrderIds.length > 0 && (
            <button
              onClick={() => setIsMergeModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-lg text-sm font-bold"
            >
              Merge {selectedOrderIds.length} Orders
            </button>
          )}
        </div>
      </div>

      {/* Status Summary */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending</h3>
              <div className="bg-orange-50 p-2 rounded-xl">
                <FaClock className="w-5 h-5 text-orange-500" />
              </div>
            </div>
            <p className="text-2xl font-black text-orange-500">{statusSummary.pending}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">In Progress</h3>
              <div className="bg-blue-50 p-2 rounded-xl">
                <FaUtensils className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <p className="text-2xl font-black text-blue-500">{statusSummary.inProgress}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed</h3>
              <div className="bg-emerald-50 p-2 rounded-xl">
                <FaCheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-500">{statusSummary.completed}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cancelled</h3>
              <div className="bg-red-50 p-2 rounded-xl">
                <FaTimesCircle className="w-5 h-5 text-red-500" />
              </div>
            </div>
            <p className="text-2xl font-black text-red-500">{statusSummary.cancelled}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="max-w-7xl mx-auto mb-8 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FaFilter className="text-indigo-500" />
              Operational Filters
            </h3>
            <button
              onClick={() => setShowFilters(false)}
              className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <FaTimes />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Status Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                <option value="all">All Active Orders</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed (Archived)</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Customer Search */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Search</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Customer, phone, event..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Month Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                <option value={0}>All Months</option>
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                <option value={0}>All Years</option>
                {[2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end border-t border-slate-50 pt-4">
            <button
              onClick={() => {
                setStatusFilter('all')
                setCustomerSearch('')
                setSelectedMonth(0)
                setSelectedYear(0)
                setCurrentPage(1)
              }}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-bold uppercase tracking-wider transition-colors"
            >
              Reset All Filters
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

              // Fallback to order level eventDate if no session dates
              if (eventDates.length === 0 && order.eventDate) {
                eventDates.push(order.eventDate)
              }

              eventDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
              const firstDate = eventDates[0] ? new Date(eventDates[0]).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null

              return (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-4">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 truncate">{order.customer?.name || 'Unknown'}</div>
                        <div className="text-xs font-medium text-slate-400 mt-0.5">{order.customer?.phone || ''}</div>
                        {(order as any).eventName && (
                          <div className="text-sm font-bold text-indigo-600 mt-1 truncate">{(order as any).eventName}</div>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.includes(order.id)}
                        onChange={() => toggleOrderSelection(order.id)}
                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 flex-shrink-0 mt-0.5"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      {firstDate && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                          <FaCalendarAlt className="text-slate-400" /> {firstDate}
                          {eventDates.length > 1 && <span className="text-slate-400">+{eventDates.length - 1}</span>}
                        </span>
                      )}
                      <select
                        value={order.status}
                        onChange={(e) => {
                          if (e.target.value === order.status) return
                          setStatusConfirm({ isOpen: true, id: order.id, newStatus: e.target.value, oldStatus: order.status })
                        }}
                        className={`px-3 py-1 text-[10px] font-bold rounded-full border-0 cursor-pointer uppercase tracking-widest ${order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : order.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-50">
                      <button onClick={() => handleOpenPreview(order)} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors" title="Preview Summary"><FaChartLine /></button>
                      <Link href={`/orders?edit=${order.id}`} className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors" title="Edit"><FaEdit /></Link>
                      <button onClick={() => setPdfLanguageModal({ isOpen: true, order })} className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors" title="PDF"><FaFilePdf /></button>
                      <button onClick={() => handleGenerateImage(order, 'english')} className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors" title="Image"><FaFileImage /></button>
                      <button onClick={() => order.customer?.email ? setEmailModal({ isOpen: true, order }) : toast.error('Customer email not available')} className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors" title="Email"><FaEnvelope /></button>
                      <button onClick={() => handleDelete(order.id)} className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors" title="Delete"><FaTrash /></button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop Table - visible only md and up */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left">
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
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Event Name</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Venue</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dates / Guests</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Created</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
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
                    if (totalMembersAll === 0 && order.numberOfMembers) {
                      totalMembersAll = Number(order.numberOfMembers) || 0
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

                    const getStatusStep = (status: string) => {
                      const steps = ['pending', 'in_progress', 'completed']
                      return steps.indexOf(status)
                    }
                    const currentStep = getStatusStep(order.status)

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
                          <div className="text-sm font-bold text-slate-900">{order.customer?.name || 'Unknown'}</div>
                          <div className="text-xs font-medium text-slate-400 mt-0.5">{order.customer?.phone || ''}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-indigo-600">
                            {(order as any).eventName || <span className="text-slate-300 font-normal italic">No Name</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs font-medium text-slate-600">
                            {(order as any).eventType || <span className="text-slate-300 font-normal">-</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-medium text-slate-500 max-w-[180px] truncate" title={(order as any).venue || ''}>
                            {(order as any).venue || <span className="text-slate-300 font-normal">-</span>}
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
                              ) : order.eventDate ? (
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 shadow-sm">
                                    <FaCalendarAlt className="text-slate-400 text-[10px]" />
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">
                                      {new Date(order.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                  </div>
                                </div>
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

      {/* Pagination */}
      <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="text-xs sm:text-sm font-medium text-slate-500 whitespace-nowrap">
          Showing <span className="text-slate-900 font-bold">{startIndex + 1}</span> to <span className="text-slate-900 font-bold">{Math.min(endIndex, filteredOrders.length)}</span> of <span className="text-slate-900 font-bold">{filteredOrders.length}</span> orders
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`p-2 rounded-xl text-xs font-bold transition-all ${currentPage === 1
              ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-90 shadow-sm'
              }`}
          >
            <FaChevronLeft className="w-3 h-3" />
          </button>
          <div className="flex gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              if (
                totalPages <= 7 ||
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-xs sm:text-sm font-bold transition-all ${currentPage === page
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-90 shadow-sm'
                      }`}
                  >
                    {page}
                  </button>
                )
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return <span key={page} className="w-8 flex items-center justify-center text-slate-300 font-bold">...</span>
              }
              return null
            })}
          </div>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-xl text-xs font-bold transition-all ${currentPage === totalPages
              ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-90 shadow-sm'
              }`}
          >
            <FaChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
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
      {
        pdfLanguageModal.isOpen && pdfLanguageModal.order && (
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
        )
      }

      {/* Email Order Modal */}
      {
        emailModal.isOpen && emailModal.order && (
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
        )
      }
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

      {/* Quick Preview Drawer */}
      {
        previewOrder && (
          <div className="fixed inset-0 z-[100] overflow-hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setPreviewOrder(null)} />
            <div className="absolute inset-y-0 right-0 max-w-full flex">
              <div className="relative w-screen max-w-2xl bg-white border-l border-gray-100 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Quick Order Preview</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        ID: {previewOrder.serialNumber ? `SKC-ORDER-${previewOrder.serialNumber}` : previewOrder.id?.slice(0, 8)}
                      </span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${previewOrder.status === 'completed' ? 'text-emerald-600' : previewOrder.status === 'in_progress' ? 'text-blue-600' : 'text-orange-600'}`}>
                        {previewOrder.status?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setPreviewOrder(null)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-all active:scale-90"
                  >
                    <FaTimesCircle className="w-6 h-6 text-slate-300 hover:text-slate-400" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8">
                  {previewOrder.loading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4">
                      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Fetching details...</p>
                    </div>
                  ) : (
                    <div className="bg-white shadow-lg rounded-xl overflow-hidden min-h-min mx-auto" style={{ width: '210mm', maxWidth: '100%' }}>
                      <div
                        className="origin-top"
                        style={{ transform: 'scale(0.95)', transformOrigin: 'top center' }}
                        dangerouslySetInnerHTML={{
                          __html: buildOrderPdfHtml(previewOrder, {
                            useEnglish: true,
                            formatDate,
                            showFinancials: true,
                            formatCurrency,
                          })
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                  <button
                    onClick={() => handleGenerateImage(previewOrder)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                  >
                    <FaFileImage /> Download Summary
                  </button>
                  <button
                    onClick={() => setPreviewOrder(null)}
                    className="px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  )
}
