"use client";
import { useEffect, useState, useMemo, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { formatCurrency, formatDateTime, sanitizeMealLabel } from '@/lib/utils'
import { Customer, MenuItem, Order, OrderItem, Supervisor, StallTemplate } from '@/types'
import { FaSearch, FaPlus, FaTimes, FaGripLines, FaUser, FaCalculator, FaWallet, FaUtensils, FaChevronDown, FaChevronUp, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUsers, FaTag, FaStore, FaTrash } from 'react-icons/fa'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import FormError from '@/components/FormError'
import { Storage } from '@/lib/storage-api'

interface OrderFormProps {
    orderId?: string | null;
    isEditMode?: boolean;
    initialOrderType?: 'EVENT' | 'LUNCH_PACK';
}

export default function OrderForm({ orderId, isEditMode = false, initialOrderType = 'EVENT' }: OrderFormProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialStatus = searchParams.get('status') || 'pending'
    const [customers, setCustomers] = useState<Customer[]>([])
    const [menuItems, setMenuItems] = useState<MenuItem[]>([])
    const [supervisors, setSupervisors] = useState<Supervisor[]>([])
    const [stallTemplates, setStallTemplates] = useState<StallTemplate[]>([])
    const [selectedSubFilter, setSelectedSubFilter] = useState<Record<string, string>>({})
    const [menuItemSearch, setMenuItemSearch] = useState<Record<string, string>>({})
    const [showStalls, setShowStalls] = useState<boolean>(false)
    const [loading, setLoading] = useState(!!orderId)
    const [currentOrderStatus, setCurrentOrderStatus] = useState<string>(initialStatus)
    const [customerSearchTerm, setCustomerSearchTerm] = useState<string>('')
    const [showCustomerDropdown, setShowCustomerDropdown] = useState<boolean>(false)
    const customerSearchRef = useRef<HTMLDivElement>(null)
    const [showAddCustomerForm, setShowAddCustomerForm] = useState<boolean>(false)
    const [isSavingCustomer, setIsSavingCustomer] = useState<boolean>(false)
    const hasLoadedRef = useRef(false)
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
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    })

    const [formData, setFormData] = useState({
        customerId: '',
        eventName: '',
        orderType: initialOrderType as 'EVENT' | 'LUNCH_PACK',
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
            itemPrices: Record<string, string>
            description: string
        }>,
        stalls: [] as Array<{
            id: string
            category: string
            description: string
            selectedMenuItems: string[]
            itemCustomizations: Record<string, string>
            itemQuantities: Record<string, string>
            pricingMethod: 'manual' | 'plate-based'
            numberOfPlates: string
            platePrice: string
            manualAmount: string
            cost: string
            numberOfMembers: string
            eventName: string
            venue: string
            date: string
            time: string
            services: string[]
        }>,
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
        if (isEditMode && orderId && customers.length > 0 && menuItems.length > 0 && !hasLoadedRef.current) {
            loadOrderData(orderId)
            hasLoadedRef.current = true
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

    useEffect(() => {
        const status = searchParams.get('status')
        if (status && !isEditMode) {
            setCurrentOrderStatus(status)
        }
    }, [searchParams, isEditMode])

    const loadData = async () => {
        try {
            const [custData, menuData, supData, stallData] = await Promise.all([
                Storage.getCustomers(),
                Storage.getMenuItems(),
                Storage.getSupervisors(),
                Storage.getStallTemplates()
            ])
            setCustomers(custData)
            setMenuItems(menuData.filter((item: any) => item.isActive))
            setSupervisors(supData)
            setStallTemplates(stallData || [])
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

            const itemPricesByMt: Record<string, Record<string, string>> = {}
            orderItems.forEach((item: any) => {
                const mealType = item.mealType || 'other'
                if (!itemsByType[mealType]) itemsByType[mealType] = []
                itemsByType[mealType].push(item.menuItemId)

                if (!customizations[mealType]) customizations[mealType] = {}
                if (!quantities[mealType]) quantities[mealType] = {}

                if (item.customization) customizations[mealType][item.menuItemId] = item.customization
                if (item.quantity) quantities[mealType][item.menuItemId] = item.quantity.toString()

                if (item.price) {
                    if (!itemPricesByMt[mealType]) itemPricesByMt[mealType] = {}
                    itemPricesByMt[mealType][item.menuItemId] = item.price.toString()
                }
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
                        numberOfMembers: (data.numberOfMembers || '').toString(),
                        itemPrices: data.itemPrices || itemPricesByMt[key] || {},
                        description: data.description || ''
                    }
                })
                : []

            const stallsArray = (order.stalls || []).map((s: any) => ({
                id: s.id || uuidv4(),
                category: s.category || '',
                description: s.description || '',
                selectedMenuItems: s.selectedMenuItems || [],
                itemCustomizations: s.itemCustomizations || {},
                itemQuantities: s.itemQuantities || {},
                pricingMethod: s.pricingMethod || 'manual',
                numberOfPlates: (s.numberOfPlates || '').toString(),
                platePrice: (s.platePrice || '').toString(),
                manualAmount: (s.manualAmount || s.cost || '').toString(),
                cost: (s.cost || '').toString(),
                numberOfMembers: (s.numberOfMembers || '').toString(),
                eventName: s.eventName || '',
                venue: s.venue || '',
                date: s.date || '',
                time: s.time || '',
                services: s.services || []
            }))

            setFormData({
                customerId: order.customerId,
                eventName: order.eventName || '',
                orderType: order.orderType || 'EVENT',
                mealTypes: mealTypesArray,
                stalls: stallsArray,
                discount: (order.discount || 0).toString(),
                transportCost: (order.transportCost || 0).toString(),
                waterBottlesCost: (order.waterBottlesCost || 0).toString(),
                totalAmount: (order.totalAmount || 0).toString(),
                advancePaid: '',
                paymentMethod: 'cash',
                paymentNotes: order.internalNote || '',
            })

            setCurrentOrderStatus(order.status || 'pending')
            setShowStalls(stallsArray.length > 0)
            setOriginalAdvancePaid(order.advancePaid || 0)
            setOriginalMealTypeAmounts(mealTypeAmounts || {})

            // Collapse all sessions by default when editing
            const initialCollapsed: Record<string, boolean> = {}
            mealTypesArray.forEach(mt => {
                initialCollapsed[mt.id] = true
            })
            setCollapsedMealTypes(initialCollapsed)
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
            } else if (mt.menuType === 'saree') {
                // Sum individual item prices for Saree sessions (multiplied by quantity)
                const sareeTotal = mt.selectedMenuItems.reduce((sum, itemId) => {
                    const price = parseFloat(mt.itemPrices?.[itemId] || '0') || 0
                    const qty = parseFloat(mt.itemQuantities[itemId] || '1') || 0
                    return sum + (price * qty)
                }, 0)
                mtTotal += sareeTotal
            } else {
                mtTotal += parseFloat(mt.manualAmount) || 0
            }
            mealTypesTotal += mtTotal
        })

        const stallsTotal = showStalls ? formData.stalls.reduce((sum, s) => {
            let sTotal = 0
            if (s.pricingMethod === 'plate-based') {
                const plates = parseFloat(s.numberOfPlates) || parseFloat(s.numberOfMembers) || 0
                sTotal = plates * (parseFloat(s.platePrice) || 0)
            } else {
                sTotal = parseFloat(s.manualAmount) || parseFloat(s.cost as string) || 0
            }
            return sum + sTotal
        }, 0) : 0
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

                    // Initialize itemPrices if changing category to saree
                    if (field === 'menuType' && value === 'saree') {
                        const newPrices: Record<string, string> = { ...mt.itemPrices }
                        mt.selectedMenuItems.forEach(itemId => {
                            if (!newPrices[itemId]) newPrices[itemId] = ''
                        })
                        updated.itemPrices = newPrices
                    }
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
            mealTypes: [{
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
                itemPrices: {},
                description: '',
            }, ...prev.mealTypes]
        }))
        setCollapsedMealTypes(prev => ({ ...prev, [id]: false }))
    }

    const handleSelectCommonItems = (mealTypeId: string) => {
        // Find common items by BOOLEAN flag OR by TYPE containing 'common'
        const commonItems = menuItems.filter(item => {
            const isCommonFlag = (item as any).isCommon === true
            const types = Array.isArray(item.type) ? item.type : [(item.type as any)]
            // Check if any type contains 'common' (handles 'common items', 'common_items', etc.)
            const hasCommonType = types.some((t: string) => t?.toLowerCase().includes('common'))
            return isCommonFlag || hasCommonType
        })
        
        const commonItemIds = commonItems.map(item => item.id)
        
        if (commonItemIds.length === 0) {
            toast.error('No items marked as "Common" in menu')
            return
        }

        setFormData(prev => ({
            ...prev,
            mealTypes: prev.mealTypes.map(mt => {
                if (mt.id === mealTypeId) {
                    const uniqueIds = Array.from(new Set([...mt.selectedMenuItems, ...commonItemIds]))
                    
                    const newQuantities = { ...mt.itemQuantities }
                    commonItems.forEach(item => {
                        if (!newQuantities[item.id]) newQuantities[item.id] = '1'
                    })

                    // Combine all common item descriptions into the main SESSION description
                    const commonDescriptions = commonItems
                        .map(item => item.description)
                        .filter(Boolean)
                        .join(", ")

                    return { 
                        ...mt, 
                        selectedMenuItems: uniqueIds,
                        itemQuantities: newQuantities,
                        // Update the Session Description with the common item details
                        description: mt.description 
                            ? (mt.description.includes(commonDescriptions) ? mt.description : `${mt.description}, ${commonDescriptions}`)
                            : commonDescriptions
                    }
                }
                return mt
            })
        }))
        toast.success(`Added ${commonItems.length} common items`)
    }

    const handleRemoveMealType = (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Remove Session',
            message: 'Are you sure you want to remove this meal session?',
            onConfirm: () => {
                setFormData(prev => ({
                    ...prev,
                    mealTypes: prev.mealTypes.filter(mt => mt.id !== id)
                }))
                setConfirmModal(p => ({ ...p, isOpen: false }))
            }
        })
    }

    const handleMenuItemToggle = (mealTypeId: string, itemId: string) => {
        setFormData(prev => ({
            ...prev,
            mealTypes: prev.mealTypes.map(mt =>
                mt.id === mealTypeId
                    ? {
                        ...mt,
                        selectedMenuItems: mt.selectedMenuItems.includes(itemId)
                            ? mt.selectedMenuItems.filter(i => i !== itemId)
                            : [...mt.selectedMenuItems, itemId],
                        itemPrices: mt.id === mealTypeId && !mt.selectedMenuItems.includes(itemId) && mt.menuType === 'saree'
                            ? { ...mt.itemPrices, [itemId]: '' }
                            : mt.itemPrices
                    }
                    : mt
            )
        }))
    }

    const handleAddStall = () => {
        const id = uuidv4()
        setShowStalls(true)
        setFormData(prev => ({
            ...prev,
            stalls: [{
                id,
                category: '',
                description: '',
                selectedMenuItems: [],
                itemCustomizations: {},
                itemQuantities: {},
                pricingMethod: 'manual',
                numberOfPlates: '',
                platePrice: '',
                manualAmount: '',
                cost: '',
                numberOfMembers: '',
                eventName: '',
                venue: '',
                date: '',
                time: '',
                services: [],
            }, ...prev.stalls]
        }))
    }

    const handleRemoveStall = (index: number) => {
        setFormData(prev => ({
            ...prev,
            stalls: prev.stalls.filter((_, i) => i !== index)
        }))
        if (formData.stalls.length <= 1) setShowStalls(false)
    }

    const handleUpdateStall = (id: string, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            stalls: prev.stalls.map(s => {
                if (s.id === id) {
                    const updated = { ...s, [field]: value }
                    if (field === 'numberOfMembers' && s.pricingMethod === 'plate-based') updated.numberOfPlates = value
                    if (field === 'pricingMethod' && value === 'plate-based') updated.numberOfPlates = s.numberOfMembers
                    return updated
                }
                return s
            })
        }))
    }

    const handleLoadStallTemplate = (stallId: string, templateId: string) => {
        const template = stallTemplates.find(t => t.id === templateId)
        if (!template) return

        setFormData(prev => ({
            ...prev,
            stalls: (prev.stalls || []).map(s => {
                if (s.id === stallId) {
                    return {
                        ...s,
                        category: template.name,
                        description: template.description || '',
                        selectedMenuItems: Array.isArray(template.menuItemIds) ? [...template.menuItemIds] : []
                    }
                }
                return s
            })
        }))
        toast.success(`Loaded ${template.name} template`)
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
                    eventName: mt.eventName,
                    description: mt.description,
                    itemPrices: mt.menuType === 'saree' ? Object.fromEntries(
                        Object.entries(mt.itemPrices).map(([k, v]) => [k, parseFloat(v) || 0])
                    ) : undefined
                }
            })

            const orderItems: OrderItem[] = formData.mealTypes.flatMap(mt =>
                mt.selectedMenuItems.map(menuItemId => ({
                    menuItemId,
                    quantity: parseFloat(mt.itemQuantities[menuItemId] || '1'),
                    mealType: mt.id,
                    customization: mt.itemCustomizations[menuItemId] || null,
                    price: mt.menuType === 'saree' ? parseFloat(mt.itemPrices[menuItemId]) || 0 : undefined
                }))
            )

            const stallItems: OrderItem[] = formData.stalls.flatMap(s =>
                s.selectedMenuItems.map(menuItemId => ({
                    menuItemId,
                    quantity: parseFloat(s.itemQuantities[menuItemId] || '1'),
                    mealType: s.id,
                    customization: s.itemCustomizations[menuItemId] || null
                }))
            )

            const stallsPayload = formData.stalls.map(s => ({
                id: s.id,
                category: s.category,
                description: s.description,
                selectedMenuItems: s.selectedMenuItems,
                itemCustomizations: s.itemCustomizations,
                itemQuantities: s.itemQuantities,
                pricingMethod: s.pricingMethod,
                numberOfPlates: parseFloat(s.numberOfPlates) || 0,
                platePrice: parseFloat(s.platePrice) || 0,
                manualAmount: parseFloat(s.manualAmount) || 0,
                cost: s.pricingMethod === 'plate-based'
                    ? (parseFloat(s.numberOfPlates) || 0) * (parseFloat(s.platePrice) || 0)
                    : parseFloat(s.manualAmount) || 0,
                numberOfMembers: parseInt(s.numberOfMembers) || 0,
                eventName: s.eventName,
                venue: s.venue,
                date: s.date,
                time: s.time,
                services: s.services
            }))

            const orderData: any = {
                customerId: formData.customerId,
                eventName: formData.eventName,
                orderType: formData.orderType,
                items: [...orderItems, ...stallItems],
                totalAmount: totals.total,
                advancePaid: parseFloat(formData.advancePaid) || 0,
                remainingAmount: totals.balance,
                status: currentOrderStatus,
                mealTypeAmounts,
                stalls: stallsPayload,
                transportCost: parseFloat(formData.transportCost) || 0,
                waterBottlesCost: parseFloat(formData.waterBottlesCost) || 0,
                discount: parseFloat(formData.discount) || 0,
                paymentMethod: formData.paymentMethod,
                additionalPayment: parseFloat(formData.advancePaid) || 0,
                internalNote: formData.paymentNotes
            }

            if (isEditMode && orderId) {
                await Storage.updateOrder(orderId, orderData)
                toast.success('Order updated')
            } else {
                await Storage.saveOrder(orderData)
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

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2 relative" ref={customerSearchRef}>
                        <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-widest">Search Customer</label>
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                            <input
                                type="text"
                                value={customerSearchTerm}
                                onChange={(e) => {
                                    setCustomerSearchTerm(e.target.value)
                                    setShowCustomerDropdown(true)
                                }}
                                onFocus={() => setShowCustomerDropdown(true)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm font-bold"
                                placeholder="Name or Phone Number"
                            />
                        </div>

                        {showCustomerDropdown && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                                {!isEditMode && (
                                    <button
                                        type="button"
                                        onClick={() => setShowAddCustomerForm(true)}
                                        className="w-full px-4 py-2.5 text-left text-primary-600 font-bold text-xs hover:bg-primary-50 flex items-center gap-2 sticky top-0 bg-white border-b border-gray-100"
                                    >
                                        <FaPlus /> Add New Customer
                                    </button>
                                )}
                                {filteredCustomers.map(c => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, customerId: c.id }))
                                            setCustomerSearchTerm(c.name)
                                            setShowCustomerDropdown(false)
                                        }}
                                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0"
                                    >
                                        <div className="font-bold text-gray-800 text-xs">{c.name}</div>
                                        <div className="text-[10px] text-gray-500">{c.phone}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-widest">
                            {formData.orderType === 'EVENT' ? 'Event Name / Title' : 'Order Title (Regular)'}
                        </label>
                        <input
                            type="text"
                            value={formData.eventName}
                            onChange={(e) => setFormData(prev => ({ ...prev, eventName: e.target.value }))}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-bold text-gray-800 text-sm"
                            placeholder={formData.orderType === 'EVENT' ? "e.g., Ramesh & Sitha Wedding" : "e.g., Daily Prasadam / Lunch Packs"}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-widest">Status</label>
                        <select
                            value={currentOrderStatus}
                            onChange={(e) => setCurrentOrderStatus(e.target.value)}
                            className={`w-full px-4 py-2 rounded-xl border border-gray-200 outline-none font-black text-xs transition-all ${currentOrderStatus === 'quotation' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                currentOrderStatus === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                    currentOrderStatus === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                        currentOrderStatus === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                                            'bg-orange-50 text-orange-700 border-orange-200'
                                }`}
                        >
                            <option value="quotation">Quotation</option>
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                {selectedCustomer && (
                    <div className="mt-6 p-5 bg-gray-50 rounded-2xl border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-inner">
                        <div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Customer Name</span>
                            <div className="font-bold text-gray-900">{selectedCustomer.name}</div>
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Phone Number</span>
                            <div className="font-bold text-gray-900">{selectedCustomer.phone}</div>
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Delivery Address</span>
                            <div className="font-bold text-gray-900">{selectedCustomer.address}</div>
                        </div>
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
                                            <option value="saree">Saree</option>
                                            <option value="special_order">Special Order</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{formData.orderType === 'EVENT' ? 'Venue' : 'Delivery/Pickup Venue'}</label>
                                        <input
                                            type="text"
                                            value={mt.venue}
                                            onChange={(e) => handleUpdateMealType(mt.id, 'venue', e.target.value)}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Session Description / Internal Notes</label>
                                    <textarea
                                        value={mt.description}
                                        onChange={(e) => handleUpdateMealType(mt.id, 'description', e.target.value)}
                                        rows={2}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                                        placeholder="e.g., Any specific instructions for this session..."
                                    />
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
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{formData.orderType === 'EVENT' ? 'Members Group Count' : 'Requested Quantity'}</label>
                                        <input
                                            type="number"
                                            value={mt.numberOfMembers}
                                            onChange={(e) => handleUpdateMealType(mt.id, 'numberOfMembers', e.target.value)}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    {mt.menuType !== 'saree' && (
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
                                    )}
                                </div>

                                {mt.menuType === 'saree' ? (
                                    <div className="p-4 bg-primary-50 rounded-lg border border-primary-100 flex justify-between items-center">
                                        <div>
                                            <p className="text-xs font-bold text-primary-600 mb-1 uppercase tracking-tight">Saree Itemized Summary</p>
                                            <p className="text-lg font-black text-primary-700">
                                                Subtotal: {formatCurrency(mt.selectedMenuItems.reduce((sum, itemId) => {
                                                    const price = parseFloat(mt.itemPrices?.[itemId] || '0') || 0
                                                    const qty = parseFloat(mt.itemQuantities[itemId] || '1') || 0
                                                    return sum + (price * qty)
                                                }, 0))}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-bold text-primary-400 uppercase">Per Unit Calculations Enabled</span>
                                        </div>
                                    </div>
                                ) : mt.pricingMethod === 'plate-based' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">{formData.orderType === 'EVENT' ? 'Number of Plates' : 'Quantity / Packs'}</label>
                                            <input
                                                type="number"
                                                value={mt.numberOfPlates}
                                                onChange={(e) => handleUpdateMealType(mt.id, 'numberOfPlates', e.target.value)}
                                                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">{formData.orderType === 'EVENT' ? 'Price per Plate' : 'Unit Price'}</label>
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

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 transition-all font-bold"
                                                placeholder={`Search and pick ${mt.menuType || 'items'}...`}
                                                value={menuItemSearch[mt.id] || ''}
                                                onChange={(e) => setMenuItemSearch(p => ({ ...p, [mt.id]: e.target.value }))}
                                            />
                                        </div>

                                        {(menuItemSearch[mt.id] || mt.menuType) && (
                                            <div className="mt-2 max-h-[350px] overflow-y-auto pr-1">
                                                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-1.5 pt-1">
                                                    {menuItems
                                                        .filter(item => {
                                                            const search = (menuItemSearch[mt.id] || '').toLowerCase()
                                                            const matchesSearch = item.name.toLowerCase().includes(search)
                                                            const itemTypes = Array.isArray(item.type) ? item.type : [(item.type as any)]
                                                            const isSpecialOrder = mt.menuType === 'special_order'
                                                            const matchesType = isSpecialOrder || !mt.menuType || itemTypes.some((t: string) => t?.toLowerCase() === mt.menuType.toLowerCase())
                                                            return matchesSearch && matchesType
                                                        })
                                                        .map(item => (
                                                            <button
                                                                key={item.id}
                                                                type="button"
                                                                onClick={() => handleMenuItemToggle(mt.id, item.id)}
                                                                className={`p-2 text-left rounded-lg border transition-all ${mt.selectedMenuItems.includes(item.id)
                                                                    ? 'bg-primary-600 border-primary-600 text-white font-black shadow-md shadow-primary-200 scale-[1.02]'
                                                                    : 'bg-white border-gray-50 text-gray-700 hover:border-primary-300 hover:bg-primary-50 font-bold'}`}
                                                            >
                                                                <div className="text-[10px] font-black leading-tight mb-0.5 line-clamp-2">{item.name}</div>
                                                                {item.description && (
                                                                    <div className={`text-[8px] line-clamp-1 italic ${mt.selectedMenuItems.includes(item.id) ? 'text-primary-100' : 'text-gray-400 font-normal'}`}>
                                                                        {item.description}
                                                                    </div>
                                                                )}
                                                            </button>
                                                        ))}
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleSelectCommonItems(mt.id)}
                                                className="flex-1 p-2 text-[10px] font-black text-center text-amber-600 border border-dashed border-amber-200 rounded-lg hover:bg-amber-50 transition-all flex items-center justify-center gap-1"
                                            >
                                                <FaPlus className="text-[8px]" /> ADD COMMON ITEMS
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setQuickAddMealTypeId(mt.id)
                                                    setShowQuickAddModal(true)
                                                }}
                                                className="flex-1 p-2 text-[10px] font-black text-center text-primary-600 border border-dashed border-primary-100 rounded-lg hover:bg-primary-50 transition-all flex items-center justify-center gap-1"
                                            >
                                                <FaPlus className="text-[8px]" /> QUICK ADD
                                            </button>
                                        </div>
                                    </div>

                                    <h4 className="font-bold text-gray-800 flex items-center justify-between border-t border-gray-50 pt-4">
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
                                                    <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                                        {mt.selectedMenuItems.map((itemId, idx) => {
                                                            const item = menuItems.find(m => m.id === itemId)
                                                            if (!item) return null
                                                            return (
                                                                <Draggable key={itemId} draggableId={itemId} index={idx}>
                                                                    {(provided) => (
                                                                        <div
                                                                            ref={provided.innerRef}
                                                                            {...provided.draggableProps}
                                                                            className="flex items-center gap-2 p-2 bg-white border border-gray-100 rounded-lg group shadow-sm hover:border-primary-200 transition-all"
                                                                        >
                                                                            <div {...provided.dragHandleProps} className="text-gray-300 group-hover:text-gray-400 cursor-grab active:cursor-grabbing">
                                                                                <FaGripLines size={12} />
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="font-bold text-gray-800 text-xs truncate leading-tight">{item.name}</div>
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="Customization..."
                                                                                    value={mt.itemCustomizations[itemId] || ''}
                                                                                    onChange={(e) => {
                                                                                        const val = e.target.value
                                                                                        setFormData(prev => ({
                                                                                            ...prev,
                                                                                            mealTypes: prev.mealTypes.map(m => m.id === mt.id ? { ...m, itemCustomizations: { ...m.itemCustomizations, [itemId]: val } } : m)
                                                                                        }))
                                                                                    }}
                                                                                    className="text-[10px] w-full mt-0.5 text-gray-500 bg-transparent border-b border-transparent focus:border-primary-300 outline-none placeholder:text-gray-300"
                                                                                />
                                                                                {mt.menuType === 'saree' && (
                                                                                    <div className="mt-1.5 space-y-1.5">
                                                                                        <div className="flex items-center gap-1.5">
                                                                                            <div className="relative flex-1">
                                                                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 font-bold">₹</span>
                                                                                                <input
                                                                                                    type="number"
                                                                                                    placeholder="Price"
                                                                                                    value={mt.itemPrices[itemId] || ''}
                                                                                                    onChange={(e) => {
                                                                                                        const val = e.target.value
                                                                                                        setFormData(prev => ({
                                                                                                            ...prev,
                                                                                                            mealTypes: prev.mealTypes.map(m => m.id === mt.id ? { ...m, itemPrices: { ...m.itemPrices, [itemId]: val } } : m)
                                                                                                        }))
                                                                                                    }}
                                                                                                    className="text-[10px] font-bold w-full text-primary-600 bg-white border border-primary-100 rounded pl-4 pr-1.5 py-1 outline-none focus:ring-1 focus:ring-primary-500"
                                                                                                />
                                                                                            </div>
                                                                                            {item.unit && (
                                                                                                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-1 rounded">/ {item.unit}</span>
                                                                                            )}
                                                                                        </div>
                                                                                        <div className="flex items-center gap-1.5">
                                                                                            <span className="text-[10px] text-gray-400 font-bold uppercase">Qty:</span>
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
                                                                                                className="text-[10px] font-bold w-16 text-slate-700 bg-white border border-slate-200 rounded px-1.5 py-1 outline-none focus:ring-1 focus:ring-primary-500"
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleMenuItemToggle(mt.id, itemId)}
                                                                                className="text-gray-300 hover:text-red-500 p-1"
                                                                            >
                                                                                <FaTimes size={14} />
                                                                            </button>
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
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FaStore className="text-primary-500" /> Live Stalls & Extras
                    </h2>
                    {!showStalls ? (
                        <button
                            type="button"
                            onClick={handleAddStall}
                            className="text-primary-600 font-bold text-sm hover:underline flex items-center gap-1"
                        >
                            <FaPlus size={12} /> Add Stalls
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleAddStall}
                            className="bg-primary-50 text-primary-600 px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-primary-100 transition-all flex items-center gap-1"
                        >
                            <FaPlus size={10} /> Add More
                        </button>
                    )}
                </div>

                {showStalls && (
                    <div className="space-y-8">
                        {formData.stalls.map((stall) => (
                            <div key={stall.id} className="relative p-6 bg-slate-50/50 rounded-2xl border border-slate-100 animate-in slide-in-from-top-4 duration-500 hover:shadow-lg hover:shadow-slate-100/50 transition-all group/stall">
                                <button
                                    type="button"
                                    onClick={() => handleRemoveStall(formData.stalls.findIndex(s => s.id === stall.id))}
                                    className="absolute -top-3 -right-3 w-8 h-8 bg-white text-slate-400 hover:text-red-500 rounded-full shadow-md border border-slate-100 flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-10 opacity-0 group-hover/stall:opacity-100"
                                >
                                    <FaTrash size={12} />
                                </button>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="space-y-4">
                                        {stallTemplates.length > 0 && (
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Quick Load Template</label>
                                                <div className="relative group/template">
                                                    <FaStore className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500 group-focus-within/template:scale-110 transition-transform" size={12} />
                                                    <select
                                                        onChange={(e) => handleLoadStallTemplate(stall.id, e.target.value)}
                                                        className="w-full pl-10 pr-4 py-3 bg-primary-50 border border-primary-100 rounded-2xl outline-none font-bold text-primary-700 text-xs focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 appearance-none cursor-pointer transition-all"
                                                        value=""
                                                    >
                                                        <option value="" disabled>Choose a pre-defined stall package...</option>
                                                        {stallTemplates.map(t => (
                                                            <option key={t.id} value={t.id}>{t.name}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary-400">
                                                        <FaChevronDown size={10} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Stall Name / Category</label>
                                            <input
                                                type="text"
                                                value={stall.category}
                                                onChange={(e) => handleUpdateStall(stall.id, 'category', e.target.value)}
                                                placeholder="e.g., Coffee Stall, LED Counter..."
                                                className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest uppercase">Stall Event Name</label>
                                                <input
                                                    type="text"
                                                    value={stall.eventName}
                                                    onChange={(e) => handleUpdateStall(stall.id, 'eventName', e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-700 text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest uppercase">Stall Venue</label>
                                                <input
                                                    type="text"
                                                    value={stall.venue}
                                                    onChange={(e) => handleUpdateStall(stall.id, 'venue', e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-700 text-xs"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Date</label>
                                                <input
                                                    type="date"
                                                    value={stall.date}
                                                    onChange={(e) => handleUpdateStall(stall.id, 'date', e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-700 text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Time</label>
                                                <input
                                                    type="time"
                                                    value={stall.time}
                                                    onChange={(e) => handleUpdateStall(stall.id, 'time', e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-700 text-xs"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Description</label>
                                            <input
                                                type="text"
                                                value={stall.description}
                                                onChange={(e) => handleUpdateStall(stall.id, 'description', e.target.value)}
                                                placeholder="e.g., Live Jalebi Counter with 2 people"
                                                className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm placeholder:text-slate-300"
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing Structure</label>
                                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateStall(stall.id, 'pricingMethod', 'manual')}
                                                    className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${stall.pricingMethod === 'manual' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                >
                                                    Manual
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateStall(stall.id, 'pricingMethod', 'plate-based')}
                                                    className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${stall.pricingMethod === 'plate-based' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                >
                                                    Plate-wise
                                                </button>
                                            </div>
                                        </div>

                                        {stall.pricingMethod === 'plate-based' ? (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase">Plates</label>
                                                    <input
                                                        type="number"
                                                        value={stall.numberOfPlates}
                                                        onChange={(e) => handleUpdateStall(stall.id, 'numberOfPlates', e.target.value)}
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-black text-slate-700 focus:ring-2 focus:ring-primary-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase">Price / Plate</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 font-bold">₹</span>
                                                        <input
                                                            type="number"
                                                            value={stall.platePrice}
                                                            onChange={(e) => handleUpdateStall(stall.id, 'platePrice', e.target.value)}
                                                            className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-black text-primary-600 focus:ring-2 focus:ring-primary-500"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">Total Extras Amount</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-lg">₹</span>
                                                    <input
                                                        type="number"
                                                        value={stall.manualAmount}
                                                        onChange={(e) => handleUpdateStall(stall.id, 'manualAmount', e.target.value)}
                                                        className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-xl outline-none font-black text-2xl text-primary-600 focus:ring-2 focus:ring-primary-500 tracking-tight"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 pt-2">
                                            <div className="flex-1">
                                                <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">Serving Members</label>
                                                <div className="relative">
                                                    <FaUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                                                    <input
                                                        type="number"
                                                        value={stall.numberOfMembers}
                                                        onChange={(e) => handleUpdateStall(stall.id, 'numberOfMembers', e.target.value)}
                                                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-slate-700"
                                                        placeholder="Qty"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Items selection for stalls - reusing the pattern from mealTypes */}
                                <div className="mt-8 pt-8 border-t border-slate-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
                                            <FaUtensils className="text-primary-500" size={14} /> Stall Menu Items
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            <div className="relative group">
                                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={12} />
                                                <input
                                                    type="text"
                                                    placeholder="Search specialized stall items..."
                                                    value={menuItemSearch[stall.id] || ''}
                                                    onChange={(e) => setMenuItemSearch(p => ({ ...p, [stall.id]: e.target.value }))}
                                                    className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 w-64 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="min-h-[100px] mb-6">
                                        {(menuItemSearch[stall.id] || stall.category) && (
                                            <div className="mt-2 max-h-[350px] overflow-y-auto pr-1">
                                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 pt-1">
                                                    {menuItems
                                                        .filter(item => {
                                                            const search = (menuItemSearch[stall.id] || '').toLowerCase()
                                                            const matchesSearch = item.name.toLowerCase().includes(search)
                                                            // For stalls, we might want to filter by certain types, but user wants to "add type add the stall items there"
                                                            // So we check if item type matches the stall category name partially or fully
                                                            const itemTypes = Array.isArray(item.type) ? item.type : [(item.type as any)]
                                                            const matchesType = !stall.category || itemTypes.some((t: string) =>
                                                                t?.toLowerCase().includes('stall') ||
                                                                (stall.category && t?.toLowerCase() === stall.category.toLowerCase())
                                                            )
                                                            return matchesSearch && (matchesType || search.length > 0)
                                                        })
                                                        .map(item => (
                                                            <button
                                                                key={item.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        stalls: prev.stalls.map(s => s.id === stall.id ? {
                                                                            ...s,
                                                                            selectedMenuItems: s.selectedMenuItems.includes(item.id)
                                                                                ? s.selectedMenuItems.filter(i => i !== item.id)
                                                                                : [...s.selectedMenuItems, item.id]
                                                                        } : s)
                                                                    }))
                                                                }}
                                                                className={`p-2 text-left rounded-xl border transition-all relative overflow-hidden ${stall.selectedMenuItems.includes(item.id)
                                                                    ? 'bg-primary-600 border-primary-600 text-white font-black shadow-lg shadow-primary-200 scale-[1.02]'
                                                                    : 'bg-white border-slate-100 text-slate-700 hover:border-primary-300 hover:bg-slate-50 font-bold'}`}
                                                            >
                                                                <div className="text-[10px] font-black leading-tight mb-0.5 line-clamp-2">{item.name}</div>
                                                                {stall.selectedMenuItems.includes(item.id) && (
                                                                    <div className="absolute -top-1 -right-1 opacity-20">
                                                                        <FaUtensils size={30} />
                                                                    </div>
                                                                )}
                                                            </button>
                                                        ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {stall.selectedMenuItems.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                            {stall.selectedMenuItems.map((itemId) => {
                                                const item = menuItems.find(m => m.id === itemId)
                                                if (!item) return null
                                                return (
                                                    <div key={itemId} className="flex items-center gap-3 p-2 bg-slate-50/50 border border-slate-100 rounded-xl group hover:border-primary-200 transition-all">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-extrabold text-slate-800 text-[10px] truncate leading-tight uppercase tracking-tight">{item.name}</div>
                                                            <input
                                                                type="text"
                                                                placeholder="Note..."
                                                                value={stall.itemCustomizations[itemId] || ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value
                                                                    handleUpdateStall(stall.id, 'itemCustomizations', { ...stall.itemCustomizations, [itemId]: val })
                                                                }}
                                                                className="text-[9px] w-full mt-0.5 text-slate-500 bg-transparent border-b border-transparent focus:border-primary-300 outline-none placeholder:text-slate-300 font-bold"
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                handleUpdateStall(stall.id, 'selectedMenuItems', stall.selectedMenuItems.filter(i => i !== item.id))
                                                            }}
                                                            className="text-slate-300 hover:text-red-500 transition-colors"
                                                        >
                                                            <FaTimes size={12} />
                                                        </button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!showStalls && (
                    <div className="text-center py-6 border-2 border-dashed border-gray-50 rounded-xl">
                        <p className="text-gray-400 text-xs font-medium">No extra stalls or charges added yet.</p>
                    </div>
                )}
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

                <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Notes / Internal Remarks</label>
                    <textarea
                        value={formData.paymentNotes}
                        onChange={(e) => setFormData(p => ({ ...p, paymentNotes: e.target.value }))}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none min-h-[80px]"
                        placeholder="Add any specific notes about the payment or order..."
                    />
                </div>

                <div className="mt-8 p-8 bg-white rounded-3xl border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-8 shadow-xl shadow-gray-100/50">
                    <div className="text-center md:text-left space-y-1">
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Total Bill Amount</div>
                        <div className="text-4xl font-black text-gray-800 tracking-tight">{formatCurrency(totals.total)}</div>
                    </div>
                    <div className="text-center md:border-x border-gray-50 py-4 md:py-0 space-y-1">
                        <div className="text-[10px] text-green-500 uppercase tracking-widest font-black">Total Received</div>
                        <div className="text-4xl font-black text-green-600 tracking-tight">
                            {formatCurrency(isEditMode ? originalAdvancePaid + (parseFloat(formData.advancePaid) || 0) : (parseFloat(formData.advancePaid) || 0))}
                        </div>
                    </div>
                    <div className="text-center md:text-right space-y-1">
                        <div className="text-[10px] text-orange-500 uppercase tracking-widest font-black">Balance Due</div>
                        <div className="text-4xl font-black text-orange-600 tracking-tight">{formatCurrency(totals.balance)}</div>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 lg:left-72 right-0 p-4 bg-white border-t border-gray-200 shadow-2xl z-40 flex justify-between items-center sm:px-20 transition-all duration-300">
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

            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-black text-gray-800 mb-2">{confirmModal.title}</h3>
                        <p className="text-gray-500 text-sm mb-8">{confirmModal.message}</p>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setConfirmModal(p => ({ ...p, isOpen: false }))}
                                className="flex-1 py-3 text-gray-600 font-bold text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmModal.onConfirm}
                                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 shadow-lg shadow-red-100"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </form>
    )
}
