"use client";
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaArrowLeft } from 'react-icons/fa'
import { toast } from 'sonner'
import Link from 'next/link'
import { isEmail, isPhone, isNonEmptyString } from '@/lib/validation'
import FormError from '@/components/FormError'

interface Customer {
    id: string
    name: string
    phone: string
    email: string
    address: string
}

interface CustomerFormProps {
    id?: string | null
}

export default function CustomerForm({ id }: CustomerFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(!!id)
    const [saving, setSaving] = useState(false)
    const [formError, setFormError] = useState('')
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
    })

    useEffect(() => {
        if (id) {
            loadData()
        } else {
            setLoading(false)
        }
    }, [id])

    const loadData = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/customers/${id}`)
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
        setFormError('')

        // Only name and address are required
        if (!isNonEmptyString(formData.name) || !isNonEmptyString(formData.address)) {
            toast.error('Please fill in name and address')
            setFormError('Please fill in name and address')
            setSaving(false)
            return
        }

        // Validate phone only if provided
        if (formData.phone && !isPhone(formData.phone)) {
            toast.error('Please enter a valid phone number')
            setFormError('Please enter a valid phone number')
            setSaving(false)
            return
        }

        // Validate email only if provided
        if (formData.email && !isEmail(formData.email)) {
            toast.error('Please enter a valid email address')
            setFormError('Please enter a valid email address')
            setSaving(false)
            return
        }

        try {
            if (id) {
                // Update existing customer
                const response = await fetch(`/api/customers/${id}`, {
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
            const message = error.message || 'Failed to save customer. Please try again.'
            toast.error(message)
            setFormError(message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
        )
    }

    return (
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
                            Phone
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Enter phone number (optional)"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Enter email address (optional)"
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
                    <FormError message={formError} className="sm:mr-auto sm:self-center" />
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
                        {saving ? 'Saving...' : id ? 'Update Customer' : 'Create Customer'}
                    </button>
                </div>
            </form>
        </div>
    )
}

