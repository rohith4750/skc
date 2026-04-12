"use client";
import { useEffect, useState, useMemo } from 'react'
import { formatDateTime, formatDate, formatCurrency, sanitizeMealLabel, getOrderDate } from '@/lib/utils'
import { Order } from '@/types'
import { FaTrash, FaFilePdf, FaFileImage, FaChevronLeft, FaChevronRight, FaEdit, FaFilter, FaChartLine, FaClock, FaCheckCircle, FaTimesCircle, FaEnvelope, FaCalendarAlt, FaLayerGroup, FaPlus, FaSearch } from 'react-icons/fa'
import Link from 'next/link'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import toast from 'react-hot-toast'
import ConfirmModal from '@/components/ConfirmModal'
import MergeOrdersModal from '@/components/MergeOrdersModal'
import { buildOrderPdfHtml } from '@/lib/order-pdf-html'
import { getRequest, postRequest, putRequest, deleteRequest } from '@/lib/api/api'
import { apiUrl } from '@/lib/api/apiUrl'
import { motion, AnimatePresence } from 'framer-motion'

export default function OrderHistoryPage() {
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
  const [filterDate, setFilterDate] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [pdfLanguageModal, setPdfLanguageModal] = useState<{ isOpen: boolean; order: any | null }>({
    isOpen: false,
    order: null,
  })
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false)
  const [isMerging, setIsMerging] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const allOrders = await getRequest({ url: apiUrl.GET_getAllOrders }) as Order[]
      setOrders(allOrders)
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load data.')
    }
  }

  const filteredOrders = useMemo(() => {
    let filtered = orders
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter)
    } else {
      filtered = filtered.filter(order => ['completed', 'cancelled'].includes(order.status))
    }
    if (customerSearch) {
      const searchLower = customerSearch.toLowerCase()
      filtered = filtered.filter(order =>
        order.customer?.name?.toLowerCase().includes(searchLower) ||
        order.customer?.phone?.includes(customerSearch) ||
        (order as any).eventName?.toLowerCase().includes(searchLower)
      )
    }
    filtered = filtered.filter(order => {
      const orderDate = new Date(getOrderDate(order))
      if (filterDate) {
        const y = orderDate.getFullYear()
        const m = String(orderDate.getMonth() + 1).padStart(2, '0')
        const day = String(orderDate.getDate()).padStart(2, '0')
        return `${y}-${m}-${day}` === filterDate
      }
      return (orderDate.getMonth() + 1) === selectedMonth && orderDate.getFullYear() === selectedYear
    })
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [orders, statusFilter, customerSearch, selectedMonth, selectedYear, filterDate])

  const statusSummary = useMemo(() => {
    return {
      total: filteredOrders.length,
      completed: filteredOrders.filter(o => o.status === 'completed').length,
      cancelled: filteredOrders.filter(o => o.status === 'cancelled').length
    }
  }, [filteredOrders])

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage)

  const handleDelete = (id: string) => setDeleteConfirm({ isOpen: true, id })

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return
    try {
      await deleteRequest({ url: apiUrl.DEL_deleteOrder(deleteConfirm.id) })
      await loadData()
      toast.success('Archived record purged.')
      setDeleteConfirm({ isOpen: false, id: null })
    } catch { toast.error('Purge failure.') }
  }

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await putRequest({ url: apiUrl.PUT_updateOrder(orderId), data: { status: newStatus } })
      await loadData()
      toast.success('Status synchronized.')
    } catch { toast.error('Sync failure.') }
  }

  const toggleOrderSelection = (id: string) => {
    setSelectedOrderIds(prev => prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id])
  }

  const handleMergeConfirm = async (primaryOrderId: string) => {
    const secondaryOrderIds = selectedOrderIds.filter(id => id !== primaryOrderId)
    setIsMerging(true)
    try {
      await postRequest({ url: apiUrl.POST_mergeOrders, data: { primaryOrderId, secondaryOrderIds } })
      toast.success('Cluster merged.')
      setSelectedOrderIds([])
      setIsMergeModalOpen(false)
      loadData()
    } catch { toast.error('Merge failure.') } finally { setIsMerging(false) }
  }

  const generateAndDownloadPDF = async (order: any, language: 'english' | 'telugu') => {
    const html = buildOrderPdfHtml(order, { useEnglish: language === 'english', formatDate, showFinancials: true, formatCurrency })
    const tempDiv = document.createElement('div')
    tempDiv.style.width = '210mm'; tempDiv.style.padding = '15mm'; tempDiv.style.background = 'white';
    tempDiv.innerHTML = html; document.body.appendChild(tempDiv)
    const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true })
    document.body.removeChild(tempDiv)
    const pdf = new jsPDF('p', 'mm', 'a4')
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.8), 'JPEG', 0, 0, 210, (canvas.height * 210) / canvas.width)
    pdf.save(`SKC-ARCHIVE-${order.id.slice(0, 8)}.pdf`)
  }

  const generateAndDownloadImage = async (order: any) => {
    const html = buildOrderPdfHtml(order, { useEnglish: true, formatDate, showFinancials: true, formatCurrency })
    const tempDiv = document.createElement('div')
    tempDiv.style.width = '210mm'; tempDiv.style.padding = '15mm'; tempDiv.style.background = 'white';
    tempDiv.innerHTML = html; document.body.appendChild(tempDiv)
    const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true })
    document.body.removeChild(tempDiv)
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `SKC-ARCHIVE-${order.id.slice(0, 8)}.png`
    a.click()
  }

  return (
    <div className="p-4 md:p-8 bg-[#fafafa] min-h-screen pt-20">
      <div className="max-w-[1600px] mx-auto">
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Archive Vault</h1>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
              <FaLayerGroup className="opacity-40" /> Historical Operation Catalog
            </p>
          </div>
          <div className="flex gap-3">
             <button onClick={() => setShowFilters(!showFilters)} className={`px-6 py-3 rounded-xl font-black text-xs uppercase transition-all ${showFilters ? 'bg-gray-900 text-white shadow-xl' : 'bg-white border text-gray-400'}`}>
                <FaFilter className="inline mr-2" /> Global Scopes
             </button>
             {selectedOrderIds.length > 1 && (
               <button onClick={() => setIsMergeModalOpen(true)} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase shadow-lg">Merge Items ({selectedOrderIds.length})</button>
             )}
          </div>
        </header>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-10 overflow-hidden">
               <div className="v2-card p-8 bg-gray-900 grid grid-cols-1 md:grid-cols-4 gap-6 text-white border-none">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-amber-400 uppercase">Search Identity</label>
                    <input type="text" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-black outline-none focus:ring-1 focus:ring-amber-500" placeholder="Name/Phone..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-amber-400 uppercase">Archive Status</label>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-black outline-none uppercase">
                      <option value="all" className="bg-slate-900">Historical Logs</option>
                      <option value="completed" className="bg-slate-900">Completed</option>
                      <option value="cancelled" className="bg-slate-900">Cancelled</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-amber-400 uppercase">Timeline Key</label>
                    <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-black outline-none [color-scheme:dark]" />
                  </div>
                  <div className="flex items-end">
                    <button onClick={() => { setStatusFilter('all'); setCustomerSearch(''); setFilterDate(''); }} className="w-full h-11 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">Clear Scopes</button>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
           <div className="v2-card p-6 border-slate-50 shadow-sm"><p className="text-[9px] font-black text-gray-400 uppercase mb-2">Total Archive</p><p className="text-2xl font-black text-gray-900">{statusSummary.total}</p></div>
           <div className="v2-card p-6 border-slate-50 shadow-sm"><p className="text-[9px] font-black text-emerald-400 uppercase mb-2">Verified</p><p className="text-2xl font-black text-emerald-600">{statusSummary.completed}</p></div>
           <div className="v2-card p-6 border-slate-50 shadow-sm"><p className="text-[9px] font-black text-rose-400 uppercase mb-2">Terminated</p><p className="text-2xl font-black text-rose-600">{statusSummary.cancelled}</p></div>
           <div className="v2-card p-6 border-slate-50 shadow-sm"><p className="text-[9px] font-black text-amber-400 uppercase mb-2">Cluster Ready</p><p className="text-2xl font-black text-amber-600">{selectedOrderIds.length}</p></div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {paginatedOrders.length === 0 ? (
            <div className="col-span-full v2-card p-20 text-center opacity-40 uppercase font-black text-xs tracking-widest">No vault data found</div>
          ) : (
            paginatedOrders.map((order, idx) => (
              <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="v2-card p-8 bg-white flex flex-col group border-slate-200">
                <div className="flex justify-between items-start mb-6">
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                         <span className={`w-3 h-3 rounded-full ${order.status === 'completed' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                         <span className="text-[10px] font-black text-gray-400 uppercase">ID: {order.id.slice(0, 12)}</span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter truncate">{order.customer?.name || 'Walk-in Subject'}</h3>
                      <p className="text-[10px] font-black text-primary-600 uppercase mt-1">{(order as any).eventName || 'Audited Event'}</p>
                   </div>
                   <input type="checkbox" checked={selectedOrderIds.includes(order.id)} onChange={() => toggleOrderSelection(order.id)} className="w-6 h-6 border-2 border-slate-100 rounded-xl" />
                </div>
                
                <div className="flex items-center justify-between pt-6 border-t border-slate-50 mt-auto">
                   <div className="text-[10px] font-black text-slate-400 uppercase">Snapshot: {formatDate(order.createdAt)}</div>
                   <div className="flex gap-2">
                      <button onClick={() => generateAndDownloadPDF(order, 'english')} className="v2-btn-icon bg-slate-50 text-slate-500 hover:bg-primary-600 hover:text-white transition-all"><FaFilePdf size={14} /></button>
                      <button onClick={() => generateAndDownloadImage(order)} className="v2-btn-icon bg-slate-50 text-slate-500 hover:bg-indigo-600 hover:text-white transition-all"><FaFileImage size={14} /></button>
                      <button onClick={() => handleDelete(order.id)} className="v2-btn-icon bg-slate-50 text-rose-300 hover:bg-rose-600 hover:text-white transition-all"><FaTrash size={14} /></button>
                   </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <footer className="mt-12 flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-xl">
             <div className="text-[10px] font-black text-slate-400 uppercase">Vault Segment {currentPage} of {totalPages}</div>
             <div className="flex gap-2">
               <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-10 h-10 border rounded-xl flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity"><FaChevronLeft size={10} /></button>
               <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-10 h-10 border rounded-xl flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity"><FaChevronRight size={10} /></button>
             </div>
          </footer>
        )}
      </div>

      <ConfirmModal isOpen={deleteConfirm.isOpen} title="Purge Record" message="Irreversible data erasure. Proceed?" confirmText="Purge" onConfirm={confirmDelete} onCancel={() => setDeleteConfirm({ isOpen: false, id: null })} variant="danger" />
      <MergeOrdersModal isOpen={isMergeModalOpen} onClose={() => setIsMergeModalOpen(false)} selectedOrders={orders.filter(o => selectedOrderIds.includes(o.id))} onMerge={handleMergeConfirm} isMerging={isMerging} />
    </div>
  )
}
