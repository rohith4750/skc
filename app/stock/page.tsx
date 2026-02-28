"use client";
import { useEffect, useState, useMemo } from 'react'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaFilter,
  FaSearch,
  FaBox,
  FaStore,
  FaGasPump,
  FaCarrot,
  FaExclamationTriangle,
  FaArrowUp,
  FaArrowDown,
  FaCheckCircle,
  FaTimes,
} from 'react-icons/fa'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Table from '@/components/Table'
import ConfirmModal from '@/components/ConfirmModal'

const STOCK_CATEGORIES = ['gas', 'store', 'vegetables', 'disposables']

const CATEGORY_ICONS: Record<string, any> = {
  gas: FaGasPump,
  store: FaStore,
  vegetables: FaCarrot,
  disposables: FaBox,
}

const CATEGORY_COLORS: Record<string, string> = {
  gas: 'bg-red-50 text-red-600 border-red-100',
  store: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  vegetables: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  disposables: 'bg-amber-50 text-amber-600 border-amber-100',
}

interface StockItem {
  id: string
  name: string
  category: string
  unit: string
  currentStock: number
  minStock?: number | null
  maxStock?: number | null
  price?: number | null
  supplier?: string | null
  location?: string | null
  description?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function StockPage() {
  const [stock, setStock] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
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
      const response = await fetch('/api/stock')
      if (!response.ok) throw new Error('Failed to fetch stock')
      const data = await response.json()
      setStock(data)
    } catch (error) {
      console.error('Failed to load stock:', error)
      toast.error('Failed to load stock. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filteredStock = useMemo(() => {
    let filtered = stock

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory)
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
  }, [stock, selectedCategory, searchTerm])

  const lowStockItems = useMemo(() => {
    return filteredStock.filter(item => {
      if (!item.minStock) return false
      return item.currentStock <= item.minStock
    })
  }, [filteredStock])

  const categoryTotals = useMemo(() => {
    const totals: Record<string, { count: number; totalValue: number }> = {}
    filteredStock.forEach(item => {
      if (!totals[item.category]) {
        totals[item.category] = { count: 0, totalValue: 0 }
      }
      totals[item.category].count++
      if (item.price && item.currentStock) {
        totals[item.category].totalValue += item.price * item.currentStock
      }
    })
    return totals
  }, [filteredStock])

  const handleTransactionClick = (item: StockItem) => {
    window.location.href = `/stock/transaction?id=${item.id}&type=in`
  }

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, id })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return
    try {
      const response = await fetch(`/api/stock/${deleteConfirm.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete stock item')
      }

      await loadData()
      toast.success('Stock item deleted successfully!')
      setDeleteConfirm({ isOpen: false, id: null })
    } catch (error: any) {
      console.error('Failed to delete stock item:', error)
      toast.error(error.message || 'Failed to delete stock item. Please try again.')
      setDeleteConfirm({ isOpen: false, id: null })
    }
  }

  const clearFilters = () => {
    setSelectedCategory('all')
    setSearchTerm('')
    setCurrentPage(1)
  }

  const columns = [
    {
      key: 'name',
      header: 'Item Name',
      accessor: (row: StockItem) => (
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
      accessor: (row: StockItem) => {
        const Icon = CATEGORY_ICONS[row.category] || FaBox
        return (
          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${CATEGORY_COLORS[row.category] || CATEGORY_COLORS.disposables}`}>
            <Icon className="text-xs" />
            <span className="capitalize">{row.category}</span>
          </span>
        )
      },
    },
    {
      key: 'currentStock',
      header: 'Stock Level',
      accessor: (row: StockItem) => {
        const isLowStock = row.minStock && row.currentStock <= row.minStock
        return (
          <div className="space-y-1.5">
            <div className="flex items-baseline gap-1.5">
              <span className={`font-black text-2xl ${isLowStock ? 'text-rose-600 animate-pulse' : 'text-slate-900'}`}>
                {row.currentStock}
              </span>
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                {row.unit}
              </span>
            </div>
            {row.minStock !== null && row.minStock !== undefined && (
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span>Min: {row.minStock}</span>
                {row.maxStock !== null && row.maxStock !== undefined && (
                  <>
                    <span>/</span>
                    <span>Max: {row.maxStock}</span>
                  </>
                )}
              </div>
            )}
            {isLowStock && (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 border border-rose-100 rounded text-[9px] text-rose-600 font-black uppercase tracking-widest">
                <FaExclamationTriangle className="text-[10px]" />
                Low Stock
              </div>
            )}
          </div>
        )
      },
    },
    {
      key: 'price',
      header: 'Valuation',
      accessor: (row: StockItem) => (
        <div>
          {row.price ? (
            <>
              <div className="font-bold text-slate-900">{formatCurrency(row.price)} / {row.unit}</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                Total: {formatCurrency((row.price || 0) * row.currentStock)}
              </div>
            </>
          ) : (
            <span className="text-slate-300">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'supplier',
      header: 'Source',
      accessor: (row: StockItem) => (
        <div className="max-w-xs">
          {row.supplier && (
            <div className="text-sm font-bold text-slate-700">{row.supplier}</div>
          )}
          {row.location && (
            <div className="text-xs text-slate-400">{row.location}</div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (row: StockItem) => (
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
    searchTerm !== '',
  ].filter(Boolean).length

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Stock Management</h1>
            <p className="text-slate-500 mt-1">Real-time inventory tracking and replenishment alerts</p>
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
            <Link
              href="/stock/create"
              className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95 font-bold text-sm"
            >
              <FaPlus />
              Add Stock Item
            </Link>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-rose-200">
              <FaExclamationTriangle />
            </div>
            <div>
              <h3 className="text-rose-900 font-bold text-sm">Action Required: Low Stock</h3>
              <p className="text-rose-600 text-xs font-medium">
                {lowStockItems.length} item(s) are currently below their minimum threshold and need replenishment.
              </p>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STOCK_CATEGORIES.map(category => {
            const Icon = CATEGORY_ICONS[category]
            const total = categoryTotals[category] || { count: 0, totalValue: 0 }

            const categoryMeta: any = {
              gas: { color: 'rose', label: 'Gas Fuel' },
              store: { color: 'indigo', label: 'Store Items' },
              vegetables: { color: 'emerald', label: 'Fresh Produce' },
              disposables: { color: 'amber', label: 'Disposables' }
            }
            const meta = categoryMeta[category]

            return (
              <div key={category} className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 hover:shadow-md transition-all group overflow-hidden relative">
                <div className={`absolute top-0 right-0 w-16 h-16 opacity-10 rounded-full -mr-8 -mt-8 bg-${meta.color}-500 group-hover:scale-150 transition-transform`} />
                <div className="relative z-10 text-center sm:text-left">
                  <div className={`w-12 h-12 rounded-2xl bg-${meta.color}-50 text-${meta.color}-600 flex items-center justify-center mx-auto sm:mx-0 mb-4 group-hover:bg-${meta.color}-600 group-hover:text-white transition-all`}>
                    <Icon className="text-xl" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{meta.label}</p>
                  <p className="text-2xl font-black text-slate-900">{total.count} <span className="text-xs font-medium text-slate-400">SKUs</span></p>
                  {total.totalValue > 0 && (
                    <p className="text-xs font-bold text-slate-500 mt-2">{formatCurrency(total.totalValue)} Val.</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Search */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                  Search SKU
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

              {/* Category Filter */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
                  Filter by Category
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
                    All SKU
                  </button>
                  {STOCK_CATEGORIES.map(category => {
                    const Icon = CATEGORY_ICONS[category]
                    const isActive = selectedCategory === category
                    return (
                      <button
                        key={category}
                        onClick={() => {
                          setSelectedCategory(category)
                          setCurrentPage(1)
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize ${isActive
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                      >
                        <Icon className="text-[10px]" />
                        {category}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stock Table Container */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <Table
            columns={columns}
            data={filteredStock}
            emptyMessage="No stock items found. Click 'Add Stock Item' to start tracking."
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            totalItems={filteredStock.length}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            itemName="stock item"
            getItemId={(item: StockItem) => item.id}
            renderActions={(item: StockItem) => (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleTransactionClick(item)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  title="Stock In/Out"
                >
                  {item.currentStock > 0 ? <FaArrowUp /> : <FaArrowDown />}
                </button>
                <Link
                  href={`/stock/create?id=${item.id}`}
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
        title="Delete Stock Item"
        message="Are you sure you want to delete this stock item? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
