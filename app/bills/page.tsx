'use client'

import { useEffect, useState, useMemo } from 'react'
import { formatCurrency, formatDateTime, formatDate, sendWhatsAppMessage } from '@/lib/utils'
import { Bill, Order, Customer } from '@/types'
import { FaPrint, FaCheck, FaEdit, FaFilter, FaChartLine, FaWallet, FaPercent, FaCalendarAlt, FaEnvelope, FaWhatsapp, FaFileImage, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { fetchWithLoader } from '@/lib/fetch-with-loader'
import Table from '@/components/Table'
import { getBillTableConfig } from '@/components/table-configs'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { generatePDFTemplate, PDFTemplateData } from '@/lib/pdf-template'
import { buildOrderPdfHtml } from '@/lib/order-pdf-html'

export default function BillsPage() {
  const [bills, setBills] = useState<Array<Bill & { order?: Order & { customer?: Customer } }>>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [customerSearch, setCustomerSearch] = useState<string>('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const loadBills = async (showToast = false) => {
    try {
      const timestamp = new Date().getTime()
      const response = await fetchWithLoader(`/api/bills?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      })
      if (!response.ok) throw new Error('Failed to fetch bills')
      const allBills = await response.json()

      // Deduplicate bills by orderId (safety check - should not be needed due to unique constraint)
      const uniqueBillsMap = new Map<string, any>()
      allBills.forEach((bill: any) => {
        if (bill.orderId) {
          const existing = uniqueBillsMap.get(bill.orderId)
          if (!existing || new Date(bill.createdAt) > new Date(existing.createdAt)) {
            uniqueBillsMap.set(bill.orderId, bill)
          }
        } else {
          // If no orderId, keep it by id (shouldn't happen, but safety)
          uniqueBillsMap.set(bill.id, bill)
        }
      })

      const uniqueBills = Array.from(uniqueBillsMap.values())

      console.log(`[Bills Page] Received ${allBills.length} bills from API, Unique by orderId: ${uniqueBills.length}`)
      if (allBills.length !== uniqueBills.length) {
        console.warn(`[Bills Page] ΓÜá∩╕Å Found ${allBills.length - uniqueBills.length} duplicate bills!`)
        const orderIdCounts = new Map<string, number>()
        allBills.forEach((bill: any) => {
          if (bill.orderId) {
            orderIdCounts.set(bill.orderId, (orderIdCounts.get(bill.orderId) || 0) + 1)
          }
        })
        const duplicates = Array.from(orderIdCounts.entries()).filter(([_, count]) => count > 1)
        console.warn('[Bills Page] Duplicate orderIds:', duplicates)
      }

      setBills(uniqueBills)
      if (showToast) {
        toast.success('Bills refreshed')
      }
    } catch (error) {
      console.error('Failed to load bills:', error)
      toast.error('Failed to load bills. Please try again.')
    }
  }

  useEffect(() => {
    loadBills()
  }, [])

  // Refresh bills when page becomes visible (user navigates back to bills page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Bills Page] Page became visible, refreshing bills...')
        loadBills(false) // Don't show toast on auto-refresh
      }
    }

    const handleFocus = () => {
      console.log('[Bills Page] Window focused, refreshing bills...')
      loadBills(false) // Don't show toast on auto-refresh
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const handleMarkPaid = async (billId: string) => {
    const bill = bills.find((b: any) => b.id === billId)
    if (!bill) return

    try {
      const response = await fetchWithLoader(`/api/bills/${billId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paidAmount: bill.totalAmount,
          remainingAmount: 0,
          status: 'paid',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update bill')
      }

      const updatedBill = await response.json()

      // Update the specific bill in the list immediately with complete data
      setBills(prevBills =>
        prevBills.map((b: any) =>
          b.id === billId
            ? updatedBill  // Replace with complete updated bill (includes all relations)
            : b
        )
      )

      toast.success('Bill marked as paid successfully!')
    } catch (error: any) {
      console.error('Failed to update bill:', error)
      toast.error(error.message || 'Failed to update bill. Please try again.')
    }
  }

  const buildBillPdfData = (bill: any) => {
    const order = bill.order
    const customer = order?.customer
    const mealTypeAmounts = order?.mealTypeAmounts as Record<string, { amount: number; date: string; services?: string[]; numberOfMembers?: number } | number> | null
    const stalls = order?.stalls as Array<{ category: string; description: string; cost: number }> | null
    const transportCost = parseFloat(order?.transportCost || '0') || 0
    const waterBottlesCost = parseFloat((order as any)?.waterBottlesCost || '0') || 0

    let tiffinsData: { persons?: number; rate?: number } = {}
    let lunchDinnerData: { type?: string; persons?: number; rate?: number } = {}
    let snacksData: { persons?: number; rate?: number } = {}

    if (mealTypeAmounts) {
      Object.entries(mealTypeAmounts).forEach(([mealType, data]) => {
        const mealData = typeof data === 'object' && data !== null ? data : { amount: typeof data === 'number' ? data : 0 }
        const persons = (typeof mealData === 'object' && mealData !== null && 'numberOfMembers' in mealData) ? (mealData.numberOfMembers || 0) : 0
        const amount = typeof mealData === 'object' && mealData !== null && 'amount' in mealData ? mealData.amount : (typeof data === 'number' ? data : 0)
        const rate = persons > 0 ? amount / persons : 0
        if (mealType.toLowerCase().includes('tiffin') || mealType.toLowerCase().includes('breakfast')) tiffinsData = { persons, rate }
        else if (mealType.toLowerCase().includes('lunch') || mealType.toLowerCase().includes('dinner')) lunchDinnerData = { type: mealType.toLowerCase().includes('lunch') ? 'Lunch' : 'Dinner', persons, rate }
        else if (mealType.toLowerCase().includes('snack')) snacksData = { persons, rate }
      })
    }

    const extraAmount = stalls?.reduce((sum, stall) => sum + (parseFloat(stall.cost?.toString() || '0') || 0), 0) || 0
    let functionDate = ''
    let functionTime = ''
    if (mealTypeAmounts) {
      const firstDate = Object.values(mealTypeAmounts).find(d => typeof d === 'object' && d !== null && d.date) as { date?: string } | undefined
      if (firstDate?.date) {
        functionDate = formatDate(firstDate.date)
        const dateObj = new Date(firstDate.date)
        if (!isNaN(dateObj.getTime())) functionTime = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      }
    }

    return {
      pdfData: {
        type: 'bill' as const,
        billNumber: `${(bill as any).serialNumber || bill.id.slice(0, 8).toUpperCase()}`,
        date: bill.createdAt,
        customer: { name: customer?.name, phone: customer?.phone, email: customer?.email, address: customer?.address },
        eventDetails: { eventName: order?.eventName || '', functionDate, functionTime, functionVenue: '' },
        mealDetails: { tiffins: tiffinsData.persons ? tiffinsData : undefined, lunchDinner: lunchDinnerData.persons ? lunchDinnerData : undefined, snacks: snacksData.persons ? snacksData : undefined },
        mealTypeAmounts: mealTypeAmounts || undefined,
        stalls: stalls || undefined,
        discount: order?.discount,
        services: order?.services && Array.isArray(order.services) ? order.services : undefined,
        numberOfMembers: order?.numberOfMembers,
        financial: { transport: transportCost || undefined, waterBottlesCost: waterBottlesCost || undefined, extra: extraAmount > 0 ? extraAmount : undefined, totalAmount: bill.totalAmount, advancePaid: bill.advancePaid, balanceAmount: bill.remainingAmount, remainingAmount: bill.remainingAmount, paidAmount: bill.paidAmount, discount: order?.discount },
        status: bill.status,
        orderId: order?.id,
        supervisor: order?.supervisor?.name,
      },
    }
  }

  const renderBillToPdf = async (bill: any): Promise<string | null> => {
    const { pdfData } = buildBillPdfData(bill)
    const htmlContent = generatePDFTemplate(pdfData)

    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.width = '210mm'
    tempDiv.style.padding = '0'
    tempDiv.style.paddingBottom = '10mm'
    tempDiv.style.background = 'white'
    tempDiv.style.color = '#000'
    tempDiv.innerHTML = htmlContent
    document.body.appendChild(tempDiv)

    try {
      const canvas = await html2canvas(tempDiv, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: tempDiv.scrollWidth,
        height: tempDiv.scrollHeight + 10,
      })
      document.body.removeChild(tempDiv)

      const imgData = canvas.toDataURL('image/jpeg', 0.85)
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 6
      const imgWidth = pageWidth - margin * 2
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = margin

      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight)
      heightLeft -= pageHeight - margin * 2
      while (heightLeft > 0) {
        position = margin - (imgHeight - heightLeft)
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight)
        heightLeft -= pageHeight - margin * 2
      }

      const dataUrl = pdf.output('datauristring')
      return dataUrl ? dataUrl.split(',')[1] : null
    } catch {
      if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv)
      return null
    }
  }

  const renderBillToImage = async (bill: any): Promise<string | null> => {
    const { pdfData } = buildBillPdfData(bill)
    const htmlContent = generatePDFTemplate(pdfData)

    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.width = '210mm'
    tempDiv.style.padding = '0'
    tempDiv.style.paddingBottom = '10mm'
    tempDiv.style.background = 'white'
    tempDiv.style.color = '#000'
    tempDiv.innerHTML = htmlContent
    document.body.appendChild(tempDiv)

    try {
      const canvas = await html2canvas(tempDiv, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: tempDiv.scrollWidth,
        height: tempDiv.scrollHeight + 10,
      })
      document.body.removeChild(tempDiv)
      return canvas.toDataURL('image/png')
    } catch {
      if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv)
      return null
    }
  }

  const renderOrderToPdf = async (order: any, language: 'english' | 'telugu'): Promise<string | null> => {
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
    tempDiv.style.paddingBottom = '20mm'
    tempDiv.style.fontFamily = 'Poppins, sans-serif'
    tempDiv.style.fontSize = '11px'
    tempDiv.style.lineHeight = '1.6'
    tempDiv.style.background = 'white'
    tempDiv.style.color = '#333'
    tempDiv.innerHTML = htmlContent
    document.body.appendChild(tempDiv)
    try {
      const canvas = await html2canvas(tempDiv, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: tempDiv.scrollWidth,
        height: tempDiv.scrollHeight + 10,
      })
      document.body.removeChild(tempDiv)
      const imgData = canvas.toDataURL('image/jpeg', 0.85)
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 6
      const imgWidth = pageWidth - margin * 2
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = margin
      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight)
      heightLeft -= pageHeight - margin * 2
      while (heightLeft > 0) {
        position = margin - (imgHeight - heightLeft)
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight)
        heightLeft -= pageHeight - margin * 2
      }
      const dataUrl = pdf.output('datauristring')
      return dataUrl ? dataUrl.split(',')[1] : null
    } catch {
      if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv)
      return null
    }
  }

  const handleSendBillEmail = async (bill: any) => {
    const customerEmail = bill.order?.customer?.email
    if (!customerEmail) {
      toast.error('Customer email not available')
      return
    }

    try {
      const [pdfBase64, orderPdfBase64] = await Promise.all([
        renderBillToPdf(bill),
        renderOrderToPdf(bill.order, 'english'),
      ])
      const response = await fetchWithLoader(`/api/bills/${bill.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: customerEmail,
          pdfBase64: pdfBase64 || undefined,
          orderPdfBase64: orderPdfBase64 || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send bill email')
      }

      toast.success(`Bill PDF sent to ${customerEmail}`)
    } catch (error: any) {
      console.error('Failed to send bill email:', error)
      toast.error(error.message || 'Failed to send bill email')
    }
  }

  const handleSendBillWhatsApp = (bill: any) => {
    const customer = bill.order?.customer
    const customerPhone = customer?.phone
    if (!customerPhone) {
      toast.error('Customer phone number not available')
      return
    }
    const eventName = bill.order?.eventName || 'Catering Event'
    const total = formatCurrency(bill.totalAmount || 0)
    const paid = formatCurrency(bill.paidAmount || 0)
    const remaining = formatCurrency(bill.remainingAmount || 0)

    const message = [
      'srivatsasa and Koundinya Caterers',
      'Bill Summary',
      `Customer: ${customer?.name || 'Unknown'}`,
      `Event: ${eventName}`,
      `Total: ${total}`,
      `Paid: ${paid}`,
      `Remaining: ${remaining}`,
      `Bill ID: ${bill.id.slice(0, 8).toUpperCase()}`,
    ].join('\n')

    sendWhatsAppMessage(customerPhone, message)
  }

  const handleGeneratePDF = async (bill: any) => {
    const pdfBase64 = await renderBillToPdf(bill)
    if (!pdfBase64) {
      toast.error('Failed to generate PDF. Please try again.')
      return
    }
    const { pdfData } = buildBillPdfData(bill)
    const billNumber = pdfData.billNumber || bill.id.slice(0, 8)
    const byteChars = atob(pdfBase64)
    const byteNumbers = new Array(byteChars.length)
    for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i)
    const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `SKC-Bill-${billNumber}.pdf`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Bill PDF generated successfully!')
  }

  const handleGenerateImage = async (bill: any) => {
    const imageDataUrl = await renderBillToImage(bill)
    if (!imageDataUrl) {
      toast.error('Failed to generate image. Please try again.')
      return
    }
    const { pdfData } = buildBillPdfData(bill)
    const billNumber = pdfData.billNumber || bill.id.slice(0, 8)
    const a = document.createElement('a')
    a.href = imageDataUrl
    a.download = `SKC-Bill-${billNumber}.png`
    a.click()
    toast.success('Bill image downloaded!')
  }

  // Filter bills
  const filteredBills = useMemo(() => {
    let filtered = bills

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(bill => bill.status === statusFilter)
    }

    // Customer search filter
    if (customerSearch) {
      const searchLower = customerSearch.toLowerCase()
      filtered = filtered.filter(bill =>
        bill.order?.customer?.name?.toLowerCase().includes(searchLower) ||
        bill.order?.customer?.phone?.includes(customerSearch) ||
        bill.order?.customer?.email?.toLowerCase().includes(searchLower)
      )
    }

    // Date range filter
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(bill => {
        const mealTypeAmounts = bill.order?.mealTypeAmounts as Record<string, { date?: string } | number> | null
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
  }, [bills, statusFilter, customerSearch, dateRange])

  const billSummary = useMemo(() => {
    const totalBilled = filteredBills.reduce((sum, bill) => sum + (parseFloat(bill.totalAmount?.toString() || '0') || 0), 0)
    const totalCollected = filteredBills.reduce((sum, bill) => sum + (parseFloat(bill.paidAmount?.toString() || '0') || 0), 0)
    const totalPending = filteredBills.reduce((sum, bill) => sum + (parseFloat(bill.remainingAmount?.toString() || '0') || 0), 0)
    const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0
    const upcomingEvents = filteredBills.filter((bill) => {
      const mealTypeAmounts = bill.order?.mealTypeAmounts as
        | Record<string, { date?: string } | number>
        | null
        | undefined
      if (!mealTypeAmounts) return false
      const firstDate = Object.values(mealTypeAmounts).find(
        (value) => typeof value === 'object' && value !== null && value.date
      ) as { date?: string } | undefined
      if (!firstDate?.date) return false
      const eventDate = new Date(firstDate.date)
      const today = new Date()
      const diff = eventDate.getTime() - today.setHours(0, 0, 0, 0)
      return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000
    }).length

    return { totalBilled, totalCollected, totalPending, collectionRate, upcomingEvents }
  }, [filteredBills])

  const tableConfig = getBillTableConfig()

  // Pagination for mobile cards
  const totalPagesBills = Math.ceil(filteredBills.length / itemsPerPage) || 1
  const startIdx = (currentPage - 1) * itemsPerPage
  const endIdx = startIdx + itemsPerPage
  const paginatedBills = filteredBills.slice(startIdx, endIdx)

  const getBillEventDate = (bill: any) => {
    const mealTypeAmounts = bill.order?.mealTypeAmounts as Record<string, { date?: string } | number> | null
    if (!mealTypeAmounts) return null
    const first = Object.values(mealTypeAmounts).find((v) => typeof v === 'object' && v !== null && (v as any).date) as { date?: string } | undefined
    return first?.date ? formatDate(first.date) : null
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Bills</h1>
          <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">Smart billing overview with event insights</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <div className="flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
            <button
              onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
              className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${statusFilter === 'all' ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              All
            </button>
            <button
              onClick={() => { setStatusFilter('paid'); setCurrentPage(1); }}
              className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${statusFilter === 'paid' ? 'bg-green-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Paid Only
            </button>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-semibold"
          >
            <FaFilter />
            {showFilters ? 'Hide Filters' : 'Filters'}
          </button>
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
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            {/* Customer Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Search</label>
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Search by customer name, phone, or email"
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
                  onChange={(e) => {
                    setDateRange({ ...dateRange, start: e.target.value })
                    setCurrentPage(1)
                  }}
                  className="flex-1 px-3 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => {
                    setDateRange({ ...dateRange, end: e.target.value })
                    setCurrentPage(1)
                  }}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-5 text-white shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Total Billed</h3>
            <FaChartLine />
          </div>
          <p className="text-2xl font-bold">{formatCurrency(billSummary.totalBilled)}</p>
          <p className="text-xs text-blue-100 mt-1">Across filtered bills</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-5 text-white shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Collected</h3>
            <FaWallet />
          </div>
          <p className="text-2xl font-bold">{formatCurrency(billSummary.totalCollected)}</p>
          <p className="text-xs text-green-100 mt-1">Paid amount</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-5 text-white shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Pending</h3>
            <FaWallet />
          </div>
          <p className="text-2xl font-bold">{formatCurrency(billSummary.totalPending)}</p>
          <p className="text-xs text-orange-100 mt-1">Outstanding balance</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-5 text-white shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Collection Rate</h3>
            <FaPercent />
          </div>
          <p className="text-2xl font-bold">{billSummary.collectionRate.toFixed(1)}%</p>
          <p className="text-xs text-purple-100 mt-1">
            Upcoming events: {billSummary.upcomingEvents}
          </p>
        </div>
      </div>

      {/* Mobile Card Layout - visible only below md */}
      <div className="md:hidden space-y-3">
        {filteredBills.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">{tableConfig.emptyMessage}</div>
        ) : (
          <>
            {paginatedBills.map((bill: any) => {
              const total = bill.totalAmount || 0
              const paid = bill.paidAmount || 0
              const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0
              return (
                <div key={bill.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                  <div className="p-4">
                    <div className="font-semibold text-gray-900">{bill.order?.customer?.name || 'Unknown'}</div>
                    <div className="text-sm text-gray-500">{bill.order?.customer?.phone || ''}</div>
                    <div className="text-sm text-gray-700 mt-1">{bill.order?.eventName || 'Event'}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{getBillEventDate(bill) || formatDateTime(bill.createdAt)}</div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <div>
                        <div className="text-xs text-gray-500">Total</div>
                        <div className="font-semibold text-gray-900">{formatCurrency(bill.totalAmount)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Remaining</div>
                        <div className="font-semibold text-red-600">{formatCurrency(bill.remainingAmount)}</div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${bill.status === 'paid' ? 'bg-green-100 text-green-800' : bill.status === 'partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{pct.toFixed(0)}% paid</span>
                        <span>{formatCurrency(paid)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100">
                        <div className="h-2 rounded-full bg-primary-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                      {bill.status !== 'paid' && (
                        <button onClick={() => handleMarkPaid(bill.id)} className="p-2.5 bg-green-50 text-green-600 rounded-lg touch-manipulation" title="Mark Paid"><FaCheck /></button>
                      )}
                      <button onClick={() => handleSendBillEmail(bill)} disabled={!bill.order?.customer?.email} className="p-2.5 bg-slate-50 text-slate-600 rounded-lg touch-manipulation disabled:opacity-50" title="Email"><FaEnvelope /></button>
                      <button onClick={() => handleSendBillWhatsApp(bill)} disabled={!bill.order?.customer?.phone} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg touch-manipulation disabled:opacity-50" title="WhatsApp"><FaWhatsapp /></button>
                      <button onClick={() => handleGenerateImage(bill)} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg touch-manipulation" title="Image"><FaFileImage /></button>
                      <button onClick={() => handleGeneratePDF(bill)} className="p-2.5 bg-primary-50 text-primary-600 rounded-lg touch-manipulation" title="PDF"><FaPrint /></button>
                    </div>
                  </div>
                </div>
              )
            })}
            {/* Mobile Pagination */}
            {(totalPagesBills > 1 || itemsPerPage < filteredBills.length) && (
              <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow-md mt-4">
                <div className="text-sm text-gray-700">
                  {startIdx + 1}-{Math.min(endIdx, filteredBills.length)} of {filteredBills.length}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"><FaChevronLeft /></button>
                  <span className="px-3 py-1 text-sm font-medium">{currentPage} / {totalPagesBills}</span>
                  <button onClick={() => setCurrentPage((p) => Math.min(totalPagesBills, p + 1))} disabled={currentPage === totalPagesBills} className="p-2 rounded-lg bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"><FaChevronRight /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Desktop Table - visible only md and up */}
      <div className="hidden md:block">
      <Table
        columns={tableConfig.columns}
        data={filteredBills}
        emptyMessage={tableConfig.emptyMessage}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        totalItems={filteredBills.length}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
        itemName={tableConfig.itemName}
        getItemId={tableConfig.getItemId}
        renderActions={(bill) => (
          <div className="flex items-center gap-2">
            {bill.status !== 'paid' && (
              <button
                onClick={() => handleMarkPaid(bill.id)}
                className="text-green-600 hover:text-green-700 p-2 hover:bg-green-50 rounded transition-all active:scale-90"
                title="Mark as Paid"
              >
                <FaCheck />
              </button>
            )}
            <button
              onClick={() => handleSendBillEmail(bill)}
              className="text-slate-600 hover:text-slate-700 p-2 hover:bg-slate-50 rounded transition-all active:scale-90"
              title={bill.order?.customer?.email ? 'Send bill via email' : 'Customer email not available'}
              disabled={!bill.order?.customer?.email}
            >
              <FaEnvelope />
            </button>
            <button
              onClick={() => handleSendBillWhatsApp(bill)}
              className="text-emerald-600 hover:text-emerald-700 p-2 hover:bg-emerald-50 rounded transition-all active:scale-90"
              title={bill.order?.customer?.phone ? 'Send bill via WhatsApp to customer' : 'Customer phone not available'}
              disabled={!bill.order?.customer?.phone}
            >
              <FaWhatsapp />
            </button>
            <button
              onClick={() => handleGenerateImage(bill)}
              className="text-indigo-600 hover:text-indigo-700 p-2 hover:bg-indigo-50 rounded transition-all active:scale-90"
              title="Download Bill Image (PNG)"
            >
              <FaFileImage />
            </button>
            <button
              onClick={() => handleGeneratePDF(bill)}
              className="text-primary-600 hover:text-primary-700 p-2 hover:bg-primary-50 rounded transition-all active:scale-90"
              title="Download PDF Bill"
            >
              <FaPrint />
            </button>
          </div>
        )}
      />
      </div>
    </div>
  )
}
