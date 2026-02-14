'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FaArrowLeft, FaCircle, FaCookieBite, FaUtensils, FaBox, FaWarehouse, FaTools } from 'react-icons/fa'
import toast from 'react-hot-toast'
import Link from 'next/link'
import FormError from '@/components/FormError'

const INVENTORY_CATEGORIES = ['glasses', 'vessels', 'cooking_utensils', 'serving_items', 'storage', 'other']

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

export default function CreateInventoryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inventoryId = searchParams?.get('id') ?? null

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    category: 'glasses',
    quantity: '',
    unit: 'pieces',
    condition: 'good',
    location: '',
    supplier: '',
    purchaseDate: '',
    purchasePrice: '',
    description: '',
    isActive: true,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    if (!inventoryId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/inventory/${inventoryId}`)
      if (!response.ok) throw new Error('Failed to fetch inventory item')
      const data: InventoryItem = await response.json()

      setFormData({
        name: data.name,
        category: data.category,
        quantity: data.quantity.toString(),
        unit: data.unit,
        condition: data.condition,
        location: data.location || '',
        supplier: data.supplier || '',
        purchaseDate: data.purchaseDate ? data.purchaseDate.split('T')[0] : '',
        purchasePrice: data.purchasePrice?.toString() || '',
        description: data.description || '',
        isActive: data.isActive,
      })
    } catch (error) {
      console.error('Failed to load inventory item:', error)
      toast.error('Failed to load inventory item. Please try again.')
      router.push('/inventory')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')

    if (!formData.name || !formData.unit) {
      toast.error('Please fill in all required fields')
      setFormError('Please fill in all required fields')
      setSaving(false)
      return
    }

    try {
      const inventoryData: any = {
        name: formData.name,
        category: formData.category,
        quantity: parseInt(formData.quantity) || 0,
        unit: formData.unit,
        condition: formData.condition,
        location: formData.location || null,
        supplier: formData.supplier || null,
        purchaseDate: formData.purchaseDate || null,
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
        description: formData.description || null,
        isActive: formData.isActive,
      }

      const url = inventoryId ? `/api/inventory/${inventoryId}` : '/api/inventory'
      const method = inventoryId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inventoryData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save inventory item')
      }

      toast.success(inventoryId ? 'Inventory item updated successfully!' : 'Inventory item added successfully!')
      router.push('/inventory')
    } catch (error: any) {
      console.error('Failed to save inventory item:', error)
      const message = error.message || 'Failed to save inventory item. Please try again.'
      toast.error(message)
      setFormError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/inventory"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <FaArrowLeft />
            Back to Inventory
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {inventoryId ? 'Edit Inventory Item' : 'Create New Inventory Item'}
          </h1>
          <p className="text-gray-600 mt-1">
            {inventoryId ? 'Update inventory item information' : 'Add a new inventory item to your records'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Water Glasses, Steel Vessels, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {INVENTORY_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Unit *
                </label>
                <input
                  type="text"
                  required
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="pieces, sets, units..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Condition *
                </label>
                <select
                  required
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="damaged">Damaged</option>
                  <option value="repair">Repair</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Storage Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Storage location"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Supplier/Vendor
                </label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Supplier name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Purchase Date
                </label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Purchase Price (per unit)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                placeholder="Additional notes, specifications..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Active
              </label>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <FormError message={formError} className="mr-auto self-center" />
              <Link
                href="/inventory"
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : inventoryId ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
