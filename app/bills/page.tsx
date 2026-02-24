'use client'

import { useEffect, useState, useMemo } from 'react'
import { formatCurrency, formatDateTime, formatDate, sendWhatsAppMessage } from '@/lib/utils'
import { Bill, Order, Customer } from '@/types'
import {
  FaPrint, FaCheck, FaEdit, FaFilter, FaChartLine, FaWallet,
  FaPercent, FaCalendarAlt, FaEnvelope, FaWhatsapp, FaFileImage,
  FaChevronLeft, FaChevronRight, FaHistory, FaPlus, FaUser, FaUsers, FaInfoCircle, FaFileInvoiceDollar, FaTimes, FaTrash
} from 'react-icons/fa'
import toast from 'react-hot-toast'
import { fetchWithLoader } from '@/lib/fetch-with-loader'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { generatePDFTemplate } from '@/lib/pdf-template'
import { buildOrderPdfHtml } from '@/lib/order-pdf-html'
import ConfirmModal from '@/components/ConfirmModal'

interface ExtendedBill {
  id: string;
  serialNumber: number;
  orderId: string;
  totalAmount: any;
  paidAmount: any;
  remainingAmount: any;
  status: string;
  paymentHistory: any;
  createdAt: string;
  updatedAt: string;
  order: Order & { items: any[], customer: Customer };
}

const getGuestCount = (order: Order) => {
  if (order.numberOfMembers) return Number(order.numberOfMembers);
  const mealTypeAmounts = order.mealTypeAmounts as Record<string, any>;
  if (!mealTypeAmounts || typeof mealTypeAmounts !== 'object') return 0;

  const counts = Object.values(mealTypeAmounts).map((mt: any) => {
    // Check for plate count or member count
    return Number(mt?.numberOfPlates || mt?.numberOfMembers || 0);
  });

  return counts.length > 0 ? Math.max(...counts) : 0;
}

