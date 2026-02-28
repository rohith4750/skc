"use client";
import { useEffect, useState, useMemo } from 'react'
import { FaEdit, FaTrash, FaUtensils, FaUserTie, FaTruck, FaDollarSign, FaReceipt, FaChevronDown, FaChevronUp, FaUsers, FaUserFriends, FaFilter, FaSearch, FaTimes, FaCheckCircle, FaExclamationCircle, FaClock, FaGasPump, FaBox, FaStore, FaCircle, FaPlus, FaPrint, FaImage } from 'react-icons/fa'
import toast from 'react-hot-toast'
import Table from '@/components/Table'
import ConfirmModal from '@/components/ConfirmModal'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { generatePDFTemplate, PDFTemplateData } from '@/lib/pdf-template'

interface Workforce {
  id: string
  name: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  expenses?: any[]
  totalAmount?: number
  totalPaidAmount?: number
  expenseCount?: number
  pendingExpenses?: number
  partialExpenses?: number
  paidExpenses?: number
  overallPaymentStatus?: 'pending' | 'partial' | 'paid'
}

const roleIcons: Record<string, any> = {
  chef: FaUtensils,
  supervisor: FaUserTie,
  transport: FaTruck,
  boys: FaUsers,
  labours: FaUserFriends,
  gas: FaGasPump,
  pan: FaBox,
  store: FaStore,
  other: FaCircle,
}

const roleColors: Record<string, string> = {
  chef: 'bg-orange-100 text-orange-800',
  supervisor: 'bg-green-100 text-green-800',
  transport: 'bg-yellow-100 text-yellow-800',
  boys: 'bg-purple-100 text-purple-800',
  labours: 'bg-indigo-100 text-indigo-800',
  gas: 'bg-red-100 text-red-800',
  pan: 'bg-pink-100 text-pink-800',
  store: 'bg-indigo-100 text-indigo-800',
  other: 'bg-gray-100 text-gray-800',
}

const CATEGORY_COLORS: Record<string, string> = {
  supervisor: 'bg-blue-100 text-blue-800',
  chef: 'bg-orange-100 text-orange-800',
  labours: 'bg-purple-100 text-purple-800',
  boys: 'bg-green-100 text-green-800',
  transport: 'bg-yellow-100 text-yellow-800',
  gas: 'bg-red-100 text-red-800',
  pan: 'bg-pink-100 text-pink-800',
  store: 'bg-indigo-100 text-indigo-800',
  other: 'bg-gray-100 text-gray-800',
}

const WORKFORCE_ROLES = ['supervisor', 'chef', 'labours', 'boys', 'transport', 'gas', 'pan', 'store', 'other']

// Helper function to get week number
const getWeekNumber = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

