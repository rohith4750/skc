"use client";
import { useState, useEffect } from 'react'
import { Storage } from '@/lib/storage-api'
import { MenuItem } from '@/types'
import { isNonEmptyString } from '@/lib/validation'
import FormError from '@/components/FormError'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface MenuFormProps {
    id?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function MenuForm({ id, onSuccess, onCancel }: MenuFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(!!id)
    const [formError, setFormError] = useState('')
    const [formData, setFormData] = useState({
        name: '',
        type: [] as string[],
        description: '',
        price: '',
        unit: '',
        isActive: true,
    })

    useEffect(() => {
        if (id) {
            loadMenuItem(id)
        }
    }, [id])

    const loadMenuItem = async (itemId: string) => {
        try {
            setLoading(true)
            const menuItems = await Storage.getMenuItems()
            const item = menuItems.find((m: MenuItem) => m.id === itemId)
            if (item) {
                setFormData({
                    name: item.name,
                    type: Array.isArray(item.type) ? item.type : [item.type],
                    description: item.description || '',
                    price: item.price ? item.price.toString() : '',
                    unit: item.unit || '',
                    isActive: item.isActive,
                })
            } else {
                toast.error('Menu item not found')
                router.push('/menu')
            }
        } catch (error) {
            console.error('Failed to load menu item:', error)
            toast.error('Failed to load menu item')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormError('')

        try {
            if (!isNonEmptyString(formData.name) || formData.type.length === 0) {
                // toast.error('Please enter name and select at least one type')
                setFormError('Please enter name and select at least one type')
                return
            }

            const menuItem: any = {
                name: formData.name,
                type: formData.type,
                description: formData.description,
                price: formData.price ? parseFloat(formData.price) : null,
                unit: formData.unit,
                isActive: formData.isActive,
            }

            if (id) {
                menuItem.id = id
            }

            await Storage.saveMenuItem(menuItem)
            toast.success(id ? 'Menu item updated successfully!' : 'Menu item created successfully!')

            if (onSuccess) {
                onSuccess()
            } else {
                router.push('/menu')
                router.refresh()
            }
        } catch (error) {
            console.error('Failed to save menu item:', error)
            const message = 'Failed to save menu item. Please try again.'
            toast.error(message)
            setFormError(message)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <form onSubmit={handleSubmit} className="p-4 sm:p-6">

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Item Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 sm:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                            placeholder="e.g., Biryani, Pulao, Water Bottle"
                        />
                        <FormError message={formError} className="mb-4" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Item Types *
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            {[
                                { id: 'breakfast', label: 'Breakfast' },
                                { id: 'lunch', label: 'Lunch' },
                                { id: 'dinner', label: 'Dinner' },
                                { id: 'snacks', label: 'Snacks' },
                                { id: 'sweets', label: 'Sweets' },
                                { id: 'saree', label: 'Saree' },
                                { id: 'water_bottles', label: 'Water Bottles' }
                            ].map(type => (
                                <label key={type.id} className="flex items-center group cursor-pointer">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.type.includes(type.id)}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                const newTypes = checked
                                                    ? [...formData.type, type.id]
                                                    : formData.type.filter(t => t !== type.id);
                                                setFormData({ ...formData, type: newTypes });
                                            }}
                                            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 transition-all checked:bg-indigo-600 checked:border-indigo-600"
                                        />
                                        <svg className="absolute h-3.5 w-3.5 opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    </div>
                                    <span className="ml-2 text-sm text-slate-600 group-hover:text-indigo-600 transition-colors">{type.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Item Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            className="w-full px-3 sm:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                            placeholder="Enter item description..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Price (Optional)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="w-full px-3 sm:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Unit (Optional)
                            </label>
                            <input
                                type="text"
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                className="w-full px-3 sm:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                                placeholder="e.g. bottle, plate"
                            />
                        </div>
                    </div>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="isActive" className="ml-2 text-sm font-medium text-slate-700">
                            Active
                        </label>
                    </div>
                </div>
                <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4">
                    <button
                        type="button"
                        onClick={() => onCancel ? onCancel() : router.back()}
                        className="px-4 sm:px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors text-sm sm:text-base"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 sm:px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
                    >
                        {id ? 'Update' : 'Create'} Item
                    </button>
                </div>
            </form>
        </div>
    )
}