export default function BillsPage() {
  const [bills, setBills] = useState<ExtendedBill[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedBill, setSelectedBill] = useState<ExtendedBill | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    method: 'cash' as string,
    notes: ''
  })
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [billToDelete, setBillToDelete] = useState<string | null>(null)

  // Load Bills
  const loadBills = async () => {
    setLoading(true)
    try {
      const response = await fetchWithLoader('/api/bills', { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to fetch bills')
      const data = await response.json()
      setBills(data)
    } catch (error) {
      console.error('Failed to load bills:', error)
      toast.error('Failed to load bills')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBills()
  }, [])

  const filteredBills = useMemo(() => {
    return bills.filter(bill => {
      const customerName = bill.order?.customer?.name?.toLowerCase() || ''
      const phone = bill.order?.customer?.phone || ''
      const query = searchQuery.toLowerCase()

      const matchesSearch = customerName.includes(query) || phone.includes(query)

      // Month/Year filter based on order eventDate or bill creation
      const billDate = new Date(bill.order?.eventDate || bill.createdAt)
      const matchesMonth = (billDate.getMonth() + 1) === selectedMonth && billDate.getFullYear() === selectedYear

      return matchesSearch && matchesMonth
    })
  }, [bills, searchQuery, selectedMonth, selectedYear])

  // Metrics (based on filtered bills)
  const metrics = useMemo(() => {
    const total = filteredBills.reduce((sum, b) => sum + Number(b.totalAmount), 0)
    const paid = filteredBills.reduce((sum, b) => sum + Number(b.paidAmount), 0)
    const pending = filteredBills.reduce((sum, b) => sum + Number(b.remainingAmount), 0)
    return { total, paid, pending, count: filteredBills.length }
  }, [filteredBills])

  const handleOpenDrawer = (bill: ExtendedBill) => {
    setSelectedBill(bill)
    setIsDrawerOpen(true)
  }

  const handleRecordPayment = async () => {
    if (!selectedBill || paymentData.amount <= 0) return

    const newPaidAmount = Number(selectedBill.paidAmount) + paymentData.amount
    const newRemainingAmount = Math.max(0, Number(selectedBill.totalAmount) - newPaidAmount)
    const newStatus = newRemainingAmount <= 0 ? 'paid' : 'partial'

    try {
      const response = await fetchWithLoader(`/api/bills/${selectedBill.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          status: newStatus,
          paymentMethod: paymentData.method,
          paymentNotes: paymentData.notes
        }),
      })

      if (!response.ok) throw new Error('Failed to record payment')

      const updatedBill = await response.json()
      setBills(prev => prev.map(b => b.id === selectedBill.id ? updatedBill : b))
      setSelectedBill(updatedBill)
      setIsPaymentModalOpen(false)
      setPaymentData({ amount: 0, method: 'cash', notes: '' })
      toast.success('Payment recorded successfully')
    } catch (error) {
      toast.error('Failed to update payment')
    }
  }

  const handleDeleteBill = (billId: string) => {
    setBillToDelete(billId)
    setIsDeleteModalOpen(true)
  }

  const confirmDeleteBill = async () => {
    if (!billToDelete) return

    const toastId = toast.loading('Deleting bill...')
    try {
      const response = await fetchWithLoader(`/api/bills/${billToDelete}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete bill');
      }

      setBills(prev => prev.filter(b => b.id !== billToDelete))
      if (selectedBill?.id === billToDelete) {
        setIsDrawerOpen(false)
        setSelectedBill(null)
      }
      toast.success('Bill deleted successfully', { id: toastId })
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete bill', { id: toastId })
    } finally {
      setIsDeleteModalOpen(false)
      setBillToDelete(null)
    }
  }


  // PDF Generation for Bills
  const renderBillToPdf = async (bill: ExtendedBill): Promise<string | null> => {
    if (!bill?.order) return null

    let tempDiv: HTMLDivElement | null = null;

    try {
      const htmlContent = buildOrderPdfHtml(bill.order, {
        useEnglish: true,
        formatDate,
        showFinancials: true,
        formatCurrency,
        bill: bill
      })

      tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.width = '210mm'
      tempDiv.style.padding = '10mm'
      tempDiv.style.fontFamily = 'Poppins, sans-serif'
      tempDiv.style.fontSize = '11px'
      tempDiv.style.lineHeight = '1.6'
      tempDiv.style.background = 'white'
      tempDiv.style.color = '#333'
      tempDiv.innerHTML = htmlContent
      tempDiv.style.overflow = 'visible'
      document.body.appendChild(tempDiv)

      await new Promise(r => setTimeout(r, 500))

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

      if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv)
      tempDiv = null;

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

      const output = pdf.output('dataurlstring')
      return output.split(',')[1] || output
    } catch (e: any) {
      if (tempDiv && document.body.contains(tempDiv)) document.body.removeChild(tempDiv)
      console.error('PDF Generation Error:', e)
      toast.error(`Failed to generate PDF: ${e.message || e}`)
      return null
    }
  }

  const renderBillToImage = async (bill: ExtendedBill): Promise<string | null> => {
    if (!bill?.order) return null

    let tempDiv: HTMLDivElement | null = null;

    try {
      const htmlContent = buildOrderPdfHtml(bill.order, {
        useEnglish: true,
        formatDate,
        showFinancials: true,
        formatCurrency,
        bill: bill
      })

      tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.width = '210mm'
      tempDiv.style.padding = '10mm'
      tempDiv.style.fontFamily = 'Poppins, sans-serif'
      tempDiv.style.fontSize = '11px'
      tempDiv.style.lineHeight = '1.6'
      tempDiv.style.background = 'white'
      tempDiv.style.color = '#333'
      tempDiv.innerHTML = htmlContent
      tempDiv.style.overflow = 'visible'
      document.body.appendChild(tempDiv)

      await new Promise(r => setTimeout(r, 500))

      const w = tempDiv.scrollWidth
      const h = Math.max(tempDiv.scrollHeight + 20, 1)
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: w,
        height: h,
        windowWidth: w,
        windowHeight: h,
      })

      if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv)
      tempDiv = null;

      return canvas.toDataURL('image/png')
    } catch (e: any) {
      if (tempDiv && document.body.contains(tempDiv)) document.body.removeChild(tempDiv)
      console.error('Image Generation Error:', e)
      toast.error(`Failed to generate image: ${e.message || e}`)
      return null
    }
  }

  const handleDownloadBillPDF = async (bill: ExtendedBill) => {

    const toastId = toast.loading('Generating PDF...')
    try {
      const pdfBase64 = await renderBillToPdf(bill)

      if (pdfBase64) {
        const billNumber = bill.serialNumber?.toString() || bill.id.slice(0, 8).toUpperCase()
        const link = document.createElement('a')
        link.href = `data:application/pdf;base64,${pdfBase64}`
        link.download = `SKC-Bill-${billNumber}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success('PDF downloaded successfully', { id: toastId })
      } else {
        toast.error('Failed to generate PDF', { id: toastId })
      }
    } catch (error) {
      console.error(error)
      toast.error('Error downloading PDF', { id: toastId })
    }
  }

  const handleDownloadBillImage = async (bill: ExtendedBill) => {
    const toastId = toast.loading('Generating Image...')
    try {
      const imageDataUrl = await renderBillToImage(bill)

      if (imageDataUrl) {
        const billNumber = bill.serialNumber?.toString() || bill.id.slice(0, 8).toUpperCase()
        const link = document.createElement('a')
        link.href = imageDataUrl
        link.download = `SKC-Bill-${billNumber}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success('Image downloaded successfully', { id: toastId })
      } else {
        toast.error('Failed to generate image', { id: toastId })
      }
    } catch (error) {
      console.error(error)
      toast.error('Error downloading image', { id: toastId })
    }
  }

  const handleSendBillEmail = async (bill: ExtendedBill) => {

    if (!bill.order.customer.email) {
      toast.error('Customer email not found')
      return
    }

    const toastId = toast.loading('Generating and sending PDF...')
    try {
      const pdfBase64 = await renderBillToPdf(bill)

      if (!pdfBase64) {
        toast.error('Failed to generate PDF', { id: toastId })
        return
      }

      const response = await fetch(`/api/bills/${bill.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfBase64 })
      })

      if (response.ok) {
        toast.success(`Bill sent to ${bill.order.customer.email}`, { id: toastId })
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to send bill', { id: toastId })
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to send bill', { id: toastId })
    }
  }

  const handleSendBillWhatsApp = async (bill: ExtendedBill) => {
    if (!bill.order.customer.phone) {
      toast.error('Customer phone not found')
      return
    }

    const toastId = toast.loading('Generating PDF...')
    try {
      const pdfBase64 = await renderBillToPdf(bill)

      if (pdfBase64) {
        const billNumber = bill.serialNumber?.toString() || bill.id.slice(0, 8).toUpperCase()
        const link = document.createElement('a')
        link.href = `data:application/pdf;base64,${pdfBase64}`
        link.download = `SKC-Bill-${billNumber}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        const message = `Hi ${bill.order.customer.name}! Here's your bill from SKC Caterers for ${bill.order.eventName || 'your event'}. Bill No: SKC-${billNumber}. Total: ${formatCurrency(bill.totalAmount)}, Remaining: ${formatCurrency(bill.remainingAmount)}.`
        sendWhatsAppMessage(bill.order.customer.phone, message)
        toast.success('PDF downloaded. WhatsApp opening...', { id: toastId })
      } else {
        toast.error('Failed to generate PDF', { id: toastId })
      }
    } catch (error) {
      console.error(error)
      toast.error('Error processing WhatsApp request', { id: toastId })
    }
  }


  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      {/* Header & Stats */}
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Financial Ledger</h1>
            <p className="text-slate-500 mt-1">Manage customer bills, multi-day orders, and payment records</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Month/Year Selector */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
              >
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <div className="w-px h-4 bg-slate-200"></div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
              >
                {[2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button
              onClick={loadBills}
              className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all shadow-sm"
            >
              <FaHistory className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Receivables</h3>
                <div className="bg-blue-50 p-2.5 rounded-xl">
                  <FaFileInvoiceDollar className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-black text-blue-600">{formatCurrency(metrics.total)}</p>
              <p className="text-xs text-slate-400 mt-2 font-medium italic">{metrics.count} active ledgers</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Collected</h3>
                <div className="bg-emerald-50 p-2.5 rounded-xl">
                  <FaWallet className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-600">{formatCurrency(metrics.paid)}</p>
              <p className="text-xs text-slate-400 mt-2 font-medium italic">{((metrics.paid / (metrics.total || 1)) * 100).toFixed(1)}% collection rate</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Outstanding</h3>
                <div className="bg-orange-50 p-2.5 rounded-xl">
                  <FaChartLine className="w-5 h-5 text-orange-600" />
                </div>
              </div>
              <p className="text-2xl font-black text-orange-600">{formatCurrency(metrics.pending)}</p>
              <p className="text-xs text-slate-400 mt-2 font-medium italic">Follow-up required</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Search customers or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
            />
            <FaUser className="absolute left-3.5 top-3 text-slate-400 text-sm" />
          </div>
        </div>

        {/* Bills Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">

          {filteredBills.map(bill => (
            <BillCard
              key={bill.id}
              bill={bill}
              onOpen={() => handleOpenDrawer(bill)}
              onDownload={() => handleDownloadBillPDF(bill)}
              onDownloadImage={() => handleDownloadBillImage(bill)}
              onWhatsApp={() => handleSendBillWhatsApp(bill)}
              onEmail={() => handleSendBillEmail(bill)}
              onDelete={() => handleDeleteBill(bill.id)}
            />

          ))}

          {filteredBills.length === 0 && !loading && (
            <div className="col-span-full py-20 text-center">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaFileInvoiceDollar className="text-slate-400 text-2xl" />
              </div>
              <h3 className="text-slate-900 font-bold">No bills found</h3>
              <p className="text-slate-500">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      {
        isDrawerOpen && selectedBill && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
            <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Ledger Details</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-medium text-slate-500">#{selectedBill.serialNumber}</span>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase ${selectedBill.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                      selectedBill.status === 'partial' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                      {selectedBill.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Customer Info */}
                <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600 font-bold text-xl">
                        {selectedBill.order.customer.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">{selectedBill.order.customer.name}</h3>
                        <p className="text-indigo-600 text-sm font-medium">{selectedBill.order.customer.phone}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownloadBillPDF(selectedBill)}
                        className="p-2 bg-white rounded-lg text-slate-600 hover:text-indigo-600 border border-slate-200 shadow-sm transition-all"
                        title="Download PDF"
                      >
                        <FaFileInvoiceDollar />
                      </button>
                      <button
                        onClick={() => handleDownloadBillImage(selectedBill)}
                        className="p-2 bg-white rounded-lg text-slate-600 hover:text-indigo-600 border border-slate-200 shadow-sm transition-all"
                        title="Download Image"
                      >
                        <FaFileImage />
                      </button>
                      <button
                        onClick={() => handleSendBillWhatsApp(selectedBill)}

                        className="p-2 bg-white rounded-lg text-slate-600 hover:text-indigo-600 border border-slate-200 shadow-sm transition-all"
                        title="Send via WhatsApp"
                      >
                        <FaWhatsapp />
                      </button>
                      <button
                        onClick={() => handleSendBillEmail(selectedBill)}
                        className="p-2 bg-white rounded-lg text-slate-600 hover:text-indigo-600 border border-slate-200 shadow-sm transition-all"
                        title="Send via Email"
                      >
                        <FaEnvelope />
                      </button>
                      <button
                        onClick={() => handleDeleteBill(selectedBill.id)}
                        className="p-2 bg-white rounded-lg text-slate-600 hover:text-rose-600 border border-slate-200 shadow-sm transition-all"
                        title="Delete Bill"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>


                {/* Financial Summary */}
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Financial Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs text-slate-500 mb-1">Total Billable</p>
                      <p className="text-lg font-bold text-slate-900">{formatCurrency(selectedBill.totalAmount)}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs text-slate-500 mb-1">Paid to Date</p>
                      <p className="text-lg font-bold text-emerald-600">{formatCurrency(selectedBill.paidAmount)}</p>
                    </div>
                    <div className="p-4 bg-rose-50 rounded-xl border border-rose-100 col-span-2">
                      <p className="text-xs text-rose-500 mb-1 font-semibold">Remaining Balance</p>
                      <div className="flex items-baseline justify-between">
                        <p className="text-2xl font-black text-rose-600">{formatCurrency(selectedBill.remainingAmount)}</p>
                        <button
                          onClick={() => setIsPaymentModalOpen(true)}
                          className="px-4 py-2 bg-white text-rose-600 rounded-lg text-sm font-bold border border-rose-200 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                        >
                          Record Payment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Details (Single Order) */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Order Details</h3>
                  </div>
                  <div className="p-4 border border-slate-100 rounded-2xl bg-white hover:border-indigo-200 transition-all shadow-[0_2px_10px_-5px_rgba(0,0,0,0.1)]">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-slate-800">{selectedBill.order.eventName || 'Unnamed Event'}</p>
                        <div className="flex gap-4">
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <FaCalendarAlt className="text-[10px]" />
                            {selectedBill.order.eventDate ? formatDate(selectedBill.order.eventDate as any) : 'No date'}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <FaUsers className="text-[10px]" />
                            {getGuestCount(selectedBill.order)} Plates
                          </p>
                        </div>
                      </div>
                      <p className="font-black text-slate-900">{formatCurrency(selectedBill.order.totalAmount)}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-50">
                      <MiniDetail label="Transport" value={formatCurrency(Number(selectedBill.order.transportCost))} />
                      <MiniDetail label="Water" value={formatCurrency(Number((selectedBill.order as any).waterBottlesCost || 0))} />
                      <MiniDetail label="Discount" value={formatCurrency(Number(selectedBill.order.discount))} accent="red" />
                    </div>
                  </div>
                </div>

                {/* Payment History */}
                {selectedBill.paymentHistory && (selectedBill.paymentHistory as any[]).length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Payment History</h3>
                    <div className="space-y-3">
                      {(selectedBill.paymentHistory as any[]).slice().reverse().map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border-l-4 border-emerald-500">
                          <div>
                            <p className="text-sm font-bold text-slate-800">+{formatCurrency(p.amount)}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-tight">{p.method} · {formatDateTime(p.date)}</p>
                          </div>
                          {p.notes && (
                            <div className="max-w-[150px] truncate text-xs text-slate-400 italic">
                              {p.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                  <FaPrint /> Generate PDF
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95">
                  <FaWhatsapp className="text-emerald-500" /> Share Bill
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Payment Modal */}
      {
        isPaymentModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsPaymentModalOpen(false)} />
            <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-8 space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 text-2xl mx-auto mb-4">
                    <FaWallet />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">Record Payment</h3>
                  <p className="text-slate-500">Updating ledger for {selectedBill?.order.customer.name}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Amount Received (₹)</label>
                    <input
                      type="number"
                      value={paymentData.amount || ''}
                      onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full text-3xl font-black px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all text-center placeholder:text-slate-200"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <PaymentMethod
                      active={paymentData.method === 'cash'}
                      onClick={() => setPaymentData({ ...paymentData, method: 'cash' })}
                      label="Cash"
                    />
                    <PaymentMethod
                      active={paymentData.method === 'upi'}
                      onClick={() => setPaymentData({ ...paymentData, method: 'upi' })}
                      label="UPI / Bank"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Notes (Optional)</label>
                    <textarea
                      value={paymentData.notes}
                      onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 focus:bg-white outline-none transition-all resize-none text-sm"
                      rows={2}
                      placeholder="e.g., Final payment settled..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRecordPayment}
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                  >
                    Confirm Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Bill"
        message="Are you sure you want to delete this bill? This action cannot be undone."
        onConfirm={confirmDeleteBill}
        onCancel={() => {
          setIsDeleteModalOpen(false)
          setBillToDelete(null)
        }}
        confirmText="Delete"
        variant="danger"
      />
    </div >
  )
}



function BillCard({ bill, onOpen, onDownload, onDownloadImage, onWhatsApp, onEmail, onDelete }: {
  bill: ExtendedBill,
  onOpen: () => void,
  onDownload: () => void,
  onDownloadImage: () => void,
  onWhatsApp: () => void,
  onEmail: () => void,
  onDelete: () => void
}) {


  const total = Number(bill.totalAmount)
  const paid = Number(bill.paidAmount)
  const progress = total > 0 ? (paid / total) * 100 : 0

  return (
    <div
      onClick={onOpen}
      className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all cursor-pointer group active:scale-[0.98] relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 group-hover:bg-indigo-50/50 transition-colors" />

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex gap-4">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
            <FaUser />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg leading-tight group-hover:text-indigo-600 transition-colors">{bill.order.customer.name}</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{bill.order.customer.phone}</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${bill.status === 'paid' ? 'bg-emerald-500 text-white' :
          bill.status === 'partial' ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'
          }`}>
          {bill.status}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-1.5 mb-6 relative z-10">
        <button
          onClick={(e) => { e.stopPropagation(); onDownload(); }}
          className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-90"
          title="Download PDF"
        >
          <FaFileInvoiceDollar className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDownloadImage(); }}
          className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-90"
          title="Download Image"
        >
          <FaFileImage className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onWhatsApp(); }}
          className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all active:scale-90"
          title="Send via WhatsApp"
        >
          <FaWhatsapp className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all active:scale-90"
          title="Delete Bill"
        >
          <FaTrash className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-5 relative z-10">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Event Date</p>
            <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100">
              <FaCalendarAlt className="text-slate-400 text-[10px]" />
              {(() => {
                if (bill.order?.eventDate) return formatDate(bill.order.eventDate as any);
                const mealTypeAmounts = bill.order?.mealTypeAmounts as Record<string, any>;
                if (mealTypeAmounts && typeof mealTypeAmounts === 'object') {
                  const dates = Object.values(mealTypeAmounts)
                    .map(mt => mt?.date)
                    .filter(d => !!d)
                    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
                  if (dates.length > 0) return formatDate(dates[0]);
                }
                return formatDate(bill.createdAt as any);
              })()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Guests</p>
            <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5 justify-center bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100">
              <FaUsers className="text-slate-400 text-[10px]" />
              {getGuestCount(bill.order) || '-'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Bill Amount</p>
            <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5 justify-end bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100">
              {formatCurrency(bill.totalAmount)}
            </p>
          </div>
        </div>

        <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-indigo-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Paid</p>
            <p className="text-sm font-bold text-slate-700">{formatCurrency(bill.paidAmount)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Remaining</p>
            <p className="text-sm font-bold text-rose-600">{formatCurrency(bill.remainingAmount)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniDetail({ label, value, accent }: { label: string, value: string, accent?: 'red' }) {
  return (
    <div className="text-center">
      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">{label}</p>
      <p className={`text-xs font-bold ${accent === 'red' ? 'text-rose-600' : 'text-slate-700'}`}>{value}</p>
    </div>
  )
}

interface PaymentMethodProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

function PaymentMethod({ active, onClick, label }: PaymentMethodProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-3 rounded-xl font-bold transition-all ${active
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
    >
      {label}
    </button>
  );
}
