"use client";
import { useEffect, useState, useMemo } from 'react'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaFilter,
  FaSearch,
  FaCircle,
  FaUtensils,
  FaCookieBite,
  FaBox,
  FaWarehouse,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimes,
  FaTools,
  FaFilePdf,
  FaFileInvoiceDollar,
} from 'react-icons/fa'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Table from '@/components/Table'
import ConfirmModal from '@/components/ConfirmModal'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { generatePDFTemplate, PDFTemplateData } from '@/lib/pdf-template'

const INVENTORY_CATEGORIES = ['glasses', 'vessels', 'cooking_utensils', 'serving_items', 'storage', 'other']

const CATEGORY_ICONS: Record<string, any> = {
  glasses: FaCircle,
  vessels: FaCookieBite,
  cooking_utensils: FaUtensils,
  serving_items: FaBox,
  storage: FaWarehouse,
  other: FaTools,
}

const CATEGORY_COLORS: Record<string, string> = {
  glasses: 'bg-blue-100 text-blue-800 border-blue-200',
  vessels: 'bg-green-100 text-green-800 border-green-200',
  cooking_utensils: 'bg-orange-100 text-orange-800 border-orange-200',
  serving_items: 'bg-purple-100 text-purple-800 border-purple-200',
  storage: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200',
}

const CONDITION_COLORS: Record<string, string> = {
  good: 'bg-green-100 text-green-800',
  fair: 'bg-yellow-100 text-yellow-800',
  damaged: 'bg-red-100 text-red-800',
  repair: 'bg-orange-100 text-orange-800',
}

interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  condition: string
  location?: string | null
  supplier?: string | null
  purchaseDate?: string | null
  purchasePrice?: number | null
  description?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedCondition, setSelectedCondition] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState<number>(10)
  const [showFilters, setShowFilters] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/inventory')
      if (!response.ok) throw new Error('Failed to fetch inventory')
      const data = await response.json()
      setInventory(data)
    } catch (error) {
      console.error('Failed to load inventory:', error)
      toast.error('Failed to load inventory. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filteredInventory = useMemo(() => {
    let filtered = inventory

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    // Condition filter
    if (selectedCondition !== 'all') {
      filtered = filtered.filter(item => item.condition === selectedCondition)
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        item.supplier?.toLowerCase().includes(searchLower) ||
        item.location?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
      )
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name))
  }, [inventory, selectedCategory, selectedCondition, searchTerm])

  const conditionCounts = useMemo(() => {
    const counts: Record<string, number> = {
      good: 0,
      fair: 0,
      damaged: 0,
      repair: 0,
    }
    filteredInventory.forEach(item => {
      counts[item.condition] = (counts[item.condition] || 0) + item.quantity
    })
    return counts
  }, [filteredInventory])

  const categoryTotals = useMemo(() => {
    const totals: Record<string, { count: number; totalQuantity: number; totalValue: number }> = {}
    filteredInventory.forEach(item => {
      if (!totals[item.category]) {
        totals[item.category] = { count: 0, totalQuantity: 0, totalValue: 0 }
      }
      totals[item.category].count++
      totals[item.category].totalQuantity += item.quantity
      if (item.purchasePrice) {
        totals[item.category].totalValue += item.purchasePrice * item.quantity
      }
    })
    return totals
  }, [filteredInventory])


  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, id })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return
    try {
      const response = await fetch(`/api/inventory/${deleteConfirm.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete inventory item')
      }

      await loadData()
      toast.success('Inventory item deleted successfully!')
      setDeleteConfirm({ isOpen: false, id: null })
    } catch (error: any) {
      console.error('Failed to delete inventory item:', error)
      toast.error(error.message || 'Failed to delete inventory item. Please try again.')
      setDeleteConfirm({ isOpen: false, id: null })
    }
  }

  const clearFilters = () => {
    setSelectedCategory('all')
    setSelectedCondition('all')
    setSearchTerm('')
    setCurrentPage(1)
  }

  const handleDownloadReport = async () => {
    const toastId = toast.loading('Generating Inventory Report...')
    try {
      // Prepare report data
      const pdfData: PDFTemplateData = {
        type: 'inventory',
        date: new Date().toISOString(),
        inventoryDetails: {
          items: filteredInventory.map(item => ({
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            condition: item.condition,
            location: item.location || undefined,
            pricePerUnit: item.purchasePrice || undefined,
            totalValue: item.purchasePrice ? item.purchasePrice * item.quantity : undefined
          })),
          grandTotalValue: filteredInventory.reduce((sum, item) => sum + ((item.purchasePrice || 0) * item.quantity), 0)
        }
      }

      const htmlContent = generatePDFTemplate(pdfData)
      const dateStr = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })

      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.width = '210mm'
      tempDiv.style.background = 'white'
      tempDiv.innerHTML = htmlContent
      document.body.appendChild(tempDiv)

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      document.body.removeChild(tempDiv)

      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight)
      pdf.save(`Inventory-Report-${dateStr.replace(/ /g, '-')}.pdf`)

      toast.success('Inventory report downloaded!', { id: toastId })
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('Failed to generate PDF report', { id: toastId })
    }
  }

  const handleDownloadItemPDF = async (item: InventoryItem) => {
    const toastId = toast.loading(`Generating PDF for ${item.name}...`)
    try {
      const pdfData: PDFTemplateData = {
        type: 'inventory',
        date: new Date().toISOString(),
        inventoryDetails: {
          items: [{
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            condition: item.condition,
            location: item.location || undefined,
            pricePerUnit: item.purchasePrice || undefined,
            totalValue: item.purchasePrice ? item.purchasePrice * item.quantity : undefined
          }],
          grandTotalValue: (item.purchasePrice || 0) * item.quantity
        }
      }

      const htmlContent = generatePDFTemplate(pdfData)
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.width = '210mm'
      tempDiv.style.background = 'white'
      tempDiv.innerHTML = htmlContent
      document.body.appendChild(tempDiv)

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      document.body.removeChild(tempDiv)

      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight)
      pdf.save(`Inventory-${item.name.replace(/ /g, '-')}.pdf`)

      toast.success('Inventory item PDF downloaded!', { id: toastId })
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('Failed to generate item PDF', { id: toastId })
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Item Name',
      accessor: (row: InventoryItem) => (
        <div>
          <div className="font-medium text-slate-900">{row.name}</div>
          {row.description && (
            <div className="text-xs text-slate-400 truncate max-w-xs">{row.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      accessor: (row: InventoryItem) => {
        const Icon = CATEGORY_ICONS[row.category] || FaTools
        return (
          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${CATEGORY_COLORS[row.category] || CATEGORY_COLORS.other}`}>
            <Icon className="text-xs" />
            {row.category.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </span>
        )
      },
    },
    {
      key: 'quantity',
      header: 'Quantity',
      accessor: (row: InventoryItem) => (
        <div className="font-bold text-slate-900">
          {row.quantity} <span className="text-[10px] text-slate-400 font-medium uppercase">{row.unit}</span>
        </div>
      ),
    },
    {
      key: 'condition',
      header: 'Condition',
      accessor: (row: InventoryItem) => (
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${CONDITION_COLORS[row.condition] || CONDITION_COLORS.good}`}>
          {row.condition.charAt(0).toUpperCase() + row.condition.slice(1)}
        </span>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      accessor: (row: InventoryItem) => (row.location || '-'),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (row: InventoryItem) => (
        <span className={`px-2 py-1 inline-flex text-[10px] font-black uppercase tracking-widest rounded-lg ${row.isActive
          ? 'bg-emerald-50 text-emerald-600'
          : 'bg-slate-100 text-slate-400'
          }`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ]

  const activeFiltersCount = [
    selectedCategory !== 'all',
    selectedCondition !== 'all',
    searchTerm !== '',
  ].filter(Boolean).length

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Inventory Management</h1>
            <p className="text-slate-500 mt-1">Track and manage kitchen equipment, utensils, and service assets</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all shadow-sm ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
            >
              <FaFilter className={activeFiltersCount > 0 ? 'text-indigo-600' : 'text-slate-400'} />
              <span className="text-sm font-bold">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="bg-indigo-600 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm font-bold text-sm"
            >
              <FaFilePdf className="text-rose-500" />
              Download Report
            </button>
            <Link
              href="/inventory/create"
              className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95 font-bold text-sm"
            >
              <FaPlus />
              Add Item
            </Link>
          </div>
        </div>

        {/* Condition Alerts */}
        {(conditionCounts.damaged > 0 || conditionCounts.repair > 0) && (
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-4 animate-pulse">
            <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-rose-200">
              <FaExclamationTriangle />
            </div>
            <div>
              <h3 className="text-rose-900 font-bold text-sm">Action Required</h3>
              <p className="text-rose-600 text-xs font-medium">
                {conditionCounts.damaged} items damaged and {conditionCounts.repair} items requiring repair.
              </p>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {INVENTORY_CATEGORIES.map(category => {
            const Icon = CATEGORY_ICONS[category]
            const total = categoryTotals[category] || { count: 0, totalQuantity: 0, totalValue: 0 }

            const categoryMeta: any = {
              glasses: { color: 'blue', label: 'Glasses' },
              vessels: { color: 'emerald', label: 'Vessels' },
              cooking_utensils: { color: 'orange', label: 'Cooking' },
              serving_items: { color: 'indigo', label: 'Serving' },
              storage: { color: 'amber', label: 'Storage' },
              other: { color: 'slate', label: 'Others' }
            }
            const meta = categoryMeta[category] || categoryMeta.other

            return (
              <div key={category} className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100 hover:shadow-md transition-all group overflow-hidden relative">
                <div className={`absolute top-0 right-0 w-16 h-16 opacity-10 rounded-full -mr-8 -mt-8 bg-${meta.color}-500 group-hover:scale-150 transition-transform`} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-xl bg-${meta.color}-50 text-${meta.color}-600`}>
                      <Icon className="text-lg" />
                    </div>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{meta.label}</p>
                  <p className="text-xl font-black text-slate-900">{total.count} <span className="text-[10px] font-medium text-slate-400">Items</span></p>
                  <div className="mt-2 text-xs font-bold text-slate-500 flex items-center justify-between">
                    <span>{total.totalQuantity} Units</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Search */}
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                  Search Assets
                </label>
                <div className="relative">
                  <FaSearch className="absolute left-3.5 top-3.5 text-slate-300" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1)
                    }}
                    placeholder="Search by name, supplier, location..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all placeholder:text-slate-300 text-sm font-medium"
                  />
                </div>
              </div>

              {/* Condition Filter */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                  Condition Status
                </label>
                <select
                  value={selectedCondition}
                  onChange={(e) => {
                    setSelectedCondition(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm font-medium"
                >
                  <option value="all">All Conditions</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="damaged">Damaged</option>
                  <option value="repair">Repair</option>
                </select>
              </div>

              {/* Category Chips */}
              <div className="md:col-span-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
                  Quick Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setSelectedCategory('all')
                      setCurrentPage(1)
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedCategory === 'all'
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    All Items
                  </button>
                  {INVENTORY_CATEGORIES.map(category => {
                    const Icon = CATEGORY_ICONS[category]
                    const isActive = selectedCategory === category
                    return (
                      <button
                        key={category}
                        onClick={() => {
                          setSelectedCategory(category)
                          setCurrentPage(1)
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${isActive
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent'
                          }`}
                      >
                        <Icon className="text-[10px]" />
                        {category.replace('_', ' ')}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inventory Table Container */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <Table
            columns={columns}
            data={filteredInventory}
            emptyMessage="No inventory items found. Click 'Add Item' to start tracking."
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            totalItems={filteredInventory.length}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            itemName="inventory item"
            getItemId={(item: InventoryItem) => item.id}
            renderActions={(item: InventoryItem) => (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDownloadItemPDF(item)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  title="Download PDF"
                >
                  <FaFilePdf />
                </button>
                <Link
                  href={`/inventory/create?id=${item.id}`}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  title="Edit"
                >
                  <FaEdit />
                </Link>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                  title="Delete"
                >
                  <FaTrash />
                </button>
              </div>
            )}
          />
        </div>
      </div>


      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Inventory Item"
        message="Are you sure you want to delete this inventory item? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
