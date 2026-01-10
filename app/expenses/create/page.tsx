'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { Expense, Order } from '@/types'
import { FaArrowLeft } from 'react-icons/fa'
import toast from 'react-hot-toast'
import Link from 'next/link'

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

interface WorkforceMember {
  id: string
  name: string
  role: string
  isActive: boolean
}

export default function CreateExpensePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const expenseId = searchParams.get('id')

  const [orders, setOrders] = useState<Order[]>([])
  const [workforce, setWorkforce] = useState<WorkforceMember[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
    paidAmount: '',
    paymentStatus: 'pending' as 'pending' | 'partial' | 'paid',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [ordersRes, workforceRes, expenseRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/workforce'),
        expenseId ? fetch(`/api/expenses/${expenseId}`) : Promise.resolve(null),
      ])
      
      if (!ordersRes.ok) throw new Error('Failed to fetch orders')
      
      const [allOrders, allWorkforce, expenseData] = await Promise.all([
        ordersRes.json(),
        workforceRes.ok ? workforceRes.json() : Promise.resolve([]),
        expenseRes ? expenseRes.json() : Promise.resolve(null),
      ])
      
      setOrders(allOrders)
      setWorkforce((allWorkforce || []).filter((member: WorkforceMember) => member.isActive))

      // If editing, populate form
      if (expenseData && expenseId) {
        const details = expenseData.calculationDetails as any || {}
        setFormData({
          orderId: expenseData.orderId || '',
          category: expenseData.category,
          calculationMethod: details.method || 'total',
          amount: details.perPlateAmount ? details.perPlateAmount.toString() : expenseData.amount.toString(),
          plates: details.plates ? details.plates.toString() : '',
          numberOfLabours: details.numberOfLabours ? details.numberOfLabours.toString() : '',
          labourAmount: details.perUnitAmount && expenseData.category === 'labours' ? details.perUnitAmount.toString() : '',
          numberOfBoys: details.numberOfBoys ? details.numberOfBoys.toString() : '',
          boyAmount: details.perUnitAmount && expenseData.category === 'boys' ? details.perUnitAmount.toString() : '',
          description: expenseData.description || '',
          recipient: expenseData.recipient || '',
          paymentDate: expenseData.paymentDate ? expenseData.paymentDate.split('T')[0] : new Date().toISOString().split('T')[0],
          eventDate: expenseData.eventDate ? expenseData.eventDate.split('T')[0] : '',
          notes: expenseData.notes || '',
          paidAmount: expenseData.paidAmount?.toString() || '0',
          paymentStatus: expenseData.paymentStatus || 'pending',
        })
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

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
    setSaving(true)
    
    if (!formData.category || calculatedAmount <= 0) {
      toast.error('Please fill in all required fields and ensure amount is greater than 0')
      setSaving(false)
      return
    }

    // Validate category-specific fields
    if (formData.category === 'chef' && formData.calculationMethod === 'plate-wise') {
      if (!formData.plates || !formData.amount) {
        toast.error('Please enter number of plates and amount per plate')
        setSaving(false)
        return
      }
    }
    if (formData.category === 'labours') {
      if (!formData.numberOfLabours || !formData.labourAmount || !formData.eventDate) {
        toast.error('Please enter number of labours, amount per labour, and event date')
        setSaving(false)
        return
      }
    }
    if (formData.category === 'boys') {
      if (!formData.numberOfBoys || !formData.boyAmount || !formData.eventDate) {
        toast.error('Please enter number of boys, amount per boy, and event date')
        setSaving(false)
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

      const paidAmount = formData.paidAmount ? parseFloat(formData.paidAmount) : 0
      
      const expenseData: any = {
        orderId: formData.orderId || null,
        category: formData.category,
        amount: calculatedAmount,
        paidAmount: paidAmount,
        paymentStatus: formData.paymentStatus,
        description: formData.description || null,
        recipient: formData.recipient || null,
        paymentDate: formData.paymentDate,
        eventDate: (formData.category === 'labours' || formData.category === 'boys') && formData.eventDate ? formData.eventDate : null,
        notes: formData.notes || null,
        calculationDetails: Object.keys(calculationDetails).length > 0 ? calculationDetails : null,
      }
      
      const url = expenseId ? `/api/expenses/${expenseId}` : '/api/expenses'
      const method = expenseId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save expense')
      }

      toast.success(expenseId ? 'Expense updated successfully!' : 'Expense added successfully!')
      router.push('/expenses')
    } catch (error: any) {
      console.error('Failed to save expense:', error)
      toast.error(error.message || 'Failed to save expense. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/expenses"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <FaArrowLeft />
            Back to Expenses
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {expenseId ? 'Edit Expense' : 'Create New Expense'}
          </h1>
          <p className="text-gray-600 mt-1">
            {expenseId ? 'Update expense information' : 'Add a new expense to your records'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Order Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Event/Order (Optional)
              </label>
              <select
                value={formData.orderId}
                onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">No specific event/order</option>
                {orders.map((order: any) => {
                  const customerName = order.customer?.name || 'Unknown'
                  const eventName = order.eventName || 'No Event Name'
                  const date = new Date(order.createdAt).toLocaleDateString()
                  return (
                    <option key={order.id} value={order.id}>
                      {customerName} - {eventName} - {date}
                    </option>
                  )
                })}
              </select>
            </div>

            {/* Category and Calculation Method */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                      recipient: '',
                    })
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chef Calculation Method */}
              {formData.category === 'chef' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Calculation Method *
                  </label>
                  <select
                    required
                    value={formData.calculationMethod}
                    onChange={(e) => setFormData({ ...formData, calculationMethod: e.target.value as 'plate-wise' | 'total', amount: '', plates: '' })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="total">Total Amount</option>
                    <option value="plate-wise">Plate-wise</option>
                  </select>
                </div>
              )}
            </div>

            {/* Dynamic Fields Based on Category */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              {/* Chef Plate-wise */}
              {formData.category === 'chef' && formData.calculationMethod === 'plate-wise' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Plates *
                      </label>
                      <input
                        type="number"
                        step="1"
                        required
                        value={formData.plates}
                        onChange={(e) => setFormData({ ...formData, plates: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount per Plate *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-primary-900">
                      Total Amount: {formatCurrency(calculatedAmount)}
                    </p>
                  </div>
                </>
              )}

              {/* Chef Total */}
              {formData.category === 'chef' && formData.calculationMethod === 'total' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0.00"
                  />
                </div>
              )}

              {/* Supervisor */}
              {formData.category === 'supervisor' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0.00"
                  />
                </div>
              )}

              {/* Labours */}
              {formData.category === 'labours' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Event Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.eventDate}
                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Labours *
                      </label>
                      <input
                        type="number"
                        step="1"
                        required
                        value={formData.numberOfLabours}
                        onChange={(e) => setFormData({ ...formData, numberOfLabours: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount per Labour *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.labourAmount}
                        onChange={(e) => setFormData({ ...formData, labourAmount: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-primary-900">
                      Total Amount: {formatCurrency(calculatedAmount)}
                    </p>
                  </div>
                </>
              )}

              {/* Boys */}
              {formData.category === 'boys' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Event Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.eventDate}
                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Boys *
                      </label>
                      <input
                        type="number"
                        step="1"
                        required
                        value={formData.numberOfBoys}
                        onChange={(e) => setFormData({ ...formData, numberOfBoys: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment per Boy *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.boyAmount}
                        onChange={(e) => setFormData({ ...formData, boyAmount: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-primary-900">
                      Total Amount: {formatCurrency(calculatedAmount)}
                    </p>
                  </div>
                </>
              )}

              {/* Other Categories */}
              {!['chef', 'supervisor', 'labours', 'boys'].includes(formData.category) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>

            {/* Payment Date and Recipient */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Payment Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Recipient
                </label>
                {['supervisor', 'chef', 'transport', 'boys', 'labours'].includes(formData.category) ? (
                  <select
                    value={formData.recipient}
                    onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select {formData.category.charAt(0).toUpperCase() + formData.category.slice(1)}</option>
                    {workforce
                      .filter((member) => member.role === formData.category)
                      .map((member) => (
                        <option key={member.id} value={member.name}>
                          {member.name}
                        </option>
                      ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.recipient}
                    onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Name of recipient"
                  />
                )}
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Payment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Paid Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.paidAmount}
                    onChange={(e) => {
                      const paid = e.target.value
                      const paidNum = parseFloat(paid) || 0
                      const amountNum = calculatedAmount
                      let status: 'pending' | 'partial' | 'paid' = 'pending'
                      if (paidNum === 0) {
                        status = 'pending'
                      } else if (paidNum >= amountNum) {
                        status = 'paid'
                      } else {
                        status = 'partial'
                      }
                      setFormData({ ...formData, paidAmount: paid, paymentStatus: status })
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Total Amount: {formatCurrency(calculatedAmount)}
                  </p>
                  {formData.paidAmount && parseFloat(formData.paidAmount) > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Remaining: {formatCurrency(Math.max(0, calculatedAmount - (parseFloat(formData.paidAmount) || 0)))}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Status
                  </label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as 'pending' | 'partial' | 'paid' })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Status will auto-update based on paid amount
                  </p>
                </div>
              </div>
            </div>

            {/* Description and Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Brief description of the expense"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                placeholder="Additional notes (optional)"
              />
            </div>

            {/* Form Footer */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <Link
                href="/expenses"
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : expenseId ? 'Update Expense' : 'Create Expense'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
