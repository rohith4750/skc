"use client";
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { formatDateTime, formatDate, formatCurrency, sanitizeMealLabel, getOrderDate } from '@/lib/utils'
import { Order } from '@/types'
import {
  FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaFilePdf, FaFileImage,
  FaEnvelope, FaChartLine, FaCheckCircle, FaClock, FaTimesCircle,
  FaLayerGroup, FaCalendarAlt, FaHistory, FaMapMarkerAlt, FaUsers,
  FaBars, FaTimes, FaUtensils, FaChevronLeft, FaChevronRight, FaClipboardList
} from 'react-icons/fa'
import Link from 'next/link'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { buildOrderPdfHtml } from '@/lib/order-pdf-html'
import toast from 'react-hot-toast'
import ConfirmModal from '@/components/ConfirmModal'
import { getRequest, deleteRequest, putRequest } from '@/lib/api/api'
import { apiUrl } from '@/lib/api/apiUrl'

export default function QuotationsPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  })
  const [customerSearch, setCustomerSearch] = useState<string>('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const allOrders = await getRequest({ url: apiUrl.GET_getAllOrders }) as Order[]
      // Only show orders with 'quotation' status
      setOrders(allOrders.filter(order => order.status === 'quotation'))
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = useMemo(() => {
    let filtered = orders

    if (customerSearch) {
      const searchLower = customerSearch.toLowerCase()
      filtered = filtered.filter(order =>
        order.customer?.name?.toLowerCase().includes(searchLower) ||
        order.customer?.phone?.includes(customerSearch) ||
        (order as any).eventName?.toLowerCase().includes(searchLower)
      )
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [orders, customerSearch])

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage)

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, id })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return
    try {
      await deleteRequest({ url: apiUrl.DEL_deleteOrder(deleteConfirm.id) })
      toast.success('Quotation deleted successfully!')
      setDeleteConfirm({ isOpen: false, id: null })
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete quotation')
    }
  }

  const handleConvertToPending = async (id: string) => {
    try {
      await putRequest({
        url: apiUrl.PUT_updateOrder(id),
        data: { status: 'pending' }
      })
      toast.success('Converted to Order! It will now appear in Order Hub.')
      loadData()
    } catch (error: any) {
      toast.error('Failed to convert quotation')
    }
  }

  // --- PDF & IMAGE GENERATION ---
  const renderQuotationToPdf = async (order: Order): Promise<string | null> => {
    let tempDiv: HTMLDivElement | null = null;
    try {
      const htmlContent = buildOrderPdfHtml(order, {
        useEnglish: true,
        formatDate,
        showFinancials: true,
        formatCurrency,
        isQuotation: true
      })

      tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.width = '210mm'
      tempDiv.style.padding = '10mm'
      tempDiv.style.fontFamily = 'Poppins, sans-serif'
      tempDiv.style.background = 'white'
      tempDiv.innerHTML = htmlContent
      document.body.appendChild(tempDiv)

      await new Promise(r => setTimeout(r, 500))

      const w = tempDiv.scrollWidth
      const h = Math.max(tempDiv.scrollHeight + 20, 1)
      const canvas = await html2canvas(tempDiv, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: w,
        height: h,
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
      toast.error(`Failed to generate PDF: ${e.message}`)
      return null
    }
  }

  const renderQuotationToImage = async (order: Order): Promise<string | null> => {
    let tempDiv: HTMLDivElement | null = null;
    try {
      const htmlContent = buildOrderPdfHtml(order, {
        useEnglish: true,
        formatDate,
        showFinancials: true,
        formatCurrency,
        isQuotation: true
      })

      tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.width = '210mm'
      tempDiv.style.padding = '10mm'
      tempDiv.style.fontFamily = 'Poppins, sans-serif'
      tempDiv.style.background = 'white'
      tempDiv.innerHTML = htmlContent
      document.body.appendChild(tempDiv)

      await new Promise(r => setTimeout(r, 500))

      const w = tempDiv.scrollWidth
      const h = Math.max(tempDiv.scrollHeight + 20, 1)
      const canvas = await html2canvas(tempDiv, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: w,
        height: h,
      })

      if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv)
      tempDiv = null;

      return canvas.toDataURL('image/png')
    } catch (e: any) {
      if (tempDiv && document.body.contains(tempDiv)) document.body.removeChild(tempDiv)
      toast.error(`Failed to generate image: ${e.message}`)
      return null
    }
  }

  const handleViewPDF = async (order: Order) => {
    const toastId = toast.loading('Opening preview...')
    try {
      const pdfBase64 = await renderQuotationToPdf(order)
      if (pdfBase64) {
        const byteCharacters = atob(pdfBase64)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i)
        const byteArray = new Uint8Array(byteNumbers)
        const file = new Blob([byteArray], { type: 'application/pdf' })
        const fileURL = URL.createObjectURL(file)
        window.open(fileURL)
        toast.dismiss(toastId)
      }
    } catch (error) {
      toast.error('Error opening preview', { id: toastId })
    }
  }

  const handleDownloadPDF = async (order: Order) => {
    const toastId = toast.loading('Generating PDF...')
    try {
      const pdfBase64 = await renderQuotationToPdf(order)
      if (pdfBase64) {
          const link = document.createElement('a')
          link.href = `data:application/pdf;base64,${pdfBase64}`
          link.download = `SKC-Quotation-${order.customer?.name?.replace(/\s+/g, '-') || 'Draft'}.pdf`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          toast.success('PDF downloaded!', { id: toastId })
      }
    } catch (error) {
      toast.error('Error downloading PDF', { id: toastId })
    }
  }

  const handleDownloadImage = async (order: Order) => {
    const toastId = toast.loading('Generating Image...')
    try {
      const imageDataUrl = await renderQuotationToImage(order)
      if (imageDataUrl) {
          const link = document.createElement('a')
          link.href = imageDataUrl
          link.download = `SKC-Quotation-${order.customer?.name?.replace(/\s+/g, '-') || 'Draft'}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          toast.success('Image downloaded!', { id: toastId })
      }
    } catch (error) {
      toast.error('Error downloading image', { id: toastId })
    }
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-slate-50/50 min-h-screen pt-16 lg:pt-8">
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <FaClipboardList className="text-purple-600" /> Quotations
          </h1>
          <p className="text-slate-500 mt-1">Manage draft orders and unconfirmed event inquiries</p>
        </div>
        <Link
          href="/orders/create?status=quotation"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 active:scale-95 transition-all shadow-lg text-sm font-bold"
        >
          <FaPlus /> Create New Quotation
        </Link>
      </div>

      <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search by customer or event..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all shadow-sm"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                />
            </div>
            <div className="text-sm text-slate-500 font-medium">
                Showing {filteredOrders.length} quotation(s)
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Customer / Event</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Date / Sessions</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Estimated Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Created</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Loading quotations...</td></tr>
              ) : paginatedOrders.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No quotations found.</td></tr>
              ) : (
                paginatedOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{order.customer?.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-500 font-medium">{order.eventName || 'Untitled Event'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-700 font-semibold">{formatDate(getOrderDate(order))}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {order.mealTypeAmounts && Object.values(order.mealTypeAmounts).map((mt: any, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 text-[10px] rounded-full text-slate-500 font-bold uppercase">
                            {sanitizeMealLabel(mt.menuType || 'other')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-black text-slate-900">{formatCurrency(order.totalAmount)}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleViewPDF(order)}
                          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View PDF Preview"
                        >
                          <FaFilePdf className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(order)}
                          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <FaClipboardList className="w-4 h-4 text-purple-600" />
                        </button>
                        <button
                          onClick={() => handleDownloadImage(order)}
                          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Download Image"
                        >
                          <FaFileImage className="w-4 h-4 text-indigo-500" />
                        </button>
                        <div className="w-px h-4 bg-slate-200 self-center mx-1"></div>
                        <button
                          onClick={() => handleConvertToPending(order.id)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Convert to Confirmed Order"
                        >
                          <FaCheckCircle className="w-5 h-5" />
                        </button>
                        <Link
                          href={`/orders/edit/${order.id}`}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Quotation"
                        >
                          <FaEdit className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <FaTrash className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
            <div className="p-6 border-t border-slate-100 flex justify-center gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-10 h-10 rounded-xl font-bold transition-all ${
                            currentPage === i + 1 ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        {i + 1}
                    </button>
                ))}
            </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Quotation"
        message="Are you sure you want to delete this quotation? This action cannot be undone."
      />
    </div>
  )
}
