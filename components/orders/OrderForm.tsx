"use client";
import { useEffect, useState, useMemo, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { formatCurrency, formatDateTime, sanitizeMealLabel } from '@/lib/utils'
import { Customer, MenuItem, Order, OrderItem } from '@/types'
import { FaSearch, FaPlus, FaTimes, FaGripLines, FaUser, FaCalculator, FaWallet, FaUtensils, FaChevronDown, FaChevronUp, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUsers, FaTag } from 'react-icons/fa'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import FormError from '@/components/FormError'
import { Storage } from '@/lib/storage-api'

interface OrderFormProps {
    orderId?: string | null;
    isEditMode?: boolean;
}

export default function OrderForm({ orderId, isEditMode = false }: OrderFormProps) {
    const router = useRouter()
    const [customers, setCustomers] = useState<Customer[]>([])
    const [menuItems, setMenuItems] = useState<MenuItem[]>([])
    const [selectedSubFilter, setSelectedSubFilter] = useState<Record<string, string>>({})
    const [menuItemSearch, setMenuItemSearch] = useState<Record<string, string>>({})
    const [showStalls, setShowStalls] = useState<boolean>(false)
    const [loading, setLoading] = useState(false)
    const [currentOrderStatus, setCurrentOrderStatus] = useState<string>('pending')
    const [customerSearchTerm, setCustomerSearchTerm] = useState<string>('')
    const [showCustomerDropdown, setShowCustomerDropdown] = useState<boolean>(false)
    const customerSearchRef = useRef<HTMLDivElement>(null)
    const [showAddCustomerForm, setShowAddCustomerForm] = useState<boolean>(false)
    const [isSavingCustomer, setIsSavingCustomer] = useState<boolean>(false)
    const [newCustomerForm, setNewCustomerForm] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
    })
    const [collapsedMealTypes, setCollapsedMealTypes] = useState<Record<string, boolean>>({})
    const [collapsedSelectedItems, setCollapsedSelectedItems] = useState<Record<string, boolean>>({})
    const [originalAdvancePaid, setOriginalAdvancePaid] = useState<number>(0)
    const [originalMealTypeAmounts, setOriginalMealTypeAmounts] = useState<Record<string, any>>({})
    const [formError, setFormError] = useState<string>('')
    const [showQuickAddModal, setShowQuickAddModal] = useState(false)
    const [quickAddMealTypeId, setQuickAddMealTypeId] = useState<string | null>(null)
    const [quickAddFormData, setQuickAddFormData] = useState({ name: '', description: '' })

    const [formData, setFormData] = useState({
        customerId: '',
        eventName: '',
        mealTypes: [] as Array<{
            id: string
            eventName: string
            venue: string
            menuType: string
            selectedMenuItems: string[]
            pricingMethod: 'manual' | 'plate-based'
            numberOfPlates: string
            platePrice: string
            manualAmount: string
            date: string
            time: string
            services: string[]
            numberOfMembers: string
            itemCustomizations: Record<string, string>
            itemQuantities: Record<string, string>
        }>,
        stalls: [] as Array<{ category: string; description: string; cost: string }>,
        discount: '',
        transportCost: '',
        waterBottlesCost: '',
        totalAmount: '',
        advancePaid: '',
        paymentMethod: 'cash' as 'cash' | 'upi' | 'card' | 'bank_transfer' | 'other',
        paymentNotes: '',
    })

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        if (isEditMode && orderId && customers.length > 0 && menuItems.length > 0) {
            loadOrderData(orderId)
        }
    }, [isEditMode, orderId, customers.length, menuItems.length])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (customerSearchRef.current && !customerSearchRef.current.contains(event.target as Node)) {
                setShowCustomerDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const loadData = async () => {
        try {
            const [allCustomers, allMenuItems] = await Promise.all([
                Storage.getCustomers(),
                Storage.getMenuItems(),
            ])
            setCustomers(allCustomers)
            setMenuItems(allMenuItems.filter((item: any) => item.isActive))
        } catch (error) {
            console.error('Failed to load data:', error)
            toast.error('Failed to load initial data')
        }
    }

    const loadOrderData = async (id: string) => {
        setLoading(true)
        try {
            const order = await Storage.getOrder(id)
            if (!order) {
                toast.error('Order not found')
                router.push('/orders')
                return
            }

            const mealTypeAmounts = order.mealTypeAmounts as Record<string, any> | null
            const orderItems = Array.isArray(order.items) ? order.items : []

            const itemsByType: Record<string, string[]> = {}
            const customizations: Record<string, Record<string, string>> = {}
            const quantities: Record<string, Record<string, string>> = {}

            orderItems.forEach((item: any) => {
                const mealType = item.mealType || 'other'
                if (!itemsByType[mealType]) itemsByType[mealType] = []
                itemsByType[mealType].push(item.menuItemId)

                if (!customizations[mealType]) customizations[mealType] = {}
                if (!quantities[mealType]) quantities[mealType] = {}

                if (item.customization) customizations[mealType][item.menuItemId] = item.customization
                if (item.quantity) quantities[mealType][item.menuItemId] = item.quantity.toString()
            })

            const mealTypesArray = mealTypeAmounts
                ? Object.entries(mealTypeAmounts).map(([key, data]) => {
                    const menuType = data.menuType || key
                    return {
                        id: key,
                        eventName: data.eventName || '',
                        venue: data.venue || '',
                        menuType: menuType.toLowerCase(),
                        selectedMenuItems: itemsByType[key] || [],
                        itemCustomizations: customizations[key] || {},
                        itemQuantities: quantities[key] || {},
                        pricingMethod: data.pricingMethod || 'manual',
                        numberOfPlates: (data.numberOfPlates || '').toString(),
                        platePrice: (data.platePrice || '').toString(),
                        manualAmount: (data.manualAmount || data.amount || '').toString(),
                        date: data.date || '',
                        time: data.time || '',
                        services: data.services || [],
                        numberOfMembers: (data.numberOfMembers || '').toString()
                    }
                })
                : []

            const stallsArray = (order.stalls || []).map((s: any) => ({
                category: s.category || '',
                description: s.description || '',
                cost: (s.cost || '').toString()
            }))

            setFormData({
                customerId: order.customerId,
                eventName: order.eventName || '',
                mealTypes: mealTypesArray,
                stalls: stallsArray,
                discount: (order.discount || 0).toString(),
                transportCost: (order.transportCost || 0).toString(),
                waterBottlesCost: (order.waterBottlesCost || 0).toString(),
                totalAmount: (order.totalAmount || 0).toString(),
                advancePaid: '',
                paymentMethod: 'cash',
                paymentNotes: '',
            })

            setCurrentOrderStatus(order.status || 'pending')
            setShowStalls(stallsArray.length > 0)
            setOriginalAdvancePaid(order.advancePaid || 0)
            setOriginalMealTypeAmounts(mealTypeAmounts || {})
        } catch (error) {
            console.error('Failed to load order:', error)
            toast.error('Failed to load order data')
        } finally {
            setLoading(false)
        }
    }

    const handleQuickAddSubmit = async () => {
        if (!quickAddFormData.name) {
            toast.error('Item name is required')
            return
        }

        try {
            const newItem = await Storage.saveMenuItem({
                name: quickAddFormData.name,
                description: quickAddFormData.description,
                type: quickAddMealTypeId ? [formData.mealTypes.find(mt => mt.id === quickAddMealTypeId)?.menuType || 'other'] : ['other'],
                price: 0,
                unit: 'plate',
                isActive: true
            })

            setMenuItems(prev => [...prev, newItem])

            if (quickAddMealTypeId) {
                handleMenuItemToggle(quickAddMealTypeId, newItem.id)
            }

            setShowQuickAddModal(false)
            setQuickAddFormData({ name: '', description: '' })
            toast.success('Item added to menu and session')
        } catch (error) {
            console.error('Failed to quick add item:', error)
            toast.error('Failed to add item')
        }
    }

    const totals = useMemo(() => {
        let mealTypesTotal = 0
        let waterTotal = 0

        formData.mealTypes.forEach(mt => {
            let mtTotal = 0
            mt.selectedMenuItems.forEach(itemId => {
                const item = menuItems.find(m => m.id === itemId)
                if (item && item.price) {
                    const qty = parseFloat(mt.itemQuantities[itemId] || '1')
                    if (item.name.toLowerCase().includes('water') && item.name.toLowerCase().includes('bottle')) {
                        waterTotal += item.price * qty
                    } else {
                        mtTotal += item.price * qty
                    }
                }
            })

            if (mt.pricingMethod === 'plate-based') {
                const plates = parseFloat(mt.numberOfPlates) || parseFloat(mt.numberOfMembers) || 0
                mtTotal += plates * (parseFloat(mt.platePrice) || 0)
            } else {
                mtTotal += parseFloat(mt.manualAmount) || 0
            }
            mealTypesTotal += mtTotal
        })

        const stallsTotal = showStalls ? formData.stalls.reduce((sum, s) => sum + (parseFloat(s.cost) || 0), 0) : 0
        const transport = parseFloat(formData.transportCost) || 0
        const discount = parseFloat(formData.discount) || 0
        const waterBottles = waterTotal > 0 ? waterTotal : (parseFloat(formData.waterBottlesCost) || 0)

        const total = Math.max(0, mealTypesTotal + transport + waterBottles + stallsTotal - discount)
        const currentAdvance = parseFloat(formData.advancePaid) || 0
        const totalAdvance = isEditMode ? originalAdvancePaid + currentAdvance : currentAdvance
        const balance = Math.max(0, total - totalAdvance)

        return { total, balance, waterTotal, stallsTotal, mealTypesTotal }
    }, [formData, menuItems, showStalls, isEditMode, originalAdvancePaid])

    const handleUpdateMealType = (id: string, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            mealTypes: prev.mealTypes.map(mt => {
                if (mt.id === id) {
                    const updated = { ...mt, [field]: value }
                    if (field === 'numberOfMembers' && mt.pricingMethod === 'plate-based') updated.numberOfPlates = value
                    if (field === 'pricingMethod' && value === 'plate-based') updated.numberOfPlates = mt.numberOfMembers
                    return updated
                }
                return mt
            })
        }))
    }

    const handleAddMealType = () => {
        const id = uuidv4()
        setFormData(prev => ({
            ...prev,
            mealTypes: [...prev.mealTypes, {
                id,
                eventName: '',
                venue: '',
                menuType: '',
                selectedMenuItems: [],
                pricingMethod: 'manual',
                numberOfPlates: '',
                platePrice: '',
                manualAmount: '',
                date: '',
                time: '',
                services: [],
                numberOfMembers: '',
                itemCustomizations: {},
                itemQuantities: {},
            }]
        }))
        setCollapsedMealTypes(prev => ({ ...prev, [id]: false }))
    }

    const handleRemoveMealType = (id: string) => {
        if (confirm('Are you sure you want to remove this meal type?')) {
            setFormData(prev => ({
                ...prev,
                mealTypes: prev.mealTypes.filter(mt => mt.id !== id)
            }))
        }
    }

    const handleMenuItemToggle = (mealTypeId: string, itemId: string) => {
        setMenuItemSearch(prev => ({ ...prev, [mealTypeId]: '' }))
        setFormData(prev => ({
            ...prev,
            mealTypes: prev.mealTypes.map(mt =>
                mt.id === mealTypeId
                    ? {
                        ...mt,
                        selectedMenuItems: mt.selectedMenuItems.includes(itemId)
                            ? mt.selectedMenuItems.filter(i => i !== itemId)
                            : [...mt.selectedMenuItems, itemId]
                    }
                    : mt
            )
        }))
    }

    const handleDragEnd = (result: any) => {
        if (!result.destination) return
        const { source, destination } = result
        const mealTypeId = source.droppableId
        if (source.droppableId !== destination.droppableId) return

        setFormData(prev => ({
            ...prev,
            mealTypes: prev.mealTypes.map(mt => {
                if (mt.id === mealTypeId) {
                    const newItems = Array.from(mt.selectedMenuItems)
                    const [removed] = newItems.splice(source.index, 1)
                    newItems.splice(destination.index, 0, removed)
                    return { ...mt, selectedMenuItems: newItems }
                }
                return mt
            })
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormError('')

        if (!formData.customerId) {
            toast.error('Please select a customer')
            return
        }

        if (formData.mealTypes.length === 0) {
            toast.error('Please add at least one meal type')
            return
        }

        for (const mt of formData.mealTypes) {
            if (!mt.menuType) { toast.error('Select menu type for all sessions'); return }
            if (mt.selectedMenuItems.length === 0) { toast.error(`Select items for ${mt.menuType}`); return }
        }

        try {
            setLoading(true)
            const mealTypeAmounts: Record<string, any> = {}
            formData.mealTypes.forEach(mt => {
                mealTypeAmounts[mt.id] = {
                    menuType: mt.menuType,
                    amount: mt.pricingMethod === 'plate-based'
                        ? (parseFloat(mt.numberOfPlates) || parseFloat(mt.numberOfMembers) || 0) * (parseFloat(mt.platePrice) || 0)
                        : parseFloat(mt.manualAmount) || 0,
                    date: mt.date,
                    time: mt.time,
                    venue: mt.venue,
                    services: mt.services,
                    numberOfMembers: parseInt(mt.numberOfMembers) || 0,
                    pricingMethod: mt.pricingMethod,
                    numberOfPlates: parseFloat(mt.numberOfPlates) || 0,
                    platePrice: parseFloat(mt.platePrice) || 0,
                    manualAmount: parseFloat(mt.manualAmount) || 0,
                    eventName: mt.eventName
                }
            })

            const orderItems: OrderItem[] = formData.mealTypes.flatMap(mt =>
                mt.selectedMenuItems.map(menuItemId => ({
                    menuItemId,
                    quantity: parseFloat(mt.itemQuantities[menuItemId] || '1'),
                    mealType: mt.id,
                    customization: mt.itemCustomizations[menuItemId] || ''
                }))
            )

            const finalData: any = {
                customerId: formData.customerId,
                eventName: formData.eventName,
                items: orderItems,
                totalAmount: totals.total,
                advancePaid: isEditMode ? originalAdvancePaid + (parseFloat(formData.advancePaid) || 0) : (parseFloat(formData.advancePaid) || 0),
                remainingAmount: totals.balance,
                status: isEditMode ? currentOrderStatus : 'pending',
                mealTypeAmounts,
                stalls: showStalls ? formData.stalls : [],
                transportCost: parseFloat(formData.transportCost) || 0,
                waterBottlesCost: totals.waterTotal > 0 ? totals.waterTotal : (parseFloat(formData.waterBottlesCost) || 0),
                discount: parseFloat(formData.discount) || 0,
                paymentMethod: formData.paymentMethod,
                paymentNotes: formData.paymentNotes,
                additionalPayment: parseFloat(formData.advancePaid) || 0
            }

            if (isEditMode && orderId) {
                await Storage.updateOrder(orderId, finalData)
                toast.success('Order updated')
            } else {
                await Storage.saveOrder(finalData)
                toast.success('Order created')
            }
            router.push('/orders/center')
        } catch (error: any) {
            setFormError(error.message)
            toast.error('Failed to save order')
        } finally {
            setLoading(false)
        }
    }

    const filteredCustomers = useMemo(() => {
        if (!customerSearchTerm.trim()) return customers
        const s = customerSearchTerm.toLowerCase()
        return customers.filter(c => c.name.toLowerCase().includes(s) || c.phone.includes(s))
    }, [customers, customerSearchTerm])

    const selectedCustomer = customers.find(c => c.id === formData.customerId)

    if (loading && isEditMode) return <div className="p-8 text-center">Loading order...</div>

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pb-20">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <FaUser className="text-primary-500" /> Customer Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative" ref={customerSearchRef}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search Customer</label>
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={customerSearchTerm}
                                onChange={(e) => {
                                    setCustomerSearchTerm(e.target.value)
                                    setShowCustomerDropdown(true)
                                }}
                                onFocus={() => setShowCustomerDropdown(true)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                placeholder="Name or Phone Number"
                            />
                        </div>

                        {showCustomerDropdown && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                <button
                                    type="button"
                                    onClick={() => setShowAddCustomerForm(true)}
                                    className="w-full px-4 py-3 text-left text-primary-600 font-medium hover:bg-primary-50 flex items-center gap-2 sticky top-0 bg-white border-b"
                                >
                                    <FaPlus /> Add New Customer
                                </button>
                                {filteredCustomers.map(c => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, customerId: c.id }))
                                            setCustomerSearchTerm(c.name)
                                            setShowCustomerDropdown(false)
                                        }}
                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-0"
                                    >
                                        <div className="font-medium text-gray-800">{c.name}</div>
                                        <div className="text-sm text-gray-500">{c.phone}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Event Title</label>
                        <input
                            type="text"
                            value={formData.eventName}
                            onChange={(e) => setFormData(prev => ({ ...prev, eventName: e.target.value }))}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="e.g., Ramesh & Sitha Wedding"
                        />
                    </div>
                </div>

                {selectedCustomer && (
                    <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><span className="text-sm text-primary-600 font-medium uppercase block">Name</span> {selectedCustomer.name}</div>
                        <div><span className="text-sm text-primary-600 font-medium uppercase block">Phone</span> {selectedCustomer.phone}</div>
                        <div><span className="text-sm text-primary-600 font-medium uppercase block">Address</span> {selectedCustomer.address}</div>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FaUtensils className="text-primary-500" /> Meal Sessions
                    </h2>
                    <button
                        type="button"
                        onClick={handleAddMealType}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center gap-2 transition-all shadow-md active:scale-95"
                    >
                        <FaPlus /> Add Session
                    </button>
                </div>

                {formData.mealTypes.map((mt, index) => (
                    <div key={mt.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm">
                                    {index + 1}
                                </span>
                                <div>
                                    <h3 className="font-bold text-gray-800">
                                        {mt.menuType ? sanitizeMealLabel(mt.menuType) : "New Session"}
                                        {mt.eventName && <span className="ml-2 text-sm font-normal text-gray-500">({mt.eventName})</span>}
                                    </h3>
                                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                        {mt.date && <span className="flex items-center gap-1"><FaCalendarAlt /> {mt.date}</span>}
                                        {mt.time && <span className="flex items-center gap-1"><FaClock /> {mt.time}</span>}
                                        {mt.venue && <span className="flex items-center gap-1"><FaMapMarkerAlt /> {mt.venue}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCollapsedMealTypes(p => ({ ...p, [mt.id]: !p[mt.id] }))}
                                    className="p-2 text-gray-400 hover:text-gray-600"
                                >
                                    {collapsedMealTypes[mt.id] ? <FaChevronDown /> : <FaChevronUp />}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveMealType(mt.id)}
                                    className="p-2 text-red-400 hover:text-red-600"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                        </div>

                        {!collapsedMealTypes[mt.id] && (
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Session Name</label>
                                        <input
                                            type="text"
                                            value={mt.eventName}
                                            onChange={(e) => handleUpdateMealType(mt.id, 'eventName', e.target.value)}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                            placeholder="e.g., Mehendi Lunch"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Meal Category</label>
                                        <select
                                            value={mt.menuType}
                                            onChange={(e) => handleUpdateMealType(mt.id, 'menuType', e.target.value)}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none capitalize"
                                        >
                                            <option value="">Select Category</option>
                                            <option value="breakfast">Breakfast</option>
                                            <option value="lunch">Lunch</option>
                                            <option value="dinner">Dinner</option>
                                            <option value="snacks">Snacks</option>
                                            <option value="tiffins">Tiffins</option>
                                            <option value="sweets">Sweets</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Venue</label>
                                        <input
                                            type="text"
                                            value={mt.venue}
                                            onChange={(e) => handleUpdateMealType(mt.id, 'venue', e.target.value)}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Event Date</label>
                                        <input
                                            type="date"
                                            value={mt.date}
                                            onChange={(e) => handleUpdateMealType(mt.id, 'date', e.target.value)}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Service Time</label>
                                        <input
                                            type="time"
                                            value={mt.time}
                                            onChange={(e) => handleUpdateMealType(mt.id, 'time', e.target.value)}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Members Group Count</label>
                                        <input
                                            type="number"
                                            value={mt.numberOfMembers}
                                            onChange={(e) => handleUpdateMealType(mt.id, 'numberOfMembers', e.target.value)}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Pricing Method</label>
                                        <div className="flex bg-gray-100 p-1 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateMealType(mt.id, 'pricingMethod', 'manual')}
                                                className={`flex-1 py-1.5 px-3 text-sm rounded-md transition-all ${mt.pricingMethod === 'manual' ? 'bg-white shadow text-primary-600 font-bold' : 'text-gray-500'}`}
                                            >
                                                Manual
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateMealType(mt.id, 'pricingMethod', 'plate-based')}
                                                className={`flex-1 py-1.5 px-3 text-sm rounded-md transition-all ${mt.pricingMethod === 'plate-based' ? 'bg-white shadow text-primary-600 font-bold' : 'text-gray-500'}`}
                                            >
                                                Plate-wise
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {mt.pricingMethod === 'plate-based' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Number of Plates</label>
                                            <input
                                                type="number"
                                                value={mt.numberOfPlates}
                                                onChange={(e) => handleUpdateMealType(mt.id, 'numberOfPlates', e.target.value)}
                                                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Price per Plate</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                                <input
                                                    type="number"
                                                    value={mt.platePrice}
                                                    onChange={(e) => handleUpdateMealType(mt.id, 'platePrice', e.target.value)}
                                                    className="w-full pl-8 pr-4 py-2 bg-white border border-gray-200 rounded-lg outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Manual Total Amount for Session</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                            <input
                                                type="number"
                                                value={mt.manualAmount}
                                                onChange={(e) => handleUpdateMealType(mt.id, 'manualAmount', e.target.value)}
                                                className="w-full pl-8 pr-4 py-2 bg-white border border-gray-200 rounded-lg outline-none"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-800 flex items-center justify-between">
                                        Selected Menu Items ({mt.selectedMenuItems.length})
                                        <button
                                            type="button"
                                            onClick={() => setCollapsedSelectedItems(p => ({ ...p, [mt.id]: !p[mt.id] }))}
                                            className="text-primary-600 text-sm font-medium hover:underline"
                                        >
                                            {collapsedSelectedItems[mt.id] ? "Show Items" : "Hide Items"}
                                        </button>
                                    </h4>

                                    {!collapsedSelectedItems[mt.id] && mt.selectedMenuItems.length > 0 && (
                                        <DragDropContext onDragEnd={handleDragEnd}>
                                            <Droppable droppableId={mt.id}>
                                                {(provided) => (
                                                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                                                        {mt.selectedMenuItems.map((itemId, idx) => {
                                                            const item = menuItems.find(m => m.id === itemId)
                                                            if (!item) return null
                                                            return (
                                                                <Draggable key={itemId} draggableId={itemId} index={idx}>
                                                                    {(provided) => (
                                                                        <div
                                                                            ref={provided.innerRef}
                                                                            {...provided.draggableProps}
                                                                            className="flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-lg group shadow-sm"
                                                                        >
                                                                            <div {...provided.dragHandleProps} className="text-gray-300 group-hover:text-gray-500">
                                                                                <FaGripLines />
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="font-medium text-gray-800 truncate">{item.name}</div>
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="Add customization (e.g., Less spicy)"
                                                                                    value={mt.itemCustomizations[itemId] || ''}
                                                                                    onChange={(e) => {
                                                                                        const val = e.target.value
                                                                                        setFormData(prev => ({
                                                                                            ...prev,
                                                                                            mealTypes: prev.mealTypes.map(m => m.id === mt.id ? { ...m, itemCustomizations: { ...m.itemCustomizations, [itemId]: val } } : m)
                                                                                        }))
                                                                                    }}
                                                                                    className="text-xs w-full mt-1 text-gray-500 bg-transparent border-b border-transparent focus:border-primary-300 outline-none"
                                                                                />
                                                                            </div>
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                                                                                    <span className="text-xs text-gray-400">Qty:</span>
                                                                                    <input
                                                                                        type="number"
                                                                                        value={mt.itemQuantities[itemId] || '1'}
                                                                                        onChange={(e) => {
                                                                                            const val = e.target.value
                                                                                            setFormData(prev => ({
                                                                                                ...prev,
                                                                                                mealTypes: prev.mealTypes.map(m => m.id === mt.id ? { ...m, itemQuantities: { ...m.itemQuantities, [itemId]: val } } : m)
                                                                                            }))
                                                                                        }}
                                                                                        className="w-10 text-center text-sm font-bold bg-transparent outline-none"
                                                                                    />
                                                                                </div>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleMenuItemToggle(mt.id, itemId)}
                                                                                    className="text-red-400 hover:text-red-600 p-1"
                                                                                >
                                                                                    <FaTimes />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </Draggable>
                                                            )
                                                        })}
                                                        {provided.placeholder}
                                                    </div>
                                                )}
                                            </Droppable>
                                        </DragDropContext>
                                    )}

                                    <div className="relative">
                                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none"
                                            placeholder={`Search ${mt.menuType || 'items'}...`}
                                            value={menuItemSearch[mt.id] || ''}
                                            onChange={(e) => setMenuItemSearch(p => ({ ...p, [mt.id]: e.target.value }))}
                                        />

                                        {(menuItemSearch[mt.id] || mt.menuType) && (
                                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                                {menuItems
                                                    .filter(item => {
                                                        const search = (menuItemSearch[mt.id] || '').toLowerCase()
                                                        const matchesSearch = item.name.toLowerCase().includes(search)
                                                        const itemTypes = Array.isArray(item.type) ? item.type : [(item.type as any)]
                                                        const matchesType = !mt.menuType || itemTypes.some((t: string) => t?.toLowerCase() === mt.menuType.toLowerCase())
                                                        return matchesSearch && matchesType
                                                    })
                                                    .slice(0, 12)
                                                    .map(item => (
                                                        <button
                                                            key={item.id}
                                                            type="button"
                                                            onClick={() => handleMenuItemToggle(mt.id, item.id)}
                                                            className={`p-2 text-xs text-left rounded-lg border transition-all ${mt.selectedMenuItems.includes(item.id) ? 'bg-primary-50 border-primary-200 text-primary-700 font-bold' : 'bg-white border-gray-100 hover:border-primary-200'}`}
                                                        >
                                                            {item.name}
                                                        </button>
                                                    ))}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setQuickAddMealTypeId(mt.id)
                                                        setShowQuickAddModal(true)
                                                    }}
                                                    className="p-2 text-xs font-bold text-center text-primary-600 border border-dashed border-primary-200 rounded-lg hover:bg-primary-50"
                                                >
                                                    + Quick Add
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <FaCalculator className="text-primary-500" /> Payment & Costs
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Transport Cost</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                            <input
                                type="number"
                                value={formData.transportCost}
                                onChange={(e) => setFormData(p => ({ ...p, transportCost: e.target.value }))}
                                className="w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Water Bottles Cost</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                            <input
                                type="number"
                                value={formData.waterBottlesCost}
                                onChange={(e) => setFormData(p => ({ ...p, waterBottlesCost: e.target.value }))}
                                className="w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Total Discount</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                            <input
                                type="number"
                                value={formData.discount}
                                onChange={(e) => setFormData(p => ({ ...p, discount: e.target.value }))}
                                className="w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-red-600"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{isEditMode ? "Additional Payment" : "Advance Paid"}</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                            <input
                                type="number"
                                value={formData.advancePaid}
                                onChange={(e) => setFormData(p => ({ ...p, advancePaid: e.target.value }))}
                                className="w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-green-600 font-bold"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 p-6 bg-gray-900 rounded-xl text-white grid grid-cols-1 md:grid-cols-3 gap-6 shadow-xl">
                    <div className="text-center md:text-left">
                        <div className="text-xs text-gray-400 uppercase tracking-widest font-bold">Total Bill</div>
                        <div className="text-3xl font-black mt-1 text-primary-400">{formatCurrency(totals.total)}</div>
                    </div>
                    <div className="text-center border-y md:border-y-0 md:border-x border-gray-800 py-4 md:py-0">
                        <div className="text-xs text-gray-400 uppercase tracking-widest font-bold">Total Advance</div>
                        <div className="text-3xl font-black mt-1 text-green-400">
                            {formatCurrency(isEditMode ? originalAdvancePaid + (parseFloat(formData.advancePaid) || 0) : (parseFloat(formData.advancePaid) || 0))}
                        </div>
                    </div>
                    <div className="text-center md:text-right">
                        <div className="text-xs text-gray-400 uppercase tracking-widest font-bold">Balance Due</div>
                        <div className="text-3xl font-black mt-1 text-orange-400">{formatCurrency(totals.balance)}</div>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-2xl z-40 flex justify-between items-center sm:px-20">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-2.5 text-gray-600 font-bold"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-10 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-black shadow-lg hover:shadow-primary-300 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                    {loading ? 'Saving...' : isEditMode ? 'Update Order' : 'Create Order'}
                </button>
            </div>

            {showQuickAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
                        <h3 className="text-2xl font-black text-gray-800 mb-6">Quick Add Menu Item</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Item Name</label>
                                <input
                                    type="text"
                                    value={quickAddFormData.name}
                                    onChange={e => setQuickAddFormData(p => ({ ...p, name: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Description (Optional)</label>
                                <textarea
                                    value={quickAddFormData.description}
                                    onChange={e => setQuickAddFormData(p => ({ ...p, description: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px]"
                                />
                            </div>
                        </div>
                        <div className="flex gap-4 mt-8">
                            <button
                                type="button"
                                onClick={() => setShowQuickAddModal(false)}
                                className="flex-1 py-3 text-gray-600 font-bold"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleQuickAddSubmit}
                                className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-200"
                            >
                                Add Item
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showAddCustomerForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
                        <h3 className="text-2xl font-black text-gray-800 mb-6">New Customer</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Name</label>
                                <input
                                    type="text"
                                    value={newCustomerForm.name}
                                    onChange={e => setNewCustomerForm(p => ({ ...p, name: e.target.value }))}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Phone</label>
                                <input
                                    type="text"
                                    value={newCustomerForm.phone}
                                    onChange={e => setNewCustomerForm(p => ({ ...p, phone: e.target.value }))}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Address</label>
                                <textarea
                                    value={newCustomerForm.address}
                                    onChange={e => setNewCustomerForm(p => ({ ...p, address: e.target.value }))}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                                />
                            </div>
                        </div>
                        <div className="flex gap-4 mt-8">
                            <button type="button" onClick={() => setShowAddCustomerForm(false)} className="flex-1 py-3 text-gray-600">Cancel</button>
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!newCustomerForm.name) return toast.error('Name required')
                                    setIsSavingCustomer(true)
                                    try {
                                        const c = await Storage.saveCustomer(newCustomerForm)
                                        setCustomers(prev => [...prev, c])
                                        setFormData(prev => ({ ...prev, customerId: c.id }))
                                        setCustomerSearchTerm(c.name)
                                        setShowAddCustomerForm(false)
                                        toast.success('Customer added')
                                    } finally { setIsSavingCustomer(false) }
                                }}
                                disabled={isSavingCustomer}
                                className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold"
                            >
                                {isSavingCustomer ? 'Saving...' : 'Add Customer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </form>
    )
}
