"use client";
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDate, formatDateTime , getOrderDate} from '@/lib/utils'
import { Expense, Order } from '@/types'
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaFilter,
  FaDollarSign,
  FaSearch,
  FaCalendarAlt,
  FaChartBar,
  FaFileExport,
  FaTimes,
  FaCheckCircle,
  FaExclamationCircle,
  FaClock,
  FaUsers,
  FaUtensils,
  FaTruck,
  FaGasPump,
  FaStore,
  FaBox,
  FaPrint,
  FaLayerGroup,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa'
import toast from 'react-hot-toast'
import Table from '@/components/Table'
import ConfirmModal from '@/components/ConfirmModal'
import Link from 'next/link'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { generatePDFTemplate, PDFTemplateData } from '@/lib/pdf-template'

const EXPENSE_CATEGORIES = [
  'supervisor',
  'chef',
  'labours',
  'boys',
  'transport',
  'gas',
  'pan',
  'store',
  'other'
]

const CATEGORY_ICONS: Record<string, any> = {
  supervisor: FaUsers,
  chef: FaUtensils,
  transport: FaTruck,
  gas: FaGasPump,
  store: FaStore,
  other: FaBox,
}

const CATEGORY_COLORS: Record<string, string> = {
  supervisor: 'bg-blue-100 text-blue-800 border-blue-200',
  chef: 'bg-orange-100 text-orange-800 border-orange-200',
  labours: 'bg-purple-100 text-purple-800 border-purple-200',
  boys: 'bg-green-100 text-green-800 border-green-200',
  transport: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  gas: 'bg-red-100 text-red-800 border-red-200',
  pan: 'bg-pink-100 text-pink-800 border-pink-200',
  store: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200',
}

