"use client";
import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { FaChevronRight, FaChevronLeft, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa'

// V2 Step Components
import CustomerStep from './v2-steps/CustomerStep'
import SessionsStep from './v2-steps/SessionsStep'
import MenuStep from './v2-steps/MenuStep'
import FinancialsStep from './v2-steps/FinancialsStep'
import OrderSummary from './v2-steps/OrderSummary'

// Legacy/Shared
import { Storage } from '@/lib/storage-api'
import { Customer, MenuItem, StallTemplate, OrderItem } from '@/types'

interface OrderFormV2Props {
    orderId?: string | null;
    isEditMode?: boolean;
    initialOrderType?: 'EVENT' | 'LUNCH_PACK';
}

export default function OrderFormV2({ orderId, isEditMode = false, initialOrderType = 'EVENT' }: OrderFormV2Props) {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    // State
    const [currentStep, setCurrentStep] = useState(1)
    const [loading, setLoading] = useState(!!orderId)
    const [isSaving, setIsSaving] = useState(false)
    const [customers, setCustomers] = useState<Customer[]>([])
    const [menuItems, setMenuItems] = useState<MenuItem[]>([])
    const [stallTemplates, setStallTemplates] = useState<StallTemplate[]>([])
    const [currentOrderStatus, setCurrentOrderStatus] = useState(searchParams.get('status') || 'pending')
    const [collapsedSessions, setCollapsedSessions] = useState<Record<string, boolean>>({})
    const [originalAdvancePaid, setOriginalAdvancePaid] = useState(0)
    
    const [formData, setFormData] = useState({
        customerId: '',
        eventName: '',
        orderType: initialOrderType as 'EVENT' | 'LUNCH_PACK',
        mealTypes: [] as any[],
        stalls: [] as any[],
        discount: '',
        transportCost: '',
        waterBottlesCost: '',
        totalAmount: '',
        advancePaid: '',
        paymentMethod: 'cash' as any,
        paymentNotes: '',
    })

    // Init Data
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [custData, itemData, stallData] = await Promise.all([
                    Storage.getCustomers(),
                    Storage.getMenuItems(),
                    Storage.getStallTemplates()
                ])
                setCustomers(custData)
                setMenuItems(itemData.filter((i: any) => i.isActive))
                setStallTemplates(stallData || [])
            } catch (err) {
                toast.error("Failed to load ecosystem data.")
            }
        }
        loadInitialData()
    }, [])

    // Load existing order for edit
    useEffect(() => {
        if (isEditMode && orderId && customers.length > 0 && menuItems.length > 0) {
            loadOrderToEdit(orderId)
        }
    }, [isEditMode, orderId, customers.length, menuItems.length])

    const loadOrderToEdit = async (id: string) => {
        setLoading(true)
        try {
            const order = await Storage.getOrder(id)
            if (!order) {
                toast.error("Order not found.")
                router.push('/orders')
                return
            }

            // Restore complex state (sessions, items, stalls)
            const mealTypeAmounts = order.mealTypeAmounts as any
            const orderItems = Array.isArray(order.items) ? order.items : []
            
            // Map items back to sessions
            const itemsByType: Record<string, string[]> = {}
            const customizations: Record<string, Record<string, string>> = {}
            const quantities: Record<string, Record<string, string>> = {}
            const prices: Record<string, Record<string, string>> = {}

            orderItems.forEach((item: any) => {
                const mtId = item.mealType || 'other'
                if (!itemsByType[mtId]) itemsByType[mtId] = []
                itemsByType[mtId].push(item.menuItemId)
                
                if (!customizations[mtId]) customizations[mtId] = {}
                if (!quantities[mtId]) quantities[mtId] = {}
                if (!prices[mtId]) prices[mtId] = {}
                
                if (item.customization) customizations[mtId][item.menuItemId] = item.customization
                if (item.quantity) quantities[mtId][item.menuItemId] = item.quantity.toString()
                if (item.price) prices[mtId][item.menuItemId] = item.price.toString()
            })

            const mealTypesArray = mealTypeAmounts ? Object.entries(mealTypeAmounts).map(([id, data]: [string, any]) => ({
                id,
                eventName: data.eventName || '',
                venue: data.venue || '',
                menuType: (data.menuType || '').toLowerCase(),
                selectedMenuItems: itemsByType[id] || [],
                itemCustomizations: customizations[id] || {},
                itemQuantities: quantities[id] || {},
                pricingMethod: data.pricingMethod || 'manual',
                numberOfPlates: (data.numberOfPlates || '').toString(),
                platePrice: (data.platePrice || '').toString(),
                manualAmount: (data.manualAmount || data.amount || '').toString(),
                date: data.date || '',
                time: data.time || '',
                services: data.services || [],
                numberOfMembers: (data.numberOfMembers || '').toString(),
                itemPrices: data.itemPrices || prices[id] || {},
                description: data.description || ''
            })) : []

            const stallsArray = (order.stalls || []).map((s: any) => ({
                ...s,
                id: s.id || uuidv4(),
                cost: (s.cost || '').toString(),
                manualAmount: (s.manualAmount || s.cost || '').toString()
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
            setOriginalAdvancePaid(order.advancePaid || 0)
            setCurrentOrderStatus(order.status || 'pending')
        } catch (err) {
            toast.error("Failed to load order.")
        } finally {
            setLoading(false)
        }
    }

    // Calculations
    const totals = useMemo(() => {
        let mealTypesTotal = 0
        let waterTotal = 0

        formData.mealTypes.forEach(mt => {
            let mtTotal = 0
            mt.selectedMenuItems.forEach((itemId: string) => {
                const item = menuItems.find(m => m.id === itemId)
                if (item && item.price) {
                    const qty = parseFloat(mt.itemQuantities[itemId] || '1')
                    if (item.name.toLowerCase().includes('water') && item.name.toLowerCase().includes('bottle')) {
                        waterTotal += item.price * qty
                    }
                }
            })

            if (mt.pricingMethod === 'plate-based') {
                const plates = parseFloat(mt.numberOfPlates) || parseFloat(mt.numberOfMembers) || 0
                mtTotal += plates * (parseFloat(mt.platePrice) || 0)
            } else if (mt.menuType === 'saree') {
                mtTotal += mt.selectedMenuItems.reduce((sum: number, itemId: string) => {
                    const p = parseFloat(mt.itemPrices?.[itemId] || '0') || 0
                    const q = parseFloat(mt.itemQuantities[itemId] || '1') || 0
                    return sum + (p * q)
                }, 0)
            } else {
                mtTotal += parseFloat(mt.manualAmount) || 0
            }
            mealTypesTotal += mtTotal
        })

        const stallsTotal = (formData.stalls || []).reduce((sum, s) => {
            let sTotal = 0
            if (s.pricingMethod === 'plate-based') {
                const plates = parseFloat(s.numberOfPlates) || parseFloat(s.numberOfMembers) || 0
                sTotal = plates * (parseFloat(s.platePrice) || 0)
            } else {
                sTotal = parseFloat(s.manualAmount) || parseFloat(s.cost) || 0
            }
            return sum + sTotal
        }, 0)

        const transport = parseFloat(formData.transportCost) || 0
        const discount = parseFloat(formData.discount) || 0
        const waterBottles = waterTotal > 0 ? waterTotal : (parseFloat(formData.waterBottlesCost) || 0)

        const total = Math.max(0, mealTypesTotal + transport + waterBottles + stallsTotal - discount)
        const currentAdvance = parseFloat(formData.advancePaid) || 0
        const totalAdvance = isEditMode ? originalAdvancePaid + currentAdvance : currentAdvance
        const balance = Math.max(0, total - totalAdvance)

        return { total, balance, waterTotal, stallsTotal, mealTypesTotal }
    }, [formData, menuItems, isEditMode, originalAdvancePaid])

    // Save
    const handleSubmit = async () => {
        if (!formData.customerId) return toast.error("Select a customer.")
        if (formData.mealTypes.length === 0) return toast.error("Add at least one session.")

        setIsSaving(true)
        try {
            const mealTypeAmounts: Record<string, any> = {}
            formData.mealTypes.forEach(mt => {
                mealTypeAmounts[mt.id] = {
                    ...mt,
                    amount: mt.pricingMethod === 'plate-based' 
                        ? (parseFloat(mt.numberOfPlates) || 0) * (parseFloat(mt.platePrice) || 0)
                        : parseFloat(mt.manualAmount) || 0,
                }
            })

            const orderItems = formData.mealTypes.flatMap(mt => mt.selectedMenuItems.map((itemId: string) => ({
                menuItemId: itemId,
                quantity: parseFloat(mt.itemQuantities[itemId] || '1'),
                mealType: mt.id,
                customization: mt.itemCustomizations[itemId] || null,
                price: mt.menuType === 'saree' ? parseFloat(mt.itemPrices[itemId]) || 0 : undefined
            })))

            const stallItems = (formData.stalls || []).flatMap(s => s.selectedMenuItems.map((itemId: string) => ({
                menuItemId: itemId,
                quantity: parseFloat(s.itemQuantities[itemId] || '1'),
                mealType: s.id,
                customization: s.itemCustomizations[itemId] || null
            })))

            const orderData = {
                customerId: formData.customerId,
                eventName: formData.eventName,
                orderType: formData.orderType,
                items: [...orderItems, ...stallItems],
                totalAmount: totals.total,
                advancePaid: isEditMode ? originalAdvancePaid + (parseFloat(formData.advancePaid) || 0) : (parseFloat(formData.advancePaid) || 0),
                remainingAmount: totals.balance,
                status: currentOrderStatus,
                mealTypeAmounts,
                stalls: formData.stalls,
                transportCost: parseFloat(formData.transportCost) || 0,
                waterBottlesCost: parseFloat(formData.waterBottlesCost) || 0,
                discount: parseFloat(formData.discount) || 0,
                internalNote: formData.paymentNotes
            }

            if (isEditMode && orderId) {
                await Storage.updateOrder(orderId, orderData)
                toast.success("Intelligence updated successfully.")
            } else {
                await Storage.saveOrder(orderData)
                toast.success("Premium Event registered.")
            }
            router.push('/orders/center')
        } catch (err) {
            toast.error("Cloud synchronization failed.")
        } finally {
            setIsSaving(false)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full"
            />
        </div>
    )

    return (
        <div className="max-w-[1600px] mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                
                {/* Main Content Areas */}
                <div className="lg:col-span-8 space-y-12">
                    {/* Progress Tracker */}
                    <div className="flex items-center justify-between mb-8 px-4">
                        {[1, 2, 3, 4].map(step => (
                            <div key={step} className="flex items-center gap-3 relative z-10">
                                <button
                                    onClick={() => step < currentStep && setCurrentStep(step)}
                                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all ${
                                        currentStep === step ? 'bg-primary-600 text-white shadow-lg' : 
                                        currentStep > step ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'
                                    }`}
                                >
                                    {currentStep > step ? <FaCheckCircle /> : step}
                                </button>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${currentStep === step ? 'text-primary-600' : 'text-gray-400'}`}>
                                    {step === 1 ? 'IDENT' : step === 2 ? 'CONFIG' : step === 3 ? 'MENU' : 'FINANCE'}
                                </span>
                                {step < 4 && <div className="w-12 h-0.5 bg-gray-100 mx-2" />}
                            </div>
                        ))}
                    </div>

                    <div className="min-h-[600px]">
                        <AnimatePresence mode="wait">
                            {currentStep === 1 && (
                                <CustomerStep 
                                    formData={formData} 
                                    setFormData={setFormData} 
                                    customers={customers}
                                    currentOrderStatus={currentOrderStatus}
                                    setCurrentOrderStatus={setCurrentOrderStatus}
                                    isEditMode={isEditMode}
                                />
                            )}
                            {currentStep === 2 && (
                                <SessionsStep 
                                    formData={formData} 
                                    setFormData={setFormData}
                                    collapsedSessions={collapsedSessions}
                                    setCollapsedSessions={setCollapsedSessions}
                                />
                            )}
                            {currentStep === 3 && (
                                <MenuStep 
                                    formData={formData} 
                                    setFormData={setFormData}
                                    menuItems={menuItems}
                                />
                            )}
                            {currentStep === 4 && (
                                <FinancialsStep 
                                    formData={formData} 
                                    setFormData={setFormData}
                                    totals={totals}
                                    isEditMode={isEditMode}
                                    originalAdvancePaid={originalAdvancePaid}
                                />
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-12 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => setCurrentStep(p => Math.max(1, p - 1))}
                            disabled={currentStep === 1}
                            className={`v2-button px-8 py-4 flex items-center gap-2 border-2 border-gray-100 text-gray-400 ${currentStep === 1 ? 'opacity-0 select-none' : 'hover:border-primary-200 hover:text-primary-600'}`}
                        >
                            <FaChevronLeft /> REVERT PHASE
                        </button>
                        
                        {currentStep < 4 ? (
                            <button
                                type="button"
                                onClick={() => setCurrentStep(p => Math.min(4, p + 1))}
                                className="v2-button bg-gray-900 text-white px-10 py-5 flex items-center gap-2 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                NEXT PHASE <FaChevronRight />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSaving}
                                className="v2-button bg-primary-600 text-white px-12 py-5 flex items-center gap-2 shadow-2xl shadow-primary-900/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                {isSaving ? "SYNCHRONIZING..." : "SYNCHRONIZE ORDER"} <FaCheckCircle />
                            </button>
                        )}
                    </div>
                </div>

                {/* Right Summary Side Panel */}
                <div className="lg:col-span-4">
                    <OrderSummary 
                        formData={formData} 
                        totals={totals} 
                        currentStep={currentStep} 
                    />
                </div>
            </div>
        </div>
    )
}
