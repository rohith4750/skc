'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { Storage } from '@/lib/storage-api'
import { generateId, formatCurrency, formatDateTime } from '@/lib/utils'
import { Customer, MenuItem, OrderItem, Supervisor } from '@/types'
import { FaSearch, FaPlus } from 'react-icons/fa'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function OrdersPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const editOrderId = searchParams.get('edit')
  const isEditMode = !!editOrderId

  const [customers, setCustomers] = useState<Customer[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [supervisors, setSupervisors] = useState<Supervisor[]>([])
  const [selectedSubFilter, setSelectedSubFilter] = useState<Record<string, string>>({})
  const [menuItemSearch, setMenuItemSearch] = useState<Record<string, string>>({})
  const [showStalls, setShowStalls] = useState<boolean>(false)
  const [loadingOrder, setLoadingOrder] = useState(false)
  const [currentOrderSupervisorId, setCurrentOrderSupervisorId] = useState<string>('')
  const [currentOrderStatus, setCurrentOrderStatus] = useState<string>('pending')
  
  const [formData, setFormData] = useState({
    customerId: '',
    mealTypes: [] as Array<{
      id: string
      menuType: string
      selectedMenuItems: string[]
      pricingMethod: 'manual' | 'plate-based'
      numberOfPlates: string
      platePrice: string
      transportCost: string
      manualAmount: string
      date: string
    }>,
    stalls: [] as Array<{ category: string; description: string; cost: string }>,
    discount: '',
    totalAmount: '',
    advancePaid: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (isEditMode && editOrderId && customers.length > 0 && menuItems.length > 0) {
      loadOrderData(editOrderId)
    }
  }, [isEditMode, editOrderId, customers.length, menuItems.length])

  const loadData = async () => {
    try {
      const [allCustomers, allMenuItems, allSupervisors] = await Promise.all([
        Storage.getCustomers(),
        Storage.getMenuItems(),
        Storage.getSupervisors(),
      ])

      setCustomers(allCustomers)
      setMenuItems(allMenuItems.filter((item: any) => item.isActive))
      setSupervisors(allSupervisors)
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

      const mealTypeAmounts = order.mealTypeAmounts as Record<string, { amount: number; date: string } | number> | null

      // Build mealTypes array from grouped items
      const mealTypesArray = Object.entries(groupedItems).map(([menuType, items]) => {
        const mealTypeData = mealTypeAmounts?.[menuType]
        const amount = typeof mealTypeData === 'object' && mealTypeData !== null ? mealTypeData.amount : (typeof mealTypeData === 'number' ? mealTypeData : 0)
        const date = typeof mealTypeData === 'object' && mealTypeData !== null ? mealTypeData.date : ''

        // Determine pricing method (assume manual if amount exists, otherwise plate-based)
        const pricingMethod: 'manual' | 'plate-based' = 'manual'
        const manualAmount = amount.toString()
        
        return {
          id: generateId(),
          menuType: menuType,
          selectedMenuItems: items.map((item: any) => item.menuItemId),
          pricingMethod,
          numberOfPlates: '',
          platePrice: '',
          transportCost: '',
          manualAmount,
          date: date || ''
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
        mealTypes: mealTypesArray,
        stalls: stallsArray,
        discount: order.discount?.toString() || '0',
        totalAmount: order.totalAmount?.toString() || '0',
        advancePaid: order.advancePaid?.toString() || '0',
      })

      setCurrentOrderSupervisorId(order.supervisorId || '')
      setCurrentOrderStatus(order.status || 'pending')
      setShowStalls(stallsArray.length > 0)
      
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
    setFormData(prev => ({
      ...prev,
      mealTypes: [...prev.mealTypes, {
        id: generateId(),
        menuType: '',
        selectedMenuItems: [],
        pricingMethod: 'manual',
        numberOfPlates: '',
        platePrice: '',
        transportCost: '',
        manualAmount: '',
        date: '',
      }]
    }))
  }

  const handleRemoveMealType = (mealTypeId: string) => {
    setFormData(prev => ({
      ...prev,
      mealTypes: prev.mealTypes.filter(mealType => mealType.id !== mealTypeId)
    }))
    // Clean up related filters
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

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    
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
      if (mealType.pricingMethod === 'plate-based' && (!mealType.numberOfPlates || !mealType.platePrice)) {
        toast.error(`Please enter plates and price for ${mealType.menuType}`)
        return
      }
      if (mealType.pricingMethod === 'manual' && !mealType.manualAmount) {
        toast.error(`Please enter amount for ${mealType.menuType}`)
        return
      }
    }

    try {
      const totalAmount = parseFloat(formData.totalAmount) || 0
      const advancePaid = parseFloat(formData.advancePaid) || 0
      const remainingAmount = totalAmount - advancePaid

      // Calculate amount and store date for each meal type
      const mealTypeAmounts: Record<string, { amount: number; date: string }> = {}
      formData.mealTypes.forEach(mealType => {
        let amount = 0
        if (mealType.pricingMethod === 'plate-based') {
          const plates = parseFloat(mealType.numberOfPlates) || 0
          const price = parseFloat(mealType.platePrice) || 0
          const transport = parseFloat(mealType.transportCost) || 0
          amount = (plates * price) + transport
        } else {
          amount = parseFloat(mealType.manualAmount) || 0
        }
        mealTypeAmounts[mealType.menuType] = {
          amount,
          date: mealType.date || ''
        }
      })

      // Combine all menu items from all meal types
      const orderItems: OrderItem[] = formData.mealTypes.flatMap(mealType =>
        mealType.selectedMenuItems.map(menuItemId => ({
          menuItemId,
          quantity: 1,
        }))
      )

      // Use first supervisor as default for new orders (since schema requires supervisorId)
      // For edit mode, use the existing supervisorId
      let supervisorId = ''
      if (isEditMode) {
        supervisorId = currentOrderSupervisorId || (supervisors.length > 0 ? supervisors[0].id : '')
      } else {
        supervisorId = supervisors.length > 0 ? supervisors[0].id : ''
        if (!supervisorId) {
          toast.error('Please add at least one supervisor before creating orders')
          return
        }
      }

      const orderData = {
        customerId: formData.customerId,
        items: orderItems,
        totalAmount,
        advancePaid,
        remainingAmount,
        status: isEditMode ? currentOrderStatus : 'pending',
        supervisorId,
        mealTypeAmounts,
        stalls: showStalls ? formData.stalls : [],
        discount: parseFloat(formData.discount) || 0,
      }

      if (isEditMode && editOrderId) {
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
      toast.error('Failed to create order. Please try again.')
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
    // When lunch is selected, also include sweets for subcategories
    const categoryItems = menuItems.filter(item => {
      const itemType = item.type.toLowerCase()
      if (menuType.toLowerCase() === 'lunch') {
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

  // Calculate total amount: Sum of all meal types + Stalls - Discount
  useEffect(() => {
    const stallsTotal = showStalls ? totalStallsCost : 0
    const discount = parseFloat(formData.discount) || 0
    
    // Calculate total from all meal types
    let mealTypesTotal = 0
    formData.mealTypes.forEach(mealType => {
      if (mealType.pricingMethod === 'plate-based') {
        const plates = parseFloat(mealType.numberOfPlates) || 0
        const price = parseFloat(mealType.platePrice) || 0
        const transport = parseFloat(mealType.transportCost) || 0
        mealTypesTotal += (plates * price) + transport
      } else {
        mealTypesTotal += parseFloat(mealType.manualAmount) || 0
      }
    })
    
    const finalTotal = Math.max(0, mealTypesTotal + stallsTotal - discount)
    setFormData(prev => ({
      ...prev,
      totalAmount: finalTotal.toFixed(2)
    }))
  }, [formData.mealTypes, formData.discount, totalStallsCost, showStalls])

  const resetForm = () => {
    setFormData({
      customerId: '',
      mealTypes: [],
      stalls: [],
      discount: '',
      totalAmount: '',
      advancePaid: '',
    })
    setSelectedSubFilter({})
    setMenuItemSearch({})
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
    
    // When lunch is selected, also include sweets
    let filtered = menuItems.filter((m: any) => {
      const itemType = m.type.toLowerCase()
      if (menuType.toLowerCase() === 'lunch') {
        return itemType === 'lunch' || itemType === 'sweets'
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

  if (loadingOrder) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading order data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {isEditMode ? 'Edit Order' : 'Create New Order'}
        </h1>
        <p className="text-gray-600">
          {isEditMode ? 'Update the order details below' : 'Fill in the form below to create a new catering order'}
        </p>
      </div>

      {/* Order Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer *
              </label>
              <select
                required
                value={formData.customerId}
                onChange={(e: any) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Customer</option>
                {customers.map((customer: any) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </option>
                ))}
              </select>
            </div>

            {/* Meal Types Section */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Meal Types</h3>
                <button
                  type="button"
                  onClick={handleAddMealType}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
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

                    return (
                      <div key={mealType.id} className="border border-gray-300 rounded-lg p-6 bg-gray-50">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-md font-semibold text-gray-800">
                            Meal Type #{mealTypeIndex + 1}
                          </h4>
                          <button
                            type="button"
                            onClick={() => handleRemoveMealType(mealType.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="space-y-4">
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">Select Menu Type</option>
                                <option value="breakfast">Breakfast</option>
                                <option value="lunch">Lunch</option>
                                <option value="dinner">Dinner</option>
                                <option value="snacks">Snacks</option>
                                <option value="sweets">Sweets</option>
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
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
                                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        subFilter === 'all'
                                          ? 'bg-green-600 text-white'
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
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                          subFilter === subcategory
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
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
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
                                <p className="text-sm text-gray-600 mt-2">
                                  {mealType.selectedMenuItems.length} item(s) selected
                                </p>
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
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                  mealType.pricingMethod === 'plate-based' ? 'bg-blue-600' : 'bg-gray-300'
                                }`}
                              >
                                <span className="sr-only">Toggle Plate-based Calculation</span>
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    mealType.pricingMethod === 'plate-based' ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                              <span className="text-sm text-gray-600">
                                {mealType.pricingMethod === 'plate-based' ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>

                            {mealType.pricingMethod === 'plate-based' ? (
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Number of Plates *
                                  </label>
                                  <input
                                    type="number"
                                    step="1"
                                    min="1"
                                    required
                                    value={mealType.numberOfPlates}
                                    onChange={(e: any) => handleUpdateMealType(mealType.id, 'numberOfPlates', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Price Per Plate *
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={mealType.platePrice}
                                    onChange={(e: any) => handleUpdateMealType(mealType.id, 'platePrice', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0.00"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Transport Cost
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={mealType.transportCost}
                                    onChange={(e: any) => handleUpdateMealType(mealType.id, 'transportCost', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0.00"
                                  />
                                </div>
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
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="0.00"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Stalls, Discount, Advance Paid, Total Amount Section */}
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
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        showStalls ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span className="sr-only">Toggle Stalls</span>
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          showStalls ? 'translate-x-6' : 'translate-x-1'
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
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
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
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    Discount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discount}
                    onChange={(e: any) => setFormData({ ...formData, discount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Advance Paid
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.advancePaid}
                    onChange={(e: any) => setFormData({ ...formData, advancePaid: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Amount * (Auto-calculated: Sum of all meal types + Stalls - Discount)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.totalAmount}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
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
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
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
