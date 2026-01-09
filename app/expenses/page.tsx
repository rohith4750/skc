'use client'

import { useEffect, useState, useMemo } from 'react'
import { Storage } from '@/lib/storage-api'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { Expense, Order } from '@/types'
import { FaPlus, FaEdit, FaTrash, FaFilter, FaDollarSign } from 'react-icons/fa'
import toast from 'react-hot-toast'
import Table from '@/components/Table'
import ConfirmModal from '@/components/ConfirmModal'

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

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState<number>(10)
  const [showModal, setShowModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  })
  const [formData, setFormData] = useState({
    orderId: '',
    category: 'supervisor',
    calculationMethod: 'total' as 'plate-wise' | 'total',
    amount: '',
    plates: '',
    numberOfLabours: '',
    labourAmount: '',
    numberOfBoys: '',
    boyAmount: '',
    description: '',
    recipient: '',
    paymentDate: new Date().toISOString().split('T')[0],
    eventDate: '',
    notes: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [allExpenses, allOrders] = await Promise.all([
        Storage.getExpenses(),
        Storage.getOrders(),
      ])
      setExpenses(allExpenses)
      setOrders(allOrders)
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load data. Please try again.')
    }
  }

  const filteredExpenses = useMemo(() => {
    let filtered = expenses
    
    if (selectedOrder !== 'all') {
      filtered = filtered.filter(expense => expense.orderId === selectedOrder)
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(expense => expense.category === selectedCategory)
    }
    
    return filtered
  }, [expenses, selectedOrder, selectedCategory])

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

  // Expenses grouped by order/event
  const expensesByOrder = useMemo(() => {
    const grouped: Record<string, { expenses: Expense[], total: number, order?: Order }> = {}
    filteredExpenses.forEach(expense => {
      const key = expense.orderId || 'no-order'
      if (!grouped[key]) {
        grouped[key] = { expenses: [], total: 0, order: expense.order }
      }
      grouped[key].expenses.push(expense)
      grouped[key].total += expense.amount
    })
    return grouped
  }, [filteredExpenses])

  // Calculate total amount based on category and calculation method
  const calculatedAmount = useMemo(() => {
    if (formData.category === 'chef') {
      if (formData.calculationMethod === 'plate-wise') {
        const plates = parseFloat(formData.plates) || 0
        const amount = parseFloat(formData.amount) || 0
        return plates * amount
      } else {
        return parseFloat(formData.amount) || 0
      }
    } else if (formData.category === 'labours') {
      const numberOfLabours = parseFloat(formData.numberOfLabours) || 0
      const labourAmount = parseFloat(formData.labourAmount) || 0
      return numberOfLabours * labourAmount
    } else if (formData.category === 'boys') {
      const numberOfBoys = parseFloat(formData.numberOfBoys) || 0
      const boyAmount = parseFloat(formData.boyAmount) || 0
      return numberOfBoys * boyAmount
    } else {
      return parseFloat(formData.amount) || 0
    }
  }, [formData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.category || calculatedAmount <= 0) {
      toast.error('Please fill in all required fields and ensure amount is greater than 0')
      return
    }

    // Validate category-specific fields
    if (formData.category === 'chef' && formData.calculationMethod === 'plate-wise') {
      if (!formData.plates || !formData.amount) {
        toast.error('Please enter number of plates and amount per plate')
        return
      }
    }
    if (formData.category === 'labours') {
      if (!formData.numberOfLabours || !formData.labourAmount || !formData.eventDate) {
        toast.error('Please enter number of labours, amount per labour, and event date')
        return
      }
    }
    if (formData.category === 'boys') {
      if (!formData.numberOfBoys || !formData.boyAmount || !formData.eventDate) {
        toast.error('Please enter number of boys, amount per boy, and event date')
        return
      }
    }

    try {
      const calculationDetails: any = {}
      if (formData.category === 'chef') {
        calculationDetails.method = formData.calculationMethod
        if (formData.calculationMethod === 'plate-wise') {
          calculationDetails.plates = parseFloat(formData.plates)
          calculationDetails.perPlateAmount = parseFloat(formData.amount)
        }
      } else if (formData.category === 'labours') {
        calculationDetails.numberOfLabours = parseFloat(formData.numberOfLabours)
        calculationDetails.perUnitAmount = parseFloat(formData.labourAmount)
      } else if (formData.category === 'boys') {
        calculationDetails.numberOfBoys = parseFloat(formData.numberOfBoys)
        calculationDetails.perUnitAmount = parseFloat(formData.boyAmount)
      }

      const expenseData: any = {
        orderId: formData.orderId || null,
        category: formData.category,
        amount: calculatedAmount,
        description: formData.description || null,
        recipient: formData.recipient || null,
        paymentDate: formData.paymentDate,
        eventDate: (formData.category === 'labours' || formData.category === 'boys') && formData.eventDate ? formData.eventDate : null,
        notes: formData.notes || null,
        calculationDetails: Object.keys(calculationDetails).length > 0 ? calculationDetails : null,
      }
      
      if (editingExpense?.id) {
        expenseData.id = editingExpense.id
      }

      await Storage.saveExpense(expenseData)
      await loadData()
      resetForm()
      toast.success(editingExpense ? 'Expense updated successfully!' : 'Expense added successfully!')
    } catch (error) {
      console.error('Failed to save expense:', error)
      toast.error('Failed to save expense. Please try again.')
    }
  }

  const resetForm = () => {
    setFormData({
      orderId: '',
      category: 'supervisor',
      calculationMethod: 'total',
      amount: '',
      plates: '',
      numberOfLabours: '',
      labourAmount: '',
      numberOfBoys: '',
      boyAmount: '',
      description: '',
      recipient: '',
      paymentDate: new Date().toISOString().split('T')[0],
      eventDate: '',
      notes: '',
    })
    setEditingExpense(null)
    setShowModal(false)
  }

  const handleEdit = (expense: Expense) => {
    const details = expense.calculationDetails as any || {}
    
    setEditingExpense(expense)
    setFormData({
      orderId: expense.orderId || '',
      category: expense.category,
      calculationMethod: details.method || 'total',
      amount: details.perPlateAmount ? details.perPlateAmount.toString() : expense.amount.toString(),
      plates: details.plates ? details.plates.toString() : '',
      numberOfLabours: details.numberOfLabours ? details.numberOfLabours.toString() : '',
      labourAmount: details.perUnitAmount && expense.category === 'labours' ? details.perUnitAmount.toString() : '',
      numberOfBoys: details.numberOfBoys ? details.numberOfBoys.toString() : '',
      boyAmount: details.perUnitAmount && expense.category === 'boys' ? details.perUnitAmount.toString() : '',
      description: expense.description || '',
      recipient: expense.recipient || '',
      paymentDate: expense.paymentDate ? expense.paymentDate.split('T')[0] : new Date().toISOString().split('T')[0],
      eventDate: expense.eventDate ? expense.eventDate.split('T')[0] : '',
      notes: expense.notes || '',
    })
    setShowModal(true)
  }

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, id })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return
    try {
      await Storage.deleteExpense(deleteConfirm.id)
      await loadData()
      toast.success('Expense deleted successfully!')
      setDeleteConfirm({ isOpen: false, id: null })
    } catch (error) {
      console.error('Failed to delete expense:', error)
      toast.error('Failed to delete expense. Please try again.')
      setDeleteConfirm({ isOpen: false, id: null })
    }
  }

  const columns = [
    {
      key: 'order',
      header: 'Event/Order',
      accessor: (row: Expense) => {
        if (row.order?.customer) {
          return (
            <div>
              <div className="text-sm font-medium text-gray-900">{row.order.customer.name}</div>
              <div className="text-xs text-gray-500">{formatDate(row.order.createdAt)}</div>
            </div>
          )
        }
        return <span className="text-gray-400">No event</span>
      },
    },
    {
      key: 'paymentDate',
      header: 'Payment Date',
      accessor: (row: Expense) => formatDate(row.paymentDate),
      className: 'whitespace-nowrap',
    },
    {
      key: 'eventDate',
      header: 'Event Date',
      accessor: (row: Expense) => row.eventDate ? formatDate(row.eventDate) : '-',
      className: 'whitespace-nowrap',
    },
    {
      key: 'category',
      header: 'Category',
      accessor: (row: Expense) => (
        <span className="capitalize font-medium">{row.category}</span>
      ),
    },
    {
      key: 'recipient',
      header: 'Recipient',
      accessor: (row: Expense) => row.recipient || '-',
    },
    {
      key: 'description',
      header: 'Description',
      accessor: (row: Expense) => {
        const details = row.calculationDetails as any
        if (details) {
          if (row.category === 'chef' && details.method === 'plate-wise') {
            return `${details.plates} plates × ${formatCurrency(details.perPlateAmount)}`
          } else if (row.category === 'labours') {
            return `${details.numberOfLabours} labours × ${formatCurrency(details.perUnitAmount)}`
          } else if (row.category === 'boys') {
            return `${details.numberOfBoys} boys × ${formatCurrency(details.perUnitAmount)}`
          }
        }
        return row.description || '-'
      },
      className: 'max-w-xs truncate',
    },
    {
      key: 'amount',
      header: 'Amount',
      accessor: (row: Expense) => (
        <span className="font-bold text-green-600">{formatCurrency(row.amount)}</span>
      ),
      className: 'text-right',
    },
    {
      key: 'createdAt',
      header: 'Created',
      accessor: (row: Expense) => formatDateTime(row.createdAt),
      className: 'whitespace-nowrap text-sm text-gray-500',
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Expense Management</h1>
          <p className="text-gray-600 mt-1">Track and manage expenses by event/order</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FaPlus />
          Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalExpenses)}</p>
            </div>
            <FaDollarSign className="text-3xl text-blue-500" />
          </div>
        </div>
        {Object.entries(categoryTotals).slice(0, 3).map(([category, total]) => (
          <div key={category} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 capitalize">{category}</p>
                <p className="text-xl font-bold text-gray-800">{formatCurrency(total)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Expenses by Event/Order Summary */}
      {Object.keys(expensesByOrder).length > 0 && (
        <div className="mb-6 bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Expenses by Event/Order</h2>
          <div className="space-y-3">
            {Object.entries(expensesByOrder).map(([orderId, data]) => (
              <div key={orderId} className="border-b border-gray-200 pb-3 last:border-b-0 last:pb-0">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">
                      {data.order?.customer?.name || 'No Event/Order'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {data.order?.customer?.name 
                        ? `${data.expenses.length} expense(s) • ${formatDate(data.order.createdAt)}`
                        : `${data.expenses.length} expense(s)`
                      }
                    </p>
                  </div>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(data.total)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <FaFilter className="text-gray-600" />
        
        {/* Order/Event Filter */}
        <select
          value={selectedOrder}
          onChange={(e) => {
            setSelectedOrder(e.target.value)
            setCurrentPage(1)
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Events/Orders</option>
          {orders.map((order: any) => (
            <option key={order.id} value={order.id}>
              {order.customer?.name || 'Unknown'} - {formatDate(order.createdAt)}
            </option>
          ))}
        </select>

        {/* Category Filter */}
        <button
          onClick={() => {
            setSelectedCategory('all')
            setCurrentPage(1)
          }}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          All Categories
        </button>
        {EXPENSE_CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => {
              setSelectedCategory(category)
              setCurrentPage(1)
            }}
            className={`px-4 py-2 rounded-lg transition-colors capitalize ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Expenses Table */}
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
        renderActions={(expense: Expense) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEdit(expense)}
              className="text-yellow-600 hover:text-yellow-900 p-2 hover:bg-yellow-50 rounded"
              title="Edit"
            >
              <FaEdit />
            </button>
            <button
              onClick={() => handleDelete(expense.id)}
              className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded"
              title="Delete"
            >
              <FaTrash />
            </button>
          </div>
        )}
      />

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {editingExpense ? 'Edit Expense' : 'Add New Expense'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event/Order (Optional)
                  </label>
                  <select
                    value={formData.orderId}
                    onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">No specific event/order</option>
                    {orders.map((order: any) => (
                      <option key={order.id} value={order.id}>
                        {order.customer?.name || 'Unknown'} - {formatDate(order.createdAt)}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Link this expense to a specific event/order for better tracking
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        category: e.target.value,
                        calculationMethod: 'total',
                        amount: '',
                        plates: '',
                        numberOfLabours: '',
                        labourAmount: '',
                        numberOfBoys: '',
                        boyAmount: '',
                      })
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Chef - Calculation Method */}
                {formData.category === 'chef' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Calculation Method *
                    </label>
                    <select
                      required
                      value={formData.calculationMethod}
                      onChange={(e) => setFormData({ ...formData, calculationMethod: e.target.value as 'plate-wise' | 'total', amount: '', plates: '' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="total">Total Amount</option>
                      <option value="plate-wise">Plate-wise</option>
                    </select>
                  </div>
                )}

                {/* Chef - Plate-wise fields */}
                {formData.category === 'chef' && formData.calculationMethod === 'plate-wise' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Plates *
                      </label>
                      <input
                        type="number"
                        step="1"
                        required
                        value={formData.plates}
                        onChange={(e) => setFormData({ ...formData, plates: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount per Plate *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-blue-900">
                          Total Amount: {formatCurrency(calculatedAmount)}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Chef - Total amount */}
                {formData.category === 'chef' && formData.calculationMethod === 'total' && (
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Amount *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                )}

                {/* Supervisor - Total amount */}
                {formData.category === 'supervisor' && (
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Amount *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                )}

                {/* Labours fields */}
                {formData.category === 'labours' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Event Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.eventDate}
                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Labours *
                      </label>
                      <input
                        type="number"
                        step="1"
                        required
                        value={formData.numberOfLabours}
                        onChange={(e) => setFormData({ ...formData, numberOfLabours: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount per Labour *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.labourAmount}
                        onChange={(e) => setFormData({ ...formData, labourAmount: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-blue-900">
                          Total Amount: {formatCurrency(calculatedAmount)}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Boys fields */}
                {formData.category === 'boys' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Event Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.eventDate}
                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Boys (Heads) *
                      </label>
                      <input
                        type="number"
                        step="1"
                        required
                        value={formData.numberOfBoys}
                        onChange={(e) => setFormData({ ...formData, numberOfBoys: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment per Boy *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.boyAmount}
                        onChange={(e) => setFormData({ ...formData, boyAmount: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-blue-900">
                          Total Amount: {formatCurrency(calculatedAmount)}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Other categories - simple amount */}
                {!['chef', 'supervisor', 'labours', 'boys'].includes(formData.category) && (
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient
                  </label>
                  <input
                    type="text"
                    value={formData.recipient}
                    onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Name of recipient"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of the expense"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Additional notes (optional)"
                />
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingExpense ? 'Update Expense' : 'Add Expense'}
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
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        variant="danger"
      />
    </div>
  )
}
