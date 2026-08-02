"use client";
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDate, formatDateTime, getOrderDate } from '@/lib/utils'
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
  FaChevronUp,
  FaExternalLinkAlt,
  FaMoneyBillWave,
  FaChartPie,
  FaListUl,
  FaList,
  FaBuilding
} from 'react-icons/fa'
import { toast } from 'sonner'
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
  const [filterDate, setFilterDate] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState<number>(10)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'events' | 'items'>('events')
  const [eventModalOrderId, setEventModalOrderId] = useState<string | null>(null)
  const [expandedGroupedEventId, setExpandedGroupedEventId] = useState<string | null>(null)
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

    // Month/Year filter based strictly on paymentDate
    filtered = filtered.filter(expense => {
      const pDate = new Date(expense.paymentDate || expense.createdAt)

      // If specific date is set, check if it matches
      if (filterDate) {
        const y = pDate.getFullYear()
        const m = String(pDate.getMonth() + 1).padStart(2, '0')
        const day = String(pDate.getDate()).padStart(2, '0')
        return `${y}-${m}-${day}` === filterDate
      }

      // Check month and year
      return (pDate.getMonth() + 1) === selectedMonth && pDate.getFullYear() === selectedYear;
    })

    return filtered.sort((a, b) => {
      // Sort using the same target date logic
      const getSortDate = (exp: Expense) => {
        let d: string | Date | null | undefined = exp.eventDate
        if (!d && exp.order) d = getOrderDate(exp.order)
        if (!d) d = exp.paymentDate
        return new Date(d || exp.createdAt).getTime()
      }
      return getSortDate(b) - getSortDate(a)
    })
  }, [expenses, selectedOrder, selectedCategory, searchTerm, selectedMonth, selectedYear, filterDate])

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

  // Group expenses by Event/Order for Event-Based View
  const eventsGrouped = useMemo(() => {
    const groupedMap: Record<string, {
      orderId: string;
      order?: Order;
      customerName: string;
      eventDateStr: string;
      orderRevenue: number;
      expenses: Expense[];
      totalExpenses: number;
      categoryTotals: Record<string, number>;
      netProfit: number;
    }> = {}

    // Group filtered expenses by orderId
    filteredExpenses.forEach((expense) => {
      const orderId = expense.orderId || 'unassigned'
      if (!groupedMap[orderId]) {
        const order = expense.order || orders.find((o) => o.id === expense.orderId)
        const customerName = order?.customer?.name || order?.eventName || (orderId === 'unassigned' ? 'General / Overhead Expenses' : 'Catering Event')
        const eventDateStr = order ? formatDate(getOrderDate(order)) : (expense.paymentDate ? formatDate(expense.paymentDate) : 'General')
        const orderRevenue = order ? Number(order.totalAmount || 0) : 0

        groupedMap[orderId] = {
          orderId,
          order,
          customerName,
          eventDateStr,
          orderRevenue,
          expenses: [],
          totalExpenses: 0,
          categoryTotals: {},
          netProfit: 0,
        }
      }

      groupedMap[orderId].expenses.push(expense)
      groupedMap[orderId].totalExpenses += expense.amount
      groupedMap[orderId].categoryTotals[expense.category] = (groupedMap[orderId].categoryTotals[expense.category] || 0) + expense.amount
    })

    // Calculate net profit for each event group
    Object.values(groupedMap).forEach((group) => {
      group.netProfit = group.orderRevenue > 0 ? group.orderRevenue - group.totalExpenses : 0
    })

    return Object.values(groupedMap).sort((a, b) => b.totalExpenses - a.totalExpenses)
  }, [filteredExpenses, orders])

  const monthlyExpenses = useMemo(() => {
    const monthly: Record<string, number> = {}
    filteredExpenses.forEach(expense => {
      let targetDateStr: string | Date | null | undefined = expense.eventDate
      if (!targetDateStr && expense.order) {
        targetDateStr = getOrderDate(expense.order)
      }
      if (!targetDateStr) {
        targetDateStr = expense.paymentDate
      }

      const targetDate = new Date(targetDateStr || expense.createdAt)
      const month = targetDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      monthly[month] = (monthly[month] || 0) + expense.amount
    })
    return monthly
  }, [filteredExpenses])

  const handleEdit = (expense: Expense) => {
    router.push(`/expenses/edit/${expense.id}`)
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
    setFilterDate('')
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
        eventName: expense.order?.eventName || undefined,
        notes: expense.notes || undefined,
        calculationDetails: expense.calculationDetails || undefined,
        isBulkExpense: expense.isBulkExpense,
        bulkAllocations: expense.bulkAllocations as any[] || undefined,
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
        scale: 3,
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
      accessor: (row: Expense) => {
        const dateStr = row.paymentDate ? formatDate(row.paymentDate) : 'Not set';
        return (
          <div className="flex items-center gap-2">
            <FaCalendarAlt className="text-slate-400 text-sm" />
            <span className="font-medium text-slate-700">{dateStr}</span>
          </div>
        );
      },
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
                      <div key={a.orderId} className="flex justify-between items-center text-xs gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrder(a.orderId)
                            setCurrentPage(1)
                          }}
                          className="text-indigo-700 hover:text-indigo-900 font-medium truncate max-w-[130px] hover:underline text-left"
                          title="Filter expenses for this event"
                        >
                          {a.orderName?.split(' - ')[0] || 'Unknown'}
                          {row.allocationMethod === 'by-plates' && a.plates ? ` (${a.plates}p)` : ''}
                        </button>
                        <span className="font-bold text-indigo-800">{formatCurrency(a.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }
        if (row.order?.customer || row.orderId) {
          const eventTitle = row.order?.customer?.name || row.order?.eventName || 'Event Order'
          const eventDateStr = row.order ? formatDate(getOrderDate(row.order)) : ''
          const isCurrentSelected = selectedOrder === row.orderId

          return (
            <div className="flex items-center gap-1.5 group">
              <button
                type="button"
                onClick={() => {
                  if (row.orderId) setEventModalOrderId(row.orderId)
                  else setSelectedOrder(row.orderId || 'all')
                }}
                className={`text-left rounded-xl p-2 -m-1 transition-all border ${
                  isCurrentSelected
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                    : 'bg-slate-50/80 hover:bg-indigo-50 border-slate-200 hover:border-indigo-200 text-slate-900'
                }`}
                title="Click to view full categorized expense breakdown"
              >
                <div className="text-xs font-black text-indigo-900 flex items-center gap-1">
                  {eventTitle}
                  <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-medium">
                    Categorized View
                  </span>
                </div>
                {eventDateStr && (
                  <div className="text-[11px] text-slate-500 font-normal">{eventDateStr}</div>
                )}
              </button>

              {row.orderId && (
                <button
                  type="button"
                  onClick={() => setEventModalOrderId(row.orderId || null)}
                  className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200 bg-indigo-50"
                  title="Open Categorized Event Expense Modal"
                >
                  <FaChartPie className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )
        }
        return <span className="text-slate-400 text-sm italic">Unassigned</span>
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
              <div className="text-sm space-y-1">
                {(details.dressedBoys > 0 || details.nonDressedBoys > 0) && (
                  <div className="flex flex-col">
                    {details.dressedBoys > 0 && <span className="font-medium text-gray-900">{details.dressedBoys} Dressed ( @{formatCurrency(details.dressedBoyAmount)} )</span>}
                    {details.nonDressedBoys > 0 && <span className="font-medium text-gray-900">{details.nonDressedBoys} Non-Dressed ( @{formatCurrency(details.nonDressedBoyAmount)} )</span>}
                  </div>
                )}
                {(details.breakfastAmount > 0 || details.lunchAmount > 0 || details.snacksAmount > 0 || details.dinnerAmount > 0) && (
                  <div className="text-xs text-gray-500 grid grid-cols-2 gap-x-2 border-t border-gray-100 pt-1 mt-1">
                    {details.breakfastAmount > 0 && <span>BF: {formatCurrency(details.breakfastAmount)}</span>}
                    {details.lunchAmount > 0 && <span>LH: {formatCurrency(details.lunchAmount)}</span>}
                    {details.snacksAmount > 0 && <span>SN: {formatCurrency(details.snacksAmount)}</span>}
                    {details.dinnerAmount > 0 && <span>DN: {formatCurrency(details.dinnerAmount)}</span>}
                  </div>
                )}
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
      <div className="w-full mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
            href="/workforce/outstanding?from=expenses"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-lg text-sm flex-1 md:flex-initial font-bold"
          >
            <FaUsers className="w-3.5 h-3.5" />
            View Outstanding
          </Link>
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
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
        <div className="w-full mb-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

            {/* Specific Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Specific Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => {
                    setFilterDate(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {filterDate && (
                  <button
                    onClick={() => {
                      setFilterDate('')
                      setCurrentPage(1)
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 bg-white text-gray-400 hover:text-gray-600 focus:outline-none rounded-md"
                    title="Clear Specific Date"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Month Filter */}
            <div className={`transition-opacity ${filterDate ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
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
            <div className={`transition-opacity ${filterDate ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
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

      {/* Active Event Filter Banner */}
      {selectedOrder !== 'all' && (() => {
        const activeOrder = orders.find((o: any) => o.id === selectedOrder)
        const activeOrderName = activeOrder?.customer?.name || activeOrder?.eventName || 'Selected Event'
        const activeOrderDate = activeOrder ? formatDate(getOrderDate(activeOrder)) : ''

        return (
          <div className="w-full mb-6 bg-gradient-to-r from-indigo-900 to-indigo-800 text-white rounded-2xl p-5 shadow-lg border border-indigo-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-700/80 p-3 rounded-xl border border-indigo-500/30">
                <FaUtensils className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-widest text-indigo-300 font-bold">Event Expense Filter Active</span>
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
                    {filteredExpenses.length} Expense Items
                  </span>
                </div>
                <h3 className="text-xl font-black tracking-tight text-white mt-0.5">
                  {activeOrderName} {activeOrderDate && <span className="text-sm font-normal text-indigo-200">({activeOrderDate})</span>}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <Link
                href={`/orders/summary/${selectedOrder}`}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-700/80 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all border border-indigo-500/40"
              >
                <FaExternalLinkAlt className="w-3 h-3" /> View Event Summary
              </Link>
              <button
                onClick={() => setSelectedOrder('all')}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md active:scale-95"
              >
                <FaTimes className="w-3 h-3" /> Reset Filter
              </button>
            </div>
          </div>
        )
      })()}

      {/* View Mode Switcher Header */}
      <div className="w-full mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('events')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'events'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FaUtensils className="w-3.5 h-3.5 text-amber-400" />
            <span>Event-Based View ({eventsGrouped.length} Events)</span>
          </button>
          <button
            onClick={() => setViewMode('items')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'items'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FaListUl className="w-3.5 h-3.5 text-indigo-400" />
            <span>Itemized List View ({filteredExpenses.length} Items)</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          {viewMode === 'events'
            ? 'Click any event card to view/expand all expense categories'
            : 'Showing flat itemized list of all expense records'}
        </div>
      </div>

      {/* EVENT-BASED CATEGORIZED VIEW */}
      {viewMode === 'events' && (
        <div className="space-y-4 mb-8">
          {eventsGrouped.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 text-slate-500">
              No events found matching your filter criteria.
            </div>
          ) : (
            eventsGrouped.map((group) => {
              const isExpanded = expandedGroupedEventId === group.orderId

              return (
                <div key={group.orderId} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
                  {/* Event Card Header (Light Mode Design) */}
                  <div
                    onClick={() => setExpandedGroupedEventId(isExpanded ? null : group.orderId)}
                    className="p-5 bg-white hover:bg-slate-50/90 text-slate-900 cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all border-b border-slate-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-indigo-50 text-indigo-600 p-3 rounded-[5px] border border-indigo-100 shadow-xs">
                        <FaUtensils className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase tracking-widest text-indigo-600 font-black">Catering Function</span>
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-[5px] font-bold border border-slate-200">
                            {group.expenses.length} Expense Item(s)
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mt-0.5 flex items-center gap-2">
                          {group.customerName}
                          <span className="text-sm font-normal text-slate-500">({group.eventDateStr})</span>
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-200 pt-3 md:pt-0">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Total Event Expenses</span>
                        <span className="text-2xl font-black text-rose-600">{formatCurrency(group.totalExpenses)}</span>
                      </div>

                      {group.orderRevenue > 0 && (
                        <div className="text-right border-l border-slate-200 pl-6">
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Net Profit</span>
                          <span className={`text-2xl font-black ${group.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatCurrency(group.netProfit)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {group.orderId !== 'unassigned' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEventModalOrderId(group.orderId)
                            }}
                            className="px-3 py-1.5 bg-amber-500 text-white font-black text-xs rounded-[5px] hover:bg-amber-600 transition-all shadow-xs flex items-center gap-1"
                            title="Open Categorized Breakdown Window"
                          >
                            <FaChartPie className="w-3.5 h-3.5" />
                            <span>Categorized Modal</span>
                          </button>
                        )}
                        <button
                          type="button"
                          className="p-2.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-[5px] hover:bg-slate-200 transition-colors"
                        >
                          {isExpanded ? <FaChevronUp className="w-4 h-4" /> : <FaChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expense Categories Quick Badges Bar */}
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Incurred Categories:</span>
                      {Object.entries(group.categoryTotals).map(([cat, amount]) => {
                        const Icon = CATEGORY_ICONS[cat] || FaBox
                        const colorClass = CATEGORY_COLORS[cat] || CATEGORY_COLORS.other

                        return (
                          <span key={cat} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border capitalize shadow-xs ${colorClass}`}>
                            <Icon className="text-xs" />
                            {cat}: {formatCurrency(amount)}
                          </span>
                        )
                      })}
                    </div>

                    <div className="flex items-center gap-2">
                      {group.orderId !== 'unassigned' && (
                        <Link
                          href={`/expenses/create?orderId=${group.orderId}`}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                        >
                          <FaPlus className="w-3 h-3" /> Add Expense
                        </Link>
                      )}
                      <button
                        onClick={() => setExpandedGroupedEventId(isExpanded ? null : group.orderId)}
                        className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 font-bold text-xs rounded-xl transition-all flex items-center gap-1"
                      >
                        {isExpanded ? 'Hide Expense Items' : `Show All ${group.expenses.length} Expense Items`}
                        {isExpanded ? <FaChevronUp className="text-xs ml-1" /> : <FaChevronDown className="text-xs ml-1" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Itemized Table for this Event */}
                  {isExpanded && (
                    <div className="p-5 bg-white space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <FaListUl className="text-indigo-600" /> Itemized Expenses for {group.customerName}
                      </h4>
                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                            <tr>
                              <th className="p-3">Payment Date</th>
                              <th className="p-3">Category</th>
                              <th className="p-3">Recipient / Details</th>
                              <th className="p-3 text-right">Amount</th>
                              <th className="p-3 text-center">Status</th>
                              <th className="p-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {group.expenses.map((expense) => {
                              const Icon = CATEGORY_ICONS[expense.category] || FaBox
                              const colorClass = CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.other
                              const isPaid = expense.paymentStatus === 'paid'

                              return (
                                <tr key={expense.id} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="p-3 font-semibold text-slate-900">
                                    {expense.paymentDate ? formatDate(expense.paymentDate) : 'No date'}
                                  </td>
                                  <td className="p-3">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${colorClass}`}>
                                      <Icon className="text-xs" />
                                      {expense.category}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <div className="font-bold text-slate-900">{expense.recipient || '-'}</div>
                                    {expense.description && (
                                      <div className="text-[11px] text-slate-500 italic">{expense.description}</div>
                                    )}
                                  </td>
                                  <td className="p-3 text-right font-black text-slate-900 text-sm">
                                    {formatCurrency(expense.amount)}
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                      {isPaid ? 'Paid' : 'Pending'}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        onClick={() => handleGeneratePDF(expense)}
                                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
                                        title="Print Receipt"
                                      >
                                        <FaPrint />
                                      </button>
                                      <button
                                        onClick={() => handleEdit(expense)}
                                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                                        title="Edit"
                                      >
                                        <FaEdit />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(expense.id)}
                                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
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
                </div>
              )
            })
          )}
        </div>
      )}

      {/* FLAT ITEMIZED LIST VIEW */}
      {viewMode === 'items' && (
        <>
          {/* Desktop Table View */}
      <div className="hidden sm:block bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
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

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-4 pb-20">
        {filteredExpenses.length === 0 && !loading && (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
            <p className="text-gray-500">No expenses found.</p>
          </div>
        )}
        {filteredExpenses
          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
          .map((expense: Expense) => {
            const Icon = CATEGORY_ICONS[expense.category] || FaBox
            const colorClass = CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.other
            const isPaid = expense.paymentStatus === 'paid'

            return (
              <div key={expense.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 active:scale-[0.98] transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 leading-tight capitalize">{expense.category}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        {expense.paymentDate ? formatDate(expense.paymentDate) : 'No date'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900">{formatCurrency(expense.amount)}</p>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {expense.paymentStatus || 'pending'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipient</span>
                    <span className="text-xs font-bold text-slate-700">{expense.recipient || '-'}</span>
                  </div>
                  {expense.order?.customer && (
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Event</span>
                      <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]">
                        {expense.order.customer.name}
                      </span>
                    </div>
                  )}
                  {expense.description && (
                    <div className="pt-2 border-t border-slate-200/50">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Description</p>
                      <p className="text-xs text-slate-600 leading-relaxed italic line-clamp-2">{expense.description}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => handleGeneratePDF(expense)}
                    className="flex flex-col items-center gap-1.5 p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100"
                  >
                    <FaPrint size={14} />
                    <span className="text-[9px] font-bold uppercase">Bill</span>
                  </button>
                  {!isPaid && (
                    <button
                      onClick={() => handleMarkAsPaid(expense)}
                      className="flex flex-col items-center gap-1.5 p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100"
                    >
                      <FaCheckCircle size={14} />
                      <span className="text-[9px] font-bold uppercase">Pay</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(expense)}
                    className="flex flex-col items-center gap-1.5 p-2 bg-yellow-50 text-yellow-600 rounded-xl hover:bg-yellow-100"
                  >
                    <FaEdit size={14} />
                    <span className="text-[9px] font-bold uppercase">Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="flex flex-col items-center gap-1.5 p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100"
                  >
                    <FaTrash size={14} />
                    <span className="text-[9px] font-bold uppercase">Del</span>
                  </button>
                </div>
              </div>
            )
          })}

        {/* Mobile Pagination */}
        {filteredExpenses.length > itemsPerPage && (
          <div className="flex items-center justify-between px-2 pt-4 pb-20">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-3 bg-white rounded-xl border border-slate-200 text-slate-600 disabled:opacity-30"
            >
              <FaChevronDown className="rotate-90" />
            </button>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Page {currentPage} of {Math.ceil(filteredExpenses.length / itemsPerPage)}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredExpenses.length / itemsPerPage), p + 1))}
              disabled={currentPage >= Math.ceil(filteredExpenses.length / itemsPerPage)}
              className="p-3 bg-white rounded-xl border border-slate-200 text-slate-600 disabled:opacity-30"
            >
              <FaChevronDown className="-rotate-90" />
            </button>
          </div>
        )}
      </div>
      </>
      )}

      {/* Categorized Event Expense Breakdown Modal */}
      {eventModalOrderId && (() => {
        const modalOrder = orders.find((o: any) => o.id === eventModalOrderId)
        const modalExpenses = expenses.filter((e: any) => e.orderId === eventModalOrderId)
        const customerName = modalOrder?.customer?.name || modalOrder?.eventName || 'Event'
        const eventDateStr = modalOrder ? formatDate(getOrderDate(modalOrder)) : 'N/A'
        const totalOrderBill = modalOrder ? Number(modalOrder.totalAmount || 0) : 0
        const totalEventExpenses = modalExpenses.reduce((sum, e) => sum + e.amount, 0)
        const netProfit = totalOrderBill > 0 ? totalOrderBill - totalEventExpenses : 0
        const marginPct = totalOrderBill > 0 ? ((netProfit / totalOrderBill) * 100).toFixed(1) : '0'

        // Group expenses by category for this event
        const categoryMap: Record<string, { total: number; items: Expense[] }> = {}
        modalExpenses.forEach((exp) => {
          if (!categoryMap[exp.category]) {
            categoryMap[exp.category] = { total: 0, items: [] }
          }
          categoryMap[exp.category].total += exp.amount
          categoryMap[exp.category].items.push(exp)
        })

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col my-auto">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-t-3xl flex justify-between items-center sticky top-0 z-10 shadow-md">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                      Event Expense Breakdown
                    </span>
                    <span className="text-xs text-indigo-200 font-medium">🗓️ {eventDateStr}</span>
                  </div>
                  <h2 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
                    <FaUtensils className="text-amber-400 w-5 h-5" />
                    {customerName}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/orders/summary/${eventModalOrderId}`}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <FaExternalLinkAlt className="w-3 h-3" /> View Order Bill
                  </Link>
                  <button
                    onClick={() => setEventModalOrderId(null)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 flex-1">
                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Order Revenue (Bill)</span>
                    <p className="text-2xl font-black text-blue-700 mt-1">{formatCurrency(totalOrderBill)}</p>
                  </div>
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
                    <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Total Event Expenses</span>
                    <p className="text-2xl font-black text-rose-700 mt-1">{formatCurrency(totalEventExpenses)}</p>
                  </div>
                  <div className={`border rounded-2xl p-4 ${netProfit >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <span className={`text-xs font-bold uppercase tracking-wider ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      Estimated Net Profit
                    </span>
                    <div className="flex items-baseline justify-between mt-1">
                      <p className={`text-2xl font-black ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        {formatCurrency(netProfit)}
                      </p>
                      {totalOrderBill > 0 && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${netProfit >= 0 ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'}`}>
                          {marginPct}% margin
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Categorized Summary Badges Grid */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <FaChartPie className="text-indigo-600" /> Categorized Expense Totals
                    </h3>
                    <Link
                      href={`/expenses/create?orderId=${eventModalOrderId}`}
                      className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center gap-1.5"
                    >
                      <FaPlus className="w-3 h-3" /> Add Expense to Event
                    </Link>
                  </div>

                  {Object.keys(categoryMap).length === 0 ? (
                    <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-200 text-slate-500">
                      No expenses recorded for this event yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {Object.entries(categoryMap).map(([cat, data]) => {
                        const Icon = CATEGORY_ICONS[cat] || FaBox
                        const colorClass = CATEGORY_COLORS[cat] || CATEGORY_COLORS.other

                        return (
                          <div key={cat} className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${colorClass}`}>
                                <Icon className="text-xs" />
                                {cat}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">{data.items.length} item(s)</span>
                            </div>
                            <p className="text-lg font-black text-slate-900">{formatCurrency(data.total)}</p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Itemized Expenses Table */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FaListUl className="text-indigo-600" /> All Event Expenses ({modalExpenses.length})
                  </h3>
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="divide-y divide-slate-100">
                      {modalExpenses.map((expense) => {
                        const Icon = CATEGORY_ICONS[expense.category] || FaBox
                        const colorClass = CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.other
                        const isPaid = expense.paymentStatus === 'paid'

                        return (
                          <div key={expense.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex items-start gap-3">
                              <div className={`p-2.5 rounded-xl mt-0.5 ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]}`}>
                                <Icon className="text-base" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 capitalize">{expense.category}</span>
                                  <span className="text-xs text-slate-500 font-medium">({expense.recipient || 'Recipient unassigned'})</span>
                                </div>
                                {expense.description && (
                                  <p className="text-xs text-slate-600 mt-0.5">{expense.description}</p>
                                )}
                                <p className="text-[10px] text-slate-400 mt-1">
                                  Date: {expense.paymentDate ? formatDate(expense.paymentDate) : 'No date'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                              <div className="text-left sm:text-right">
                                <p className="font-black text-slate-900 text-base">{formatCurrency(expense.amount)}</p>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {isPaid ? 'Paid' : 'Pending'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleGeneratePDF(expense)}
                                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                  title="Print Receipt"
                                >
                                  <FaPrint />
                                </button>
                                <button
                                  onClick={() => handleEdit(expense)}
                                  className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                                  title="Edit"
                                >
                                  <FaEdit />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

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

