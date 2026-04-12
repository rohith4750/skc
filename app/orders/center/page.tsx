"use client";
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { formatDateTime, formatDate, formatCurrency, sanitizeMealLabel, getOrderDate } from '@/lib/utils'
import { Order } from '@/types'
import {
  FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaFilePdf, FaFileImage,
  FaEnvelope, FaChartLine, FaCheckCircle, FaClock, FaTimesCircle,
  FaLayerGroup, FaCalendarAlt, FaHistory, FaMapMarkerAlt, FaUsers,
  FaBars, FaTimes, FaUtensils, FaChevronLeft, FaChevronRight
} from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import toast from 'react-hot-toast'
import ConfirmModal from '@/components/ConfirmModal'
import MergeOrdersModal from '@/components/MergeOrdersModal'
import { getRequest, postRequest, putRequest, deleteRequest } from '@/lib/api/api'
import { apiUrl } from '@/lib/api/apiUrl'
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
  const [filterDate, setFilterDate] = useState<string>('')
  const [mealTypeFilter, setMealTypeFilter] = useState<string>('all')
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
      const allOrders = await getRequest({ 
        url: `${apiUrl.GET_getAllOrders}?t=${Date.now()}` 
      }) as Order[]
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
      // Default view for Order Hub is pending/in_progress but EXCLUDING quotations
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

      if (filterDate) {
        const y = orderDate.getFullYear()
        const m = String(orderDate.getMonth() + 1).padStart(2, '0')
        const d = String(orderDate.getDate()).padStart(2, '0')
        return `${y}-${m}-${d}` === filterDate
      }

      const monthMatch = selectedMonth === 0 || (orderDate.getMonth() + 1) === selectedMonth
      const yearMatch = selectedYear === 0 || orderDate.getFullYear() === selectedYear
      return monthMatch && yearMatch
    })

    // Meal type filter
    if (mealTypeFilter !== 'all') {
      filtered = filtered.filter(order => {
        const mealTypeAmounts = order.mealTypeAmounts as Record<string, any> | null
        if (!mealTypeAmounts) return false
        return Object.values(mealTypeAmounts).some(data => {
          const menuType = typeof data === 'object' && data !== null ? data.menuType : null
          return menuType?.toLowerCase() === mealTypeFilter.toLowerCase()
        })
      })
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [orders, statusFilter, customerSearch, selectedMonth, selectedYear, mealTypeFilter, filterDate])

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
      await deleteRequest({ url: apiUrl.DEL_deleteOrder(deleteConfirm.id) })

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
      const responseData = await putRequest({
        url: apiUrl.PUT_updateOrder(orderId),
        data: { status: newStatus }
      })
      
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o))
      await loadData()

      if (newStatus === 'in_progress' || newStatus === 'completed') {
        toast.success(`Order status updated to ${newStatus}. Bill synchronization active.`)
      } else {
        toast.success('Order status updated successfully!')
      }
    } catch (error: any) {
      console.error('Failed to update status:', error)
      toast.error(error.message || 'Failed to update order status.')
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

  const confirmSeparation = async () => {
    const { orderId, sessionKey, date } = separationConfirm
    if (!orderId) return

    try {
      const endpoint = sessionKey ? apiUrl.POST_discardOrderSession : apiUrl.POST_discardOrderDate
      const body = sessionKey ? { orderId, sessionKey } : { orderId, date }

      await postRequest({
        url: endpoint,
        data: body
      })

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
      await postRequest({
        url: apiUrl.POST_mergeOrders,
        data: { primaryOrderId, secondaryOrderIds }
      })

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
        .header-top { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 10px; color: #555; }
        .header-main { font-size: 32px; font-weight: 700; margin: 15px 0 8px 0; letter-spacing: 2px; color: #1a1a1a; }
        .header-subtitle { font-size: 14px; color: #666; margin-bottom: 12px; font-style: italic; }
        .header-details { font-size: 9px; line-height: 1.6; color: #444; margin-top: 10px; }
        .section { margin-bottom: 15px; }
        .section-title { font-size: 14px; font-weight: 600; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 2px solid #ddd; color: #222; }
        .info-row { margin-bottom: 6px; }
        .info-label { font-weight: 600; display: inline-block; width: 120px; }
        .menu-item { padding: 2px 4px; font-size: 9px; line-height: 1.3; font-weight: 600; }
      </style>
      
      <div class="header">
        <div class="header-top">
          <div>Telidevara Rajendraprasad</div>
          <div>ART FOOD ZONE (A Food Caterers)</div>
        </div>
        <div style="display: flex; align-items: center; justify-content: center; gap: 20px;">
          <img src="${window.location.origin}/images/logo.jpg" alt="SKC Logo" style="width: 80px; height: 80px; object-fit: contain; border-radius: 50%;" />
          <div>
            <div class="header-main">SRIVATSASA & KOWNDINYA CATERERS</div>
            <div class="header-subtitle">(Pure Vegetarian)</div>
          </div>
        </div>
        <div class="header-details">
          <div>Regd. No: 2361930100031 | Plot No. 115, Padmavathi Nagar, Bank Colony, Saheb Nag Vanathalipuram, Hyderabad</div>
          <div>Email: pujyasri1989cya@gmail.com, Cell: 9866525102, 9963691393, 9390015302</div>
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
        <div class="section">
          <div class="section-title">Customer Details</div>
          <div class="info-row"><span class="info-label">Name:</span> ${customer?.name || 'N/A'}</div>
          <div class="info-row"><span class="info-label">Phone:</span> ${customer?.phone || 'N/A'}</div>
          <div class="info-row"><span class="info-label">Address:</span> ${customer?.address || 'N/A'}</div>
        </div>
        <div class="section">
          <div class="section-title">Order Information</div>
          <div class="info-row"><span class="info-label">Event Date:</span> ${eventDateDisplay}</div>
          <div class="info-row"><span class="info-label">Order ID:</span> SKC-ORDER-${(order as any).serialNumber || order.id.slice(0, 8).toUpperCase()}</div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Menu Items</div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; font-size: 9px;">
    `

    const resolveMenuType = (sessionKey: string, sessionData: any, item?: any): string => {
      if (sessionData?.menuType) return sessionData.menuType
      if (sessionKey && sessionKey.startsWith('session_')) return sessionKey.split('_')[1]
      return 'OTHER'
    }

    type SessionGroup = { menuType: string; members?: number; items: any[] }
    const byDate: Record<string, SessionGroup[]> = {}

    order.items.forEach((item: any) => {
      const sessionKey = item.mealType || ''
      const sessionData = mealTypeAmounts ? (mealTypeAmounts[sessionKey] as any) : null
      const menuType = resolveMenuType(sessionKey, sessionData, item)
      const dateKey = sessionData?.date ? String(sessionData.date).split('T')[0] : eventDateDisplay
      
      if (!byDate[dateKey]) byDate[dateKey] = []
      let session = byDate[dateKey].find((s: any) => s.menuType === menuType)
      if (!session) {
        session = { menuType, members: sessionData?.numberOfMembers, items: [] }
        byDate[dateKey].push(session)
      }
      session.items.push(item)
    })

    Object.keys(byDate).sort().forEach(dateKey => {
      htmlContent += `<div style="grid-column: span 4; font-weight: 700; margin-top: 10px; border-bottom: 1px solid #ddd;">📅 ${formatDate(dateKey)}</div>`
      byDate[dateKey].forEach(session => {
        htmlContent += `<div style="grid-column: span 4; font-weight: 700; margin-top: 5px; color: #f97316;">${sanitizeMealLabel(session.menuType)} ${session.members ? `(${session.members} Members)` : ''}</div>`
        session.items.forEach((item, idx) => {
          const itemName = useEnglish ? (item.menuItem?.name || item.menuItem?.nameTelugu) : (item.menuItem?.nameTelugu || item.menuItem?.name)
          htmlContent += `<div class="menu-item">${idx + 1}. ${itemName}${item.customization ? ` (${item.customization})` : ''}</div>`
        })
      })
    })

    htmlContent += `</div></div> <div style="margin-top: 30px; text-align: center;"><img src="${window.location.origin}/images/stamp.png" style="width: 250px;" alt="Stamp" /></div>`
    return htmlContent
  }

  const renderOrderToPdf = async (order: any, language: 'english' | 'telugu'): Promise<string | null> => {
    const htmlContent = generateMenuHtml(order, language)
    const tempDiv = document.createElement('div')
    tempDiv.style.width = '210mm'; tempDiv.style.padding = '15mm'; tempDiv.style.background = 'white';
    tempDiv.innerHTML = htmlContent; document.body.appendChild(tempDiv)
    const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true })
    document.body.removeChild(tempDiv)
    const imgData = canvas.toDataURL('image/jpeg', 0.8)
    const pdf = new jsPDF('p', 'mm', 'a4')
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, (canvas.height * 210) / canvas.width)
    return pdf.output('datauristring').split(',')[1]
  }

  const renderOrderToImage = async (order: any, language: 'english' | 'telugu', showFinancials = false): Promise<string | null> => {
    const htmlContent = generateMenuHtml(order, language)
    const tempDiv = document.createElement('div')
    tempDiv.style.width = '210mm'; tempDiv.style.padding = '15mm'; tempDiv.style.background = 'white';
    tempDiv.innerHTML = htmlContent; document.body.appendChild(tempDiv)
    const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true })
    document.body.removeChild(tempDiv)
    return canvas.toDataURL('image/png')
  }

  const handleGeneratePDF = async (order: any, language: 'english' | 'telugu') => {
    const pdfBase64 = await renderOrderToPdf(order, language)
    if (!pdfBase64) return
    const a = document.createElement('a')
    a.href = `data:application/pdf;base64,${pdfBase64}`
    a.download = `SKC-ORDER-${(order as any).serialNumber || order.id.slice(0, 8)}.pdf`
    a.click()
  }

  const handleGenerateImage = async (order: any, language: 'english' | 'telugu' = 'english') => {
    const imageDataUrl = await renderOrderToImage(order, language)
    if (!imageDataUrl) return
    const a = document.createElement('a')
    a.href = imageDataUrl
    a.download = `SKC-ORDER-${(order as any).serialNumber || order.id.slice(0, 8)}.png`
    a.click()
  }

  const handleSendOrderEmail = async (order: any, language: 'english' | 'telugu') => {
    const customerEmail = order.customer?.email
    if (!customerEmail) return
    setEmailSending(true)
    try {
      const pdfBase64 = await renderOrderToPdf(order, language)
      await postRequest({ url: apiUrl.POST_sendOrderEmail(order.id), data: { email: customerEmail, pdfBase64 } })
      toast.success(`Sent to ${customerEmail}`)
      setEmailModal({ isOpen: false, order: null })
    } catch { toast.error('Email failed') } finally { setEmailSending(false) }
  }

  const handleOpenPreview = async (order: any) => {
    setPreviewOrder({ ...order, loading: true })
    const freshOrder = await getRequest({ url: apiUrl.GET_getOrderById(order.id) }).catch(() => order)
    setPreviewOrder(freshOrder)
  }

  return (
    <div className="p-4 md:p-8 bg-[#fafafa] min-h-screen pt-20">
      <div className="max-w-[1600px] mx-auto">
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <div className="w-2 h-10 bg-primary-600 rounded-full" />
              Intelligence Hub
            </h1>
            <p className="text-gray-500 mt-2 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
              <FaLayerGroup className="text-primary-500" /> Active Operational Pipeline
            </p>
          </motion.div>
          <div className="flex gap-3">
            <button onClick={() => setShowFilters(!showFilters)} className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${showFilters ? 'bg-primary-600 text-white shadow-lg' : 'bg-white border text-gray-500'}`}>
              <FaFilter className="inline mr-2" /> Filter Workspace
            </button>
            <Link href="/orders/create" className="v2-button bg-gray-900 text-white px-8 py-3 flex items-center gap-2 shadow-xl text-xs font-black uppercase tracking-widest">
              <FaPlus /> Initialize Order
            </Link>
          </div>
        </header>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-10 overflow-hidden">
               <div className="v2-card p-8 bg-white grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase">Search</label>
                    <input type="text" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} className="v2-input h-10 text-xs" placeholder="Customer..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase">Status</label>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="v2-input h-10 text-xs uppercase">
                      <option value="all">ALL</option>
                      <option value="pending">PENDING</option>
                      <option value="in_progress">LIVE</option>
                      <option value="completed">CLOSED</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase">Target Date</label>
                    <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="v2-input h-10 text-xs" />
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          {paginatedOrders.length === 0 ? (
            <div className="v2-card p-20 text-center opacity-40 uppercase font-black text-xs tracking-[0.2em]">No operations found</div>
          ) : (
            <>
              {paginatedOrders.map((order, idx) => (
                <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="v2-card p-6 flex items-center gap-8 relative overflow-hidden group">
                  <div className={`absolute left-0 inset-y-0 w-1 ${order.status === 'completed' ? 'bg-emerald-500' : order.status === 'in_progress' ? 'bg-blue-500' : 'bg-orange-500'}`} />
                  <div className="flex-shrink-0"><input type="checkbox" checked={selectedOrderIds.includes(order.id)} onChange={() => toggleOrderSelection(order.id)} className="w-5 h-5 rounded border-2 border-gray-100" /></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-900 uppercase tracking-tight truncate">{order.customer?.name || 'Walk-in'}</h3>
                    <p className="text-primary-600 text-[10px] font-black uppercase mt-1">{(order as any).eventName || 'Private Occasion'}</p>
                  </div>
                  <div className="flex-shrink-0 w-40">
                    <select value={order.status} onChange={e => handleStatusChange(order.id, e.target.value)} className={`w-full py-2 px-3 rounded-lg text-[10px] font-black border-2 outline-none uppercase ${order.status === 'completed' ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : 'border-orange-100 bg-orange-50 text-orange-600'}`}>
                      <option value="pending">PENDING</option>
                      <option value="in_progress">LIVE</option>
                      <option value="completed">CLOSED</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenPreview(order)} className="v2-btn-icon bg-gray-50 text-blue-500"><FaSearch size={12} /></button>
                    <Link href={`/orders/edit/${order.id}`} className="v2-btn-icon bg-gray-50 text-amber-500"><FaEdit size={12} /></Link>
                    <button onClick={() => setPdfLanguageModal({ isOpen: true, order })} className="v2-btn-icon bg-gray-50 text-gray-500"><FaFilePdf size={12} /></button>
                    <button onClick={() => handleDelete(order.id)} className="v2-btn-icon bg-gray-50 text-red-500"><FaTrash size={12} /></button>
                  </div>
                </motion.div>
              ))}

              <footer className="mt-8 flex justify-between items-center py-6 border-t border-slate-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Volume: {filteredOrders.length}</p>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-10 h-10 border rounded-xl flex items-center justify-center disabled:opacity-30"><FaChevronLeft size={10} /></button>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-10 h-10 border rounded-xl flex items-center justify-center disabled:opacity-30"><FaChevronRight size={10} /></button>
                </div>
              </footer>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {previewOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewOrder(null)} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                <h2 className="font-black text-xl uppercase tracking-tighter">Operational Analytics</h2>
                <button onClick={() => setPreviewOrder(null)}><FaTimes size={20} className="text-gray-300 hover:text-gray-900" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8">
                 {previewOrder.loading ? <div className="animate-pulse text-center uppercase font-black text-xs py-20">Computing...</div> : 
                   <div className="v2-card p-10 shadow-2xl scale-95 origin-top" dangerouslySetInnerHTML={{ __html: buildOrderPdfHtml(previewOrder, { useEnglish: true, formatDate, showFinancials: true, formatCurrency }) }} />
                 }
              </div>
              <div className="p-6 border-t flex gap-4">
                <button onClick={() => handleGenerateImage(previewOrder)} className="flex-1 v2-button bg-primary-600 text-white py-4 flex items-center justify-center gap-2"><FaFileImage /> Download Matrix</button>
                <button onClick={() => setPreviewOrder(null)} className="px-8 border rounded-2xl font-black uppercase text-[10px]">Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal isOpen={deleteConfirm.isOpen} title="Terminate Operation" message="Irreversible data destruction. Proceed?" confirmText="Confirm" onConfirm={confirmDelete} onCancel={() => setDeleteConfirm({ isOpen: false, id: null })} variant="danger" />
      <ConfirmModal isOpen={pdfLanguageModal.isOpen} title="Export Language" message="Select target dialect for documentation." confirmText="English" onConfirm={() => handleGeneratePDF(pdfLanguageModal.order, 'english')} onCancel={() => setPdfLanguageModal({ isOpen: false, order: null })} variant="info" />
    </div>
  )
}
