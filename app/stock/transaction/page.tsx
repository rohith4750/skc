'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FaArrowLeft, FaArrowUp, FaArrowDown, FaTimes } from 'react-icons/fa'
import toast from 'react-hot-toast'
import Link from 'next/link'

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
}

export default function StockTransactionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const stockId = searchParams.get('id')
  const transactionType = searchParams.get('type') || 'in'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [stockItem, setStockItem] = useState<StockItem | null>(null)
  const [transactionData, setTransactionData] = useState({
    type: (transactionType === 'out' ? 'out' : 'in') as 'in' | 'out',
    quantity: '',
    price: '',
    reference: '',
    notes: '',
  })

  useEffect(() => {
    if (stockId) {
      loadStockData()
    } else {
      toast.error('Stock item ID is required')
      router.push('/stock')
    }
  }, [stockId])

  const loadStockData = async () => {
    if (!stockId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/stock/${stockId}`)
      if (!response.ok) throw new Error('Failed to fetch stock item')
      const data: StockItem = await response.json()

      setStockItem(data)
      setTransactionData(prev => ({
        ...prev,
        price: data.price?.toString() || '',
      }))
    } catch (error) {
      console.error('Failed to load stock item:', error)
      toast.error('Failed to load stock item. Please try again.')
      router.push('/stock')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    if (!transactionData.quantity || !stockItem) {
      toast.error('Please fill in all required fields')
      setSaving(false)
      return
    }

    try {
      const quantity = parseFloat(transactionData.quantity)
      if (quantity <= 0) {
        toast.error('Quantity must be greater than 0')
        setSaving(false)
        return
      }

      if (transactionData.type === 'out' && quantity > stockItem.currentStock) {
        toast.error(`Insufficient stock. Available: ${stockItem.currentStock} ${stockItem.unit}`)
        setSaving(false)
        return
      }

      const transactionPayload: any = {
        type: transactionData.type,
        quantity: quantity,
        price: transactionData.price ? parseFloat(transactionData.price) : null,
        reference: transactionData.reference || null,
        notes: transactionData.notes || null,
      }

      const response = await fetch(`/api/stock/${stockId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionPayload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create transaction')
      }

      toast.success(`Stock ${transactionData.type === 'in' ? 'added' : 'removed'} successfully!`)
      router.push('/stock')
    } catch (error: any) {
      console.error('Failed to create transaction:', error)
      toast.error(error.message || 'Failed to create transaction. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!stockItem) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Stock item not found</p>
          <Link href="/stock" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
            Back to Stock
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/stock"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <FaArrowLeft />
            Back to Stock
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Stock {transactionData.type === 'in' ? 'In' : 'Out'}
          </h1>
          <p className="text-gray-600 mt-1">
            {transactionData.type === 'in' ? 'Add stock to inventory' : 'Remove stock from inventory'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Stock Item Info */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Item</div>
              <div className="font-semibold text-gray-900 text-lg">{stockItem.name}</div>
              <div className="text-sm text-gray-500 mt-2">
                Current Stock: <span className="font-medium">{stockItem.currentStock} {stockItem.unit}</span>
              </div>
              {stockItem.minStock && (
                <div className="text-xs text-gray-500 mt-1">
                  Min: {stockItem.minStock} {stockItem.unit}
                  {stockItem.maxStock && ` | Max: ${stockItem.maxStock} ${stockItem.unit}`}
                </div>
              )}
            </div>

            {/* Transaction Type */}
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

            {/* Quantity */}
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
              <div className="text-xs text-gray-500 mt-1">Unit: {stockItem.unit}</div>
              {transactionData.type === 'out' && stockItem.currentStock > 0 && (
                <div className="text-xs text-yellow-600 mt-1 font-medium">
                  Available: {stockItem.currentStock} {stockItem.unit}
                </div>
              )}
            </div>

            {/* Price */}
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

            {/* Reference */}
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

            {/* Notes */}
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

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
              <Link
                href="/stock"
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className={`px-6 py-2.5 rounded-lg font-medium transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
                  transactionData.type === 'in'
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {saving 
                  ? 'Processing...' 
                  : (transactionData.type === 'in' ? 'Add Stock' : 'Remove Stock')
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