export default function WorkforcePage() {
  const [workforce, setWorkforce] = useState<Workforce[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  })
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [datePeriodType, setDatePeriodType] = useState<'all' | 'day' | 'week' | 'month'>('all')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [selectedWeek, setSelectedWeek] = useState<string>('')

  useEffect(() => {
    loadWorkforce()
  }, [])

  const [workforcePayments, setWorkforcePayments] = useState<any[]>([])
  const [clearingPayments, setClearingPayments] = useState(false)

  const loadWorkforce = async () => {
    try {
      const response = await fetch('/api/workforce')
      if (!response.ok) throw new Error('Failed to fetch workforce')
      const data = await response.json()
      setWorkforce(data.workforce || data)
      setWorkforcePayments(data.workforcePayments || [])
    } catch (error: any) {
      console.error('Failed to load workforce:', error)
      toast.error('Failed to load workforce. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleEdit = (member: Workforce) => {
    // Navigate to create page with edit mode
    window.location.href = `/workforce/create?id=${member.id}`
  }

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, id })
  }

  const handleGeneratePDF = async (member: Workforce) => {
    // Prepare expense items for PDF
    const expenseItems = (member.expenses || []).map((exp: any) => ({
      date: exp.paymentDate || exp.createdAt,
      amount: exp.amount || 0,
      description: exp.description || '',
      status: exp.paymentStatus || 'pending',
      orderName: exp.order?.eventName,
      customerName: exp.order?.customer?.name,
      venueAddress: exp.order?.venueAddress,
      calculationDetails: exp.calculationDetails,
      isBulkExpense: exp.isBulkExpense,
      bulkAllocations: exp.bulkAllocations,
    }))

    // Prepare PDF template data
    const pdfData: PDFTemplateData = {
      type: 'workforce',
      billNumber: `WF-${member.id.slice(0, 8).toUpperCase()}`,
      date: new Date().toISOString(),
      workforceDetails: {
        name: member.name || 'Unknown',
        role: member.role,
        totalAmount: member.totalAmount || 0,
        totalPaid: member.totalPaidAmount || 0,
        expenses: expenseItems,
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

      pdf.save(`workforce-${member.id.slice(0, 8)}.pdf`)
      toast.success('Workforce receipt generated successfully!')
    } catch (error) {
      if (document.body.contains(tempDiv)) {
        document.body.removeChild(tempDiv)
      }
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF. Please try again.')
    }
  }

  const handleDownloadImage = async (member: Workforce) => {
    // Prepare expense items for PDF (reusing logic from handleGeneratePDF)
    const expenseItems = (member.expenses || []).map((exp: any) => ({
      date: exp.paymentDate || exp.createdAt,
      amount: exp.amount || 0,
      description: exp.description || '',
      status: exp.paymentStatus || 'pending',
      orderName: exp.order?.eventName,
      customerName: exp.order?.customer?.name,
      venueAddress: exp.order?.venueAddress,
      calculationDetails: exp.calculationDetails,
      isBulkExpense: exp.isBulkExpense,
      bulkAllocations: exp.bulkAllocations,
    }))

    // Prepare PDF template data
    const pdfData: PDFTemplateData = {
      type: 'workforce',
      billNumber: `WF-${member.id.slice(0, 8).toUpperCase()}`,
      date: new Date().toISOString(),
      workforceDetails: {
        name: member.name || 'Unknown',
        role: member.role,
        totalAmount: member.totalAmount || 0,
        totalPaid: member.totalPaidAmount || 0,
        expenses: expenseItems,
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

      // Download as Image
      const imgData = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = imgData
      link.download = `workforce-receipt-${member.name.replace(/\s+/g, '-').toLowerCase()}-${member.id.slice(0, 8)}.png`
      link.click()

      toast.success('Workforce receipt downloaded as image!')
    } catch (error) {
      if (document.body.contains(tempDiv)) {
        document.body.removeChild(tempDiv)
      }
      console.error('Error downloading image:', error)
      toast.error('Failed to download image. Please try again.')
    }
  }

  const handleClearPayments = async () => {
    if (workforce.length > 0) return
    setClearingPayments(true)
    try {
      const res = await fetch('/api/workforce/payments', { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to clear')
      }
      toast.success('Payment history cleared')
      await loadWorkforce()
    } catch (e: any) {
      toast.error(e.message || 'Failed to clear payments')
    } finally {
      setClearingPayments(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return

    try {
      const response = await fetch(`/api/workforce/${deleteConfirm.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete workforce member')
      }

      await loadWorkforce()
      toast.success('Workforce member deleted successfully!')
      setDeleteConfirm({ isOpen: false, id: null })
    } catch (error: any) {
      console.error('Failed to delete workforce member:', error)
      toast.error(error.message || 'Failed to delete workforce member. Please try again.')
      setDeleteConfirm({ isOpen: false, id: null })
    }
  }


  // Generate week options
  const weekOptions = useMemo(() => {
    const weeks: string[] = []
    const now = new Date()
    const currentYear = now.getFullYear()

    for (let year = currentYear - 1; year <= currentYear + 1; year++) {
      const lastDay = new Date(year, 11, 31)
      const lastWeek = getWeekNumber(lastDay)

      for (let week = 1; week <= lastWeek; week++) {
        weeks.push(`${year}-W${week.toString().padStart(2, '0')}`)
      }
    }
    return weeks.reverse()
  }, [])

  // Helper function for date filtering
  const getDateRange = useMemo(() => {
    if (datePeriodType === 'all') return null

    let startDate: Date
    let endDate: Date

    if (datePeriodType === 'day' && selectedDate) {
      startDate = new Date(selectedDate)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(selectedDate)
      endDate.setHours(23, 59, 59, 999)
      return { start: startDate, end: endDate }
    }

    if (datePeriodType === 'week' && selectedWeek) {
      const [year, week] = selectedWeek.split('-W').map(Number)
      const firstDay = new Date(year, 0, 1)
      const dayOfWeek = firstDay.getDay()
      const daysToAdd = (week - 1) * 7 - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)
      startDate = new Date(year, 0, 1 + daysToAdd)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 6)
      endDate.setHours(23, 59, 59, 999)
      return { start: startDate, end: endDate }
    }

    if (datePeriodType === 'month' && selectedMonth) {
      const [year, month] = selectedMonth.split('-').map(Number)
      startDate = new Date(year, month - 1, 1)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(year, month, 0)
      endDate.setHours(23, 59, 59, 999)
      return { start: startDate, end: endDate }
    }

    return null
  }, [datePeriodType, selectedDate, selectedWeek, selectedMonth])

  const filteredWorkforce = useMemo(() => {
    let filtered = workforce.map(member => {
      // Filter expenses by date period
      let memberExpenses = member.expenses || []

      if (getDateRange) {
        memberExpenses = memberExpenses.filter((expense: any) => {
          const paymentDate = new Date(expense.paymentDate)
          return paymentDate >= getDateRange.start && paymentDate <= getDateRange.end
        })

        // Recalculate totals based on filtered expenses
        const totalAmount = memberExpenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0)
        const totalPaidAmount = memberExpenses.reduce((sum: number, exp: any) => sum + (exp.paidAmount || 0), 0)
        const expenseCount = memberExpenses.length

        const pendingExpenses = memberExpenses.filter((exp: any) => exp.paymentStatus === 'pending').length
        const partialExpenses = memberExpenses.filter((exp: any) => exp.paymentStatus === 'partial').length
        const paidExpenses = memberExpenses.filter((exp: any) => exp.paymentStatus === 'paid').length

        let overallPaymentStatus: 'pending' | 'partial' | 'paid' = 'paid'
        if (totalPaidAmount === 0) {
          overallPaymentStatus = 'pending'
        } else if (totalPaidAmount < totalAmount) {
          overallPaymentStatus = 'partial'
        }

        return {
          ...member,
          expenses: memberExpenses,
          totalAmount,
          totalPaidAmount,
          expenseCount,
          pendingExpenses,
          partialExpenses,
          paidExpenses,
          overallPaymentStatus,
        }
      }

      return member
    })

    // Role filter
    if (selectedRole !== 'all') {
      filtered = filtered.filter(member => member.role === selectedRole)
    }

    // Status filter
    if (selectedStatus !== 'all') {
      const isActive = selectedStatus === 'active'
      filtered = filtered.filter(member => member.isActive === isActive)
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(searchLower) ||
        member.role.toLowerCase().includes(searchLower)
      )
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name))
  }, [workforce, selectedRole, selectedStatus, searchTerm, getDateRange])

  const roleTotals = useMemo(() => {
    const totals: Record<string, { count: number; totalAmount: number; expenseCount: number }> = {}
    filteredWorkforce.forEach(member => {
      if (!totals[member.role]) {
        totals[member.role] = { count: 0, totalAmount: 0, expenseCount: 0 }
      }
      totals[member.role].count++
      totals[member.role].totalAmount += member.totalAmount || 0
      totals[member.role].expenseCount += member.expenseCount || 0
    })
    return totals
  }, [filteredWorkforce])

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (member: Workforce) => (
        <div className="flex items-center gap-2">
          {roleIcons[member.role] && (
            <span className={`px-2 py-1 rounded-full text-xs ${roleColors[member.role]}`}>
              {(() => {
                const Icon = roleIcons[member.role]
                return <Icon className="w-4 h-4" />
              })()}
            </span>
          )}
          <span className="font-medium text-gray-900">
            {member.name?.trim() || 'Unknown'}
          </span>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (member: Workforce) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[member.role] || 'bg-gray-100 text-gray-800'}`}>
          {member.role.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (member: Workforce) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${member.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {member.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ]

  const totalPayments = filteredWorkforce.reduce((sum, m) => sum + (m.totalAmount || 0), 0)
  const totalPaidFromExpenses = filteredWorkforce.reduce((sum, m) => sum + (m.totalPaidAmount || 0), 0)
  const totalWorkforcePayments = workforcePayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const totalPaid = totalPaidFromExpenses + totalWorkforcePayments

  return (
    <div className="p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-5 md:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Workforce Management</h1>
          <p className="text-gray-600 mt-1 sm:mt-1.5 md:mt-2 text-xs sm:text-sm md:text-base">Manage chefs, supervisors, and transport staff with payment tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/workforce/outstanding"
            className="text-sm text-amber-700 hover:text-amber-800 font-medium"
          >
            Outstanding →
          </Link>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm ${showFilters
              ? 'bg-primary-500 text-white hover:bg-primary-600'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
          >
            <FaFilter className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{showFilters ? 'Hide' : 'Filters'}</span>
          </button>
          <Link
            href="/workforce/create"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary-500 text-white text-sm hover:bg-primary-600"
          >
            <FaPlus className="w-3.5 h-3.5" /> Add Member
          </Link>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Filter Workforce</h2>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or role..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Roles</option>
                {WORKFORCE_ROLES.map(role => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Date Period Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period Type
              </label>
              <select
                value={datePeriodType}
                onChange={(e) => {
                  setDatePeriodType(e.target.value as 'all' | 'day' | 'week' | 'month')
                  setSelectedDate('')
                  setSelectedWeek('')
                  setSelectedMonth('')
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Time</option>
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </div>

            {datePeriodType === 'day' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            )}

            {datePeriodType === 'week' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Week
                </label>
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select a week</option>
                  {weekOptions.map((week: string) => (
                    <option key={week} value={week}>
                      {week}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {datePeriodType === 'month' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Month
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            )}
          </div>

          {/* Clear Filters */}
          {(selectedRole !== 'all' || selectedStatus !== 'all' || searchTerm || datePeriodType !== 'all') && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setSelectedRole('all')
                  setSelectedStatus('all')
                  setSearchTerm('')
                  setDatePeriodType('all')
                  setSelectedDate('')
                  setSelectedWeek('')
                  setSelectedMonth('')
                }}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-5 md:mb-6">
        <div className="bg-white rounded-lg shadow border border-gray-100 p-4 sm:p-5 border-l-4 border-primary-500 relative overflow-hidden">
          <div className="bg-primary-500 absolute top-0 right-0 p-2.5 rounded-bl-xl">
            <FaUserTie className="w-5 h-5 text-white" />
          </div>
          <div className="relative pr-12">
            <p className="text-sm text-gray-600 mb-1">Total Workforce</p>
            <p className="text-lg font-bold text-gray-800">{filteredWorkforce.length}</p>
            {workforce.length !== filteredWorkforce.length && (
              <p className="text-xs text-gray-500 mt-1">of {workforce.length} total</p>
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-100 p-4 sm:p-5 border-l-4 border-blue-500 relative overflow-hidden">
          <div className="bg-blue-500 absolute top-0 right-0 p-2.5 rounded-bl-xl">
            <FaDollarSign className="w-5 h-5 text-white" />
          </div>
          <div className="relative pr-12">
            <p className="text-sm text-gray-600 mb-1">Total Amount</p>
            <p className="text-lg font-bold text-gray-800">{formatCurrency(totalPayments)}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-100 p-4 sm:p-5 border-l-4 border-green-500 relative overflow-hidden">
          <div className="bg-green-500 absolute top-0 right-0 p-2.5 rounded-bl-xl">
            <FaCheckCircle className="w-5 h-5 text-white" />
          </div>
          <div className="relative pr-12">
            <p className="text-sm text-gray-600 mb-1">Total Paid</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(totalPaid)}</p>
          </div>
        </div>
      </div>

      {/* Role Summary Cards */}
      {Object.keys(roleTotals).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {Object.entries(roleTotals).map(([role, totals]) => {
            const Icon = roleIcons[role]
            return (
              <div key={role} className="bg-white rounded-lg shadow border border-gray-100 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${roleColors[role] || 'bg-gray-100 text-gray-800'}`}>
                    {role.toUpperCase()}
                  </span>
                  {Icon && <Icon className="w-4 h-4 text-gray-400" />}
                </div>
                <p className="text-base font-bold text-gray-800">{totals.count}</p>
                <p className="text-xs text-gray-500">members</p>
                {totals.totalAmount > 0 && (
                  <p className="text-xs font-medium text-green-600 mt-1">{formatCurrency(totals.totalAmount)}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Workforce Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"></th>
                {columns.map((column) => (
                  <th key={column.key} className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {column.header}
                  </th>
                ))}
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWorkforce.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2} className="px-6 py-8 text-center text-gray-500">
                    {workforce.length === 0
                      ? 'No workforce members found. Add your first member.'
                      : 'No workforce members match the current filters.'}
                  </td>
                </tr>
              ) : (
                filteredWorkforce.map((member) => {
                  const isExpanded = expandedRows.has(member.id)
                  const hasExpenses = member.expenses && member.expenses.length > 0
                  return (
                    <>
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {hasExpenses && (
                            <button
                              onClick={() => toggleExpand(member.id)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                            </button>
                          )}
                        </td>
                        {columns.map((column) => (
                          <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                            {column.render ? column.render(member) : (member as any)[column.key]}
                          </td>
                        ))}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleGeneratePDF(member)}
                              className="text-primary-600 hover:text-primary-700 p-2 hover:bg-primary-50 rounded"
                              title="Generate PDF Receipt"
                            >
                              <FaPrint />
                            </button>
                            <button
                              onClick={() => handleDownloadImage(member)}
                              className="text-amber-600 hover:text-amber-700 p-2 hover:bg-amber-50 rounded"
                              title="Download Image Receipt"
                            >
                              <FaImage />
                            </button>
                            <button
                              onClick={() => handleEdit(member)}
                              className="text-primary-600 hover:text-primary-700 p-2 hover:bg-primary-50 rounded"
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDelete(member.id)}
                              className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && hasExpenses && (
                        <tr>
                          <td colSpan={columns.length + 2} className="px-6 py-4 bg-gray-50">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-gray-800 mb-3">Expense Details</h4>
                              {member.expenses!.map((expense: any) => (
                                <div key={expense.id} className="bg-white p-3 rounded border border-gray-200">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${CATEGORY_COLORS[expense.category] || 'bg-gray-100 text-gray-800'}`}>
                                          {expense.category.toUpperCase()}
                                        </span>
                                        {expense.order?.customer && (
                                          <span className="text-xs text-gray-500">
                                            Order: {expense.order.customer.name}
                                          </span>
                                        )}
                                      </div>
                                      {expense.description && (
                                        <p className="text-sm text-gray-600 mb-1">{expense.description}</p>
                                      )}
                                      {expense.recipient && (
                                        <p className="text-xs text-gray-500">Recipient: {expense.recipient}</p>
                                      )}
                                      <p className="text-xs text-gray-500">Date: {formatDate(expense.paymentDate)}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-semibold text-gray-800">{formatCurrency(expense.amount)}</p>
                                      {expense.paidAmount !== undefined && expense.paidAmount > 0 && (
                                        <p className="text-sm text-green-600 font-medium">
                                          Paid: {formatCurrency(expense.paidAmount || 0)}
                                        </p>
                                      )}
                                      {expense.paidAmount !== undefined && expense.paidAmount < expense.amount && (
                                        <p className="text-sm text-orange-600 font-medium">
                                          Remaining: {formatCurrency(expense.amount - (expense.paidAmount || 0))}
                                        </p>
                                      )}
                                      {expense.paymentStatus && (
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${expense.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                          expense.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                          }`}>
                                          {expense.paymentStatus === 'paid' && <FaCheckCircle className="text-xs" />}
                                          {expense.paymentStatus === 'partial' && <FaExclamationCircle className="text-xs" />}
                                          {expense.paymentStatus === 'pending' && <FaClock className="text-xs" />}
                                          {expense.paymentStatus.charAt(0).toUpperCase() + expense.paymentStatus.slice(1)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Workforce Payment History */}
      {workforcePayments.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FaReceipt className="w-5 h-5" />
                Payment Transactions
              </h2>
              <p className="text-green-100 text-sm mt-1">Recorded payments against workforce outstanding</p>
            </div>
            {workforce.length === 0 && (
              <button
                onClick={handleClearPayments}
                disabled={clearingPayments}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg disabled:opacity-50"
              >
                {clearingPayments ? 'Clearing…' : 'Clear payment history'}
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payment Method</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Notes</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {workforcePayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-green-50">
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDate(payment.paymentDate)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 capitalize">
                        {payment.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{payment.notes || '-'}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">{formatCurrency(parseFloat(payment.amount))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-right font-semibold text-gray-700">Total Payments:</td>
                  <td className="px-4 py-4 text-right text-xl font-bold text-green-600">{formatCurrency(totalWorkforcePayments)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Audit Log - Paid Payments Table */}
      {filteredWorkforce.some(m => m.expenses && m.expenses.some((e: any) => e.paymentStatus === 'paid' || e.paidAmount > 0)) && (
        <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FaCheckCircle className="w-5 h-5" />
              Payment Audit Log
            </h2>
            <p className="text-green-100 text-sm mt-1">Track all paid amounts for workforce</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Recipient</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Event</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Paid Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredWorkforce
                  .filter(member => member.expenses && member.expenses.some((e: any) => e.paymentStatus === 'paid' || e.paidAmount > 0))
                  .flatMap((member) => {
                    const paidExpenses = (member.expenses || []).filter(
                      (exp: any) => exp.paymentStatus === 'paid' || exp.paidAmount > 0
                    )
                    const Icon = roleIcons[member.role] || FaCircle

                    return paidExpenses.map((expense: any) => {
                      const paidAmount = expense.paidAmount || expense.amount || 0
                      return (
                        <tr key={expense.id} className="hover:bg-green-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-full ${roleColors[member.role] || 'bg-gray-100'}`}>
                                <Icon className="w-3 h-3" />
                              </div>
                              <span className="font-medium text-gray-900">{member.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${roleColors[member.role] || 'bg-gray-100 text-gray-800'}`}>
                              {member.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${CATEGORY_COLORS[expense.category] || 'bg-gray-100 text-gray-800'}`}>
                              {expense.category.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {expense.recipient || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {expense.order?.customer?.name || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {formatDate(expense.paymentDate)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-bold text-green-600 text-lg">
                              {formatCurrency(paidAmount)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <FaCheckCircle className="text-[10px]" />
                              Paid
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  })}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-right font-semibold text-gray-700">
                    Total Paid Amount:
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-xl font-bold text-green-600">{formatCurrency(totalPaid)}</span>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Workforce Member"
        message="Are you sure you want to delete this workforce member? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
      />
    </div>
  )
}
