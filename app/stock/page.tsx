'use client'

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
  gas: 'bg-red-100 text-red-800 border-red-200',
  store: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  vegetables: 'bg-green-100 text-green-800 border-green-200',
  disposables: 'bg-yellow-100 text-yellow-800 border-yellow-200',
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

interface StockTransaction {
  id: string
  stockId: string
  type: 'in' | 'out'
  quantity: number
  price?: number | null
  totalAmount?: number | null
  reference?: string | null
  notes?: string | null
  createdAt: string
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
          <div className="font-medium text-gray-900">{row.name}</div>
          {row.description && (
            <div className="text-xs text-gray-500 truncate max-w-xs">{row.description}</div>
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
            {row.category.charAt(0).toUpperCase() + row.category.slice(1)}
          </span>
        )
      },
    },
    {
      key: 'currentStock',
      header: 'Current Stock',
      accessor: (row: StockItem) => {
        const isLowStock = row.minStock && row.currentStock <= row.minStock
        return (
          <div className="space-y-1.5">
            <div className="flex items-baseline gap-1.5">
              <span className={`font-bold text-2xl ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                {row.currentStock}
              </span>
              <span className="text-sm text-gray-600 font-normal">
                {row.unit}
              </span>
            </div>
            {row.minStock !== null && row.minStock !== undefined && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="font-medium text-gray-600">Min:</span>
                <span>{row.minStock} {row.unit}</span>
                {row.maxStock !== null && row.maxStock !== undefined && (
                  <>
                    <span className="text-gray-300 mx-1">•</span>
                    <span className="font-medium text-gray-600">Max:</span>
                    <span>{row.maxStock} {row.unit}</span>
                  </>
                )}
              </div>
            )}
            {isLowStock && (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-medium mt-1">
                <FaExclamationTriangle className="text-xs" />
                Low Stock Alert
              </div>
            )}
          </div>
        )
      },
    },
    {
      key: 'price',
      header: 'Price/Unit',
      accessor: (row: StockItem) => (
        <div>
          {row.price ? (
            <>
              <div className="font-medium text-gray-900">{formatCurrency(row.price)}</div>
              <div className="text-xs text-gray-500">
                Total: {formatCurrency((row.price || 0) * row.currentStock)}
              </div>
            </>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'supplier',
      header: 'Supplier/Location',
      accessor: (row: StockItem) => (
        <div className="max-w-xs">
          {row.supplier && (
            <div className="text-sm text-gray-900">{row.supplier}</div>
          )}
          {row.location && (
            <div className="text-xs text-gray-500">{row.location}</div>
          )}
          {!row.supplier && !row.location && (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (row: StockItem) => (
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
          row.isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
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
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock Management</h1>
          <p className="text-gray-600 mt-1">Track and manage your inventory items</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <FaFilter />
            Filters
            {activeFiltersCount > 0 && (
              <span className="bg-primary-500 text-white text-xs rounded-full px-2 py-0.5">
                {activeFiltersCount}
              </span>
            )}
          </button>
          <Link
            href="/stock/create"
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors shadow-md"
          >
            <FaPlus />
            Add Stock Item
          </Link>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <FaExclamationTriangle className="text-red-400 text-xl" />
            <div className="flex-1">
              <h3 className="text-red-800 font-semibold">Low Stock Alert</h3>
              <p className="text-red-700 text-sm">
                {lowStockItems.length} item(s) are below minimum stock level
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STOCK_CATEGORIES.map(category => {
          const Icon = CATEGORY_ICONS[category]
          const total = categoryTotals[category] || { count: 0, totalValue: 0 }
          return (
            <div key={category} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1 capitalize">{category}</p>
                  <p className="text-2xl font-bold text-gray-900">{total.count} items</p>
                  {total.totalValue > 0 && (
                    <p className="text-gray-500 text-xs mt-2">{formatCurrency(total.totalValue)}</p>
                  )}
                </div>
                <div className={`${CATEGORY_COLORS[category]} rounded-full p-3`}>
                  <Icon className="text-xl" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6 bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FaFilter className="text-primary-500" />
              Filters
            </h3>
            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="Search by name, supplier, location..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setSelectedCategory('all')
                    setCurrentPage(1)
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Categories
                </button>
                {STOCK_CATEGORIES.map(category => {
                  const Icon = CATEGORY_ICONS[category]
                  return (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category)
                        setCurrentPage(1)
                      }}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                        selectedCategory === category
                          ? `${CATEGORY_COLORS[category]} border-2`
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

      {/* Stock Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <Table
          columns={columns}
          data={filteredStock}
          emptyMessage="No stock items found. Click 'Add Stock Item' to add your first item."
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          totalItems={filteredStock.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemName="stock item"
          getItemId={(item: StockItem) => item.id}
          renderActions={(item: StockItem) => (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTransactionClick(item)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Stock In/Out"
              >
                {item.currentStock > 0 ? <FaArrowUp /> : <FaArrowDown />}
              </button>
              <Link
                href={`/stock/create?id=${item.id}`}
                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="Edit"
              >
                <FaEdit />
              </Link>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <FaTrash />
              </button>
            </div>
          )}
        />
      </div>


      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Stock Item"
        message="Are you sure you want to delete this stock item? This action cannot be undone."
        variant="danger"
      />
    </div>
  )
}
