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
  FaTimes,
  FaCheckCircle,
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
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null)
  const [transactionData, setTransactionData] = useState({
    type: 'in' as 'in' | 'out',
    quantity: '',
    price: '',
    reference: '',
    notes: '',
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

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!transactionData.quantity || !selectedStock) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const quantity = parseFloat(transactionData.quantity)
      if (quantity <= 0) {
        toast.error('Quantity must be greater than 0')
        return
      }

      const transactionPayload: any = {
        type: transactionData.type,
        quantity: quantity,
        price: transactionData.price ? parseFloat(transactionData.price) : null,
        reference: transactionData.reference || null,
        notes: transactionData.notes || null,
      }

      const response = await fetch(`/api/stock/${selectedStock.id}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionPayload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create transaction')
      }

      await loadData()
      resetTransactionForm()
      toast.success(`Stock ${transactionData.type === 'in' ? 'added' : 'removed'} successfully!`)
    } catch (error: any) {
      console.error('Failed to create transaction:', error)
      toast.error(error.message || 'Failed to create transaction. Please try again.')
    }
  }

  const resetTransactionForm = () => {
    setTransactionData({
      type: 'in',
      quantity: '',
      price: '',
      reference: '',
      notes: '',
    })
    setSelectedStock(null)
    setShowTransactionModal(false)
  }

  const handleTransactionClick = (item: StockItem) => {
    setSelectedStock(item)
    setTransactionData({
      type: 'in',
      quantity: '',
      price: item.price?.toString() || '',
      reference: '',
      notes: '',
    })
    setShowTransactionModal(true)
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
      accessor: (row: StockItem) => (
        <div>
          <div className={`font-bold text-lg ${row.minStock && row.currentStock <= row.minStock ? 'text-red-600' : 'text-gray-900'}`}>
            {row.currentStock} {row.unit}
          </div>
          {row.minStock && (
            <div className="text-xs text-gray-500">
              Min: {row.minStock} {row.unit}
              {row.maxStock && ` | Max: ${row.maxStock} ${row.unit}`}
            </div>
          )}
          {row.minStock && row.currentStock <= row.minStock && (
            <div className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
              <FaExclamationTriangle /> Low Stock
            </div>
          )}
        </div>
      ),
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

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading stock...</p>
        </div>
      </div>
    )
  }

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

      {/* Stock Transaction Modal */}
      {showTransactionModal && selectedStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Stock {transactionData.type === 'in' ? 'In' : 'Out'}
              </h2>
              <button
                onClick={resetTransactionForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
            
            <form onSubmit={handleTransaction} className="p-6">
              <div className="space-y-4 mb-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Item</div>
                  <div className="font-semibold text-gray-900">{selectedStock.name}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Current Stock: {selectedStock.currentStock} {selectedStock.unit}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type *
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTransactionData({ ...transactionData, type: 'in' })}
                      className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                        transactionData.type === 'in'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <FaArrowUp className="inline mr-2" />
                      Stock In
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransactionData({ ...transactionData, type: 'out' })}
                      className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                        transactionData.type === 'out'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <FaArrowDown className="inline mr-2" />
                      Stock Out
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={transactionData.quantity}
                    onChange={(e) => setTransactionData({ ...transactionData, quantity: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter quantity"
                  />
                  <div className="text-xs text-gray-500 mt-1">Unit: {selectedStock.unit}</div>
                  {transactionData.type === 'out' && selectedStock.currentStock > 0 && (
                    <div className="text-xs text-yellow-600 mt-1">
                      Available: {selectedStock.currentStock} {selectedStock.unit}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price per Unit
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={transactionData.price}
                    onChange={(e) => setTransactionData({ ...transactionData, price: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    value={transactionData.reference}
                    onChange={(e) => setTransactionData({ ...transactionData, reference: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Invoice #, Receipt #, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={transactionData.notes}
                    onChange={(e) => setTransactionData({ ...transactionData, notes: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetTransactionForm}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2.5 rounded-lg font-medium transition-colors shadow-md ${
                    transactionData.type === 'in'
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  {transactionData.type === 'in' ? 'Add Stock' : 'Remove Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
