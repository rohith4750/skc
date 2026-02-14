'use client'

import { useEffect, useState, useMemo } from 'react'
import { formatDateTime, formatDate } from '@/lib/utils'
import { Order } from '@/types'
import { FaTrash, FaFilePdf, FaImage, FaChevronLeft, FaChevronRight, FaEdit, FaFilter, FaChartLine, FaClock, FaCheckCircle, FaTimesCircle, FaEnvelope, FaPrint } from 'react-icons/fa'
import Link from 'next/link'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import toast from 'react-hot-toast'
import ConfirmModal from '@/components/ConfirmModal'
import { generatePDFTemplate } from '@/lib/pdf-template'

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
  const [imageLanguageModal, setImageLanguageModal] = useState<{ isOpen: boolean; order: any | null }>({
    isOpen: false,
    order: null,
  })
  const [emailModal, setEmailModal] = useState<{ isOpen: boolean; order: any | null }>({
    isOpen: false,
    order: null,
  })
  const [emailSending, setEmailSending] = useState(false)
  const [docModal, setDocModal] = useState<{ isOpen: boolean; order: any | null; type: 'menu-pdf' | 'menu-image' | 'bill-pdf' | 'bill-image'; language?: 'english' | 'telugu' }>({
    isOpen: false,
    order: null,
    type: 'menu-pdf'
  })
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])
  const [mergeModal, setMergeModal] = useState<{ isOpen: boolean; primaryId: string | null; loading: boolean }>({
    isOpen: false,
    primaryId: null,
    loading: false
  })

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

  const handleMergeOrders = async () => {
    if (!mergeModal.primaryId) {
      toast.error('Please select a primary order');
      return;
    }

    setMergeModal(prev => ({ ...prev, loading: true }));
    try {
      const secondaryOrderIds = selectedOrderIds.filter(id => id !== mergeModal.primaryId);

      const response = await fetch('/api/orders/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryOrderId: mergeModal.primaryId,
          secondaryOrderIds
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to merge orders');
      }

      toast.success('Orders merged successfully!');
      setMergeModal({ isOpen: false, primaryId: null, loading: false });
      setSelectedOrderIds([]);
      loadData();
    } catch (error: any) {
      console.error('Merge error:', error);
      toast.error(error.message || 'Error merging orders');
      setMergeModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDownloadBill = async (order: any, options: { splitByDate?: boolean; type: 'pdf' | 'image' }) => {
    // We need to fetch the bill for this order first
    try {
      const response = await fetch(`/api/bills/order/${order.id}`)
      if (!response.ok) throw new Error('Bill not found for this order')
      const bill = await response.json()

      // Build PDF Data (Similar to Bills page)
      const mealTypeAmounts = order.mealTypeAmounts || {}
      const stalls = order.stalls || []
      const transportCost = parseFloat(order.transportCost || '0') || 0
      const waterBottlesCost = parseFloat(order.waterBottlesCost || '0') || 0

      const pdfData = {
        type: 'bill' as const,
        billNumber: bill.serialNumber || bill.id.slice(0, 8).toUpperCase(),
        date: bill.createdAt,
        customer: { name: order.customer?.name, phone: order.customer?.phone, email: order.customer?.email, address: order.customer?.address },
        eventDetails: { eventName: order.eventName || '', functionDate: formatDate(order.createdAt), functionTime: '', functionVenue: '' },
        mealTypeAmounts: mealTypeAmounts,
        stalls: stalls,
        financial: {
          transport: transportCost,
          waterBottlesCost: waterBottlesCost,
          extra: stalls.reduce((sum: number, s: any) => sum + (parseFloat(s.cost) || 0), 0),
          totalAmount: bill.totalAmount,
          advancePaid: bill.advancePaid,
          balanceAmount: bill.remainingAmount,
          paidAmount: bill.paidAmount
        },
        status: bill.status,
        options
      }

      const htmlContent = generatePDFTemplate(pdfData)
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.width = '210mm'
      tempDiv.style.padding = '0'
      tempDiv.style.background = 'white'
      tempDiv.style.color = '#000'
      tempDiv.innerHTML = htmlContent
      document.body.appendChild(tempDiv)

      const canvas = await html2canvas(tempDiv, { scale: 1.5, useCORS: true, logging: false, backgroundColor: '#ffffff', width: tempDiv.scrollWidth, height: tempDiv.scrollHeight })
      document.body.removeChild(tempDiv)

      if (options.type === 'pdf') {
        const imgData = canvas.toDataURL('image/jpeg', 0.85)
        const pdf = new jsPDF('p', 'mm', 'a4')
        const imgWidth = 210
        const pageHeight = 297
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
        pdf.save(`SKC-Bill-${pdfData.billNumber}${options.splitByDate ? '-Separate' : ''}.pdf`)
      } else {
        const imgData = canvas.toDataURL('image/jpeg', 0.9)
        const link = document.createElement('a')
        link.href = imgData
        link.download = `SKC-Bill-${pdfData.billNumber}${options.splitByDate ? '-Separate' : ''}.jpg`
        link.click()
      }

      toast.success('Bill downloaded successfully!')
      setDocModal({ isOpen: false, order: null, type: 'bill-pdf' })
    } catch (error: any) {
      console.error('Error downloading bill:', error)
      toast.error(error.message || 'Failed to download bill')
    }
  }

  const checkAndOpenDocModal = (order: any, type: 'menu-pdf' | 'menu-image' | 'bill-pdf' | 'bill-image', language?: 'english' | 'telugu') => {
    const mealTypeAmounts = order.mealTypeAmounts || {}
    const dates = new Set()
    Object.values(mealTypeAmounts).forEach((d: any) => {
      if (d && typeof d === 'object' && d.date) dates.add(d.date)
    })

    if (dates.size > 1) {
      setDocModal({ isOpen: true, order, type, language })
    } else {
      if (type === 'menu-pdf') handleGeneratePDF(order, language || 'english')
      else if (type === 'menu-image') handleGenerateImage(order, language || 'english')
      else if (type === 'bill-pdf') handleDownloadBill(order, { splitByDate: false, type: 'pdf' })
      else if (type === 'bill-image') handleDownloadBill(order, { splitByDate: false, type: 'image' })
    }
  }

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

  const confirmStatusChange = async () => {
    if (!statusConfirm.id || !statusConfirm.newStatus) return

    await handleStatusChange(statusConfirm.id, statusConfirm.newStatus)
    setStatusConfirm({ isOpen: false, id: null, newStatus: '', oldStatus: '' })
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
    tempDiv.style.width = '215.9mm' // Legal width (8.5 inches)
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
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; font-size: 14px;">
    `

    const priorityOrder = ['breakfast', 'tiffins', 'lunch', 'snacks', 'dinner', 'supper'];

    // Group items by session (using the ID stored in item.mealType)
    const itemsBySession: Record<string, any[]> = {}
    order.items.forEach((item: any) => {
      const sessionKey = item.mealType || 'Legacy'
      if (!itemsBySession[sessionKey]) itemsBySession[sessionKey] = []
      itemsBySession[sessionKey].push(item)
    })

    // Group sessions by date
    const sessionsByDate: Record<string, any[]> = {}
    Object.keys(itemsBySession).forEach(sessionKey => {
      const sessionData = mealTypeAmounts?.[sessionKey] as any
      const sessionDate = (sessionData && typeof sessionData === 'object' && sessionData.date) ? sessionData.date : 'Other'
      if (!sessionsByDate[sessionDate]) sessionsByDate[sessionDate] = []
      sessionsByDate[sessionDate].push({ key: sessionKey, data: sessionData, items: itemsBySession[sessionKey] })
    })

    // Sort dates
    const sortedDates = Object.keys(sessionsByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

    sortedDates.forEach(date => {
      // Add date header if there's more than one date
      if (sortedDates.length > 1) {
        htmlContent += `
          <div style="grid-column: span 4; background: #f3f4f6; padding: 8px; font-weight: bold; font-size: 16px; margin-top: 15px; margin-bottom: 10px; border-radius: 4px; color: #111; font-family: 'Poppins', sans-serif; text-align: center;">
            Menu for ${formatDate(date)}
          </div>
        `
      }

      // Sort sessions within date by priority
      const sessions = sessionsByDate[date].sort((a, b) => {
        const typeA = (a.data?.menuType || a.key).toLowerCase()
        const typeB = (b.data?.menuType || b.key).toLowerCase()
        const indexA = priorityOrder.indexOf(typeA);
        const indexB = priorityOrder.indexOf(typeB);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return typeA.localeCompare(typeB);
      })

      sessions.forEach(session => {
        const menuType = session.data?.menuType || session.key
        const memberInfo = (session.data?.numberOfMembers) ? ` (${session.data.numberOfMembers} Members)` : ''

        htmlContent += `
          <div style="grid-column: span 4; font-weight: 700; font-size: 15px; margin-top: 12px; margin-bottom: 6px; color: #222; text-transform: uppercase; border-bottom: 2px solid #eee; padding-bottom: 4px; font-family: 'Poppins', sans-serif;">
            ${menuType}${memberInfo}
          </div>
        `

        session.items.forEach((item: any, index: number) => {
          const itemName = useEnglish
            ? (item.menuItem?.name || item.menuItem?.nameTelugu || 'Unknown Item')
            : (item.menuItem?.nameTelugu || item.menuItem?.name || 'Unknown Item')
          htmlContent += `
            <div style="padding: 4px; font-family: 'Poppins', sans-serif; line-height: 1.4; font-weight: 500; font-size: 14px;">
              ${index + 1}. ${itemName}${item.customization ? ` <span style="font-size: 12px; color: #666;">(${item.customization})</span>` : ''}
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

    tempDiv.innerHTML = htmlContent
    document.body.appendChild(tempDiv)

    try {
      // Convert HTML to canvas (scale 1.5 + JPEG to keep payload under 4.5MB limit)
      const canvas = await html2canvas(tempDiv, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      // Remove temporary element
      document.body.removeChild(tempDiv)

      // Create PDF from canvas (JPEG for smaller size - avoids 413 on email send)
      const imgData = canvas.toDataURL('image/jpeg', 0.85)
      const pdf = new jsPDF('p', 'mm', 'legal')
      const imgWidth = 215.9 // Legal width in mm
      const pageHeight = 355.6 // Legal height in mm (14 inches)
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

  const handleGenerateImage = async (order: any, language: 'english' | 'telugu') => {
    // Re-use logic to generate HTML but stop before PDF creation
    // We need to slightly modify renderOrderToPdf or extract common logic
    // For now, let's duplicate the core rendering part to avoid complex refactoring risks
    // ...actually, renderOrderToPdf returns base64 PDF. Let's create a specialized helper for image
    // But duplicating 150 lines is bad. Let's refactor slightly.

    // Actually, let's just copy the logic for now to ensure we don't break PDF generation
    // passed in buildOrderPdfHtml
    // Wait, buildOrderPdfHtml is not imported here? 
    // Ah, renderOrderToPdf has the HTML generation logic INLINE in this file! 
    // It should import from lib/order-pdf-html.ts? 
    // Let's check imports.
    // Line 9 imports html2canvas. 
    // Line 204: renderOrderToPdf starts.
    // It seems the logic is indeed inline here despite buildOrderPdfHtml existing in lib.
    // Wait, let me check if buildOrderPdfHtml is imported. No. 
    // But in app/bills/page.tsx it IS imported.
    // The user recently asked to change font size in lib/order-pdf-html.ts.
    // If this file (orders/history/page.tsx) uses INLINE logic, then the font size change I made earlier will NOT affect this!
    // I need to check if the user wanted to change font size here too.
    // The user request was "INCREASE THE FONT SIZE IN THE MENU PDF DOR MENU ITEMS".
    // If I only changed it in lib/order-pdf-html.ts and this file doesn't use it, then I missed part of the request.
    // BUT the current request is "ADD IMAGE DONWLOAD ASO ABOVETHEPDF IMAGE DOWNLOD WITH SAME TEMPLATE".
    // So I should first refactor this file to use the shared lib/order-pdf-html.ts if possible, or apply the same font size changes here.
    // However, refactoring might be risky.
    // Let's see if I can use the generateImage logic here.

    // Let's implement handleGenerateImage by copying the logic for now and adapting for Image download.
    // AND I should probably apply the font size change here too if I notice it's the same code.

    const customer = order.customer
    const supervisor = order.supervisor
    const useEnglish = language === 'english'

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

    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.width = '215.9mm' // Legal width (8.5 inches)
    tempDiv.style.padding = '15mm'
    tempDiv.style.fontFamily = 'Poppins, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
    tempDiv.style.fontSize = '11px'
    tempDiv.style.lineHeight = '1.6'
    tempDiv.style.background = 'white'
    tempDiv.style.color = '#333'

    // Note: Applying the font size increase here as well (10px -> 12px for headers, 9px -> 11px for items)
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
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; font-size: 14px;">
    `

    const priorityOrder = ['breakfast', 'tiffins', 'lunch', 'snacks', 'dinner', 'supper'];

    // Group items by session (using the ID stored in item.mealType)
    const itemsBySession: Record<string, any[]> = {}
    order.items.forEach((item: any) => {
      const sessionKey = item.mealType || 'Legacy'
      if (!itemsBySession[sessionKey]) itemsBySession[sessionKey] = []
      itemsBySession[sessionKey].push(item)
    })

    // Group sessions by date
    const sessionsByDate: Record<string, any[]> = {}
    Object.keys(itemsBySession).forEach(sessionKey => {
      const sessionData = mealTypeAmounts?.[sessionKey] as any
      const sessionDate = (sessionData && typeof sessionData === 'object' && sessionData.date) ? sessionData.date : 'Other'
      if (!sessionsByDate[sessionDate]) sessionsByDate[sessionDate] = []
      sessionsByDate[sessionDate].push({ key: sessionKey, data: sessionData, items: itemsBySession[sessionKey] })
    })

    // Sort dates
    const sortedDates = Object.keys(sessionsByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

    sortedDates.forEach(date => {
      // Add date header if there's more than one date
      if (sortedDates.length > 1) {
        htmlContent += `
          <div style="grid-column: span 4; background: #f3f4f6; padding: 10px; font-weight: bold; font-size: 18px; margin-top: 20px; margin-bottom: 12px; border-radius: 6px; color: #111; font-family: 'Poppins', sans-serif; text-align: center; border: 1px solid #e5e7eb;">
            Menu for ${formatDate(date)}
          </div>
        `
      }

      // Sort sessions within date by priority
      const sessions = sessionsByDate[date].sort((a, b) => {
        const typeA = (a.data?.menuType || a.key).toLowerCase()
        const typeB = (b.data?.menuType || b.key).toLowerCase()
        const indexA = priorityOrder.indexOf(typeA);
        const indexB = priorityOrder.indexOf(typeB);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return typeA.localeCompare(typeB);
      })

      sessions.forEach(session => {
        const menuType = session.data?.menuType || session.key
        const memberInfo = (session.data?.numberOfMembers) ? ` (${session.data.numberOfMembers} Members)` : ''

        htmlContent += `
          <div style="grid-column: span 4; font-weight: 700; font-size: 16px; margin-top: 15px; margin-bottom: 8px; color: #222; text-transform: uppercase; border-bottom: 2px solid #ddd; padding-bottom: 5px; font-family: 'Poppins', sans-serif;">
            ${menuType}${memberInfo}
          </div>
        `

        session.items.forEach((item: any, index: number) => {
          const itemName = useEnglish
            ? (item.menuItem?.name || item.menuItem?.nameTelugu || 'Unknown Item')
            : (item.menuItem?.nameTelugu || item.menuItem?.name || 'Unknown Item')
          htmlContent += `
            <div style="padding: 5px; font-family: 'Poppins', sans-serif; line-height: 1.5; font-weight: 500; font-size: 15px;">
              ${index + 1}. ${itemName}${item.customization ? ` <span style="font-size: 13px; color: #555;">(${item.customization})</span>` : ''}
            </div>
          `
        })
      })
    })

    htmlContent += `
        </div>
      </div>
    `

    if (order.stalls && Array.isArray(order.stalls) && order.stalls.length > 0) {
      htmlContent += `
        <div class="section">
          <div class="section-title">Stalls</div>
          <div style="font-size: 11px;">
      `
      order.stalls.forEach((stall: any, idx: number) => {
        htmlContent += `<div class="menu-item" style="font-size: 11px;">${idx + 1}. ${stall.category}${stall.description ? ` - ${stall.description}` : ''}</div>`
      })
      htmlContent += `
          </div>
        </div>
      `
    }

    tempDiv.innerHTML = htmlContent
    document.body.appendChild(tempDiv)

    try {
      const canvas = await html2canvas(tempDiv, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })
      document.body.removeChild(tempDiv)

      // Download Image
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/jpeg', 0.9)
      link.download = `order-SKC-ORDER-${(order as any).serialNumber || order.id.slice(0, 8)}.jpg`
      link.click()

      toast.success(`Image downloaded (${language === 'english' ? 'English' : 'Telugu'})`)
    } catch (error) {
      tempDiv.parentNode?.removeChild(tempDiv)
      console.error('Error generating Image:', error)
      toast.error('Failed to generate Image. Please try again.')
    }
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
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.length === paginatedOrders.length && paginatedOrders.length > 0}
                      onChange={() => {
                        if (selectedOrderIds.length === paginatedOrders.length) {
                          setSelectedOrderIds([])
                        } else {
                          setSelectedOrderIds(paginatedOrders.map((o: any) => o.id))
                        }
                      }}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                  </th>
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
                  const mealTypeAmounts = order.mealTypeAmounts as Record<string, any> | null
                  const eventDates: Array<{ label: string; date: string; key: string }> = []
                  if (mealTypeAmounts) {
                    Object.entries(mealTypeAmounts).forEach(([key, data]) => {
                      if (typeof data === 'object' && data !== null && data.date) {
                        eventDates.push({
                          label: data.menuType || key,
                          date: data.date,
                          key
                        })
                      }
                    })
                  }

                  return (
                    <tr key={order.id} className={`hover:bg-gray-50 ${selectedOrderIds.includes(order.id) ? 'bg-primary-50/50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.includes(order.id)}
                          onChange={() => {
                            setSelectedOrderIds(prev =>
                              prev.includes(order.id) ? prev.filter(i => i !== order.id) : [...prev, order.id]
                            )
                          }}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {(order as any).numberOfMembers || <span className="text-gray-400">-</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 space-y-1.5">
                          {eventDates.length > 0 ? (
                            eventDates.map(({ label, date, key }) => (
                              <div key={key} className="flex items-center justify-between gap-4 min-w-[200px]">
                                <span className="capitalize text-sm font-semibold text-gray-700">{label}:</span>
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
                            onClick={() => checkAndOpenDocModal(order, 'menu-pdf')}
                            className="text-secondary-500 hover:text-secondary-700 p-2 hover:bg-secondary-50 rounded"
                            title="Download Menu PDF"
                          >
                            <FaFilePdf />
                          </button>
                          <button
                            onClick={() => checkAndOpenDocModal(order, 'menu-image')}
                            className="text-purple-600 hover:text-purple-800 p-2 hover:bg-purple-50 rounded"
                            title="Download Menu Image"
                          >
                            <FaImage />
                          </button>
                          {(order.status === 'in_progress' || order.status === 'completed') && (
                            <button
                              onClick={() => checkAndOpenDocModal(order, 'bill-pdf')}
                              className="text-primary-600 hover:text-primary-900 p-2 hover:bg-primary-50 rounded"
                              title="Download Financial Bill"
                            >
                              <FaPrint />
                            </button>
                          )}
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
                తెలుగు (Telugu)
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

      {/* Image Language Selection Modal */}
      {imageLanguageModal.isOpen && imageLanguageModal.order && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Download Order Image</h3>
            <p className="text-sm text-gray-600 mb-4">Do you want the menu items in English or Telugu?</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  handleGenerateImage(imageLanguageModal.order, 'english')
                  setImageLanguageModal({ isOpen: false, order: null })
                }}
                className="flex-1 px-4 py-2.5 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors"
              >
                English
              </button>
              <button
                onClick={() => {
                  handleGenerateImage(imageLanguageModal.order, 'telugu')
                  setImageLanguageModal({ isOpen: false, order: null })
                }}
                className="flex-1 px-4 py-2.5 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors"
              >
                తెలుగు (Telugu)
              </button>
            </div>
            <button
              onClick={() => setImageLanguageModal({ isOpen: false, order: null })}
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
                {emailSending ? 'Sending...' : 'తెలుగు'}
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
      {/* Group/Separate Doc Choice Modal */}
      {docModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Multiple Dates Detected</h3>
            <p className="text-gray-600 mb-6">How would you like to generate this document? This order spans multiple event dates.</p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                onClick={() => {
                  if (docModal.type === 'menu-pdf') setPdfLanguageModal({ isOpen: true, order: docModal.order })
                  else if (docModal.type === 'menu-image') setImageLanguageModal({ isOpen: true, order: docModal.order })
                  else if (docModal.type === 'bill-pdf') handleDownloadBill(docModal.order, { splitByDate: false, type: 'pdf' })
                  else if (docModal.type === 'bill-image') handleDownloadBill(docModal.order, { splitByDate: false, type: 'image' })
                  setDocModal({ ...docModal, isOpen: false })
                }}
                className="flex flex-col items-center justify-center p-4 border-2 border-primary-100 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all group"
              >
                <span className="text-primary-600 font-bold mb-1">Grouped</span>
                <span className="text-xs text-gray-500 group-hover:text-primary-600">All dates consolidated</span>
              </button>

              <button
                onClick={() => {
                  if (docModal.type === 'menu-pdf') setPdfLanguageModal({ isOpen: true, order: docModal.order })
                  else if (docModal.type === 'menu-image') setImageLanguageModal({ isOpen: true, order: docModal.order })
                  else if (docModal.type === 'bill-pdf') handleDownloadBill(docModal.order, { splitByDate: true, type: 'pdf' })
                  else if (docModal.type === 'bill-image') handleDownloadBill(docModal.order, { splitByDate: true, type: 'image' })
                  setDocModal({ ...docModal, isOpen: false })
                }}
                className="flex flex-col items-center justify-center p-4 border-2 border-purple-100 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group"
              >
                <span className="text-purple-600 font-bold mb-1">Separate</span>
                <span className="text-xs text-gray-500 group-hover:text-purple-600">Each date starts new page</span>
              </button>
            </div>

            <button
              onClick={() => setDocModal({ isOpen: false, order: null, type: 'menu-pdf' })}
              className="mt-6 w-full py-2 text-gray-500 hover:text-gray-700 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Merge Orders Modal */}
      {mergeModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Merge {selectedOrderIds.length} Orders</h3>

            <div className="space-y-4 mb-6">
              <p className="text-sm text-gray-600 bg-amber-50 border border-amber-100 p-3 rounded-lg">
                <strong>Attention:</strong> This will combine all dates, sessions, and payments into one record. This action is Permanent.
              </p>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Primary Order (Destination)</label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2 bg-gray-50">
                  {orders.filter(o => selectedOrderIds.includes(o.id)).map(o => (
                    <label key={o.id} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${mergeModal.primaryId === o.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:border-primary-200'}`}>
                      <input
                        type="radio"
                        name="primaryOrder"
                        checked={mergeModal.primaryId === o.id}
                        onChange={() => setMergeModal(prev => ({ ...prev, primaryId: o.id }))}
                        className="w-4 h-4 text-primary-600"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-black text-gray-900">#{o.serialNumber} - {o.customer?.name}</div>
                        <div className="text-xs text-gray-500">{o.eventName} • {formatDate(o.createdAt)}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setMergeModal({ isOpen: false, primaryId: null, loading: false })}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all"
                disabled={mergeModal.loading}
              >
                Cancel
              </button>
              <button
                onClick={handleMergeOrders}
                disabled={!mergeModal.primaryId || mergeModal.loading}
                className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {mergeModal.loading ? 'Merging...' : 'Confirm Merge'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Bar */}
      {selectedOrderIds.length >= 2 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-2xl border border-primary-100 px-6 py-4 flex items-center gap-6 z-40 animate-in slide-in-from-bottom-8 duration-300">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-500 uppercase">Selection</span>
            <span className="text-sm font-black text-primary-600">{selectedOrderIds.length} Orders</span>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <button
            onClick={() => setMergeModal({ isOpen: true, primaryId: null, loading: false })}
            className="bg-primary-600 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all flex items-center gap-2 active:scale-95"
          >
            Merge Selection
          </button>
          <button
            onClick={() => setSelectedOrderIds([])}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}
