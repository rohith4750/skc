'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FaArrowLeft } from 'react-icons/fa'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Customer {
  id: string
  name: string
  phone: string
  email: string
  address: string
  createdAt: string
  updatedAt: string
}

export default function CreateCustomerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const customerId = searchParams.get('id')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    if (!customerId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/customers/${customerId}`)
      if (!response.ok) throw new Error('Failed to fetch customer')
      const data: Customer = await response.json()
      
      setFormData({
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
      })
    } catch (error) {
      console.error('Failed to load customer:', error)
      toast.error('Failed to load customer. Please try again.')
      router.push('/customers')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    if (!formData.name || !formData.phone || !formData.email || !formData.address) {
      toast.error('Please fill in all required fields')
      setSaving(false)
      return
    }

    try {
      if (customerId) {
        // Update existing customer
        const response = await fetch(`/api/customers/${customerId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        
        if (!response.ok) throw new Error('Failed to update customer')
        toast.success('Customer updated successfully!')
      } else {
        // Create new customer
        const response = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        
        if (!response.ok) throw new Error('Failed to create customer')
        toast.success('Customer created successfully!')
      }
      
      router.push('/customers')
    } catch (error: any) {
      console.error('Failed to save customer:', error)
      toast.error(error.message || 'Failed to save customer. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading customer...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/customers"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Customers</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          {customerId ? 'Edit Customer' : 'Add New Customer'}
        </h1>
        <p className="text-gray-600 mt-1">
          {customerId ? 'Update customer information' : 'Add a new customer to the system'}
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter customer name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Address *
              </label>
              <textarea
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter customer address"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-4 border-t border-gray-200">
            <Link
              href="/customers"
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-center font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : customerId ? 'Update Customer' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