export default function ExpensesPage() {
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState<number>(10)
  const [showFilters, setShowFilters] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  })
  const [expandedBulkExpenseId, setExpandedBulkExpenseId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [expensesRes, ordersRes] = await Promise.all([
        fetch('/api/expenses'),
        fetch('/api/orders'),
      ])

      if (!expensesRes.ok) throw new Error('Failed to fetch expenses')
      if (!ordersRes.ok) throw new Error('Failed to fetch orders')

      const [allExpenses, allOrders] = await Promise.all([
        expensesRes.json(),
        ordersRes.json(),
      ])

      setExpenses(allExpenses)
      setOrders(allOrders)
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filteredExpenses = useMemo(() => {
    let filtered = expenses

    // Order filter
    if (selectedOrder !== 'all') {
      filtered = filtered.filter(expense => expense.orderId === selectedOrder)
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(expense => expense.category === selectedCategory)
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(expense =>
        expense.recipient?.toLowerCase().includes(searchLower) ||
        expense.description?.toLowerCase().includes(searchLower) ||
        expense.category.toLowerCase().includes(searchLower) ||
        expense.order?.customer?.name.toLowerCase().includes(searchLower)
      )
    }

    // Month/Year filter
    filtered = filtered.filter(expense => {
      const paymentDate = new Date(expense.paymentDate)
      return (paymentDate.getMonth() + 1) === selectedMonth && paymentDate.getFullYear() === selectedYear
    })

    return filtered.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
  }, [expenses, selectedOrder, selectedCategory, searchTerm, selectedMonth, selectedYear])

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  }, [filteredExpenses])

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    filteredExpenses.forEach(expense => {
      totals[expense.category] = (totals[expense.category] || 0) + expense.amount
    })
    return totals
  }, [filteredExpenses])

  const monthlyExpenses = useMemo(() => {
    const monthly: Record<string, number> = {}
    filteredExpenses.forEach(expense => {
      const month = new Date(expense.paymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      monthly[month] = (monthly[month] || 0) + expense.amount
    })
    return monthly
  }, [filteredExpenses])

  const handleEdit = (expense: Expense) => {
    router.push(`/expenses/create?id=${expense.id}`)
  }

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, id })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return
    try {
      const response = await fetch(`/api/expenses/${deleteConfirm.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete expense')
      }

      await loadData()
      toast.success('Expense deleted successfully!')
      setDeleteConfirm({ isOpen: false, id: null })
    } catch (error: any) {
      console.error('Failed to delete expense:', error)
      toast.error(error.message || 'Failed to delete expense. Please try again.')
      setDeleteConfirm({ isOpen: false, id: null })
    }
  }

  const handleMarkAsPaid = async (expense: Expense) => {
    try {
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: expense.orderId,
          category: expense.category,
          amount: expense.amount,
          paidAmount: expense.amount,
          paymentStatus: 'paid',
          description: expense.description,
          recipient: expense.recipient,
          paymentDate: expense.paymentDate,
          eventDate: expense.eventDate,
          notes: expense.notes,
          calculationDetails: expense.calculationDetails,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to mark expense as paid')
      }

      await loadData()
      toast.success('Expense marked as paid successfully!')
    } catch (error: any) {
      console.error('Failed to mark expense as paid:', error)
      toast.error(error.message || 'Failed to mark expense as paid. Please try again.')
    }
  }

  const clearFilters = () => {
    setSelectedOrder('all')
    setSelectedCategory('all')
    setSearchTerm('')
    setSelectedMonth(new Date().getMonth() + 1)
    setSelectedYear(new Date().getFullYear())
    setCurrentPage(1)
  }

  const handleGeneratePDF = async (expense: Expense) => {
    const customer = expense.order?.customer

    // Prepare PDF template data
    const pdfData: PDFTemplateData = {
      type: 'expense',
      billNumber: `EXP-${expense.id.slice(0, 8).toUpperCase()}`,
      date: expense.paymentDate || expense.createdAt,
      customer: customer ? {
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
      } : undefined,
      expenseDetails: {
        category: expense.category,
        recipient: expense.recipient || '',
        description: expense.description || '',
        amount: expense.amount,
        paidAmount: expense.paidAmount,
        paymentStatus: expense.paymentStatus as 'pending' | 'partial' | 'paid' || 'pending',
        paymentDate: expense.paymentDate,
        eventDate: expense.eventDate || undefined,
        notes: expense.notes || undefined,
        calculationDetails: expense.calculationDetails || undefined,
      },
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

      pdf.save(`expense-${expense.id.slice(0, 8)}.pdf`)
      toast.success('Expense receipt generated successfully!')
    } catch (error) {
      if (document.body.contains(tempDiv)) {
        document.body.removeChild(tempDiv)
      }
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF. Please try again.')
    }
  }

  const columns = [
    {
      key: 'paymentDate',
      header: 'Payment Date',
      accessor: (row: Expense) => (
        <div className="flex items-center gap-2">
          <FaCalendarAlt className="text-gray-400 text-sm" />
          <span className="font-medium">{formatDate(row.paymentDate)}</span>
        </div>
      ),
      className: 'whitespace-nowrap',
    },
    {
      key: 'category',
      header: 'Category',
      accessor: (row: Expense) => {
        const Icon = CATEGORY_ICONS[row.category] || FaBox
        return (
          <div className="flex flex-col gap-1">
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${CATEGORY_COLORS[row.category] || CATEGORY_COLORS.other}`}>
              <Icon className="text-xs" />
              {row.category.charAt(0).toUpperCase() + row.category.slice(1)}
            </span>
            {row.isBulkExpense && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 border border-indigo-200">
                <FaLayerGroup className="text-[10px]" />
                Bulk
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: 'order',
      header: 'Event/Order',
      accessor: (row: Expense) => {
        // Check if bulk expense
        if (row.isBulkExpense && row.bulkAllocations) {
          const allocations = row.bulkAllocations as any[]
          const isExpanded = expandedBulkExpenseId === row.id
          return (
            <div className="space-y-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setExpandedBulkExpenseId(isExpanded ? null : row.id)
                }}
                className="flex items-start gap-2 text-left w-full hover:bg-indigo-50 rounded p-1 -m-1 transition-colors"
              >
                <FaLayerGroup className="text-indigo-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-indigo-700 flex items-center gap-1">
                    Bulk: {allocations.length} events
                    {isExpanded ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
                  </div>
                  <div className="text-xs text-gray-500 truncate max-w-[200px]">
                    {allocations.slice(0, 2).map((a: any, i: number) => (
                      <span key={a.orderId}>
                        {a.orderName?.split(' - ')[0] || 'Unknown'}
                        {i < Math.min(allocations.length - 1, 1) && ', '}
                      </span>
                    ))}
                    {allocations.length > 2 && <span className="text-indigo-600"> +{allocations.length - 2} more</span>}
                  </div>
                </div>
              </button>
              {isExpanded && (
                <div className="bg-indigo-50 rounded-lg p-2 ml-5 border border-indigo-200">
                  <div className="text-xs font-semibold text-indigo-800 mb-1">
                    Allocation ({row.allocationMethod || 'manual'}):
                  </div>
                  <div className="space-y-1">
                    {allocations.map((a: any) => (
                      <div key={a.orderId} className="flex justify-between text-xs">
                        <span className="text-gray-700 truncate max-w-[140px]">{a.orderName?.split(' - ')[0] || 'Unknown'}</span>
                        <span className="font-medium text-indigo-700">{formatCurrency(a.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }
        if (row.order?.customer) {
          return (
            <div>
              <div className="text-sm font-medium text-gray-900">{row.order.customer.name}</div>
              <div className="text-xs text-gray-500">{formatDate(getOrderDate(row.order))}</div>
            </div>
          )
        }
        return <span className="text-gray-400 text-sm">No event</span>
      },
    },
    {
      key: 'recipient',
      header: 'Recipient',
      accessor: (row: Expense) => (
        <div className="max-w-xs">
          <div className="font-medium text-gray-900">{row.recipient || '-'}</div>
          {row.description && (
            <div className="text-xs text-gray-500 truncate">{row.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Details',
      accessor: (row: Expense) => {
        const details = row.calculationDetails as any
        if (details) {
          if (row.category === 'chef' && details.method === 'plate-wise') {
            return (
              <div className="text-sm">
                <div className="font-medium text-gray-900">{details.plates} plates</div>
                <div className="text-xs text-gray-500">@{formatCurrency(details.perPlateAmount)}/plate</div>
              </div>
            )
          } else if (row.category === 'labours') {
            return (
              <div className="text-sm">
                <div className="font-medium text-gray-900">{details.numberOfLabours} labours</div>
                <div className="text-xs text-gray-500">@{formatCurrency(details.perUnitAmount)}/each</div>
              </div>
            )
          } else if (row.category === 'boys') {
            return (
              <div className="text-sm">
                <div className="font-medium text-gray-900">{details.numberOfBoys} boys</div>
                <div className="text-xs text-gray-500">@{formatCurrency(details.perUnitAmount)}/each</div>
              </div>
            )
          }
        }
        return <span className="text-sm text-gray-600">{row.description || '-'}</span>
      },
    },
    {
      key: 'amount',
      header: 'Amount / Payment Status',
      accessor: (row: Expense) => {
        const paidAmount = row.paidAmount || 0
        const paymentStatus = row.paymentStatus || 'pending'
        const statusConfig = {
          paid: { color: 'bg-green-100 text-green-800', icon: FaCheckCircle, label: 'Paid' },
          partial: { color: 'bg-yellow-100 text-yellow-800', icon: FaExclamationCircle, label: 'Partial' },
          pending: { color: 'bg-red-100 text-red-800', icon: FaClock, label: 'Pending' },
        }
        const config = statusConfig[paymentStatus] || statusConfig.pending
        const Icon = config.icon

        return (
          <div className="text-right">
            <div className="font-bold text-lg text-green-600">{formatCurrency(row.amount)}</div>
            {paidAmount > 0 && (
              <div className="text-sm text-green-700 font-medium mt-1">
                Paid: {formatCurrency(paidAmount)}
              </div>
            )}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${config.color}`}>
              <Icon className="text-xs" />
              {config.label}
            </span>
          </div>
        )
      },
      className: 'text-right',
    },
  ]

  const activeFiltersCount = [
    selectedOrder !== 'all',
    selectedCategory !== 'all',
    searchTerm !== '',
    true, // Month/Year filter is always active
  ].filter(Boolean).length

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Expense Registry</h1>
          <p className="text-slate-500 mt-1">Track and manage business expenditures with precision</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 active:scale-95 transition-all shadow-sm text-sm"
          >
            <FaFilter className="w-4 h-4 text-slate-400" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="bg-indigo-600 text-white text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
          <Link
            href="/expenses/create"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 active:scale-95 transition-all shadow-lg text-sm flex-1 md:flex-initial font-bold"
          >
            <FaPlus className="w-3.5 h-3.5" />
            Add Expense
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Expenses</h3>
              <div className="bg-blue-50 p-2.5 rounded-xl">
                <FaDollarSign className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-black text-blue-600">{formatCurrency(totalExpenses)}</p>
          </div>
          <p className="text-xs font-medium text-slate-400 mt-4 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            {filteredExpenses.length} records found
          </p>
        </div>

        {Object.entries(categoryTotals)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([category, total]) => {
            const Icon = CATEGORY_ICONS[category] || FaBox
            const categoryColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.other
            const colorName = categoryColor.split('-')[1] // blue, orange, purple, etc.

            return (
              <div key={category} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider capitalize">{category}</h3>
                    <div className={`bg-${colorName}-50 p-2.5 rounded-xl`}>
                      <Icon className={`w-5 h-5 text-${colorName}-600`} />
                    </div>
                  </div>
                  <p className={`text-2xl font-black text-slate-800`}>{formatCurrency(total)}</p>
                </div>
                <p className="text-xs font-medium text-slate-400 mt-4 flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full bg-${colorName}-400`}></span>
                  {filteredExpenses.filter(e => e.category === category).length} items
                </p>
              </div>
            )
          })}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="max-w-7xl mx-auto mb-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FaFilter className="text-indigo-500" />
              Search & Filters
            </h3>
            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-bold uppercase tracking-wider"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setShowFilters(false)}
                className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="Search by recipient, description, category..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Month Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(parseInt(e.target.value))
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(parseInt(e.target.value))
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {[2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Order Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event/Order
              </label>
              <select
                value={selectedOrder}
                onChange={(e) => {
                  setSelectedOrder(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Events/Orders</option>
                {orders.map((order: any) => (
                  <option key={order.id} value={order.id}>
                    {order.customer?.name || 'Unknown'} - {formatDate(getOrderDate(order))}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setSelectedCategory('all')
                    setCurrentPage(1)
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === 'all'
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  All Categories
                </button>
                {EXPENSE_CATEGORIES.map(category => {
                  const Icon = CATEGORY_ICONS[category] || FaBox
                  return (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category)
                        setCurrentPage(1)
                      }}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${selectedCategory === category
                        ? `${CATEGORY_COLORS[category] || CATEGORY_COLORS.other} border-2`
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      <Icon className="text-xs" />
                      {category}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <Table
          columns={columns}
          data={filteredExpenses}
          emptyMessage="No expenses found. Click 'Add Expense' to add your first expense."
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          totalItems={filteredExpenses.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemName="expense"
          getItemId={(item: Expense) => item.id}
          renderActions={(expense: Expense) => {
            const paymentStatus = expense.paymentStatus || 'pending'
            const isPaid = paymentStatus === 'paid'

            return (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleGeneratePDF(expense)}
                  className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  title="Generate Receipt"
                >
                  <FaPrint />
                </button>
                {!isPaid && (
                  <button
                    onClick={() => handleMarkAsPaid(expense)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Mark as Paid"
                  >
                    <FaCheckCircle />
                  </button>
                )}
                <button
                  onClick={() => handleEdit(expense)}
                  className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDelete(expense.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <FaTrash />
                </button>
              </div>
            )
          }}
        />
      </div>

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        variant="danger"
      />
    </div>
  )
}
