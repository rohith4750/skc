'use client'

import { useEffect, useState, useMemo } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaStore,
    FaSearch,
    FaCalendarAlt,
    FaTimes,
    FaArrowLeft,
    FaCheckCircle,
    FaExclamationCircle,
    FaClock,
    FaChartBar,
    FaFilter,
    FaReceipt,
    FaShoppingBasket
} from 'react-icons/fa'
import toast from 'react-hot-toast'
import Link from 'next/link'
import ConfirmModal from '@/components/ConfirmModal'

interface StoreEntry {
    id: string
    description: string
    amount: number
    recipient: string | null
    notes: string | null
    paymentDate: string
    paymentStatus: string
    paidAmount: number
    createdAt: string
}

export default function StoreCalculatorPage() {
    const [entries, setEntries] = useState<StoreEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Filters
    const [searchTerm, setSearchTerm] = useState('')
    const [dateRange, setDateRange] = useState({ start: '', end: '' })
    const [showFilters, setShowFilters] = useState(false)
    const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all')

    // Form state
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        recipient: '',
        notes: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paidAmount: '',
        paymentStatus: 'paid' as 'pending' | 'partial' | 'paid',
    })

    // Delete
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null,
    })

    useEffect(() => {
        loadEntries()
    }, [])

    const loadEntries = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/expenses')
            if (!res.ok) throw new Error('Failed to fetch')
            const allExpenses = await res.json()
            // Filter only store category expenses
            const storeExpenses = allExpenses
                .filter((e: any) => e.category === 'store')
                .map((e: any) => ({
                    id: e.id,
                    description: e.description || 'Store Expense',
                    amount: typeof e.amount === 'string' ? parseFloat(e.amount) : Number(e.amount || 0),
                    recipient: e.recipient,
                    notes: e.notes,
                    paymentDate: e.paymentDate,
                    paymentStatus: (e.paymentStatus || 'pending').toLowerCase(),
                    paidAmount: typeof e.paidAmount === 'string' ? parseFloat(e.paidAmount) : Number(e.paidAmount || 0),
                    createdAt: e.createdAt,
                }))
                .sort((a: StoreEntry, b: StoreEntry) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
            setEntries(storeExpenses)
        } catch (error) {
            console.error('Failed to load store entries:', error)
            toast.error('Failed to load store entries')
        } finally {
            setLoading(false)
        }
    }

    const baseFilteredEntries = useMemo(() => {
        let filtered = entries

        if (searchTerm) {
            const s = searchTerm.toLowerCase()
            filtered = filtered.filter(e =>
                e.description.toLowerCase().includes(s) ||
                e.recipient?.toLowerCase().includes(s) ||
                e.notes?.toLowerCase().includes(s)
            )
        }

        if (dateRange.start || dateRange.end) {
            filtered = filtered.filter(e => {
                const d = new Date(e.paymentDate)
                if (dateRange.start && d < new Date(dateRange.start)) return false
                if (dateRange.end) {
                    const end = new Date(dateRange.end)
                    end.setHours(23, 59, 59, 999)
                    if (d > end) return false
                }
                return true
            })
        }
        return filtered
    }, [entries, searchTerm, dateRange])

    const filteredEntries = useMemo(() => {
        if (statusFilter === 'all') return baseFilteredEntries

        return baseFilteredEntries.filter(e => {
            if (statusFilter === 'paid') return e.paymentStatus === 'paid'
            if (statusFilter === 'pending') return e.paymentStatus === 'pending' || e.paymentStatus === 'partial'
            return true
        })
    }, [baseFilteredEntries, statusFilter])

    const totalAmount = useMemo(() => baseFilteredEntries.reduce((sum, e) => sum + e.amount, 0), [baseFilteredEntries])
    const totalPaid = useMemo(() => baseFilteredEntries.reduce((sum, e) => {
        const status = (e.paymentStatus || 'pending').toLowerCase()
        if (status === 'pending') return sum
        if (status === 'paid') return sum + e.amount
        return sum + (e.paidAmount || 0)
    }, 0), [baseFilteredEntries])
    const totalPending = totalAmount - totalPaid

    // Monthly breakdown (based on status filter or base? Usually base context is better)
    const monthlyBreakdown = useMemo(() => {
        const monthly: Record<string, number> = {}
        baseFilteredEntries.forEach(e => {
            const month = new Date(e.paymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
            monthly[month] = (monthly[month] || 0) + e.amount
        })
        return Object.entries(monthly).slice(0, 6)
    }, [baseFilteredEntries])

    const resetForm = () => {
        setFormData({
            description: '',
            amount: '',
            recipient: '',
            notes: '',
            paymentDate: new Date().toISOString().split('T')[0],
            paidAmount: '',
            paymentStatus: 'paid',
        })
        setEditingId(null)
        setShowForm(false)
    }

    const handleEdit = (entry: StoreEntry) => {
        setFormData({
            description: entry.description,
            amount: entry.amount.toString(),
            recipient: entry.recipient || '',
            notes: entry.notes || '',
            paymentDate: entry.paymentDate?.split('T')[0] || new Date().toISOString().split('T')[0],
            paidAmount: entry.paidAmount?.toString() || '0',
            paymentStatus: entry.paymentStatus as 'pending' | 'partial' | 'paid',
        })
        setEditingId(entry.id)
        setShowForm(true)
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const amount = parseFloat(formData.amount)
        if (!formData.description.trim() || !amount || amount <= 0) {
            toast.error('Please enter description and a valid amount')
            return
        }

        setSaving(true)
        try {
            // Logic to determine final paid amount
            let finalPaidAmount = 0
            if (formData.paymentStatus === 'pending') {
                finalPaidAmount = 0
            } else if (formData.paymentStatus === 'paid') {
                finalPaidAmount = amount // Full amount
            } else {
                // Partial
                finalPaidAmount = formData.paidAmount ? parseFloat(formData.paidAmount) : 0
            }

            const expenseData = {
                orderId: null,
                category: 'store',
                amount: amount,
                paidAmount: finalPaidAmount,
                paymentStatus: formData.paymentStatus,
                description: formData.description.trim(),
                recipient: formData.recipient.trim() || null,
                paymentDate: formData.paymentDate,
                eventDate: null,
                notes: formData.notes.trim() || null,
                calculationDetails: null,
                isBulkExpense: false,
                bulkAllocations: null,
                allocationMethod: null,
            }

            const url = editingId ? `/api/expenses/${editingId}` : '/api/expenses'
            const method = editingId ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(expenseData),
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Failed to save')
            }

            toast.success(editingId ? 'Entry updated!' : 'Entry added!')
            resetForm()
            await loadEntries()
        } catch (error: any) {
            console.error('Failed to save:', error)
            toast.error(error.message || 'Failed to save entry')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = (id: string) => {
        setDeleteConfirm({ isOpen: true, id })
    }

    const confirmDelete = async () => {
        if (!deleteConfirm.id) return
        try {
            const res = await fetch(`/api/expenses/${deleteConfirm.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete')
            toast.success('Entry deleted!')
            setDeleteConfirm({ isOpen: false, id: null })
            await loadEntries()
        } catch (error) {
            console.error('Failed to delete:', error)
            toast.error('Failed to delete entry')
            setDeleteConfirm({ isOpen: false, id: null })
        }
    }

    const handleMarkAsPaid = async (entry: StoreEntry) => {
        try {
            const res = await fetch(`/api/expenses/${entry.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: null,
                    category: 'store',
                    amount: entry.amount,
                    paidAmount: entry.amount,
                    paymentStatus: 'paid',
                    description: entry.description,
                    recipient: entry.recipient,
                    paymentDate: entry.paymentDate,
                    eventDate: null,
                    notes: entry.notes,
                    calculationDetails: null,
                }),
            })
            if (!res.ok) throw new Error('Failed to update')
            toast.success('Marked as paid!')
            await loadEntries()
        } catch (error) {
            console.error('Failed to mark as paid:', error)
            toast.error('Failed to mark as paid')
        }
    }

    const clearFilters = () => {
        setSearchTerm('')
        setDateRange({ start: '', end: '' })
    }

    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
        paid: { color: 'bg-green-100 text-green-800', icon: FaCheckCircle, label: 'Paid' },
        partial: { color: 'bg-yellow-100 text-yellow-800', icon: FaExclamationCircle, label: 'Partial' },
        pending: { color: 'bg-red-100 text-red-800', icon: FaClock, label: 'Pending' },
    }

    if (loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">Loading store expenses...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-4 sm:mb-6">
                <Link
                    href="/expenses"
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-3 text-sm transition-colors"
                >
                    <FaArrowLeft className="text-xs" />
                    Back to Expenses
                </Link>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="bg-indigo-100 p-2 rounded-lg">
                                <FaStore className="text-indigo-600 w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            Store Expenditure
                        </h1>
                        <p className="text-gray-500 mt-1 text-xs sm:text-sm">Track all your store purchases — vegetables, supplies, essentials</p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:scale-95 transition-all shadow-sm text-sm"
                        >
                            <FaFilter className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Filter</span>
                        </button>
                        <button
                            onClick={() => {
                                resetForm()
                                setShowForm(true)
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-md text-sm font-medium flex-1 sm:flex-initial"
                        >
                            <FaPlus className="w-3.5 h-3.5" />
                            Add Entry
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                {/* Total Store Expenses */}
                <div
                    onClick={() => setStatusFilter('all')}
                    className={`bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-4 sm:p-5 text-white relative overflow-hidden cursor-pointer transition-all transform hover:scale-[1.02] active:scale-[0.98] ${statusFilter === 'all' ? 'ring-4 ring-indigo-200 ring-offset-2' : ''}`}
                >
                    <div className="bg-white bg-opacity-20 absolute top-0 right-0 p-3 rounded-bl-2xl">
                        <FaStore className="w-5 h-5" />
                    </div>
                    <div className="relative pr-12">
                        <p className="text-indigo-100 text-xs font-medium mb-2">Total Store Expenses</p>
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold break-words leading-tight">{formatCurrency(totalAmount)}</p>
                        <p className="text-indigo-200 text-xs mt-1.5">{baseFilteredEntries.length} entries</p>
                    </div>
                </div>

                {/* Total Paid */}
                <div
                    onClick={() => setStatusFilter('paid')}
                    className={`bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-4 sm:p-5 text-white relative overflow-hidden cursor-pointer transition-all transform hover:scale-[1.02] active:scale-[0.98] ${statusFilter === 'paid' ? 'ring-4 ring-green-200 ring-offset-2' : ''}`}
                >
                    <div className="bg-white bg-opacity-20 absolute top-0 right-0 p-3 rounded-bl-2xl">
                        <FaCheckCircle className="w-5 h-5" />
                    </div>
                    <div className="relative pr-12">
                        <p className="text-green-100 text-xs font-medium mb-2">Total Paid</p>
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold break-words leading-tight">{formatCurrency(totalPaid)}</p>
                    </div>
                </div>

                {/* Pending */}
                <div
                    onClick={() => setStatusFilter('pending')}
                    className={`bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg p-4 sm:p-5 text-white relative overflow-hidden cursor-pointer transition-all transform hover:scale-[1.02] active:scale-[0.98] ${statusFilter === 'pending' ? 'ring-4 ring-orange-200 ring-offset-2' : ''}`}
                >
                    <div className="bg-white bg-opacity-20 absolute top-0 right-0 p-3 rounded-bl-2xl">
                        <FaClock className="w-5 h-5" />
                    </div>
                    <div className="relative pr-12">
                        <p className="text-amber-100 text-xs font-medium mb-2">Pending Amount</p>
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold break-words leading-tight">{formatCurrency(totalPending)}</p>
                    </div>
                </div>

                {/* This Month */}
                <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg p-4 sm:p-5 text-white relative overflow-hidden">
                    <div className="bg-white bg-opacity-20 absolute top-0 right-0 p-3 rounded-bl-2xl">
                        <FaChartBar className="w-5 h-5" />
                    </div>
                    <div className="relative pr-12">
                        <p className="text-violet-100 text-xs font-medium mb-2">Monthly Breakdown</p>
                        {monthlyBreakdown.length > 0 ? (
                            <div className="space-y-0.5">
                                {monthlyBreakdown.slice(0, 3).map(([month, amount]) => (
                                    <div key={month} className="flex justify-between text-xs">
                                        <span className="text-violet-200">{month}</span>
                                        <span className="font-semibold">{formatCurrency(amount)}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-violet-200 text-sm">No entries yet</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="mb-4 bg-white rounded-xl shadow-md p-4 sm:p-5 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                            <FaFilter className="text-indigo-500" />
                            Filters
                        </h3>
                        <div className="flex items-center gap-2">
                            {(searchTerm || dateRange.start || dateRange.end || statusFilter !== 'all') && (
                                <button onClick={() => { clearFilters(); setStatusFilter('all'); }} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                                    Clear All
                                </button>
                            )}
                            <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
                                <FaTimes className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search description, vendor..."
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Entry Form */}
            {showForm && (
                <div className="mb-4 sm:mb-6 bg-white rounded-xl shadow-lg border border-indigo-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-white font-semibold text-base sm:text-lg flex items-center gap-2">
                                <FaReceipt />
                                {editingId ? 'Edit Entry' : 'New Store Entry'}
                            </h2>
                            <button onClick={resetForm} className="text-indigo-200 hover:text-white transition-colors">
                                <FaTimes className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                        {/* Description + Amount — Main row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Description *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    placeholder="e.g., Vegetables, Oil, Rice, Monthly Supplies..."
                                />
                                {/* Quick suggestions */}
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {['Vegetables', 'Oil', 'Rice', 'Spices', 'Groceries', 'Disposables', 'Cleaning Supplies', 'Gas Cylinder'].map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, description: s })}
                                            className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${formData.description === s
                                                ? 'bg-indigo-100 text-indigo-700 border-indigo-300 font-medium'
                                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                                }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Amount (₹) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    min="0.01"
                                    value={formData.amount}
                                    onChange={(e) => {
                                        const val = e.target.value
                                        setFormData({
                                            ...formData,
                                            amount: val,
                                            paidAmount: val, // auto-set paid = amount for convenience
                                        })
                                    }}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    placeholder="45000"
                                />
                            </div>
                        </div>

                        {/* Date, Vendor, Payment Status */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Date *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.paymentDate}
                                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Vendor / Shop
                                </label>
                                <input
                                    type="text"
                                    value={formData.recipient}
                                    onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    placeholder="Shop or vendor name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Payment Status
                                </label>
                                <select
                                    value={formData.paymentStatus}
                                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as any })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                >
                                    <option value="paid">Paid</option>
                                    <option value="partial">Partial</option>
                                    <option value="pending">Pending</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Paid Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.paidAmount}
                                    onChange={(e) => {
                                        const paid = parseFloat(e.target.value) || 0
                                        const total = parseFloat(formData.amount) || 0
                                        let status: 'pending' | 'partial' | 'paid' = 'pending'
                                        if (paid >= total && total > 0) status = 'paid'
                                        else if (paid > 0) status = 'partial'
                                        setFormData({ ...formData, paidAmount: e.target.value, paymentStatus: status })
                                    }}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Notes
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                rows={2}
                                placeholder="Any additional notes..."
                            />
                        </div>

                        {/* Amount Preview + Buttons */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
                            <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2.5">
                                <span className="text-xs text-indigo-600 font-medium">Total Amount: </span>
                                <span className="text-lg font-bold text-indigo-700">
                                    {formatCurrency(parseFloat(formData.amount) || 0)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 sm:flex-initial px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? 'Saving...' : editingId ? 'Update Entry' : 'Add Entry'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* Statement / Ledger */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 sm:px-6 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                            <FaShoppingBasket className="text-indigo-500" />
                            Store Expense Statement
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                                {filteredEntries.length} entries
                            </span>
                        </h2>
                        <div className="text-right">
                            <span className="text-xs text-gray-500">Grand Total</span>
                            <p className="text-sm sm:text-base font-bold text-indigo-700">{formatCurrency(totalAmount)}</p>
                        </div>
                    </div>
                </div>

                {filteredEntries.length === 0 ? (
                    <div className="py-16 text-center">
                        <FaStore className="mx-auto text-4xl text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No store expenses found</p>
                        <p className="text-gray-400 text-sm mt-1">Click "Add Entry" to record your first store purchase</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredEntries.map((entry, index) => {
                                        const config = statusConfig[entry.paymentStatus] || statusConfig.pending
                                        const StatusIcon = config.icon
                                        return (
                                            <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <FaCalendarAlt className="text-gray-400 text-xs" />
                                                        <span className="text-sm font-medium text-gray-900">{formatDate(entry.paymentDate)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm font-medium text-gray-900">{entry.description}</div>
                                                    {entry.notes && (
                                                        <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">{entry.notes}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm text-gray-600">{entry.recipient || '—'}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="text-sm font-bold text-gray-900">{formatCurrency(entry.amount)}</div>
                                                    {entry.paidAmount > 0 && entry.paidAmount < entry.amount && (
                                                        <div className="text-xs text-green-600 mt-0.5">Paid: {formatCurrency(entry.paidAmount)}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                                                        <StatusIcon className="text-[10px]" />
                                                        {config.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {entry.paymentStatus !== 'paid' && (
                                                            <button
                                                                onClick={() => handleMarkAsPaid(entry)}
                                                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                title="Mark as Paid"
                                                            >
                                                                <FaCheckCircle className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleEdit(entry)}
                                                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <FaEdit className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(entry.id)}
                                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <FaTrash className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                                {/* Total Row */}
                                <tfoot>
                                    <tr className="bg-indigo-50 border-t-2 border-indigo-200">
                                        <td colSpan={3} className="px-4 py-3 text-sm font-bold text-indigo-900">
                                            Grand Total ({filteredEntries.length} entries)
                                        </td>
                                        <td className="px-4 py-3 text-right text-base font-bold text-indigo-700">
                                            {formatCurrency(totalAmount)}
                                        </td>
                                        <td colSpan={2}></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {filteredEntries.map((entry) => {
                                const config = statusConfig[entry.paymentStatus] || statusConfig.pending
                                const StatusIcon = config.icon
                                return (
                                    <div key={entry.id} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs text-gray-500">{formatDate(entry.paymentDate)}</span>
                                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${config.color}`}>
                                                        <StatusIcon className="text-[8px]" />
                                                        {config.label}
                                                    </span>
                                                </div>
                                                <h3 className="text-sm font-semibold text-gray-900">{entry.description}</h3>
                                                {entry.recipient && (
                                                    <p className="text-xs text-gray-500 mt-0.5">{entry.recipient}</p>
                                                )}
                                                {entry.notes && (
                                                    <p className="text-xs text-gray-400 mt-0.5 truncate">{entry.notes}</p>
                                                )}
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-sm font-bold text-gray-900">{formatCurrency(entry.amount)}</p>
                                                <div className="flex items-center gap-1 mt-1.5 justify-end">
                                                    {entry.paymentStatus !== 'paid' && (
                                                        <button
                                                            onClick={() => handleMarkAsPaid(entry)}
                                                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                                                        >
                                                            <FaCheckCircle className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleEdit(entry)}
                                                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                                    >
                                                        <FaEdit className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(entry.id)}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                                                    >
                                                        <FaTrash className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                            {/* Mobile Total */}
                            <div className="p-4 bg-indigo-50 border-t-2 border-indigo-200">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-indigo-900">Grand Total</span>
                                    <span className="text-base font-bold text-indigo-700">{formatCurrency(totalAmount)}</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                title="Delete Store Entry"
                message="Are you sure you want to delete this entry? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
            />
        </div>
    )
}
