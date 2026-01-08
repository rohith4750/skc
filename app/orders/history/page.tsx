'use client'

import { useEffect, useState, useMemo } from 'react'
import { Storage } from '@/lib/storage-api'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Order } from '@/types'
import { FaTrash, FaFilePdf, FaFilter, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import jsPDF from 'jspdf'
import toast from 'react-hot-toast'
import ConfirmModal from '@/components/ConfirmModal'

export default function OrdersHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filterSupervisor, setFilterSupervisor] = useState<string>('all')
  const [supervisors, setSupervisors] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [allOrders, allSupervisors] = await Promise.all([
        Storage.getOrders(),
        Storage.getSupervisors(),
      ])
      setOrders(allOrders)
      setSupervisors(allSupervisors)
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load data. Please try again.')
    }
  }

  const filteredOrders = useMemo(() => {
    if (filterSupervisor === 'all') return orders
    return orders.filter((order: any) => order.supervisorId === filterSupervisor)
  }, [orders, filterSupervisor])

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex)

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filterSupervisor])

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, id })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return
    try {
      await Storage.deleteOrder(deleteConfirm.id)
      await loadData()
      toast.success('Order deleted successfully!')
      setDeleteConfirm({ isOpen: false, id: null })
    } catch (error) {
      console.error('Failed to delete order:', error)
      toast.error('Failed to delete order. Please try again.')
      setDeleteConfirm({ isOpen: false, id: null })
    }
  }

  const handleGeneratePDF = (order: any) => {
    const doc = new jsPDF()
    const customer = order.customer
    const supervisor = order.supervisor

    // Header
    doc.setFontSize(20)
    doc.text('CATERING ORDER', 105, 20, { align: 'center' })
    
    // Customer Information
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Customer Details:', 20, 35)
    doc.setFont('helvetica', 'normal')
    doc.text(`Name: ${customer?.name || 'N/A'}`, 20, 42)
    doc.text(`Phone: ${customer?.phone || 'N/A'}`, 20, 49)
    doc.text(`Email: ${customer?.email || 'N/A'}`, 20, 56)
    doc.text(`Address: ${customer?.address || 'N/A'}`, 20, 63)

    // Order Information
    doc.setFont('helvetica', 'bold')
    doc.text('Order Information:', 20, 75)
    doc.setFont('helvetica', 'normal')
    doc.text(`Date: ${formatDateTime(order.createdAt)}`, 20, 82)
    doc.text(`Supervisor: ${supervisor?.name || 'N/A'}`, 20, 89)
    doc.text(`Order ID: ${order.id.slice(0, 8).toUpperCase()}`, 20, 96)

    // Menu Items (without quantity)
    let yPos = 110
    doc.setFont('helvetica', 'bold')
    doc.text('Menu Items:', 20, yPos)
    yPos += 10
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    
    order.items.forEach((item: any, idx: number) => {
      const itemName = item.menuItem?.name || 'Unknown Item'
      
      // Check if we need a new page
      if (yPos > 270) {
        doc.addPage()
        yPos = 20
      }
      
      doc.text(`${idx + 1}. ${itemName}`, 20, yPos)
      yPos += 7
    })

    // Stalls (if any)
    if (order.stalls && Array.isArray(order.stalls) && order.stalls.length > 0) {
      yPos += 5
      if (yPos > 270) {
        doc.addPage()
        yPos = 20
      }
      doc.setFont('helvetica', 'bold')
      doc.text('Stalls:', 20, yPos)
      yPos += 7
      doc.setFont('helvetica', 'normal')
      
      order.stalls.forEach((stall: any, idx: number) => {
        if (yPos > 270) {
          doc.addPage()
          yPos = 20
        }
        doc.text(`${idx + 1}. ${stall.category}${stall.description ? ` - ${stall.description}` : ''}`, 20, yPos)
        yPos += 7
      })
    }

    // Financial Summary
    yPos += 10
    if (yPos > 270) {
      doc.addPage()
      yPos = 20
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Financial Summary:', 20, yPos)
    yPos += 10
    doc.setFont('helvetica', 'normal')
    
    if (order.discount && order.discount > 0) {
      doc.text(`Discount: ${formatCurrency(order.discount)}`, 20, yPos)
      yPos += 7
    }
    doc.text(`Total Amount: ${formatCurrency(order.totalAmount)}`, 20, yPos)
    yPos += 7
    doc.text(`Advance Paid: ${formatCurrency(order.advancePaid)}`, 20, yPos)
    yPos += 7
    doc.text(`Remaining Amount: ${formatCurrency(order.remainingAmount)}`, 20, yPos)

    doc.save(`order-${order.id.slice(0, 8)}.pdf`)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Orders History</h1>
        
        {/* Supervisor Filter */}
        <div className="flex items-center gap-3">
          <FaFilter className="text-gray-600" />
          <select
            value={filterSupervisor}
            onChange={(e) => setFilterSupervisor(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Supervisors</option>
            {supervisors.map((supervisor: any) => (
              <option key={supervisor.id} value={supervisor.id}>
                {supervisor.name}
              </option>
            ))}
          </select>
        </div>
      </div>

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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supervisor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meal Types</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Advance Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedOrders.map((order: any) => {
                  // Group items by meal type
                  const groupedItems: Record<string, any[]> = {}
                  order.items.forEach((item: any) => {
                    const mealType = item.menuItem?.type?.toLowerCase() || 'other'
                    if (!groupedItems[mealType]) {
                      groupedItems[mealType] = []
                    }
                    groupedItems[mealType].push(item)
                  })
                  const mealTypeAmounts = order.mealTypeAmounts as Record<string, { amount: number; date: string } | number> | null
                  
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.customer?.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{order.customer?.phone || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.supervisor?.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 space-y-1">
                          {Object.entries(groupedItems).map(([mealType, items]) => {
                            const mealTypeData = mealTypeAmounts?.[mealType]
                            const amount = typeof mealTypeData === 'object' && mealTypeData !== null ? mealTypeData.amount : (typeof mealTypeData === 'number' ? mealTypeData : null)
                            const date = typeof mealTypeData === 'object' && mealTypeData !== null ? mealTypeData.date : null
                            return (
                              <div key={mealType} className="flex items-center justify-between">
                                <span className="capitalize font-medium">{mealType}:</span>
                                <span className="ml-2 text-blue-600">{amount !== null ? formatCurrency(amount) : '-'}</span>
                                {date && <span className="ml-2 text-xs text-gray-500">({new Date(date).toLocaleDateString()})</span>}
                              </div>
                            )
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">
                          <div className="space-y-2">
                            {Object.entries(groupedItems).map(([mealType, items]) => (
                              <div key={mealType}>
                                <div className="font-medium text-xs text-gray-500 capitalize mb-1">{mealType}:</div>
                                <div className="text-xs text-gray-700">
                                  {items.slice(0, 3).map((item: any, idx: number) => (
                                    <div key={idx}>{item.menuItem?.name || 'Unknown'}</div>
                                  ))}
                                  {items.length > 3 && <div className="text-gray-500">+{items.length - 3} more</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{formatCurrency(order.totalAmount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">{formatCurrency(order.advancePaid)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-red-600">{formatCurrency(order.remainingAmount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleGeneratePDF(order)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded"
                            title="Download PDF"
                          >
                            <FaFilePdf />
                          </button>
                          <button
                            onClick={() => handleDelete(order.id)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded"
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
      {filteredOrders.length > itemsPerPage && (
        <div className="mt-4 flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow-md">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} orders
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === 1
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
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
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
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === totalPages
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
    </div>
  )
}
