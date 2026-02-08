'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { Storage } from '@/lib/storage-api'
import { generateId, formatCurrency, formatDateTime } from '@/lib/utils'
import { Customer, MenuItem, OrderItem } from '@/types'
import { FaSearch, FaPlus } from 'react-icons/fa'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import FormError from '@/components/FormError'

export default function OrdersPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const editOrderId = searchParams?.get('edit') ?? null
  const isEditMode = !!editOrderId
  const financialLink = editOrderId ? `/orders/financial/${editOrderId}` : '/orders/financial'

  const [customers, setCustomers] = useState<Customer[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [selectedSubFilter, setSelectedSubFilter] = useState<Record<string, string>>({})
  const [menuItemSearch, setMenuItemSearch] = useState<Record<string, string>>({})
  const [showStalls, setShowStalls] = useState<boolean>(false)
  const [loadingOrder, setLoadingOrder] = useState(false)
  const [currentOrderStatus, setCurrentOrderStatus] = useState<string>('pending')
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState<boolean>(false)
  const customerSearchRef = useRef<HTMLDivElement>(null)
  const [collapsedMealTypes, setCollapsedMealTypes] = useState<Record<string, boolean>>({})
  const [originalAdvancePaid, setOriginalAdvancePaid] = useState<number>(0)
  const [originalMealTypeAmounts, setOriginalMealTypeAmounts] = useState<Record<string, any>>({})
  const [formError, setFormError] = useState<string>('')

  const [formData, setFormData] = useState({
    customerId: '',
    eventName: '',
    mealTypes: [] as Array<{
      id: string
      menuType: string
      selectedMenuItems: string[]
      pricingMethod: 'manual' | 'plate-based'
      numberOfPlates: string
      platePrice: string
      manualAmount: string
      date: string
      services: string[] // Array of selected services: 'buffet', 'vaddana', 'handover'
      numberOfMembers: string
    }>,
    stalls: [] as Array<{ category: string; description: string; cost: string }>,
    discount: '',
    transportCost: '',
    totalAmount: '',
    advancePaid: '',
    paymentMethod: 'cash' as 'cash' | 'upi' | 'card' | 'bank_transfer' | 'other',
    paymentNotes: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (isEditMode && editOrderId && customers.length > 0 && menuItems.length > 0) {
      loadOrderData(editOrderId)
    }
  }, [isEditMode, editOrderId, customers.length, menuItems.length])

  // Close customer dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerSearchRef.current && !customerSearchRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Filter customers based on search term
  const filteredCustomers = useMemo(() => {
    if (!customerSearchTerm.trim()) return customers
    const searchLower = customerSearchTerm.toLowerCase()
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(searchLower) ||
      customer.phone.includes(customerSearchTerm) ||
      customer.email.toLowerCase().includes(searchLower)
    )
  }, [customers, customerSearchTerm])

  // Get selected customer details
  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === formData.customerId)
  }, [customers, formData.customerId])

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
      toast.error('Failed to load data. Please try again.')
    }
  }

  const loadOrderData = async (orderId: string) => {
    setLoadingOrder(true)
    try {
      const order = await Storage.getOrder(orderId)

      if (!order) {
        toast.error('Order not found')
        router.push('/orders')
        return
      }

      // Group items by meal type (using menuItem.type)
      const groupedItems: Record<string, any[]> = {}
      order.items.forEach((item: any) => {
        const mealType = item.menuItem?.type?.toLowerCase() || 'other'
        if (!groupedItems[mealType]) {
          groupedItems[mealType] = []
        }
        groupedItems[mealType].push(item)
      })

      const mealTypeAmounts = order.mealTypeAmounts as Record<string, {
        amount: number
        date: string
        services?: string[]
        numberOfMembers?: number
        pricingMethod?: 'manual' | 'plate-based'
        numberOfPlates?: number
        platePrice?: number
        manualAmount?: number
      } | number> | null

      // Build mealTypes array from grouped items
      const mealTypesArray = Object.entries(groupedItems).map(([menuType, items]) => {
        const mealTypeData = mealTypeAmounts?.[menuType]
        const amount = typeof mealTypeData === 'object' && mealTypeData !== null ? mealTypeData.amount : (typeof mealTypeData === 'number' ? mealTypeData : 0)
        const date = typeof mealTypeData === 'object' && mealTypeData !== null ? mealTypeData.date : ''
        const services = typeof mealTypeData === 'object' && mealTypeData !== null && mealTypeData.services ? mealTypeData.services : []
        const numberOfMembers = typeof mealTypeData === 'object' && mealTypeData !== null && mealTypeData.numberOfMembers ? mealTypeData.numberOfMembers.toString() : ''

        const pricingMethod: 'manual' | 'plate-based' =
          typeof mealTypeData === 'object' && mealTypeData !== null && mealTypeData.pricingMethod
            ? mealTypeData.pricingMethod
            : 'manual'

        const numberOfPlates =
          typeof mealTypeData === 'object' && mealTypeData !== null && mealTypeData.numberOfPlates !== undefined
            ? mealTypeData.numberOfPlates.toString()
            : ''
        const platePrice =
          typeof mealTypeData === 'object' && mealTypeData !== null && mealTypeData.platePrice !== undefined
            ? mealTypeData.platePrice.toString()
            : ''
        const manualAmount =
          typeof mealTypeData === 'object' && mealTypeData !== null && mealTypeData.manualAmount !== undefined
            ? mealTypeData.manualAmount.toString()
            : amount.toString()

        return {
          id: generateId(),
          menuType: menuType,
          selectedMenuItems: items.map((item: any) => item.menuItemId),
          pricingMethod,
          numberOfPlates,
          platePrice,
          manualAmount,
          date: date || '',
          services,
          numberOfMembers
        }
      })

      // Parse stalls
      const stallsArray = order.stalls && Array.isArray(order.stalls)
        ? order.stalls.map((stall: any) => ({
          category: stall.category || '',
          description: stall.description || '',
          cost: stall.cost?.toString() || ''
        }))
        : []

      setFormData({
        customerId: order.customerId,
        eventName: (order as any).eventName || '',
        mealTypes: mealTypesArray,
        stalls: stallsArray,
        discount: order.discount?.toString() || '0',
        transportCost: (order as any).transportCost?.toString() || '0',
        totalAmount: order.totalAmount?.toString() || '0',
        advancePaid: '',
        paymentMethod: 'cash',
        paymentNotes: '',
      })

      setCurrentOrderStatus(order.status || 'pending')
      setShowStalls(stallsArray.length > 0)
      setOriginalAdvancePaid(order.advancePaid || 0)
      setOriginalMealTypeAmounts(mealTypeAmounts || {})

      toast.success('Order loaded successfully')
    } catch (error) {
      console.error('Failed to load order:', error)
      toast.error('Failed to load order. Please try again.')
      router.push('/orders')
    } finally {
      setLoadingOrder(false)
    }
  }

  const handleMenuItemToggle = (mealTypeId: string, menuItemId: string) => {
    setFormData(prev => ({
      ...prev,
      mealTypes: prev.mealTypes.map(mealType =>
        mealType.id === mealTypeId
          ? {
            ...mealType,
            selectedMenuItems: mealType.selectedMenuItems.includes(menuItemId)
              ? mealType.selectedMenuItems.filter(id => id !== menuItemId)
              : [...mealType.selectedMenuItems, menuItemId]
          }
          : mealType
      )
    }))
  }

  const handleAddMealType = () => {
    const newId = generateId()
    setFormData(prev => ({
      ...prev,
      mealTypes: [...prev.mealTypes, {
        id: newId,
        menuType: '',
        selectedMenuItems: [],
        pricingMethod: 'manual',
        numberOfPlates: '',
        platePrice: '',
        manualAmount: '',
        date: '',
        services: [],
        numberOfMembers: '',
      }]
    }))
    // New meal type starts expanded
    setCollapsedMealTypes(prev => ({ ...prev, [newId]: false }))
  }

  const handleCollapseMealType = (mealTypeId: string) => {
    setCollapsedMealTypes(prev => ({ ...prev, [mealTypeId]: true }))
    // Automatically add a new meal type after collapsing
    const newId = generateId()
    setFormData(prev => ({
      ...prev,
      mealTypes: [...prev.mealTypes, {
        id: newId,
        menuType: '',
        selectedMenuItems: [],
        pricingMethod: 'manual',
        numberOfPlates: '',
        platePrice: '',
        manualAmount: '',
        date: '',
        services: [],
        numberOfMembers: '',
      }]
    }))
    // New meal type starts expanded
    setCollapsedMealTypes(prev => ({ ...prev, [newId]: false }))
  }

  const handleExpandMealType = (mealTypeId: string) => {
    setCollapsedMealTypes(prev => ({ ...prev, [mealTypeId]: false }))
  }

  const handleRemoveMealType = (mealTypeId: string) => {
    setFormData(prev => ({
      ...prev,
      mealTypes: prev.mealTypes.filter(mealType => mealType.id !== mealTypeId)
    }))
    // Clean up related filters and collapsed state
    setSelectedSubFilter(prev => {
      const newFilters = { ...prev }
      delete newFilters[mealTypeId]
      return newFilters
    })
    setMenuItemSearch(prev => {
      const newSearches = { ...prev }
      delete newSearches[mealTypeId]
      return newSearches
    })
    setCollapsedMealTypes(prev => {
      const newCollapsed = { ...prev }
      delete newCollapsed[mealTypeId]
      return newCollapsed
    })
  }

  const handleUpdateMealType = (mealTypeId: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      mealTypes: prev.mealTypes.map(mealType =>
        mealType.id === mealTypeId ? { ...mealType, [field]: value } : mealType
      )
    }))

    // Reset filters when menu type changes
    if (field === 'menuType') {
      setSelectedSubFilter(prev => ({ ...prev, [mealTypeId]: 'all' }))
      setMenuItemSearch(prev => ({ ...prev, [mealTypeId]: '' }))
      setFormData(prev => ({
        ...prev,
        mealTypes: prev.mealTypes.map(mealType =>
          mealType.id === mealTypeId ? { ...mealType, selectedMenuItems: [] } : mealType
        )
      }))
    }
  }

  const normalizeDate = (value: string | undefined | null) => {
    if (!value) return ''
    return value.split('T')[0]
  }

  const findExistingOrderForCustomerDate = async () => {
    const datesToCheck = formData.mealTypes
      .map(mealType => normalizeDate(mealType.date))
      .filter(Boolean)

    if (!formData.customerId || datesToCheck.length === 0) return null

    const orders = await Storage.getOrders()
    return orders.find((order: any) => {
      if (order.customerId !== formData.customerId) return false
      const existingDates = Object.values(order.mealTypeAmounts || {})
        .map((data: any) => normalizeDate(typeof data === 'object' ? data?.date : ''))
        .filter(Boolean)
      return existingDates.some((date: string) => datesToCheck.includes(date))
    })
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setFormError('')

    // Validate that at least one meal type is added
    if (formData.mealTypes.length === 0) {
      toast.error('Please add at least one meal type')
      return
    }

    // Validate each meal type
    for (const mealType of formData.mealTypes) {
      if (!mealType.menuType) {
        toast.error('Please select menu type for all meal types')
        return
      }
      if (mealType.selectedMenuItems.length === 0) {
        toast.error(`Please select at least one menu item for ${mealType.menuType}`)
        return
      }
      if (mealType.pricingMethod === 'plate-based' && (!mealType.numberOfMembers || !mealType.platePrice)) {
        toast.error(`Please enter number of members and price for ${mealType.menuType}`)
        return
      }
      if (mealType.pricingMethod === 'manual' && !mealType.manualAmount) {
        toast.error(`Please enter amount for ${mealType.menuType}`)
        return
      }
    }

    try {
      if (!isEditMode) {
        const existingOrder = await findExistingOrderForCustomerDate()
        if (existingOrder?.id) {
          toast.error('Order already exists for this customer on the same date. Please update the existing order.')
          router.push(`/orders?edit=${existingOrder.id}`)
          return
        }
      }

      const totalAmount = parseFloat(formData.totalAmount) || 0
      const inputAdvancePaid = parseFloat(formData.advancePaid) || 0
      const effectiveAdvancePaid = isEditMode ? originalAdvancePaid + inputAdvancePaid : inputAdvancePaid
      const remainingAmount = Math.max(0, totalAmount - effectiveAdvancePaid)

      // Calculate amount and store date for each meal type
      const mealTypeAmounts: Record<string, {
        amount: number
        date: string
        services?: string[]
        numberOfMembers?: number
        pricingMethod?: 'manual' | 'plate-based'
        numberOfPlates?: number
        platePrice?: number
        manualAmount?: number
      }> = {}
      formData.mealTypes.forEach(mealType => {
        let amount = 0
        if (mealType.pricingMethod === 'plate-based') {
          const plates = parseFloat(mealType.numberOfPlates) || 0
          const price = parseFloat(mealType.platePrice) || 0
          amount = plates * price
        } else {
          amount = parseFloat(mealType.manualAmount) || 0
        }
        mealTypeAmounts[mealType.menuType] = {
          amount,
          date: mealType.date || '',
          services: mealType.services,
          numberOfMembers: mealType.numberOfMembers ? parseInt(mealType.numberOfMembers, 10) : undefined,
          pricingMethod: mealType.pricingMethod,
          numberOfPlates: mealType.numberOfPlates ? parseFloat(mealType.numberOfPlates) : undefined,
          platePrice: mealType.platePrice ? parseFloat(mealType.platePrice) : undefined,
          manualAmount: mealType.manualAmount ? parseFloat(mealType.manualAmount) : undefined,
        }
      })

      // Combine all menu items from all meal types
      const orderItems: OrderItem[] = formData.mealTypes.flatMap(mealType =>
        mealType.selectedMenuItems.map(menuItemId => ({
          menuItemId,
          quantity: 1,
        }))
      )

      const orderData: any = {
        customerId: formData.customerId,
        eventName: formData.eventName || null,
        items: orderItems,
        totalAmount,
        advancePaid: effectiveAdvancePaid,
        remainingAmount,
        status: isEditMode ? currentOrderStatus : 'pending',
        mealTypeAmounts,
        stalls: showStalls ? formData.stalls : [],
        transportCost: parseFloat(formData.transportCost) || 0,
        discount: parseFloat(formData.discount) || 0,
        paymentMethod: formData.paymentMethod,
        paymentNotes: formData.paymentNotes,
      }

      if (isEditMode && editOrderId) {
        orderData.additionalPayment = inputAdvancePaid
        // Update existing order
        await Storage.updateOrder(editOrderId, orderData)
        toast.success('Order updated successfully!')
        router.push('/orders/history')
      } else {
        // Create new order
        await Storage.saveOrder(orderData)
        resetForm()
        toast.success('Order created successfully!')
      }
    } catch (error) {
      console.error('Failed to create order:', error)
      const message = (error as Error)?.message || 'Failed to create order. Please try again.'
      setFormError(message)
      toast.error(message)
    }
  }

  // Extract subcategory from description (e.g., "FRY (Any One)" -> "FRY")
  const extractSubcategory = (description: string | undefined): string => {
    if (!description) return ''
    // Extract text before "(" - this is the subcategory
    const match = description.match(/^([^(]+)/)
    return match ? match[1].trim() : description.trim()
  }

  // Get unique subcategories for a specific menu type
  const getAvailableSubcategories = (menuType: string) => {
    if (!menuType) return []
    // When lunch or dinner is selected, also include sweets for subcategories
    const categoryItems = menuItems.filter(item => {
      const itemType = item.type.toLowerCase()
      if (menuType.toLowerCase() === 'lunch' || menuType.toLowerCase() === 'dinner') {
        return itemType === 'lunch' || itemType === 'sweets'
      }
      return itemType === menuType.toLowerCase()
    })
    const subcategories = categoryItems
      .map(item => extractSubcategory(item.description))
      .filter(sub => sub !== '')
    // Remove duplicates and sort
    return Array.from(new Set(subcategories)).sort()
  }

  // Calculate total stalls cost from all selected stalls (only if stalls are enabled)
  const totalStallsCost = useMemo(() => {
    if (!showStalls) return 0
    return formData.stalls.reduce((sum, stall) => sum + (parseFloat(stall.cost) || 0), 0)
  }, [formData.stalls, showStalls])

  const additionalAdvancePaid = parseFloat(formData.advancePaid) || 0
  const effectiveAdvancePaid = isEditMode ? originalAdvancePaid + additionalAdvancePaid : additionalAdvancePaid
  const effectiveRemainingAmount = Math.max(0, (parseFloat(formData.totalAmount) || 0) - effectiveAdvancePaid)

  // Calculate total amount: Sum of all meal types + Transport + Stalls - Discount
  useEffect(() => {
    const stallsTotal = showStalls ? totalStallsCost : 0
    const discount = parseFloat(formData.discount) || 0
    const transportCost = parseFloat(formData.transportCost) || 0

    // Calculate total from all meal types (without transport)
    let mealTypesTotal = 0
    formData.mealTypes.forEach(mealType => {
      if (mealType.pricingMethod === 'plate-based') {
        // Use numberOfMembers as the plate count for plate-based pricing
        const members = parseFloat(mealType.numberOfMembers) || 0
        const price = parseFloat(mealType.platePrice) || 0
        mealTypesTotal += members * price
      } else {
        mealTypesTotal += parseFloat(mealType.manualAmount) || 0
      }
    })

    const finalTotal = Math.max(0, mealTypesTotal + transportCost + stallsTotal - discount)
    setFormData(prev => ({
      ...prev,
      totalAmount: finalTotal.toFixed(2)
    }))
  }, [formData.mealTypes, formData.discount, formData.transportCost, totalStallsCost, showStalls])

  const resetForm = () => {
    setFormData({
      customerId: '',
      eventName: '',
      mealTypes: [],
      stalls: [],
      discount: '',
      transportCost: '',
      totalAmount: '',
      advancePaid: '',
      paymentMethod: 'cash',
      paymentNotes: '',
    })
    setOriginalAdvancePaid(0)
    setSelectedSubFilter({})
    setMenuItemSearch({})
    setCollapsedMealTypes({})
    setShowStalls(false)
  }

  const handleAddStall = () => {
    setFormData(prev => ({
      ...prev,
      stalls: [...prev.stalls, { category: '', description: '', cost: '' }]
    }))
  }

  const handleRemoveStall = (index: number) => {
    setFormData(prev => ({
      ...prev,
      stalls: prev.stalls.filter((_, i) => i !== index)
    }))
  }

  const handleUpdateStall = (index: number, field: 'category' | 'description' | 'cost', value: string) => {
    setFormData(prev => ({
      ...prev,
      stalls: prev.stalls.map((stall, i) =>
        i === index ? { ...stall, [field]: value } : stall
      )
    }))
  }

  // Filter menu items for a specific meal type
  const getFilteredMenuItems = (mealTypeId: string, menuType: string) => {
    if (!menuType) return []

    // For lunch or dinner, show ALL active menu items
    let filtered = menuItems.filter((m: any) => {
      const itemType = m.type.toLowerCase()
      if (menuType.toLowerCase() === 'lunch' || menuType.toLowerCase() === 'dinner') {
        return m.isActive !== false // Show all active items
      }
      return itemType === menuType.toLowerCase()
    })

    // Filter by subcategory if selected
    const subFilter = selectedSubFilter[mealTypeId] || 'all'
    if (subFilter !== 'all') {
      filtered = filtered.filter((item: any) => {
        const subcategory = extractSubcategory(item.description)
        return subcategory.toLowerCase() === subFilter.toLowerCase()
      })
    }

    // Filter by search term
    const search = menuItemSearch[mealTypeId] || ''
    if (search.trim()) {
      const searchLower = search.toLowerCase().trim()
      filtered = filtered.filter((item: any) =>
        item.name.toLowerCase().includes(searchLower) ||
        (item.description && item.description.toLowerCase().includes(searchLower))
      )
    }

    return filtered
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {isEditMode ? 'Edit Order' : 'Create New Order'}
          </h1>
          <p className="text-gray-600">
            {isEditMode ? 'Update the order details below' : 'Fill in the form below to create a new catering order'}
          </p>
        </div>
        {isEditMode && (
          <Link
            href={financialLink}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            Go to Financial Tracking
          </Link>
        )}
      </div>

      {/* Order Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer *
              </label>
              <div ref={customerSearchRef} className="relative">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={selectedCustomer ? `${selectedCustomer.name} - ${selectedCustomer.phone}` : customerSearchTerm}
                    onChange={(e) => {
                      setCustomerSearchTerm(e.target.value)
                      setShowCustomerDropdown(true)
                      if (selectedCustomer) {
                        setFormData({ ...formData, customerId: '' })
                      }
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    placeholder="Search customer by name, phone, or email..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  {formData.customerId && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, customerId: '' })
                        setCustomerSearchTerm('')
                        setShowCustomerDropdown(false)
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl"
                    >
                      ×
                    </button>
                  )}
                </div>
                {showCustomerDropdown && filteredCustomers.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {filteredCustomers.map((customer: Customer) => (
                      <div
                        key={customer.id}
                        onClick={() => {
                          setFormData({ ...formData, customerId: customer.id })
                          setCustomerSearchTerm('')
                          setShowCustomerDropdown(false)
                        }}
                        className={`px-4 py-2 hover:bg-primary-50 cursor-pointer ${formData.customerId === customer.id ? 'bg-primary-100' : ''
                          }`}
                      >
                        <div className="font-medium text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-500">{customer.phone}</div>
                        {customer.email && (
                          <div className="text-xs text-gray-400">{customer.email}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {showCustomerDropdown && customerSearchTerm && filteredCustomers.length === 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
                    No customers found
                  </div>
                )}
              </div>
              {formData.customerId && selectedCustomer && (
                <input
                  type="hidden"
                  value={formData.customerId}
                  required
                />
              )}
            </div>

            {/* Event Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Name
              </label>
              <input
                type="text"
                value={formData.eventName}
                onChange={(e: any) => setFormData({ ...formData, eventName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter event name (e.g., Wedding, Birthday, etc.)"
              />
            </div>

            {/* Meal Types Section */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Meal Types</h3>
                <button
                  type="button"
                  onClick={handleAddMealType}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
                >
                  <FaPlus /> Add Meal Type
                </button>
              </div>

              {formData.mealTypes.length === 0 ? (
                <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                  No meal types added. Click "Add Meal Type" to add one.
                </p>
              ) : (
                <div className="space-y-6">
                  {formData.mealTypes.map((mealType, mealTypeIndex) => {
                    const availableSubcategories = getAvailableSubcategories(mealType.menuType)
                    const filteredMenuItems = getFilteredMenuItems(mealType.id, mealType.menuType)
                    const subFilter = selectedSubFilter[mealType.id] || 'all'
                    const search = menuItemSearch[mealType.id] || ''
                    const isCollapsed = collapsedMealTypes[mealType.id] || false

                    return (
                      <div key={mealType.id} className="border border-gray-300 rounded-lg bg-gray-50">
                        <div className="flex justify-between items-center p-4 border-b border-gray-300">
                          <h4 className="text-md font-semibold text-gray-800">
                            Meal Type #{mealTypeIndex + 1} {mealType.menuType && `- ${mealType.menuType.charAt(0).toUpperCase() + mealType.menuType.slice(1)}`}
                          </h4>
                          <div className="flex items-center gap-2">
                            {!isCollapsed && (
                              <button
                                type="button"
                                onClick={() => handleCollapseMealType(mealType.id)}
                                className="px-4 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                              >
                                OK
                              </button>
                            )}
                            {isCollapsed && (
                              <button
                                type="button"
                                onClick={() => handleExpandMealType(mealType.id)}
                                className="px-4 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                              >
                                Edit
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveMealType(mealType.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        {!isCollapsed && (
                          <div className="p-6 space-y-4">
                            {/* Menu Type Selector and Date */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Menu Type *
                                </label>
                                <select
                                  required
                                  value={mealType.menuType}
                                  onChange={(e: any) => handleUpdateMealType(mealType.id, 'menuType', e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                  <option value="">Select Menu Type</option>
                                  <option value="breakfast">Breakfast</option>
                                  <option value="lunch">Lunch</option>
                                  <option value="dinner">Dinner</option>
                                  <option value="snacks">Snacks</option>
                                  <option value="sweets">Sweets</option>
                                  <option value="saree">Saree</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Date *
                                </label>
                                <input
                                  type="date"
                                  required
                                  value={mealType.date}
                                  onChange={(e: any) => handleUpdateMealType(mealType.id, 'date', e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                              </div>
                            </div>

                            {/* Services and Number of Members */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Services */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Services
                                </label>
                                <div className="space-y-2">
                                  {['buffet', 'vaddana', 'handover'].map((service) => (
                                    <label key={service} className="flex items-center p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={mealType.services.includes(service)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            handleUpdateMealType(mealType.id, 'services', [...mealType.services, service])
                                          } else {
                                            handleUpdateMealType(mealType.id, 'services', mealType.services.filter((s: string) => s !== service))
                                          }
                                        }}
                                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mr-3"
                                      />
                                      <span className="text-sm font-medium text-gray-900 capitalize">
                                        {service.charAt(0).toUpperCase() + service.slice(1)}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>

                              {/* Number of Members */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Number of Members
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={mealType.numberOfMembers}
                                  onChange={(e: any) => handleUpdateMealType(mealType.id, 'numberOfMembers', e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                  placeholder="Enter number of members/guests"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Number of guests for this meal type
                                </p>
                              </div>
                            </div>

                            {/* Menu Items Selection */}
                            {mealType.menuType && (
                              <div>
                                {/* Subcategory Filter Buttons */}
                                {availableSubcategories.length > 0 && (
                                  <div className="mb-4">
                                    <div className="mb-2">
                                      <span className="text-sm font-medium text-gray-700">
                                        {mealType.menuType.charAt(0).toUpperCase() + mealType.menuType.slice(1)} Categories:
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedSubFilter(prev => ({ ...prev, [mealType.id]: 'all' }))}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${subFilter === 'all'
                                          ? 'bg-primary-500 text-white'
                                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                          }`}
                                      >
                                        All {mealType.menuType}
                                      </button>
                                      {availableSubcategories.map((subcategory: string) => (
                                        <button
                                          key={subcategory}
                                          type="button"
                                          onClick={() => setSelectedSubFilter(prev => ({ ...prev, [mealType.id]: subcategory }))}
                                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${subFilter === subcategory
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                          {subcategory}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Search Filter */}
                                <div className="mb-3">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Menu Items * (Select items by checking the boxes)
                                  </label>
                                  <div className="relative">
                                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                      type="text"
                                      value={search}
                                      onChange={(e: any) => setMenuItemSearch(prev => ({ ...prev, [mealType.id]: e.target.value }))}
                                      placeholder="Search menu items by name or description..."
                                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                  </div>
                                </div>

                                {/* Menu Items List */}
                                <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {filteredMenuItems.length === 0 ? (
                                      <p className="col-span-full text-gray-500 text-center py-8">
                                        {search.trim()
                                          ? `No menu items found matching "${search}"`
                                          : 'No menu items found for this type'}
                                      </p>
                                    ) : (
                                      filteredMenuItems.map((menuItem: any) => (
                                        <label
                                          key={menuItem.id}
                                          className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={mealType.selectedMenuItems.includes(menuItem.id)}
                                            onChange={() => handleMenuItemToggle(mealType.id, menuItem.id)}
                                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mr-3"
                                          />
                                          <div className="flex-1">
                                            <span className="text-sm font-medium text-gray-900">{menuItem.name}</span>
                                            {menuItem.description && (
                                              <p className="text-xs text-gray-500 mt-1">{menuItem.description}</p>
                                            )}
                                          </div>
                                        </label>
                                      ))
                                    )}
                                  </div>
                                </div>
                                {mealType.selectedMenuItems.length > 0 && (
                                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm font-semibold text-blue-800 mb-2">
                                      Selected Items ({mealType.selectedMenuItems.length}):
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {mealType.selectedMenuItems.map((itemId: string) => {
                                        const item = menuItems.find((m: any) => m.id === itemId)
                                        return item ? (
                                          <span
                                            key={itemId}
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-md"
                                          >
                                            {item.name}
                                          </span>
                                        ) : null
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Pricing Section for this Meal Type */}
                            <div className="border-t border-gray-200 pt-4">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">Pricing for {mealType.menuType || 'this meal type'}</h4>

                              <div className="mb-4 flex items-center gap-3">
                                <label className="text-sm font-medium text-gray-700">
                                  Use Plate-based Calculation
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateMealType(mealType.id, 'pricingMethod', mealType.pricingMethod === 'manual' ? 'plate-based' : 'manual')}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${mealType.pricingMethod === 'plate-based' ? 'bg-primary-500' : 'bg-gray-300'
                                    }`}
                                >
                                  <span className="sr-only">Toggle Plate-based Calculation</span>
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${mealType.pricingMethod === 'plate-based' ? 'translate-x-6' : 'translate-x-1'
                                      }`}
                                  />
                                </button>
                                <span className="text-sm text-gray-600">
                                  {mealType.pricingMethod === 'plate-based' ? 'Enabled' : 'Disabled'}
                                </span>
                              </div>

                              {mealType.pricingMethod === 'plate-based' ? (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Per Plate Amount *
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={mealType.platePrice}
                                    onChange={(e: any) => handleUpdateMealType(mealType.id, 'platePrice', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="0.00"
                                  />
                                  {mealType.numberOfMembers && parseFloat(mealType.platePrice) > 0 && (
                                    <p className="text-sm text-green-600 mt-2 font-medium">
                                      Total: {mealType.numberOfMembers} members × ₹{parseFloat(mealType.platePrice).toFixed(2)} = ₹{(parseFloat(mealType.numberOfMembers) * parseFloat(mealType.platePrice)).toFixed(2)}
                                    </p>
                                  )}
                                  {!mealType.numberOfMembers && (
                                    <p className="text-xs text-orange-500 mt-1">
                                      ⚠ Enter Number of Members above to calculate total
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Manual Amount *
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={mealType.manualAmount}
                                    onChange={(e: any) => handleUpdateMealType(mealType.id, 'manualAmount', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="0.00"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {isEditMode && (
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="text-sm font-bold text-orange-800 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  Member Change Summary
                </h4>
                <div className="space-y-2">
                  {formData.mealTypes.map(mt => {
                    const original = originalMealTypeAmounts[mt.menuType]
                    const oldMembers = original?.numberOfMembers || 0
                    const newMembers = parseInt(mt.numberOfMembers) || 0
                    const diff = newMembers - oldMembers

                    if (diff === 0) return null

                    return (
                      <div key={mt.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700 capitalize font-medium">{mt.menuType}:</span>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-500">{oldMembers} → {newMembers}</span>
                          <span className={`font-bold px-2 py-0.5 rounded text-xs ${diff > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {diff > 0 ? '+' : ''}{diff} Members
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  {!formData.mealTypes.some(mt => (parseInt(mt.numberOfMembers) || 0) !== (originalMealTypeAmounts[mt.menuType]?.numberOfMembers || 0)) && (
                    <p className="text-xs text-gray-500 italic">No member changes detected yet.</p>
                  )}
                </div>
              </div>
            )}

            {!isEditMode && (
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Charges</h3>

                <div className="mb-4 border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Stalls (Separate from plate calculation)
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowStalls(!showStalls)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${showStalls ? 'bg-primary-500' : 'bg-gray-300'
                          }`}
                      >
                        <span className="sr-only">Toggle Stalls</span>
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showStalls ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                      </button>
                      <span className="text-sm text-gray-500">
                        {showStalls ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    {showStalls && (
                      <button
                        type="button"
                        onClick={handleAddStall}
                        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm"
                      >
                        + Add Stall
                      </button>
                    )}
                  </div>

                  {!showStalls ? (
                    <p className="text-gray-500 text-sm text-center py-4 bg-gray-50 rounded-lg">
                      Stalls are disabled. Toggle above to enable.
                    </p>
                  ) : formData.stalls.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4 bg-gray-50 rounded-lg">
                      No stalls added. Click "Add Stall" to add one.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {formData.stalls.map((stall, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-semibold text-gray-700">Stall #{index + 1}</h4>
                            <button
                              type="button"
                              onClick={() => handleRemoveStall(index)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Stall Category *
                              </label>
                              <select
                                value={stall.category}
                                onChange={(e: any) => handleUpdateStall(index, 'category', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              >
                                <option value="">Select Stall Category</option>
                                <option value="Sweet Stall">Sweet Stall</option>
                                <option value="Pan Stall">Pan Stall</option>
                                <option value="LED Counter">LED Counter</option>
                                <option value="Tiffin Counter">Tiffin Counter</option>
                                <option value="Chat Counter">Chat Counter</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description/Tag
                              </label>
                              <textarea
                                value={stall.description}
                                onChange={(e: any) => handleUpdateStall(index, 'description', e.target.value)}
                                rows={2}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Enter description or tag for this stall..."
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cost
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={stall.cost}
                                onChange={(e: any) => handleUpdateStall(index, 'cost', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      {formData.stalls.length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Total Stalls Cost:</span>
                            <span className="text-lg font-bold text-blue-600">{formatCurrency(totalStallsCost)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transport Cost
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.transportCost}
                      onChange={(e: any) => setFormData({ ...formData, transportCost: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.discount}
                      onChange={(e: any) => setFormData({ ...formData, discount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isEditMode ? 'Additional Advance Paid' : 'Advance Paid'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.advancePaid}
                      onChange={(e: any) => setFormData({ ...formData, advancePaid: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="0.00"
                    />
                    {isEditMode && (
                      <p className="mt-1 text-xs text-gray-500">
                        Current advance: {formatCurrency(originalAdvancePaid)} · New total: {formatCurrency(effectiveAdvancePaid)} · Remaining: {formatCurrency(effectiveRemainingAmount)}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e: any) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="card">Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Notes
                  </label>
                  <input
                    type="text"
                    value={formData.paymentNotes}
                    onChange={(e: any) => setFormData({ ...formData, paymentNotes: e.target.value })}
                    placeholder="e.g., Transaction ID, Reference, etc."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div className="mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Amount * (Auto-calculated: Meal Types + Transport + Stalls - Discount)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.totalAmount}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            )}

            {isEditMode && (
              <div className="border-t border-gray-200 pt-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700 font-medium">
                    Financial updates (payments, discounts, transport, stalls) are handled in the Financial Tracking page.
                  </p>
                  <div className="mt-3">
                    <Link
                      href={financialLink}
                      className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Open Financial Tracking
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
              <FormError message={formError} className="mr-auto self-center" />
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Clear Form
              </button>
              <button
                type="submit"
                disabled={formData.mealTypes.length === 0 || formData.mealTypes.some(mt => mt.selectedMenuItems.length === 0)}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isEditMode ? 'Update Order' : 'Create Order'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Link to Orders History */}
      <div className="mt-8 text-center">
        <Link
          href="/orders/history"
          className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          View Orders History
        </Link>
      </div>
    </div>
  )
}
