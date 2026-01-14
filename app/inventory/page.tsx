'use client'

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
} from 'react-icons/fa'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Table from '@/components/Table'
import ConfirmModal from '@/components/ConfirmModal'

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

  const columns = [
    {
      key: 'name',
      header: 'Item Name',
      accessor: (row: InventoryItem) => (
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
        <div className="font-bold text-lg text-gray-900">
          {row.quantity} {row.unit}
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
      header: 'Location/Supplier',
      accessor: (row: InventoryItem) => (
        <div className="max-w-xs">
          {row.location && (
            <div className="text-sm text-gray-900">{row.location}</div>
          )}
          {row.supplier && (
            <div className="text-xs text-gray-500">{row.supplier}</div>
          )}
          {!row.location && !row.supplier && (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'purchasePrice',
      header: 'Purchase Info',
      accessor: (row: InventoryItem) => (
        <div>
          {row.purchasePrice ? (
            <>
              <div className="font-medium text-gray-900">{formatCurrency(row.purchasePrice)}</div>
              <div className="text-xs text-gray-500">
                Total: {formatCurrency((row.purchasePrice || 0) * row.quantity)}
              </div>
            </>
          ) : (
            <span className="text-gray-400">-</span>
          )}
          {row.purchaseDate && (
            <div className="text-xs text-gray-500 mt-1">{formatDate(row.purchaseDate)}</div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (row: InventoryItem) => (
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
    selectedCondition !== 'all',
    searchTerm !== '',
  ].filter(Boolean).length

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Track and manage kitchen equipment and utensils</p>
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
            href="/inventory/create"
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors shadow-md"
          >
            <FaPlus />
            Add Inventory Item
          </Link>
        </div>
      </div>

      {/* Condition Alerts */}
      {(conditionCounts.damaged > 0 || conditionCounts.repair > 0) && (
        <div className="mb-6 bg-orange-50 border-l-4 border-orange-400 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <FaExclamationTriangle className="text-orange-400 text-xl" />
            <div className="flex-1">
              <h3 className="text-orange-800 font-semibold">Items Requiring Attention</h3>
              <p className="text-orange-700 text-sm">
                {conditionCounts.damaged} items damaged, {conditionCounts.repair} items need repair
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {INVENTORY_CATEGORIES.map(category => {
          const Icon = CATEGORY_ICONS[category]
          const total = categoryTotals[category] || { count: 0, totalQuantity: 0, totalValue: 0 }
          return (
            <div key={category} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">
                    {category.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{total.count} items</p>
                  <p className="text-gray-500 text-xs mt-2">{total.totalQuantity} {total.count > 0 ? filteredInventory.find(i => i.category === category)?.unit || 'pieces' : 'total'}</p>
                  {total.totalValue > 0 && (
                    <p className="text-gray-500 text-xs">{formatCurrency(total.totalValue)}</p>
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
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

            {/* Condition Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condition
              </label>
              <select
                value={selectedCondition}
                onChange={(e) => {
                  setSelectedCondition(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Conditions</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="damaged">Damaged</option>
                <option value="repair">Repair</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="md:col-span-3">
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
                {INVENTORY_CATEGORIES.map(category => {
                  const Icon = CATEGORY_ICONS[category]
                  return (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category)
                        setCurrentPage(1)
                      }}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === category
                          ? `${CATEGORY_COLORS[category]} border-2`
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="text-xs" />
                      {category.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <Table
          columns={columns}
          data={filteredInventory}
          emptyMessage="No inventory items found. Click 'Add Inventory Item' to add your first item."
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          totalItems={filteredInventory.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemName="inventory item"
          getItemId={(item: InventoryItem) => item.id}
          renderActions={(item: InventoryItem) => (
            <div className="flex items-center gap-2">
              <Link
                href={`/inventory/create?id=${item.id}`}
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
        title="Delete Inventory Item"
        message="Are you sure you want to delete this inventory item? This action cannot be undone."
        variant="danger"
      />
    </div>
  )
}
