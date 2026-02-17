'use client'

import { useEffect, useState, useMemo } from 'react'
import { formatCurrency, formatDateTime, formatDate, sendWhatsAppMessage } from '@/lib/utils'
import { Bill, Order, Customer } from '@/types'
import {
  FaPrint, FaCheck, FaEdit, FaFilter, FaChartLine, FaWallet,
  FaPercent, FaCalendarAlt, FaEnvelope, FaWhatsapp, FaFileImage,
  FaChevronLeft, FaChevronRight, FaHistory, FaPlus, FaUser, FaInfoCircle, FaFileInvoiceDollar, FaTimes
} from 'react-icons/fa'
import toast from 'react-hot-toast'
import { fetchWithLoader } from '@/lib/fetch-with-loader'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { generatePDFTemplate } from '@/lib/pdf-template'
import { buildOrderPdfHtml } from '@/lib/order-pdf-html'

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

export default function BillsPage() {
  const [bills, setBills] = useState<ExtendedBill[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBill, setSelectedBill] = useState<ExtendedBill | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    method: 'cash' as string,
    notes: ''
  })

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

      return customerName.includes(query) || phone.includes(query)
    })
  }, [bills, searchQuery])

  // Metrics
  const metrics = useMemo(() => {
    const total = bills.reduce((sum, b) => sum + Number(b.totalAmount), 0)
    const paid = bills.reduce((sum, b) => sum + Number(b.paidAmount), 0)
    const pending = bills.reduce((sum, b) => sum + Number(b.remainingAmount), 0)
    return { total, paid, pending, count: bills.length }
  }, [bills])

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

  // PDF Generation for Bills
  const renderBillToPdf = async (bill: ExtendedBill): Promise<string | null> => {
    if (!bill?.order) return null

    // Ensure order has items for PDF generation

    const htmlContent = buildOrderPdfHtml(bill.order, {
      useEnglish: true,
      formatDate,
      showFinancials: true,
      formatCurrency,
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

    await new Promise(r => setTimeout(r, 500))

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
    } catch (e) {
      if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv)
      console.error('PDF Generation Error:', e)
      toast.error('Failed to generate PDF')
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
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-all shadow-sm">
              <FaFilter className="text-slate-400" />
              Advanced Filters
            </button>
            <button
              onClick={loadBills}
              className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all"
            >
              <FaHistory className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Receivables"
            value={formatCurrency(metrics.total)}
            icon={<FaFileInvoiceDollar className="text-blue-500" />}
            color="blue"
            subtitle={`${metrics.count} active ledgers`}
          />
          <StatCard
            title="Successfully Collected"
            value={formatCurrency(metrics.paid)}
            icon={<FaWallet className="text-emerald-500" />}
            color="emerald"
            subtitle={`${((metrics.paid / (metrics.total || 1)) * 100).toFixed(1)}% collection rate`}
          />
          <StatCard
            title="Outstanding Balance"
            value={formatCurrency(metrics.pending)}
            icon={<FaChartLine className="text-orange-500" />}
            color="orange"
            subtitle="Follow-up required"
          />
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
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <FaCalendarAlt className="text-[10px]" />
                          {selectedBill.order.eventDate ? formatDate(selectedBill.order.eventDate as any) : 'No date'}
                        </p>
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
    </div >
  )
}

function StatCard({ title, value, icon, subtitle, color }: { title: string, value: string, icon: React.ReactNode, subtitle: string, color: string }) {
  const colorMap: any = {
    blue: "from-blue-50 to-indigo-50/50 border-blue-100",
    emerald: "from-emerald-50 to-teal-50/50 border-emerald-100",
    orange: "from-orange-50 to-amber-50/50 border-orange-100",
  }
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 group`}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-white rounded-2xl shadow-sm text-xl group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <FaInfoCircle className="text-slate-300 hover:text-slate-400 cursor-pointer" />
      </div>
      <h3 className="text-slate-500 text-sm font-semibold tracking-wide uppercase">{title}</h3>
      <p className="text-3xl font-black text-slate-900 mt-1">{value}</p>
      <p className="text-xs text-slate-400 mt-2 flex items-center gap-1 font-medium italic">
        {subtitle}
      </p>
    </div>
  )
}


function BillCard({ bill, onOpen }: { bill: ExtendedBill, onOpen: () => void }) {
  const total = Number(bill.totalAmount)
  const paid = Number(bill.paidAmount)
  const progress = total > 0 ? (paid / total) * 100 : 0

  return (
    <div
      onClick={onOpen}
      className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-[0_8px_30px_-15px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] hover:border-indigo-100 transition-all cursor-pointer group active:scale-[0.98]"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex gap-4">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 text-2xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
            <FaUser />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-lg leading-tight">{bill.order.customer.name}</h3>
            <p className="text-slate-400 text-sm mt-0.5">{bill.order.customer.phone}</p>
          </div>
        </div>
        <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${bill.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
          bill.status === 'partial' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
          }`}>
          {bill.status}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Event Date</p>
            <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <FaCalendarAlt className="text-slate-300" />
              {bill.order.eventDate ? formatDate(bill.order.eventDate as any) : formatDate(bill.createdAt as any)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Total</p>
            <p className="text-xl font-black text-slate-900">{formatCurrency(total)}</p>
          </div>
        </div>

        {/* Collection Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-400 italic">{progress.toFixed(0)}% Collected</span>
            <span className="text-rose-600">-{formatCurrency(Number(bill.remainingAmount))}</span>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${bill.status === 'paid' ? 'bg-emerald-500' : 'bg-indigo-500'
                }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <div className="flex-1" />
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                {i}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniDetail({ label, value, accent }: { label: string, value: string, accent?: 'red' | 'default' }) {
  return (
    <div>
      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter mb-0.5">{label}</p>
      <p className={`text-xs font-bold ${accent === 'red' ? 'text-rose-500' : 'text-slate-700'}`}>{value}</p>
    </div>
  )
}

function PaymentMethod({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`py-3 rounded-xl border-2 font-bold transition-all ${active ? 'bg-indigo-50 border-indigo-500 text-indigo-600 shadow-sm' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
        }`}
    >
      {label}
    </button>
  )
}
