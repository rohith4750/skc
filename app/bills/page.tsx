'use client'

import { useEffect, useState, useMemo } from 'react'
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils'
import { Bill, Order, Customer } from '@/types'
import { FaPrint, FaCheck, FaEdit, FaFilter, FaChartLine, FaWallet, FaPercent, FaCalendarAlt } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { fetchWithLoader } from '@/lib/fetch-with-loader'
import Table from '@/components/Table'
import { getBillTableConfig } from '@/components/table-configs'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { generatePDFTemplate, PDFTemplateData } from '@/lib/pdf-template'

export default function BillsPage() {
  const [bills, setBills] = useState<Array<Bill & { order?: Order & { customer?: Customer } }>>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [editingBill, setEditingBill] = useState<Bill & { order?: Order & { customer?: Customer } } | null>(null)
  const [editFormData, setEditFormData] = useState({
    paidAmount: '',
    remainingAmount: '',
    status: 'pending' as 'pending' | 'partial' | 'paid'
  })
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
        console.warn(`[Bills Page] ⚠️ Found ${allBills.length - uniqueBills.length} duplicate bills!`)
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

  const handleEditBill = (bill: Bill & { order?: Order & { customer?: Customer } }) => {
    setEditingBill(bill)
    setEditFormData({
      paidAmount: bill.paidAmount.toString(),
      remainingAmount: bill.remainingAmount.toString(),
      status: bill.status as 'pending' | 'partial' | 'paid'
    })
  }

  const handleCloseEditModal = () => {
    setEditingBill(null)
    setEditFormData({
      paidAmount: '',
      remainingAmount: '',
      status: 'pending'
    })
  }

  const handleUpdateBill = async () => {
    if (!editingBill) return

    try {
      const paidAmount = parseFloat(editFormData.paidAmount) || 0
      const totalAmount = editingBill.totalAmount
      
      // Determine status based on paid amount (with small tolerance for floating point errors)
      let status: 'pending' | 'partial' | 'paid' = 'pending'
      const tolerance = 0.01 // Small tolerance for floating point comparison
      let remainingAmount = 0
      
      if (paidAmount <= tolerance) {
        status = 'pending'
        remainingAmount = totalAmount
      } else if (paidAmount >= (totalAmount - tolerance)) {
        status = 'paid'
        remainingAmount = 0
      } else {
        status = 'partial'
        remainingAmount = Math.max(0, totalAmount - paidAmount)
      }

      const response = await fetchWithLoader(`/api/bills/${editingBill.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paidAmount: paidAmount,
          remainingAmount: remainingAmount,
          status: status,
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
          b.id === editingBill.id 
            ? updatedBill  // Replace with complete updated bill (includes all relations)
            : b
        )
      )
      
      handleCloseEditModal()
      toast.success('Bill updated successfully!')
    } catch (error: any) {
      console.error('Failed to update bill:', error)
      toast.error(error.message || 'Failed to update bill. Please try again.')
    }
  }

  const handleGeneratePDF = async (bill: any) => {
    const order = bill.order
    const customer = order?.customer
    
    // Extract meal type amounts and organize meal details
    const mealTypeAmounts = order?.mealTypeAmounts as Record<string, { amount: number; date: string; services?: string[]; numberOfMembers?: number } | number> | null
    const stalls = order?.stalls as Array<{ category: string; description: string; cost: number }> | null
    const transportCost = parseFloat(order?.transportCost || '0') || 0
    
    // Extract meal details from mealTypeAmounts
    let tiffinsData: { persons?: number; rate?: number } = {}
    let lunchDinnerData: { type?: string; persons?: number; rate?: number } = {}
    let snacksData: { persons?: number; rate?: number } = {}
    
    if (mealTypeAmounts) {
      Object.entries(mealTypeAmounts).forEach(([mealType, data]) => {
        const mealData = typeof data === 'object' && data !== null ? data : { amount: typeof data === 'number' ? data : 0 }
        const persons = (typeof mealData === 'object' && mealData !== null && 'numberOfMembers' in mealData) ? (mealData.numberOfMembers || 0) : 0
        const amount = typeof mealData === 'object' && mealData !== null && 'amount' in mealData ? mealData.amount : (typeof data === 'number' ? data : 0)
        const rate = persons > 0 ? amount / persons : 0
        
        if (mealType.toLowerCase().includes('tiffin') || mealType.toLowerCase().includes('breakfast')) {
          tiffinsData = { persons, rate }
        } else if (mealType.toLowerCase().includes('lunch') || mealType.toLowerCase().includes('dinner')) {
          lunchDinnerData = { 
            type: mealType.toLowerCase().includes('lunch') ? 'Lunch' : 'Dinner',
            persons, 
            rate 
          }
        } else if (mealType.toLowerCase().includes('snack')) {
          snacksData = { persons, rate }
        }
      })
    }
    
    // Calculate extra amount from stalls
    const extraAmount = stalls?.reduce((sum, stall) => sum + (parseFloat(stall.cost?.toString() || '0') || 0), 0) || 0
    
    // Get first event date from mealTypeAmounts
    let functionDate = ''
    let functionTime = ''
    if (mealTypeAmounts) {
      const firstDate = Object.values(mealTypeAmounts).find(d => 
        typeof d === 'object' && d !== null && d.date
      ) as { date?: string } | undefined
      if (firstDate?.date) {
        functionDate = formatDate(firstDate.date)
        // Extract time if available (assuming format includes time)
        const dateObj = new Date(firstDate.date)
        if (!isNaN(dateObj.getTime())) {
          functionTime = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        }
      }
    }
    
    // Prepare PDF template data
    const pdfData: PDFTemplateData = {
      type: 'bill',
      billNumber: `BILL-${bill.id.slice(0, 8).toUpperCase()}`,
      date: bill.createdAt,
      customer: {
        name: customer?.name,
        phone: customer?.phone,
        email: customer?.email,
        address: customer?.address,
      },
      eventDetails: {
        eventName: order?.eventName || '',
        functionDate: functionDate,
        functionTime: functionTime,
        functionVenue: '', // Not stored in order, can be added later
      },
      mealDetails: {
        tiffins: tiffinsData.persons ? tiffinsData : undefined,
        lunchDinner: lunchDinnerData.persons ? lunchDinnerData : undefined,
        snacks: snacksData.persons ? snacksData : undefined,
      },
      mealTypeAmounts: mealTypeAmounts || undefined,
      stalls: stalls || undefined,
      discount: order?.discount || undefined,
      services: order?.services && Array.isArray(order.services) ? order.services : undefined,
      numberOfMembers: order?.numberOfMembers || undefined,
      financial: {
        transport: transportCost || undefined,
        extra: extraAmount > 0 ? extraAmount : undefined,
        totalAmount: bill.totalAmount,
        advancePaid: bill.advancePaid,
        balanceAmount: bill.remainingAmount,
        remainingAmount: bill.remainingAmount,
        paidAmount: bill.paidAmount,
        discount: order?.discount || undefined,
      },
      status: bill.status,
      orderId: order?.id,
      supervisor: order?.supervisor?.name,
    }
    
    // Generate HTML using template
    const htmlContent = generatePDFTemplate(pdfData)
    
    // Create a temporary HTML element to render properly
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.width = '210mm' // A4 width
    tempDiv.style.padding = '0'
    tempDiv.style.background = 'white'
    tempDiv.style.color = '#000'
    
    tempDiv.innerHTML = htmlContent
    document.body.appendChild(tempDiv)
    
    try {
      // Convert HTML to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: tempDiv.scrollWidth,
        height: tempDiv.scrollHeight,
      })
      
      // Remove temporary element
      document.body.removeChild(tempDiv)
      
      // Create PDF from canvas
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      
      let position = 0
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      
      pdf.save(`bill-${bill.id.slice(0, 8)}.pdf`)
      toast.success('Bill PDF generated successfully!')
    } catch (error) {
      if (document.body.contains(tempDiv)) {
        document.body.removeChild(tempDiv)
      }
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF. Please try again.')
    }
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
    if (dateRange.start) {
      filtered = filtered.filter(bill => {
        const billDate = new Date(bill.createdAt)
        const startDate = new Date(dateRange.start)
        return billDate >= startDate
      })
    }
    if (dateRange.end) {
      filtered = filtered.filter(bill => {
        const billDate = new Date(bill.createdAt)
        const endDate = new Date(dateRange.end)
        endDate.setHours(23, 59, 59, 999)
        return billDate <= endDate
      })
    }
    
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [bills, statusFilter, customerSearch, dateRange])

  const billSummary = useMemo(() => {
    const totalBilled = filteredBills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0)
    const totalCollected = filteredBills.reduce((sum, bill) => sum + (bill.paidAmount || 0), 0)
    const totalPending = filteredBills.reduce((sum, bill) => sum + (bill.remainingAmount || 0), 0)
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

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Bills</h1>
          <p className="text-gray-600 mt-2">Smart billing overview with event insights</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <FaFilter />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
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
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => {
                    setDateRange({ ...dateRange, start: e.target.value })
                    setCurrentPage(1)
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => {
                    setDateRange({ ...dateRange, end: e.target.value })
                    setCurrentPage(1)
                  }}
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
            <button
              onClick={() => handleEditBill(bill)}
              className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded"
              title="Edit Bill"
            >
              <FaEdit />
            </button>
            {bill.status !== 'paid' && (
              <button
                onClick={() => handleMarkPaid(bill.id)}
                className="text-primary-600 hover:text-primary-700 p-2 hover:bg-primary-50 rounded"
                title="Mark as Paid"
              >
                <FaCheck />
              </button>
            )}
            <button
              onClick={() => handleGeneratePDF(bill)}
              className="text-primary-600 hover:text-primary-700 p-2 hover:bg-primary-50 rounded"
              title="Generate PDF"
            >
              <FaPrint />
            </button>
          </div>
        )}
      />

      {/* Edit Bill Modal */}
      {editingBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Edit Bill Payment</h2>
              <p className="text-sm text-gray-600 mt-1">
                Bill #{editingBill.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Amount
                </label>
                <input
                  type="text"
                  value={formatCurrency(editingBill.totalAmount)}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paid Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={editingBill.totalAmount}
                  required
                  value={editFormData.paidAmount}
                  onChange={(e) => {
                    const paid = parseFloat(e.target.value) || 0
                    const total = editingBill.totalAmount
                    const remaining = Math.max(0, total - paid)
                    let status: 'pending' | 'partial' | 'paid' = 'pending'
                    if (paid === 0) {
                      status = 'pending'
                    } else if (paid >= total) {
                      status = 'paid'
                    } else {
                      status = 'partial'
                    }
                    setEditFormData({
                      paidAmount: e.target.value,
                      remainingAmount: remaining.toFixed(2),
                      status
                    })
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: {formatCurrency(editingBill.totalAmount)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remaining Amount
                </label>
                <input
                  type="text"
                  value={formatCurrency(parseFloat(editFormData.remainingAmount) || 0)}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    editFormData.status === 'paid' ? 'bg-green-100 text-green-800' :
                    editFormData.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {editFormData.status.charAt(0).toUpperCase() + editFormData.status.slice(1)}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Status is automatically calculated based on paid amount
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={handleCloseEditModal}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateBill}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Update Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
