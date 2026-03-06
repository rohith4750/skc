"use client";
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { formatDateTime, formatDate, formatCurrency, sanitizeMealLabel, getOrderDate } from '@/lib/utils'
import { Order } from '@/types'
import {
  FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaFilePdf, FaFileImage,
  FaEnvelope, FaChartLine, FaCheckCircle, FaClock, FaTimesCircle,
  FaCalendarAlt, FaHistory, FaLayerGroup, FaChevronLeft, FaChevronRight
} from 'react-icons/fa'
import Link from 'next/link'
import toast from 'react-hot-toast'
import ConfirmModal from '@/components/ConfirmModal'
import { getRequest, deleteRequest, putRequest } from '@/lib/api/api'
import { apiUrl } from '@/lib/api/apiUrl'

export default function OrdersListPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(15)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  })
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [customerSearch, setCustomerSearch] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const allOrders = await getRequest({ url: apiUrl.GET_getAllOrders }) as Order[]
      setOrders(allOrders)
    } catch (error) {
      console.error('Failed to load orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = useMemo(() => {
    let filtered = orders

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    if (customerSearch) {
      const searchLower = customerSearch.toLowerCase()
      filtered = filtered.filter(order =>
        order.customer?.name?.toLowerCase().includes(searchLower) ||
        order.customer?.phone?.includes(customerSearch) ||
        (order as any).eventName?.toLowerCase().includes(searchLower)
      )
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [orders, statusFilter, customerSearch])

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return
    try {
      await deleteRequest({ url: apiUrl.DEL_deleteOrder(id) })
      toast.success('Order deleted')
      loadData()
    } catch (error) {
      toast.error('Failed to delete order')
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800">Orders Management</h1>
          <p className="text-gray-500 mt-1">View and manage all catering orders in one place</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/orders/center"
            className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-bold flex items-center gap-2 transition-all"
          >
            <FaLayerGroup /> Order Hub
          </Link>
          <Link
            href="/orders/create"
            className="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-black shadow-lg shadow-primary-200 flex items-center gap-2 transition-all active:scale-95"
          >
            <FaPlus /> Create Order
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 relative">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer name, phone or event..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold text-gray-700"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Event</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-medium">Loading orders...</td></tr>
              ) : paginatedOrders.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-medium">No orders found matching your criteria</td></tr>
              ) : (
                paginatedOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-xs font-black text-gray-400">#{(order as any).serialNumber || order.id.slice(0, 8).toUpperCase()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">{order.customer?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{order.customer?.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-indigo-600">{(order as any).eventName || '-'}</div>
                      <div className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">{(order as any).eventType || 'Event'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-black text-gray-800">{formatCurrency(order.totalAmount)}</div>
                      <div className="text-[10px] text-red-500 font-bold">Due: {formatCurrency(order.remainingAmount)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest ${order.status === 'completed' ? 'bg-green-100 text-green-700' :
                          order.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-orange-100 text-orange-700'
                        }`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-500 whitespace-nowrap">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/orders/edit/${order.id}`}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <FaEdit size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <FaTrash size={16} />
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
          <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-2 hover:bg-white rounded-lg disabled:opacity-30 transition-all shadow-sm"
              >
                <FaChevronLeft className="text-gray-600" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-2 hover:bg-white rounded-lg disabled:opacity-30 transition-all shadow-sm"
              >
                <FaChevronRight className="text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
