'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FaArrowLeft } from 'react-icons/fa'
import toast from 'react-hot-toast'
import Link from 'next/link'
import FormError from '@/components/FormError'

const WORKFORCE_ROLES = ['supervisor', 'chef', 'labours', 'boys', 'transport', 'gas', 'pan', 'store', 'other']

interface WorkforceMember {
  id: string
  name: string
  role: string
  isActive: boolean
}

export default function CreateWorkforcePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const workforceId = searchParams?.get('id') ?? null
  const isEditMode = !!workforceId

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    role: 'supervisor',
    isActive: true,
  })

  useEffect(() => {
    if (isEditMode) {
      loadWorkforceData()
    } else {
      setLoading(false)
    }
  }, [isEditMode, workforceId])

  const loadWorkforceData = async () => {
    if (!workforceId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/workforce/${workforceId}`)
      if (!response.ok) throw new Error('Failed to fetch workforce member')
      const data: WorkforceMember = await response.json()

      setFormData({
        name: data.name,
        role: data.role,
        isActive: data.isActive,
      })
    } catch (error) {
      console.error('Failed to load workforce member:', error)
      toast.error('Failed to load workforce member. Please try again.')
      router.push('/workforce')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')

    if (!formData.name.trim()) {
      toast.error('Please enter a name')
      setFormError('Please enter a name')
      setSaving(false)
      return
    }

    try {
      const workforceData = {
        name: formData.name.trim(),
        role: formData.role,
        isActive: formData.isActive,
      }

      const url = isEditMode ? `/api/workforce/${workforceId}` : '/api/workforce'
      const method = isEditMode ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workforceData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save workforce member')
      }

      toast.success(isEditMode ? 'Workforce member updated successfully!' : 'Workforce member added successfully!')
      router.push('/workforce')
    } catch (error: any) {
      console.error('Failed to save workforce member:', error)
      const message = error.message || 'Failed to save workforce member. Please try again.'
      toast.error(message)
      setFormError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/workforce"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <FaArrowLeft />
            Back to Workforce
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'Edit Workforce Member' : 'Add New Workforce Member'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditMode ? 'Update workforce member information' : 'Add a new workforce member to your records'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="Enter workforce member name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                {WORKFORCE_ROLES.map(role => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Active
              </label>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <FormError message={formError} className="mr-auto self-center" />
              <Link
                href="/workforce"
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : (isEditMode ? 'Update Member' : 'Create Member')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
