"use client";
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Expense, Order, BulkAllocation } from '@/types'
import { FaArrowLeft, FaLayerGroup, FaChevronDown, FaChevronUp, FaTimes, FaInfoCircle } from 'react-icons/fa'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { formatCurrency, getLocalISODate, getOrderDate } from '@/lib/utils'
import FormError from '@/components/FormError'

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

const WORKFORCE_RECIPIENT_ROLES = ['supervisor', 'chef', 'labours', 'boys', 'transport', 'gas', 'pan', 'store', 'other']

const ALLOCATION_METHODS = [
    { value: 'equal', label: 'Equal Split', description: 'Divide amount equally among all events' },
    { value: 'manual', label: 'Manual', description: 'Specify exact amount for each event' },
    { value: 'by-plates', label: 'By Plates', description: 'Allocate proportionally by number of plates/members' },
    { value: 'by-percentage', label: 'By Percentage', description: 'Allocate by custom percentage for each event' },
]

interface WorkforceMember {
    id: string
    name: string
    role: string
    isActive: boolean
}

interface ExpenseFormProps {
    id?: string | null
}

export default function ExpenseForm({ id: expenseId }: ExpenseFormProps) {
    const router = useRouter()
    const [orders, setOrders] = useState<Order[]>([])
    const [workforce, setWorkforce] = useState<WorkforceMember[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formError, setFormError] = useState('')
    const [existingExpenses, setExistingExpenses] = useState<any[]>([])
    const [customCategoryInputType, setCustomCategoryInputType] = useState<'select' | 'input'>('select')

    // Bulk allocation state
    const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false)
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])
    const isBulkExpense = selectedOrderIds.length > 1
    const [allocationMethod, setAllocationMethod] = useState<'equal' | 'manual' | 'by-plates' | 'by-percentage'>('equal')
    const [bulkAllocations, setBulkAllocations] = useState<BulkAllocation[]>([])
    const [showAllocationDetails, setShowAllocationDetails] = useState(true)

    // Filters for orders
    const [filterMonth, setFilterMonth] = useState<string>(new Date().getMonth().toString())
    const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString())
    const [filterDate, setFilterDate] = useState<string>('')
    const [orderSearch, setOrderSearch] = useState('')

    const [formData, setFormData] = useState({
        category: 'supervisor',
        customCategoryName: '',
        calculationMethod: 'total' as 'plate-wise' | 'total',
        amount: '',
        plates: '',
        numberOfLabours: '',
        labourAmount: '',
        dressedBoys: '',
        dressedBoyAmount: '',
        nonDressedBoys: '',
        nonDressedBoyAmount: '',
        description: '',
        recipient: '',
        paymentDate: getLocalISODate(),
        eventDate: '',
        notes: '',
        paidAmount: '',
        paymentStatus: 'pending' as 'pending' | 'partial' | 'paid',
        mealType: '',
        selectedMealTypes: [] as Array<{ id: string; label: string; plates: string }>,
        breakfastAmount: '',
        lunchAmount: '',
        snacksAmount: '',
        dinnerAmount: '',
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const results = await Promise.allSettled([
                fetch('/api/orders'),
                fetch('/api/workforce'),
                fetch('/api/expenses'),
                expenseId ? fetch(`/api/expenses/${expenseId}`) : Promise.resolve(null),
            ])

            const ordersResult = results[0]
            const workforceResult = results[1]
            const expensesResult = results[2]
            const expenseResult = results[3]

            if (ordersResult.status === 'fulfilled' && ordersResult.value.ok) {
                setOrders(await ordersResult.value.json())
            }

            if (workforceResult.status === 'fulfilled' && workforceResult.value.ok) {
                const wf = await workforceResult.value.json()
                setWorkforce((wf.workforce || []).filter((member: any) => member.isActive))
            }

            if (expensesResult.status === 'fulfilled' && expensesResult.value.ok) {
                setExistingExpenses(await expensesResult.value.json())
            }

            if (expenseId && expenseResult.status === 'fulfilled' && (expenseResult.value as any)?.ok) {
                const expenseData = await (expenseResult.value as any).json()
                if (expenseData) {
                    const details = expenseData.calculationDetails as any || {}
                    const isCustomCategory = !EXPENSE_CATEGORIES.includes(expenseData.category)
                    setFormData({
                        category: isCustomCategory ? 'other' : expenseData.category,
                        customCategoryName: isCustomCategory ? expenseData.category : '',
                        calculationMethod: details.method || 'total',
                        amount: details.perPlateAmount ? details.perPlateAmount.toString() : expenseData.amount.toString(),
                        plates: details.plates ? details.plates.toString() : '',
                        numberOfLabours: details.numberOfLabours ? details.numberOfLabours.toString() : '',
                        labourAmount: details.perUnitAmount && expenseData.category === 'labours' ? details.perUnitAmount.toString() : '',
                        dressedBoys: details.dressedBoys ? details.dressedBoys.toString() : '',
                        dressedBoyAmount: details.dressedBoyAmount ? details.dressedBoyAmount.toString() : '',
                        nonDressedBoys: details.nonDressedBoys ? details.nonDressedBoys.toString() : '',
                        nonDressedBoyAmount: details.nonDressedBoyAmount ? details.nonDressedBoyAmount.toString() : '',
                        description: expenseData.description || '',
                        recipient: expenseData.recipient || '',
                        paymentDate: expenseData.paymentDate ? expenseData.paymentDate.split('T')[0] : getLocalISODate(),
                        eventDate: expenseData.eventDate ? expenseData.eventDate.split('T')[0] : '',
                        notes: expenseData.notes || '',
                        paidAmount: expenseData.paidAmount?.toString() || '0',
                        paymentStatus: expenseData.paymentStatus || 'pending',
                        mealType: details.mealType || '',
                        selectedMealTypes: details.mealTypePlates ? details.mealTypePlates.map((mp: any) => ({
                            id: mp.mealType,
                            label: mp.mealType,
                            plates: mp.plates.toString()
                        })) : [],
                        breakfastAmount: details.breakfastAmount?.toString() || '',
                        lunchAmount: details.lunchAmount?.toString() || '',
                        snacksAmount: details.snacksAmount?.toString() || '',
                        dinnerAmount: details.dinnerAmount?.toString() || '',
                    })
                    if (isCustomCategory) {
                        setCustomCategoryInputType('input')
                    }

                    if (expenseData.isBulkExpense && expenseData.bulkAllocations) {
                        setAllocationMethod(expenseData.allocationMethod || 'manual')
                        const allocations = expenseData.bulkAllocations as BulkAllocation[]
                        setBulkAllocations(allocations)
                        setSelectedOrderIds(allocations.map((a: BulkAllocation) => a.orderId))
                    } else if (expenseData.orderId) {
                        setSelectedOrderIds([expenseData.orderId])
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load data:', error)
            toast.error('Failed to load data. Please refresh.')
        } finally {
            setLoading(false)
        }
    }

    const customCategories = useMemo(() => {
        const categories = new Set<string>()
        workforce
            .filter((member) => member.role === 'other')
            .forEach((member) => {
                categories.add(member.name)
            })
        existingExpenses.forEach((expense: any) => {
            if (expense.category && !EXPENSE_CATEGORIES.includes(expense.category)) {
                categories.add(expense.category)
            }
        })
        return Array.from(categories).sort()
    }, [existingExpenses, workforce])

    const availableMealTypes = useMemo(() => {
        if (selectedOrderIds.length === 0) return []
        const uniqueMeals = new Map<string, { id: string; label: string }>()
        selectedOrderIds.forEach(orderId => {
            const order = orders.find(o => o.id === orderId)
            if (order && order.mealTypeAmounts) {
                Object.entries(order.mealTypeAmounts).forEach(([id, data]) => {
                    let label = id
                    if (typeof data === 'object' && (data as any).menuType) {
                        label = (data as any).menuType
                    }
                    const normalizedId = label.toLowerCase().trim()
                    if (!uniqueMeals.has(normalizedId)) {
                        uniqueMeals.set(normalizedId, { id: normalizedId, label })
                    }
                })
            }
        })
        return Array.from(uniqueMeals.values())
    }, [selectedOrderIds, orders])

    const calculatedAmount = useMemo(() => {
        if (formData.category === 'chef') {
            if (formData.calculationMethod === 'plate-wise') {
                if (formData.selectedMealTypes.length > 0) {
                    const totalPlates = formData.selectedMealTypes.reduce((sum, mt) => sum + (parseFloat(mt.plates) || 0), 0)
                    const amount = parseFloat(formData.amount) || 0
                    return totalPlates * amount
                } else {
                    const plates = parseFloat(formData.plates) || 0
                    const amount = parseFloat(formData.amount) || 0
                    return plates * amount
                }
            } else {
                return parseFloat(formData.amount) || 0
            }
        } else if (formData.category === 'labours') {
            const numberOfLabours = parseFloat(formData.numberOfLabours) || 0
            const labourAmount = parseFloat(formData.labourAmount) || 0
            return numberOfLabours * labourAmount
        } else if (formData.category === 'boys') {
            const dressedBoys = parseFloat(formData.dressedBoys) || 0
            const dressedBoyAmount = parseFloat(formData.dressedBoyAmount) || 0
            const nonDressedBoys = parseFloat(formData.nonDressedBoys) || 0
            const nonDressedBoyAmount = parseFloat(formData.nonDressedBoyAmount) || 0
            const mealTotal = (parseFloat(formData.breakfastAmount) || 0) +
                (parseFloat(formData.lunchAmount) || 0) +
                (parseFloat(formData.snacksAmount) || 0) +
                (parseFloat(formData.dinnerAmount) || 0)
            return (dressedBoys * dressedBoyAmount) + (nonDressedBoys * nonDressedBoyAmount) + mealTotal
        } else {
            return parseFloat(formData.amount) || 0
        }
    }, [formData])

    const getOrderDisplayName = (order: Order) => {
        const customerName = order.customer?.name || 'Unknown'
        const eventName = order.eventName || 'No Event Name'
        const date = new Date(getOrderDate(order)).toLocaleDateString()
        return `${customerName} - ${eventName} (${date})`
    }

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const eventDate = new Date(getOrderDate(order))
            if (filterDate) {
                const d = new Date(filterDate)
                if (eventDate.getFullYear() !== d.getFullYear() ||
                    eventDate.getMonth() !== d.getMonth() ||
                    eventDate.getDate() !== d.getDate()) {
                    return false
                }
            } else {
                const monthMatch = filterMonth === 'all' || eventDate.getMonth().toString() === filterMonth
                const yearMatch = filterYear === 'all' || eventDate.getFullYear().toString() === filterYear
                if (!monthMatch || !yearMatch) return false
            }
            if (!orderSearch.trim()) return true
            const searchLower = orderSearch.toLowerCase()
            const customerMatch = order.customer?.name?.toLowerCase().includes(searchLower)
            const eventMatch = order.eventName?.toLowerCase().includes(searchLower)
            const phoneMatch = order.customer?.phone?.includes(orderSearch)
            return customerMatch || eventMatch || phoneMatch
        })
    }, [orders, filterMonth, filterYear, filterDate, orderSearch])

    const getOrderPlates = (order: Order, mealTypeIds?: string[]): number => {
        if (mealTypeIds && mealTypeIds.length > 0) {
            if (order.mealTypeAmounts) {
                let totalPlates = 0
                Object.entries(order.mealTypeAmounts).forEach(([key, mealData]) => {
                    let label = key
                    if (mealData && typeof mealData === 'object' && (mealData as any).menuType) {
                        label = (mealData as any).menuType
                    }
                    const mealId = label.toLowerCase().trim()
                    if (mealTypeIds.includes(mealId)) {
                        if (mealData && typeof mealData === 'object' && (mealData as any).numberOfPlates) {
                            totalPlates += (mealData as any).numberOfPlates
                        } else if (mealData && typeof mealData === 'object' && (mealData as any).numberOfMembers) {
                            totalPlates += (mealData as any).numberOfMembers
                        }
                    }
                })
                if (totalPlates > 0) return totalPlates
            }
            return 0
        }
        if (order.numberOfMembers) return order.numberOfMembers
        if (order.mealTypeAmounts) {
            let totalPlates = 0
            Object.values(order.mealTypeAmounts).forEach((meal: any) => {
                if (typeof meal === 'object' && meal.numberOfPlates) {
                    totalPlates += meal.numberOfPlates
                } else if (typeof meal === 'object' && meal.numberOfMembers) {
                    totalPlates += meal.numberOfMembers
                }
            })
            if (totalPlates > 0) return totalPlates
        }
        return 100
    }

    const recalculateAllocations = (method: string, orderIds: string[], totalAmount: number) => {
        if (orderIds.length === 0) {
            setBulkAllocations([])
            return
        }
        const selectedOrders = orders.filter(o => orderIds.includes(o.id))
        if (method === 'equal') {
            const perOrderAmount = totalAmount / orderIds.length
            const newAllocations: BulkAllocation[] = selectedOrders.map(order => ({
                orderId: order.id,
                orderName: getOrderDisplayName(order),
                amount: Math.round(perOrderAmount * 100) / 100,
                percentage: 100 / orderIds.length,
            }))
            const sum = newAllocations.reduce((s, a) => s + a.amount, 0)
            if (newAllocations.length > 0 && Math.abs(sum - totalAmount) > 0.01) {
                newAllocations[newAllocations.length - 1].amount += totalAmount - sum
            }
            setBulkAllocations(newAllocations)
        } else if (method === 'by-plates') {
            const filterByMealTypes = formData.category === 'chef' && formData.calculationMethod === 'plate-wise' && formData.selectedMealTypes.length > 0
            const mealTypeIds = filterByMealTypes ? formData.selectedMealTypes.map(m => m.id) : undefined
            const ordersWithPlates = selectedOrders.map(order => ({
                order,
                plates: getOrderPlates(order, mealTypeIds)
            }))
            const totalPlates = ordersWithPlates.reduce((sum, o) => sum + o.plates, 0)
            const newAllocations: BulkAllocation[] = ordersWithPlates.map(({ order, plates }) => {
                const percentage = totalPlates > 0 ? (plates / totalPlates) * 100 : 0
                return {
                    orderId: order.id,
                    orderName: getOrderDisplayName(order),
                    amount: totalPlates > 0 ? Math.round((totalAmount * plates / totalPlates) * 100) / 100 : 0,
                    percentage: percentage,
                    plates: plates,
                }
            })
            const sum = newAllocations.reduce((s, a) => s + a.amount, 0)
            if (newAllocations.length > 0 && Math.abs(sum - totalAmount) > 0.01) {
                newAllocations[newAllocations.length - 1].amount += totalAmount - sum
            }
            setBulkAllocations(newAllocations)
        } else if (method === 'by-percentage') {
            const newAllocations: BulkAllocation[] = selectedOrders.map(order => {
                const existing = bulkAllocations.find(a => a.orderId === order.id)
                const percentage = existing?.percentage || (100 / orderIds.length)
                return {
                    orderId: order.id,
                    orderName: getOrderDisplayName(order),
                    amount: Math.round((totalAmount * percentage / 100) * 100) / 100,
                    percentage: percentage,
                }
            })
            setBulkAllocations(newAllocations)
        } else {
            const newAllocations: BulkAllocation[] = selectedOrders.map(order => {
                const existing = bulkAllocations.find(a => a.orderId === order.id)
                return {
                    orderId: order.id,
                    orderName: getOrderDisplayName(order),
                    amount: existing?.amount || 0,
                }
            })
            setBulkAllocations(newAllocations)
        }
    }

    const handleOrderSelection = (orderId: string, isSelected: boolean) => {
        const newSelectedIds = isSelected
            ? [...selectedOrderIds, orderId]
            : selectedOrderIds.filter(id => id !== orderId)
        setSelectedOrderIds(newSelectedIds)
        recalculateAllocations(allocationMethod, newSelectedIds, calculatedAmount)
    }

    const handleAllocationMethodChange = (method: 'equal' | 'manual' | 'by-plates' | 'by-percentage') => {
        setAllocationMethod(method)
        recalculateAllocations(method, selectedOrderIds, calculatedAmount)
    }

    const handleAllocationAmountChange = (orderId: string, amount: number) => {
        setBulkAllocations(prev => prev.map(a =>
            a.orderId === orderId ? { ...a, amount } : a
        ))
    }

    const handlePercentageChange = (orderId: string, percentage: number) => {
        setBulkAllocations(prev => prev.map(a =>
            a.orderId === orderId
                ? { ...a, percentage, amount: Math.round((calculatedAmount * percentage / 100) * 100) / 100 }
                : a
        ))
    }

    const totalAllocated = useMemo(() => {
        return bulkAllocations.reduce((sum, a) => sum + (a.amount || 0), 0)
    }, [bulkAllocations])

    const allocationDifference = useMemo(() => {
        return Math.round((calculatedAmount - totalAllocated) * 100) / 100
    }, [calculatedAmount, totalAllocated])

    useEffect(() => {
        if (isBulkExpense && selectedOrderIds.length >= 2 && calculatedAmount > 0) {
            recalculateAllocations(allocationMethod, selectedOrderIds, calculatedAmount)
        }
    }, [calculatedAmount])

    const handleMealTypeToggle = (mealId: string, mealLabel: string) => {
        setFormData(prev => {
            const isSelected = prev.selectedMealTypes.some(mt => mt.id === mealId)
            if (isSelected) {
                return {
                    ...prev,
                    selectedMealTypes: prev.selectedMealTypes.filter(mt => mt.id !== mealId)
                }
            } else {
                let totalDefaultPlates = 0
                selectedOrderIds.forEach(orderId => {
                    const selectedOrder = orders.find(o => o.id === orderId)
                    if (selectedOrder && selectedOrder.mealTypeAmounts) {
                        Object.entries(selectedOrder.mealTypeAmounts).forEach(([key, mealData]) => {
                            let label = key
                            if (mealData && typeof mealData === 'object' && (mealData as any).menuType) {
                                label = (mealData as any).menuType
                            }
                            if (label.toLowerCase().trim() === mealId) {
                                if (mealData && typeof mealData === 'object') {
                                    const plates = (mealData as any).numberOfPlates || (mealData as any).numberOfMembers || 0
                                    totalDefaultPlates += plates
                                }
                            }
                        })
                    }
                })
                return {
                    ...prev,
                    selectedMealTypes: [
                        ...prev.selectedMealTypes,
                        {
                            id: mealId,
                            label: mealLabel,
                            plates: totalDefaultPlates > 0 ? totalDefaultPlates.toString() : ''
                        }
                    ]
                }
            }
        })
    }

    useEffect(() => {
        if (formData.category === 'chef' && selectedOrderIds.length > 0 && !isBulkExpense && selectedOrderIds.length === 1) {
            const selectedOrder = orders.find(o => o.id === selectedOrderIds[0])
            if (selectedOrder) {
                let plates = 0
                if (formData.mealType && selectedOrder.mealTypeAmounts) {
                    const mealData = (selectedOrder.mealTypeAmounts as any)[formData.mealType]
                    if (mealData && typeof mealData === 'object') {
                        plates = mealData.numberOfPlates || mealData.numberOfMembers || 0
                    }
                } else {
                    plates = getOrderPlates(selectedOrder)
                }
                if (plates > 0) {
                    setFormData(prev => ({ ...prev, plates: plates.toString() }))
                }
            }
        }
    }, [selectedOrderIds, formData.category, formData.mealType, isBulkExpense, orders])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setFormError('')

        if (!formData.category || calculatedAmount <= 0) {
            toast.error('Please fill in all required fields and ensure amount is greater than 0')
            setSaving(false)
            return
        }

        if (isBulkExpense) {
            if (selectedOrderIds.length < 2) {
                toast.error('Bulk expense must cover at least 2 events')
                setSaving(false)
                return
            }
            if (Math.abs(allocationDifference) > 0.01) {
                toast.error(`Allocation amounts must equal total expense. Difference: ${formatCurrency(allocationDifference)}`)
                setSaving(false)
                return
            }
        }

        try {
            const calculationDetails: any = {}
            if (formData.category === 'chef') {
                calculationDetails.method = formData.calculationMethod
                if (formData.calculationMethod === 'plate-wise') {
                    if (formData.selectedMealTypes.length > 0) {
                        calculationDetails.plates = formData.selectedMealTypes.reduce((sum, mt) => sum + (parseFloat(mt.plates) || 0), 0)
                        calculationDetails.perPlateAmount = parseFloat(formData.amount)
                        calculationDetails.mealTypePlates = formData.selectedMealTypes.map(mt => ({
                            mealType: mt.id,
                            plates: parseFloat(mt.plates) || 0
                        }))
                        calculationDetails.mealType = formData.selectedMealTypes.map(mt => mt.id).join(',')
                    } else {
                        calculationDetails.plates = parseFloat(formData.plates)
                        calculationDetails.perPlateAmount = parseFloat(formData.amount)
                        if (formData.mealType) calculationDetails.mealType = formData.mealType
                    }
                }
            } else if (formData.category === 'labours') {
                calculationDetails.numberOfLabours = parseFloat(formData.numberOfLabours)
                calculationDetails.perUnitAmount = parseFloat(formData.labourAmount)
            } else if (formData.category === 'boys') {
                calculationDetails.dressedBoys = parseFloat(formData.dressedBoys) || 0
                calculationDetails.dressedBoyAmount = parseFloat(formData.dressedBoyAmount) || 0
                calculationDetails.nonDressedBoys = parseFloat(formData.nonDressedBoys) || 0
                calculationDetails.nonDressedBoyAmount = parseFloat(formData.nonDressedBoyAmount) || 0
                calculationDetails.breakfastAmount = parseFloat(formData.breakfastAmount) || 0
                calculationDetails.lunchAmount = parseFloat(formData.lunchAmount) || 0
                calculationDetails.snacksAmount = parseFloat(formData.snacksAmount) || 0
                calculationDetails.dinnerAmount = parseFloat(formData.dinnerAmount) || 0
            }

            const finalCategory = formData.category === 'other' && formData.customCategoryName.trim()
                ? formData.customCategoryName.trim()
                : formData.category

            const expenseData: any = {
                orderId: (isBulkExpense && formData.category !== 'labours') ? null : (selectedOrderIds[0] || null),
                category: finalCategory,
                amount: calculatedAmount,
                paidAmount: formData.paidAmount ? parseFloat(formData.paidAmount) : 0,
                paymentStatus: formData.paymentStatus,
                description: formData.description || null,
                recipient: formData.recipient || null,
                paymentDate: formData.paymentDate,
                eventDate: (formData.category === 'labours' || formData.category === 'boys') && formData.eventDate ? formData.eventDate : null,
                notes: formData.notes || null,
                calculationDetails: Object.keys(calculationDetails).length > 0 ? calculationDetails : null,
                isBulkExpense: (isBulkExpense && formData.category !== 'labours'),
                bulkAllocations: (isBulkExpense && formData.category !== 'labours') ? bulkAllocations : null,
                allocationMethod: (isBulkExpense && formData.category !== 'labours') ? allocationMethod : null,
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
            toast.error(error.message || 'Failed to save expense')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="text-center py-10">Loading...</div>

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Order Filter Controls */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <FaInfoCircle className="text-primary-500" />
                        Filter Events
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Specific Date</label>
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Month</label>
                            <select
                                value={filterMonth}
                                onChange={(e) => {
                                    setFilterMonth(e.target.value)
                                    if (e.target.value !== 'all') setFilterDate('')
                                }}
                                disabled={!!filterDate}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-400"
                            >
                                <option value="all">All Months</option>
                                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, idx) => (
                                    <option key={month} value={idx}>{month}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
                            <select
                                value={filterYear}
                                onChange={(e) => {
                                    setFilterYear(e.target.value)
                                    if (e.target.value !== 'all') setFilterDate('')
                                }}
                                disabled={!!filterDate}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-400"
                            >
                                <option value="all">All Years</option>
                                {[2024, 2025, 2026, 2027].map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Search Event/Customer</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={orderSearch}
                                    onChange={(e) => setOrderSearch(e.target.value)}
                                    placeholder="Search name, phone..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-primary-500"
                                />
                                {(filterDate || filterMonth !== 'all' || orderSearch) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFilterDate('')
                                            setFilterMonth('all')
                                            setFilterYear(new Date().getFullYear().toString())
                                            setOrderSearch('')
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 hover:text-red-500"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Event Selection Dropdown */}
                <div className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Event/Order (Optional)
                    </label>
                    <div
                        className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white cursor-pointer flex justify-between items-center ${formData.category === 'labours' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => formData.category !== 'labours' && setIsEventDropdownOpen(!isEventDropdownOpen)}
                    >
                        <div className="truncate text-gray-800">
                            {formData.category === 'labours' && selectedOrderIds.length > 1
                                ? 'Only one event allowed for labours'
                                : selectedOrderIds.length === 0
                                    ? 'No specific event/order'
                                    : selectedOrderIds.length === 1
                                        ? (() => {
                                            const o = orders.find(ord => ord.id === selectedOrderIds[0])
                                            return o ? getOrderDisplayName(o) : '1 event selected'
                                        })()
                                        : `${selectedOrderIds.length} events selected`}
                        </div>
                        <FaChevronDown className={`text-gray-400 transition-transform ${isEventDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {isEventDropdownOpen && (
                        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                            <div className="max-h-64 overflow-y-auto p-2">
                                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedOrderIds.length === 0}
                                        onChange={() => {
                                            setSelectedOrderIds([])
                                            setBulkAllocations([])
                                            setIsEventDropdownOpen(false)
                                        }}
                                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                    />
                                    <span className="font-medium text-gray-900">No specific event/order</span>
                                </label>
                                <div className="h-px bg-gray-100 my-1"></div>
                                {filteredOrders.length === 0 && (
                                    <div className="p-4 text-sm text-gray-500 text-center">No events found matching your filter</div>
                                )}
                                {filteredOrders.map(order => {
                                    const isSelected = selectedOrderIds.includes(order.id)
                                    const plates = getOrderPlates(order)
                                    const eventDate = new Date(getOrderDate(order))
                                    return (
                                        <label
                                            key={order.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) => handleOrderSelection(order.id, e.target.checked)}
                                                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900 truncate">
                                                    {order.customer?.name || 'Unknown'} - {order.eventName || 'No Event Name'}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {eventDate.toLocaleDateString()} • {plates} plates/members
                                                </div>
                                            </div>
                                        </label>
                                    )
                                })}
                            </div>
                            {selectedOrderIds.length > 0 && (
                                <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                                    <span className="text-sm text-gray-600 font-medium">Selected: {selectedOrderIds.length}</span>
                                    <button
                                        type="button"
                                        onClick={() => setIsEventDropdownOpen(false)}
                                        className="text-sm font-semibold text-primary-600 hover:text-primary-700"
                                    >
                                        Done
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Category and Calculation Method */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                        <select
                            required
                            value={formData.category}
                            onChange={(e) => setFormData({
                                ...formData,
                                category: e.target.value,
                                customCategoryName: e.target.value !== 'other' ? '' : formData.customCategoryName,
                                calculationMethod: 'total',
                                amount: '',
                                plates: '',
                                numberOfLabours: '',
                                labourAmount: '',
                                dressedBoys: '',
                                dressedBoyAmount: '',
                                nonDressedBoys: '',
                                nonDressedBoyAmount: '',
                                recipient: '',
                                selectedMealTypes: [],
                            })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            {EXPENSE_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>
                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {formData.category === 'chef' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Calculation Method *</label>
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
                            {selectedOrderIds.length > 0 && availableMealTypes.length > 0 && (
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Meal Types (Optional)</label>
                                    <div className="flex flex-wrap gap-2">
                                        {availableMealTypes.map(meal => {
                                            const isSelected = formData.selectedMealTypes.some(mt => mt.id === meal.id)
                                            return (
                                                <button
                                                    key={meal.id}
                                                    type="button"
                                                    onClick={() => handleMealTypeToggle(meal.id, meal.label)}
                                                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${isSelected ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                                                >
                                                    {meal.label}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {formData.category === 'other' && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Custom Category Name *</label>
                            <div className="space-y-2">
                                <div className="flex gap-2 mb-2">
                                    <button
                                        type="button"
                                        onClick={() => { setCustomCategoryInputType('select'); setFormData({ ...formData, customCategoryName: '' }) }}
                                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${customCategoryInputType === 'select' ? 'bg-primary-500 text-white' : 'bg-white text-gray-700 border-gray-300'}`}
                                    >
                                        Select Existing
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setCustomCategoryInputType('input'); setFormData({ ...formData, customCategoryName: '' }) }}
                                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${customCategoryInputType === 'input' ? 'bg-primary-500 text-white' : 'bg-white text-gray-700 border-gray-300'}`}
                                    >
                                        Add New
                                    </button>
                                </div>
                                {customCategoryInputType === 'select' ? (
                                    <select
                                        required
                                        value={formData.customCategoryName}
                                        onChange={(e) => setFormData({ ...formData, customCategoryName: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="">Select a category...</option>
                                        {customCategories.map((cat) => (
                                            <option key={cat} value={cat}>
                                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        required
                                        value={formData.customCategoryName}
                                        onChange={(e) => setFormData({ ...formData, customCategoryName: e.target.value })}
                                        placeholder="Enter custom category name"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Dynamic Fields */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    {formData.category === 'chef' && formData.calculationMethod === 'plate-wise' && (
                        <>
                            {formData.selectedMealTypes.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-200 bg-white p-4 rounded-lg">
                                    <div className="space-y-3">
                                        <label className="block text-sm font-medium text-gray-700">Plates per Meal Type *</label>
                                        {formData.selectedMealTypes.map((mt, index) => (
                                            <div key={mt.id} className="flex items-center gap-3">
                                                <span className="text-sm font-medium text-gray-600 w-24 truncate">{mt.label}</span>
                                                <input
                                                    type="number"
                                                    required
                                                    value={mt.plates}
                                                    onChange={(e) => {
                                                        const newMealTypes = [...formData.selectedMealTypes]
                                                        newMealTypes[index].plates = e.target.value
                                                        setFormData({ ...formData, selectedMealTypes: newMealTypes })
                                                    }}
                                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount per Plate *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Number of Plates *</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.plates}
                                            onChange={(e) => setFormData({ ...formData, plates: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount per Plate *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="bg-gray-100 border border-gray-200 p-4 rounded-lg">
                                <p className="text-sm font-semibold text-gray-800">Total Amount: {formatCurrency(calculatedAmount)}</p>
                            </div>
                        </>
                    )}

                    {formData.category === 'chef' && formData.calculationMethod === 'total' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount *</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                            />
                        </div>
                    )}

                    {formData.category === 'supervisor' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Event Amount *</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                            />
                        </div>
                    )}

                    {formData.category === 'labours' && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Event Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.eventDate}
                                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Number of Labours *</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.numberOfLabours}
                                        onChange={(e) => setFormData({ ...formData, numberOfLabours: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount per Labour *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.labourAmount}
                                        onChange={(e) => setFormData({ ...formData, labourAmount: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                                    />
                                </div>
                            </div>
                            <div className="bg-gray-100 border border-gray-200 p-4 rounded-lg">
                                <p className="text-sm font-semibold text-gray-800">Total Amount: {formatCurrency(calculatedAmount)}</p>
                            </div>
                        </>
                    )}

                    {formData.category === 'boys' && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="md:col-span-2 lg:col-span-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Event Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.eventDate}
                                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Dressed Boys *</label>
                                    <input type="number" required value={formData.dressedBoys} onChange={(e) => setFormData({ ...formData, dressedBoys: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Dressed Rate *</label>
                                    <input type="number" step="0.01" required value={formData.dressedBoyAmount} onChange={(e) => setFormData({ ...formData, dressedBoyAmount: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Non-Dressed Boys *</label>
                                    <input type="number" required value={formData.nonDressedBoys} onChange={(e) => setFormData({ ...formData, nonDressedBoys: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Non-Dressed Rate *</label>
                                    <input type="number" step="0.01" required value={formData.nonDressedBoyAmount} onChange={(e) => setFormData({ ...formData, nonDressedBoyAmount: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Breakfast Amount</label>
                                    <input type="number" step="0.01" value={formData.breakfastAmount} onChange={(e) => setFormData({ ...formData, breakfastAmount: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Lunch Amount</label>
                                    <input type="number" step="0.01" value={formData.lunchAmount} onChange={(e) => setFormData({ ...formData, lunchAmount: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Snacks Amount</label>
                                    <input type="number" step="0.01" value={formData.snacksAmount} onChange={(e) => setFormData({ ...formData, snacksAmount: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Dinner Amount</label>
                                    <input type="number" step="0.01" value={formData.dinnerAmount} onChange={(e) => setFormData({ ...formData, dinnerAmount: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" />
                                </div>
                            </div>
                            <div className="bg-gray-100 border border-gray-200 p-4 rounded-lg">
                                <p className="text-sm font-semibold text-gray-800">Total Amount: {formatCurrency(calculatedAmount)}</p>
                            </div>
                        </>
                    )}

                    {!['chef', 'supervisor', 'labours', 'boys'].includes(formData.category) && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                            />
                        </div>
                    )}
                </div>

                {/* Payment Date and Recipient */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Date *</label>
                        <input
                            type="date"
                            required
                            value={formData.paymentDate}
                            onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient</label>
                        {WORKFORCE_RECIPIENT_ROLES.includes(formData.category) && workforce.some(m => m.role === formData.category) ? (
                            <select
                                value={formData.recipient}
                                onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                            >
                                <option value="">Select recipient</option>
                                {workforce.filter(m => m.role === formData.category).map(member => (
                                    <option key={member.id} value={member.name}>{member.name}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                value={formData.recipient}
                                onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
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
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Paid Amount</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.paidAmount}
                                onChange={(e) => {
                                    const paid = e.target.value
                                    const paidNum = parseFloat(paid) || 0
                                    const amountNum = calculatedAmount
                                    const status = paidNum === 0 ? 'pending' : paidNum >= amountNum ? 'paid' : 'partial'
                                    setFormData({ ...formData, paidAmount: paid, paymentStatus: status })
                                }}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                            />
                            <p className="text-xs text-gray-500 mt-1">Total Amount: {formatCurrency(calculatedAmount)}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Status</label>
                            <select
                                value={formData.paymentStatus}
                                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as 'pending' | 'partial' | 'paid' })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                            >
                                <option value="pending">Pending</option>
                                <option value="partial">Partial</option>
                                <option value="paid">Paid</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Bulk Allocation */}
                {isBulkExpense && formData.category !== 'labours' && selectedOrderIds.length >= 2 && calculatedAmount > 0 && (
                    <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                        <div className="bg-slate-100 px-4 py-3 cursor-pointer flex justify-between items-center" onClick={() => setShowAllocationDetails(!showAllocationDetails)}>
                            <div className="flex items-center gap-2">
                                <FaLayerGroup className="text-slate-600" />
                                <h3 className="font-semibold text-slate-900">Allocation Breakdown</h3>
                            </div>
                            {showAllocationDetails ? <FaChevronUp className="text-slate-600" /> : <FaChevronDown className="text-slate-600" />}
                        </div>
                        {showAllocationDetails && (
                            <div className="p-4 space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {ALLOCATION_METHODS.map(m => (
                                        <button key={m.value} type="button" onClick={() => handleAllocationMethodChange(m.value as any)} className={`px-3 py-2 rounded-lg text-xs font-medium ${allocationMethod === m.value ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}>
                                            {m.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                    <table className="w-full text-xs">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-4 py-2 text-left font-semibold text-gray-700">Event</th>
                                                {allocationMethod === 'by-plates' && <th className="px-4 py-2 text-center font-semibold text-gray-700">Plates</th>}
                                                {allocationMethod === 'by-percentage' && <th className="px-4 py-2 text-center font-semibold text-gray-700">%</th>}
                                                <th className="px-4 py-2 text-right font-semibold text-gray-700">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {bulkAllocations.map(a => (
                                                <tr key={a.orderId}>
                                                    <td className="px-4 py-2 truncate text-gray-800">{a.orderName}</td>
                                                    {allocationMethod === 'by-plates' && <td className="px-4 py-2 text-center">{a.plates}</td>}
                                                    {allocationMethod === 'by-percentage' && (
                                                        <td className="px-4 py-2">
                                                            <input type="number" step="0.1" value={a.percentage} onChange={(e) => handlePercentageChange(a.orderId, parseFloat(e.target.value) || 0)} className="w-16 px-1 py-0.5 border rounded text-center" />
                                                        </td>
                                                    )}
                                                    <td className="px-4 py-2 text-right">
                                                        {allocationMethod === 'manual' ? (
                                                            <input type="number" step="0.01" value={a.amount} onChange={(e) => handleAllocationAmountChange(a.orderId, parseFloat(e.target.value) || 0)} className="w-24 px-1 py-0.5 border rounded text-right" />
                                                        ) : formatCurrency(a.amount)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button type="button" onClick={() => router.push('/expenses')} className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                    <button type="submit" disabled={saving} className="px-10 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-bold shadow-md disabled:bg-gray-400 transition-all">
                        {saving ? 'Saving...' : expenseId ? 'Update Expense' : 'Create Expense'}
                    </button>
                </div>
            </form>
        </div>
    )
}
