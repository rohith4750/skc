'use client'

import { useEffect, useState, useMemo } from 'react'
import { formatCurrency, formatDateTime, formatDate, sendWhatsAppMessage } from '@/lib/utils'
import { Bill, Order, Customer } from '@/types'
import { FaPrint, FaCheck, FaEdit, FaFilter, FaChartLine, FaWallet, FaPercent, FaCalendarAlt, FaEnvelope, FaWhatsapp, FaImage, FaFilePdf } from 'react-icons/fa'
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
  const [billModal, setBillModal] = useState<{ isOpen: boolean; bill: any | null; type: 'pdf' | 'image' }>({ isOpen: false, bill: null, type: 'pdf' })
  const [selectedBillIds, setSelectedBillIds] = useState<string[]>([])
  const [consolidateModal, setConsolidateModal] = useState<{ isOpen: boolean; title: string }>({ isOpen: false, title: 'Statement of Account' })

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

      // Deduplicate bills by orderId
      const uniqueBillsMap = new Map<string, any>()
      allBills.forEach((bill: any) => {
        if (bill.orderId) {
          const existing = uniqueBillsMap.get(bill.orderId)
          if (!existing || new Date(bill.createdAt) > new Date(existing.createdAt)) {
            uniqueBillsMap.set(bill.orderId, bill)
          }
        } else {
          uniqueBillsMap.set(bill.id, bill)
        }
      })

      const uniqueBills = Array.from(uniqueBillsMap.values())
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

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadBills(false)
      }
    }
    const handleFocus = () => {
      loadBills(false)
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const handleBulkDiscardDate = async (date: string, orderIds: string[]) => {
    if (!window.confirm(`Are you sure you want to discard ALL catering sessions and records for ${formatDate(date)}? This action is PERMANENT and will affect associated bills.`)) return

    try {
      const response = await fetch('/api/orders/bulk-discard-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, orderIds })
      })

      if (!response.ok) throw new Error('Failed to bulk discard date')

      toast.success(`Successfully discarded records for ${formatDate(date)}`)
      loadBills()
    } catch (error) {
      console.error('Bulk discard error:', error)
      toast.error('Failed to discard records')
    }
  }

  const groupedBills = useMemo(() => {
    const groups: Record<string, typeof bills> = {}

    bills.forEach(bill => {
      const dates = new Set<string>()
      const mealTypeAmounts = (bill.order?.mealTypeAmounts as Record<string, any>) || {}

      Object.values(mealTypeAmounts).forEach((d: any) => {
        if (d && typeof d === 'object' && d.date) {
          dates.add(d.date)
        }
      })

      if (dates.size === 0) {
        dates.add(new Date(bill.createdAt).toISOString().split('T')[0])
      }

      dates.forEach(date => {
        if (!groups[date]) groups[date] = []
        groups[date].push(bill)
      })
    })

    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
  }, [bills])

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
      setBills(prevBills =>
        prevBills.map((b: any) => b.id === billId ? updatedBill : b)
      )
      toast.success('Bill marked as paid successfully!')
    } catch (error: any) {
      console.error('Failed to update bill:', error)
      toast.error(error.message || 'Failed to update bill. Please try again.')
    }
  }

  const handleCombineBills = async (type: 'pdf' | 'image') => {
    if (selectedBillIds.length < 2) {
      toast.error('Please select at least 2 bills to combine')
      return
    }

    const selectedBills = bills.filter(b => selectedBillIds.includes(b.id))
    const customerIds = new Set(selectedBills.map(b => b.order?.customer?.id || 'unknown'))
    if (customerIds.size > 1) {
      if (!confirm('You have selected bills for different customers. Combine them into one statement anyway?')) {
        return
      }
    }

    const customer = selectedBills[0].order?.customer
    const billsData = selectedBills.map(b => ({
      serialNumber: String(b.serialNumber || b.id.slice(0, 8).toUpperCase()),
      date: b.createdAt,
      eventName: b.order?.eventName || 'N/A',
      total: b.totalAmount,
      paid: b.paidAmount,
      balance: b.remainingAmount
    }))

    const statementData: PDFTemplateData = {
      type: 'statement',
      date: new Date().toISOString(),
      statementDetails: {
        customerName: customer?.name || 'Various Customers',
        customerPhone: customer?.phone,
        bills: billsData,
        grandTotal: selectedBills.reduce((sum, b) => sum + b.totalAmount, 0),
        totalPaid: selectedBills.reduce((sum, b) => sum + b.paidAmount, 0),
        totalBalance: selectedBills.reduce((sum, b) => sum + b.remainingAmount, 0)
      }
    }

    const htmlContent = generatePDFTemplate(statementData)
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.width = '210mm'
    tempDiv.style.background = 'white'
    tempDiv.innerHTML = htmlContent
    document.body.appendChild(tempDiv)

    try {
      const canvas = await html2canvas(tempDiv, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794
      })
      document.body.removeChild(tempDiv)

      if (type === 'pdf') {
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
        pdf.save(`${consolidateModal.title.replace(/\s+/g, '-')}-${formatDate(new Date().toISOString())}.pdf`)
      } else {
        const imgData = canvas.toDataURL('image/jpeg', 0.9)
        const link = document.createElement('a')
        link.href = imgData
        link.download = `${consolidateModal.title.replace(/\s+/g, '-')}-${formatDate(new Date().toISOString())}.jpg`
        link.click()
      }

      toast.success('Statement generated successfully!')
      setConsolidateModal({ ...consolidateModal, isOpen: false })
      setSelectedBillIds([])
    } catch (error) {
      console.error('Error generating statement:', error)
      toast.error('Failed to generate statement')
      if (tempDiv.parentNode) document.body.removeChild(tempDiv)
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

    let mealsTotal = 0
    if (mealTypeAmounts) {
      Object.entries(mealTypeAmounts).forEach(([mealType, data]) => {
        const mealData = typeof data === 'object' && data !== null ? data : { amount: typeof data === 'number' ? data : 0 }
        const persons = (typeof mealData === 'object' && mealData !== null && 'numberOfMembers' in mealData) ? (mealData.numberOfMembers || 0) : 0
        const amount = typeof mealData === 'object' && mealData !== null && 'amount' in mealData ? mealData.amount : (typeof data === 'number' ? data : 0)
        mealsTotal += amount
        const rate = persons > 0 ? amount / persons : 0
        if (mealType.toLowerCase().includes('tiffin') || mealType.toLowerCase().includes('breakfast')) tiffinsData = { persons, rate }
        else if (mealType.toLowerCase().includes('lunch') || mealType.toLowerCase().includes('dinner')) lunchDinnerData = { type: mealType.toLowerCase().includes('lunch') ? 'Lunch' : 'Dinner', persons, rate }
        else if (mealType.toLowerCase().includes('snack')) snacksData = { persons, rate }
      })
    }

    const extraAmount = stalls?.reduce((sum, stall) => sum + (parseFloat(stall.cost?.toString() || '0') || 0), 0) || 0
    let finalWaterBottlesCost = waterBottlesCost
    if (finalWaterBottlesCost === 0) {
      const calculatedTotal = mealsTotal + transportCost + extraAmount - (parseFloat(order?.discount || '0') || 0)
      const diff = parseFloat(bill.totalAmount || '0') - calculatedTotal
      if (diff > 0) finalWaterBottlesCost = diff
    }
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
        financial: { transport: transportCost || undefined, waterBottlesCost: finalWaterBottlesCost || undefined, extra: extraAmount > 0 ? extraAmount : undefined, totalAmount: bill.totalAmount, advancePaid: bill.advancePaid, balanceAmount: bill.remainingAmount, remainingAmount: bill.remainingAmount, paidAmount: bill.paidAmount, discount: order?.discount },
        status: bill.status,
        orderId: order?.id,
        supervisor: order?.supervisor?.name,
      },
    }
  }

  const renderBillToPdf = async (bill: any, options: { splitByDate?: boolean } = {}): Promise<string | null> => {
    const { pdfData } = buildBillPdfData(bill)
    const htmlContent = generatePDFTemplate({ ...pdfData, options })
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.width = '210mm'
    tempDiv.style.background = 'white'
    tempDiv.innerHTML = htmlContent
    document.body.appendChild(tempDiv)
    try {
      const canvas = await html2canvas(tempDiv, { scale: 1.5, useCORS: true, backgroundColor: '#ffffff', width: tempDiv.scrollWidth, height: tempDiv.scrollHeight })
      document.body.removeChild(tempDiv)
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
      return pdf.output('datauristring').split(',')[1]
    } catch {
      if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv)
      return null
    }
  }

  const renderOrderToPdf = async (order: any, language: 'english' | 'telugu'): Promise<string | null> => {
    if (!order?.items?.length) return null
    const htmlContent = buildOrderPdfHtml(order, { useEnglish: language === 'english', formatDate })
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.width = '210mm'
    tempDiv.style.background = 'white'
    tempDiv.innerHTML = htmlContent
    document.body.appendChild(tempDiv)
    try {
      const canvas = await html2canvas(tempDiv, { scale: 1.5, useCORS: true, backgroundColor: '#ffffff' })
      document.body.removeChild(tempDiv)
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
      return pdf.output('datauristring').split(',')[1]
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
      if (!response.ok) throw new Error('Failed to send bill email')
      toast.success(`Bill PDF sent to ${customerEmail}`)
    } catch (error: any) {
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
    const message = [
      'SRI VATSASA AND KOUNDINYA CATERERS',
      'Bill Summary',
      `Customer: ${customer?.name || 'Unknown'}`,
      `Event: ${bill.order?.eventName || 'Catering Event'}`,
      `Total: ${formatCurrency(bill.totalAmount)}`,
      `Paid: ${formatCurrency(bill.paidAmount)}`,
      `Remaining: ${formatCurrency(bill.remainingAmount)}`,
      `Bill ID: ${bill.id.slice(0, 8).toUpperCase()}`,
    ].join('\n')
    sendWhatsAppMessage(customerPhone, message)
  }

  const handleGeneratePDF = async (bill: any, options: { splitByDate?: boolean } = {}) => {
    const pdfBase64 = await renderBillToPdf(bill, options)
    if (!pdfBase64) {
      toast.error('Failed to generate PDF')
      return
    }
    const { pdfData } = buildBillPdfData(bill)
    const byteChars = atob(pdfBase64)
    const byteNumbers = new Array(byteChars.length)
    for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i)
    const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `SKC-Bill-${pdfData.billNumber}${options.splitByDate ? '-Separate' : ''}.pdf`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Bill PDF generated successfully!')
    setBillModal({ isOpen: false, bill: null, type: 'pdf' })
  }

  const handleGenerateBillImage = async (bill: any, options: { splitByDate?: boolean } = {}) => {
    const { pdfData } = buildBillPdfData(bill)
    const htmlContent = generatePDFTemplate({ ...pdfData, options })
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.width = '210mm'
    tempDiv.style.background = 'white'
    tempDiv.innerHTML = htmlContent
    document.body.appendChild(tempDiv)
    try {
      const canvas = await html2canvas(tempDiv, { scale: 1.5, useCORS: true, backgroundColor: '#ffffff', width: tempDiv.scrollWidth, height: tempDiv.scrollHeight })
      document.body.removeChild(tempDiv)
      const imgData = canvas.toDataURL('image/jpeg', 0.9)
      const link = document.createElement('a')
      link.href = imgData
      link.download = `SKC-Bill-${pdfData.billNumber}${options.splitByDate ? '-Separate' : ''}.jpg`
      link.click()
      toast.success('Bill Image downloaded successfully!')
      setBillModal({ isOpen: false, bill: null, type: 'image' })
    } catch {
      if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv)
      toast.error('Failed to generate Bill Image.')
    }
  }

  const checkAndOpenBillModal = (bill: any, type: 'pdf' | 'image') => {
    const mealTypeAmounts = bill.order?.mealTypeAmounts || {}
    const dates = new Set()
    Object.values(mealTypeAmounts).forEach((d: any) => {
      if (d && typeof d === 'object' && d.date) dates.add(d.date)
    })
    if (dates.size > 1) setBillModal({ isOpen: true, bill, type })
    else type === 'pdf' ? handleGeneratePDF(bill) : handleGenerateBillImage(bill)
  }

  const filteredBills = useMemo(() => {
    let filtered = bills
    if (statusFilter !== 'all') filtered = filtered.filter(bill => bill.status === statusFilter)
    if (customerSearch) {
      const searchLower = customerSearch.toLowerCase()
      filtered = filtered.filter(bill =>
        bill.order?.customer?.name?.toLowerCase().includes(searchLower) ||
        bill.order?.customer?.phone?.includes(customerSearch)
      )
    }
    // Date range filter
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(bill => {
        const mealTypeAmounts = (bill.order?.mealTypeAmounts as Record<string, any>) || {}
        const eventDates = new Set<string>()

        Object.values(mealTypeAmounts).forEach((d: any) => {
          if (d && typeof d === 'object' && d.date) {
            eventDates.add(d.date)
          }
        })

        if (eventDates.size === 0) {
          eventDates.add(new Date(bill.createdAt).toISOString().split('T')[0])
        }

        const datesArray = Array.from(eventDates)
        return datesArray.some(dateStr => {
          const eventDate = new Date(dateStr)
          if (dateRange.start) {
            const start = new Date(dateRange.start)
            if (eventDate < start) return false
          }
          if (dateRange.end) {
            const end = new Date(dateRange.end)
            end.setHours(23, 59, 59, 999)
            if (eventDate > end) return false
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
    const upcomingEvents = filteredBills.filter(bill => {
      const mealTypeAmounts = bill.order?.mealTypeAmounts as Record<string, { date?: string }> | null
      const firstDate = mealTypeAmounts ? Object.values(mealTypeAmounts).find(v => v?.date) : null
      if (!firstDate?.date) return false
      const diff = new Date(firstDate.date).getTime() - new Date().setHours(0, 0, 0, 0)
      return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000
    }).length
    return { totalBilled, totalCollected, totalPending, collectionRate, upcomingEvents }
  }, [filteredBills])

  return (
    <div className="p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="animate-in fade-in slide-in-from-left duration-500">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
            Financial <span className="text-primary-600">Bills</span>
          </h1>
          <p className="text-slate-500 font-bold flex items-center gap-2 uppercase tracking-widest text-xs">
            <span className="w-8 h-1 bg-primary-500 rounded-full"></span>
            Manage and track catering finances
          </p>
        </div>

        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right duration-500">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
            <button
              onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
              className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              All Bills
            </button>
            <button
              onClick={() => { setStatusFilter('paid'); setCurrentPage(1); }}
              className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${statusFilter === 'paid' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Paid
            </button>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${showFilters ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-sm'}`}
          >
            <FaFilter />
            {showFilters ? 'Hide Filters' : 'Filters'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Total Billed', value: billSummary.totalBilled, icon: FaChartLine, color: 'blue', desc: 'Total across filtered' },
          { label: 'Collected', value: billSummary.totalCollected, icon: FaWallet, color: 'emerald', desc: 'Successfully paid' },
          { label: 'Pending', value: billSummary.totalPending, icon: FaWallet, color: 'amber', desc: 'Outstanding balance' },
          { label: 'Collection Rate', value: `${billSummary.collectionRate.toFixed(1)}%`, icon: FaPercent, color: 'indigo', desc: `${billSummary.upcomingEvents} Upcoming events` }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-50 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-${stat.color}-100 transition-all`}></div>
            <div className="relative">
              <div className={`w-12 h-12 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl flex items-center justify-center mb-4`}>
                <stat.icon size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900 mb-1">{typeof stat.value === 'number' ? formatCurrency(stat.value) : stat.value}</h3>
              <p className="text-xs font-bold text-slate-500">{stat.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-[32px] p-8 mb-12 border border-slate-200 shadow-sm animate-in fade-in zoom-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Customer Search</label>
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => { setCustomerSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Search by name or phone..."
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-primary-500 transition-all outline-none font-bold text-sm"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Bill Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-primary-500 transition-all outline-none font-bold text-sm cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Date Range</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => { setDateRange({ ...dateRange, start: e.target.value }); setCurrentPage(1); }}
                  className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-primary-500 transition-all outline-none font-bold text-[10px]"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => { setDateRange({ ...dateRange, end: e.target.value }); setCurrentPage(1); }}
                  className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-primary-500 transition-all outline-none font-bold text-[10px]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grouped Results */}
      {filteredBills.length === 0 ? (
        <div className="bg-white rounded-[40px] border-2 border-dashed border-slate-200 p-20 text-center">
          <h3 className="text-2xl font-black text-slate-900 mb-2">No bills found</h3>
          <p className="text-slate-500 font-bold text-sm">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="space-y-12 pb-20">
          {groupedBills.map(([date, dateBills]) => (
            <div key={date} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-6 px-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center text-primary-500">
                    <FaCalendarAlt size={20} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 leading-none mb-1">{formatDate(date)}</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{dateBills.length} Bills</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const ids = dateBills.map(b => b.id)
                      const allSelected = ids.every(id => selectedBillIds.includes(id))
                      if (allSelected) setSelectedBillIds(prev => prev.filter(id => !ids.includes(id)))
                      else setSelectedBillIds(prev => Array.from(new Set([...prev, ...ids])))
                    }}
                    className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => handleBulkDiscardDate(date, dateBills.map(b => b.orderId!).filter(Boolean))}
                    className="px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all"
                  >
                    Discard Date
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                {dateBills.map(bill => (
                  <div key={bill.id} className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={selectedBillIds.includes(bill.id)}
                          onChange={() => setSelectedBillIds(prev => prev.includes(bill.id) ? prev.filter(i => i !== bill.id) : [...prev, bill.id])}
                          className="w-5 h-5 rounded-lg border-2 border-slate-200 text-primary-600 cursor-pointer"
                        />
                        <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill #{bill.serialNumber || bill.id.slice(0, 8).toUpperCase()}</span>
                          <h3 className="text-xl font-black text-slate-900">{bill.order?.customer?.name || 'Unknown Client'}</h3>
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${bill.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {bill.status}
                      </div>
                    </div>

                    <div className="space-y-4 mb-8">
                      <div className="flex justify-between border-b border-slate-50 pb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                        <span className="text-sm font-black text-slate-900">{formatCurrency(bill.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-2">
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Paid</span>
                        <span className="text-sm font-black text-emerald-600">{formatCurrency(bill.paidAmount)}</span>
                      </div>
                      {bill.remainingAmount > 0 && (
                        <div className="flex justify-between bg-rose-50 p-4 rounded-2xl">
                          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Balance</span>
                          <span className="text-lg font-black text-rose-600">{formatCurrency(bill.remainingAmount)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-6 border-t border-slate-50">
                      {bill.status !== 'paid' && (
                        <button onClick={() => handleMarkPaid(bill.id)} className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-all"><FaCheck size={16} /></button>
                      )}
                      <button onClick={() => handleSendBillEmail(bill)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all"><FaEnvelope size={16} /></button>
                      <button onClick={() => handleSendBillWhatsApp(bill)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-emerald-50 hover:text-emerald-600 transition-all"><FaWhatsapp size={16} /></button>
                      <button onClick={() => checkAndOpenBillModal(bill, 'pdf')} className="ml-auto p-3 bg-primary-50 text-primary-600 rounded-2xl hover:bg-primary-100 transition-all"><FaPrint size={16} /></button>
                      <button onClick={() => checkAndOpenBillModal(bill, 'image')} className="p-3 bg-purple-50 text-purple-600 rounded-2xl hover:bg-purple-100 transition-all"><FaImage size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {billModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-10 max-w-md w-full animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-slate-900 mb-6 font-poppins">Multiple Dates</h3>
            <div className="space-y-4">
              <button onClick={() => billModal.type === 'pdf' ? handleGeneratePDF(billModal.bill, { splitByDate: false }) : handleGenerateBillImage(billModal.bill, { splitByDate: false })} className="w-full p-6 bg-slate-50 rounded-[24px] hover:bg-primary-50 transition-all text-left flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary-600 shadow-sm"><FaPrint /></div>
                <div><span className="block font-black text-slate-900">Consolidated</span><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Single Page</span></div>
              </button>
              <button onClick={() => billModal.type === 'pdf' ? handleGeneratePDF(billModal.bill, { splitByDate: true }) : handleGenerateBillImage(billModal.bill, { splitByDate: true })} className="w-full p-6 bg-slate-50 rounded-[24px] hover:bg-purple-50 transition-all text-left flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-purple-600 shadow-sm"><FaFilePdf /></div>
                <div><span className="block font-black text-slate-900">Separate</span><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Multi-Page</span></div>
              </button>
            </div>
            <button onClick={() => setBillModal({ isOpen: false, bill: null, type: 'pdf' })} className="mt-8 w-full text-center text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all">Cancel</button>
          </div>
        </div>
      )}

      {consolidateModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-10 max-w-lg w-full animate-in zoom-in duration-300">
            <h3 className="text-3xl font-black text-slate-900 mb-6 font-poppins">Combine Bills</h3>
            <div className="space-y-6 mb-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Statement Title</label>
                <input type="text" value={consolidateModal.title} onChange={(e) => setConsolidateModal({ ...consolidateModal, title: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-primary-500 transition-all outline-none font-black" placeholder="e.g. Monthly Summary" />
              </div>
              <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-100 max-h-64 overflow-y-auto">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Breakdown</p>
                <div className="space-y-2">
                  {bills.filter(b => selectedBillIds.includes(b.id)).map(b => (
                    <div key={b.id} className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0">
                      <span className="text-xs font-black text-slate-900">{b.order?.customer?.name}</span>
                      <span className="text-xs font-black text-slate-700">{formatCurrency(b.remainingAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleCombineBills('pdf')} className="py-6 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl flex flex-col items-center gap-2"><FaPrint size={20} /><span className="text-[10px]">Export PDF</span></button>
              <button onClick={() => handleCombineBills('image')} className="py-6 bg-white border-2 border-slate-200 text-slate-900 rounded-[24px] font-black uppercase tracking-widest hover:border-primary-500 hover:text-primary-600 transition-all flex flex-col items-center gap-2"><FaImage size={20} /><span className="text-[10px]">Save Image</span></button>
            </div>
            <button onClick={() => setConsolidateModal({ ...consolidateModal, isOpen: false })} className="mt-8 w-full text-center text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all">Cancel</button>
          </div>
        </div>
      )}

      {/* Floating Action Bar */}
      {selectedBillIds.length >= 2 && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-slate-900 rounded-full shadow-2xl px-10 py-5 flex items-center gap-8 z-40 animate-in slide-in-from-bottom-20 duration-500 border border-slate-800">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Selection</span>
            <span className="text-sm font-black text-white">{selectedBillIds.length} Bills Selected</span>
          </div>
          <div className="h-10 w-px bg-slate-800"></div>
          <button onClick={() => setConsolidateModal({ ...consolidateModal, isOpen: true })} className="bg-primary-500 text-white px-8 py-3 rounded-full font-black uppercase tracking-widest text-xs shadow-lg hover:bg-primary-400 transition-all flex items-center gap-3">Combine & Download</button>
          <button onClick={() => setSelectedBillIds([])} className="text-slate-500 hover:text-white transition-colors p-2"><FaFilter size={14} /></button>
        </div>
      )}
    </div>
  )
}
