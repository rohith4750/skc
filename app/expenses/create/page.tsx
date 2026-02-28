"use client";
import { useEffect, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Expense, Order, BulkAllocation } from '@/types'
import { FaArrowLeft, FaLayerGroup, FaChevronDown, FaChevronUp, FaTimes, FaInfoCircle } from 'react-icons/fa'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { formatCurrency, getLocalISODate , getOrderDate} from '@/lib/utils'
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

export default function CreateExpensePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const expenseId = searchParams?.get('id') ?? null

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
  const [filterMonth, setFilterMonth] = useState<string>(new Date().getMonth().toString()) // Default to current month
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString())
  const [filterDate, setFilterDate] = useState<string>('') // New specific date filter
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
    mealType: '', // Add mealType to state
    selectedMealTypes: [] as Array<{ id: string; label: string; plates: string }>,
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

      // Handle Orders
      if (ordersResult.status === 'fulfilled' && ordersResult.value.ok) {
        setOrders(await ordersResult.value.json())
      } else {
        console.error('Failed to fetch orders:', ordersResult.status === 'fulfilled' ? ordersResult.value.statusText : ordersResult.reason)
        toast.error('Failed to load orders')
      }

      // Handle Workforce
      if (workforceResult.status === 'fulfilled' && workforceResult.value.ok) {
        const wf = await workforceResult.value.json()
        setWorkforce((wf.workforce || []).filter((member: any) => member.isActive))
      } else {
        console.error('Failed to fetch workforce:', workforceResult.status === 'fulfilled' ? workforceResult.value.statusText : (workforceResult as any).reason)
        // Don't fail completely if workforce fails
      }

      // Handle Expenses
      if (expensesResult.status === 'fulfilled' && expensesResult.value.ok) {
        setExistingExpenses(await expensesResult.value.json())
      } else {
        console.error('Failed to fetch expenses:', expensesResult.status === 'fulfilled' ? expensesResult.value.statusText : (expensesResult as any).reason)
      }

      // Handle Single Expense (Edit Mode)
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
              label: mp.mealType, // We might not have the original label, fallback to ID
              plates: mp.plates.toString()
            })) : [],
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

  // Get unique custom categories (categories not in EXPENSE_CATEGORIES)
  const customCategories = useMemo(() => {
    const categories = new Set<string>()
    // Include workforce members with role "other" as custom category options
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

  // Get available meal types for the selected orders
  const availableMealTypes = useMemo(() => {
    if (selectedOrderIds.length === 0) return []

    const uniqueMeals = new Map<string, { id: string; label: string }>()

    selectedOrderIds.forEach(orderId => {
      const order = orders.find(o => o.id === orderId)
      if (order && order.mealTypeAmounts) {
        Object.entries(order.mealTypeAmounts).forEach(([id, data]) => {
          let label = id // fallback to ID if no name
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

  // Calculate total amount based on category and calculation method
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
      return (dressedBoys * dressedBoyAmount) + (nonDressedBoys * nonDressedBoyAmount)
    } else {
      return parseFloat(formData.amount) || 0
    }
  }, [formData])

  // Get order name for display
  const getOrderDisplayName = (order: Order) => {
    const customerName = order.customer?.name || 'Unknown'
    const eventName = order.eventName || 'No Event Name'
    const date = new Date(getOrderDate(order)).toLocaleDateString()
    return `${customerName} - ${eventName} (${date})`
  }

  // Filtered orders based on month, year and search
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Date filtering
      const eventDate = new Date(getOrderDate(order))

      // If specific date is provided, ignore month/year
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

      // Search filtering
      if (!orderSearch.trim()) return true

      const searchLower = orderSearch.toLowerCase()
      const customerMatch = order.customer?.name?.toLowerCase().includes(searchLower)
      const eventMatch = order.eventName?.toLowerCase().includes(searchLower)
      const phoneMatch = order.customer?.phone?.includes(orderSearch)

      return customerMatch || eventMatch || phoneMatch
    })
  }, [orders, filterMonth, filterYear, filterDate, orderSearch])

  // Get plates/members count for an order (for by-plates allocation)
  const getOrderPlates = (order: Order): number => {
    if (order.numberOfMembers) return order.numberOfMembers
    // Try to get from mealTypeAmounts
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
    return 100 // Default if not found
  }

  // Recalculate allocations when method or selected orders change
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
      // Adjust last allocation for rounding
      const sum = newAllocations.reduce((s, a) => s + a.amount, 0)
      if (newAllocations.length > 0 && Math.abs(sum - totalAmount) > 0.01) {
        newAllocations[newAllocations.length - 1].amount += totalAmount - sum
      }
      setBulkAllocations(newAllocations)
    } else if (method === 'by-plates') {
      const ordersWithPlates = selectedOrders.map(order => ({
        order,
        plates: getOrderPlates(order)
      }))
      const totalPlates = ordersWithPlates.reduce((sum, o) => sum + o.plates, 0)

      const newAllocations: BulkAllocation[] = ordersWithPlates.map(({ order, plates }) => {
        const percentage = (plates / totalPlates) * 100
        return {
          orderId: order.id,
          orderName: getOrderDisplayName(order),
          amount: Math.round((totalAmount * plates / totalPlates) * 100) / 100,
          percentage: percentage,
          plates: plates,
        }
      })
      // Adjust last allocation for rounding
      const sum = newAllocations.reduce((s, a) => s + a.amount, 0)
      if (newAllocations.length > 0 && Math.abs(sum - totalAmount) > 0.01) {
        newAllocations[newAllocations.length - 1].amount += totalAmount - sum
      }
      setBulkAllocations(newAllocations)
    } else if (method === 'by-percentage') {
      // For percentage, keep existing percentages if available, otherwise equal
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
      // Manual - keep existing amounts if available
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

  // Handle order selection for bulk expense
  const handleOrderSelection = (orderId: string, isSelected: boolean) => {
    const newSelectedIds = isSelected
      ? [...selectedOrderIds, orderId]
      : selectedOrderIds.filter(id => id !== orderId)
    setSelectedOrderIds(newSelectedIds)
    recalculateAllocations(allocationMethod, newSelectedIds, calculatedAmount)
  }

  // Handle allocation method change
  const handleAllocationMethodChange = (method: 'equal' | 'manual' | 'by-plates' | 'by-percentage') => {
    setAllocationMethod(method)
    recalculateAllocations(method, selectedOrderIds, calculatedAmount)
  }

  // Handle manual allocation amount change
  const handleAllocationAmountChange = (orderId: string, amount: number) => {
    setBulkAllocations(prev => prev.map(a =>
      a.orderId === orderId ? { ...a, amount } : a
    ))
  }

  // Handle percentage change
  const handlePercentageChange = (orderId: string, percentage: number) => {
    setBulkAllocations(prev => prev.map(a =>
      a.orderId === orderId
        ? { ...a, percentage, amount: Math.round((calculatedAmount * percentage / 100) * 100) / 100 }
        : a
    ))
  }

  // Calculate total allocated
  const totalAllocated = useMemo(() => {
    return bulkAllocations.reduce((sum, a) => sum + (a.amount || 0), 0)
  }, [bulkAllocations])

  // Allocation difference (should be 0 when properly allocated)
  const allocationDifference = useMemo(() => {
    return Math.round((calculatedAmount - totalAllocated) * 100) / 100
  }, [calculatedAmount, totalAllocated])

  // Recalculate allocations when total amount changes
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
        // Find default plates for this meal type across all selected orders
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

  // Autofill plates from order when category is 'chef'
  useEffect(() => {
    // console.log('Autofill check:', { category: formData.category, orderId: selectedOrderIds[0], mealType: formData.mealType, isBulkExpense })

    if (formData.category === 'chef' && selectedOrderIds.length > 0 && !isBulkExpense && selectedOrderIds.length === 1) {
      // NOTE: For multi-event (bulk), handleMealTypeToggle handles the plate summation. 
      // This autofill is mainly left intact for single-event total plates fallback.
      const selectedOrder = orders.find(o => o.id === selectedOrderIds[0])
      // console.log('Selected Order:', selectedOrder)

      if (selectedOrder) {
        let plates = 0

        // If a specific meal type is selected, try to get plates for that meal
        if (formData.mealType && selectedOrder.mealTypeAmounts) {
          const mealData = (selectedOrder.mealTypeAmounts as any)[formData.mealType]
          if (mealData) {
            if (typeof mealData === 'object') {
              plates = mealData.numberOfPlates || mealData.numberOfMembers || 0
            } else if (typeof mealData === 'number') {
              // If it's just a number, it's likely the amount, not plates. 
            }
          }
        }
        // If no meal type selected (or explicitly 'Total'), fallback to total plates logic
        else {
          plates = getOrderPlates(selectedOrder)
        }

        // console.log('Calculated plates:', plates)
        if (plates > 0) {
          // console.log('Setting plates to:', plates)
          setFormData(prev => ({
            ...prev,
            plates: plates.toString()
          }))
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
      setFormError('Please fill in all required fields and ensure amount is greater than 0')
      setSaving(false)
      return
    }

    // Validate bulk expense allocation
    if (isBulkExpense) {
      if (selectedOrderIds.length < 2) {
        toast.error('Bulk expense must cover at least 2 events')
        setFormError('Bulk expense must cover at least 2 events')
        setSaving(false)
        return
      }
      if (Math.abs(allocationDifference) > 0.01) {
        toast.error(`Allocation amounts must equal total expense. Difference: ${formatCurrency(allocationDifference)}`)
        setFormError(`Allocation amounts must equal total expense. Difference: ${formatCurrency(allocationDifference)}`)
        setSaving(false)
        return
      }
    }

    // Validate category-specific fields
    if (formData.category === 'chef' && formData.calculationMethod === 'plate-wise') {
      if (formData.selectedMealTypes.length > 0) {
        if (formData.selectedMealTypes.some(mt => !mt.plates) || !formData.amount) {
          toast.error('Please enter number of plates for all selected meal types and amount per plate')
          setFormError('Please enter number of plates for all selected meal types and amount per plate')
          setSaving(false)
          return
        }
      } else {
        if (!formData.plates || !formData.amount) {
          toast.error('Please enter number of plates and amount per plate')
          setFormError('Please enter number of plates and amount per plate')
          setSaving(false)
          return
        }
      }
    }
    if (formData.category === 'labours') {
      if (!formData.numberOfLabours || !formData.labourAmount || !formData.eventDate) {
        toast.error('Please enter number of labours, amount per labour, and event date')
        setFormError('Please enter number of labours, amount per labour, and event date')
        setSaving(false)
        return
      }
    }
    if (formData.category === 'boys') {
      if (formData.dressedBoys === '' || formData.dressedBoyAmount === '' || formData.nonDressedBoys === '' || formData.nonDressedBoyAmount === '' || !formData.eventDate) {
        toast.error('Please enter details for all boys (use 0 if none) and the event date')
        setFormError('Please enter details for all boys (use 0 if none) and the event date')
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
            if (formData.mealType) {
              calculationDetails.mealType = formData.mealType
            }
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
      }

      const paidAmount = formData.paidAmount ? parseFloat(formData.paidAmount) : 0

      // Validate custom category name if "other" is selected
      if (formData.category === 'other') {
        if (!formData.customCategoryName || !formData.customCategoryName.trim()) {
          toast.error('Please enter or select a custom category name')
          setSaving(false)
          return
        }
      }

      // Use custom category name if "other" is selected and custom name is provided
      const finalCategory = formData.category === 'other' && formData.customCategoryName.trim()
        ? formData.customCategoryName.trim()
        : formData.category

      const expenseData: any = {
        orderId: isBulkExpense ? null : (selectedOrderIds[0] || null),
        category: finalCategory,
        amount: calculatedAmount,
        paidAmount: paidAmount,
        paymentStatus: formData.paymentStatus,
        description: formData.description || null,
        recipient: formData.recipient || null,
        paymentDate: formData.paymentDate,
        eventDate: (formData.category === 'labours' || formData.category === 'boys') && formData.eventDate ? formData.eventDate : null,
        notes: formData.notes || null,
        calculationDetails: Object.keys(calculationDetails).length > 0 ? calculationDetails : null,
        // Bulk allocation fields
        isBulkExpense: isBulkExpense,
        bulkAllocations: isBulkExpense ? bulkAllocations : null,
        allocationMethod: isBulkExpense ? allocationMethod : null,
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

      const successMessage = isBulkExpense
        ? `Bulk expense ${expenseId ? 'updated' : 'added'} for ${selectedOrderIds.length} events!`
        : `Expense ${expenseId ? 'updated' : 'added'} successfully!`
      toast.success(successMessage)
      router.push('/expenses')
    } catch (error: any) {
      console.error('Failed to save expense:', error)
      const message = error.message || 'Failed to save expense. Please try again.'
      toast.error(message)
      setFormError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/expenses"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <FaArrowLeft />
            Back to Expenses
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {expenseId ? 'Edit Expense' : 'Create New Expense'}
          </h1>
          <p className="text-gray-600 mt-1">
            {expenseId ? 'Update expense information' : 'Add a new expense to your records'}
          </p>
        </div>

        {/* Form */}
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white cursor-pointer flex justify-between items-center"
                onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
              >
                <div className="truncate text-gray-800">
                  {selectedOrderIds.length === 0
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
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-primary-50 border border-transparent' : 'hover:bg-gray-50 border border-transparent'
                            }`}
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
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                              <span>{eventDate.toLocaleDateString()}</span>
                              <span>•</span>
                              <span>{plates} plates/members</span>
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => {
                    setFormData({
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
                    })
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chef Calculation Method & Meal Type */}
              {formData.category === 'chef' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Calculation Method *
                    </label>
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

                  {/* Meal Type Selection (Visible when Orders are selected) */}
                  {selectedOrderIds.length > 0 && availableMealTypes.length > 0 && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Meal Types (Optional)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {availableMealTypes.map(meal => {
                          const isSelected = formData.selectedMealTypes.some(mt => mt.id === meal.id)
                          return (
                            <button
                              key={meal.id}
                              type="button"
                              onClick={() => handleMealTypeToggle(meal.id, meal.label)}
                              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${isSelected
                                ? 'bg-primary-50 text-primary-700 border-primary-200'
                                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                }`}
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

              {/* Other Category - Custom Category Name */}
              {formData.category === 'other' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Custom Category Name *
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCustomCategoryInputType('select')
                          setFormData({ ...formData, customCategoryName: '' })
                        }}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${customCategoryInputType === 'select'
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        Select Existing
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomCategoryInputType('input')
                          setFormData({ ...formData, customCategoryName: '' })
                        }}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${customCategoryInputType === 'input'
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        Add New
                      </button>
                    </div>
                    {customCategoryInputType === 'select' ? (
                      <select
                        required
                        value={formData.customCategoryName}
                        onChange={(e) => setFormData({ ...formData, customCategoryName: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                        placeholder="Enter custom category name (e.g., workforce, maintenance)"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic Fields Based on Category */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              {/* Chef Plate-wise */}
              {formData.category === 'chef' && formData.calculationMethod === 'plate-wise' && (
                <>
                  <div className="grid grid-cols-1 gap-4">
                    {formData.selectedMealTypes.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-200 bg-white p-4 rounded-lg">
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-700">
                            Plates per Meal Type *
                          </label>
                          {formData.selectedMealTypes.map((mt, index) => (
                            <div key={mt.id} className="flex items-center gap-3">
                              <span className="text-sm font-medium text-gray-600 w-24 truncate" title={mt.label}>{mt.label}</span>
                              <input
                                type="number"
                                step="1"
                                required
                                value={mt.plates}
                                onChange={(e) => {
                                  const newMealTypes = [...formData.selectedMealTypes]
                                  newMealTypes[index].plates = e.target.value
                                  setFormData({ ...formData, selectedMealTypes: newMealTypes })
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="0"
                              />
                            </div>
                          ))}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount per Plate *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Number of Plates *
                          </label>
                          <input
                            type="number"
                            step="1"
                            required
                            value={formData.plates}
                            onChange={(e) => setFormData({ ...formData, plates: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount per Plate *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mt-4">
                    <p className="text-sm font-semibold text-primary-900">
                      Total Amount: {formatCurrency(calculatedAmount)}
                    </p>
                  </div>
                </>
              )}

              {/* Chef Total */}
              {formData.category === 'chef' && formData.calculationMethod === 'total' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0.00"
                  />
                </div>
              )}

              {/* Supervisor */}
              {formData.category === 'supervisor' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0.00"
                  />
                </div>
              )}

              {/* Labours */}
              {formData.category === 'labours' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Event Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.eventDate}
                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Labours *
                      </label>
                      <input
                        type="number"
                        step="1"
                        required
                        value={formData.numberOfLabours}
                        onChange={(e) => setFormData({ ...formData, numberOfLabours: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount per Labour *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.labourAmount}
                        onChange={(e) => setFormData({ ...formData, labourAmount: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-primary-900">
                      Total Amount: {formatCurrency(calculatedAmount)}
                    </p>
                  </div>
                </>
              )}

              {/* Boys */}
              {formData.category === 'boys' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="md:col-span-2 lg:col-span-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Event Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.eventDate}
                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dressed Boys *
                      </label>
                      <input
                        type="number"
                        step="1"
                        required
                        value={formData.dressedBoys}
                        onChange={(e) => setFormData({ ...formData, dressedBoys: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dressed Rate *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.dressedBoyAmount}
                        onChange={(e) => setFormData({ ...formData, dressedBoyAmount: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Non-Dressed Boys *
                      </label>
                      <input
                        type="number"
                        step="1"
                        required
                        value={formData.nonDressedBoys}
                        onChange={(e) => setFormData({ ...formData, nonDressedBoys: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Non-Dressed Rate *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.nonDressedBoyAmount}
                        onChange={(e) => setFormData({ ...formData, nonDressedBoyAmount: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-primary-900">
                      Total Amount: {formatCurrency(calculatedAmount)}
                    </p>
                  </div>
                </>
              )}

              {/* Other Categories */}
              {!['chef', 'supervisor', 'labours', 'boys'].includes(formData.category) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>

            {/* Payment Date and Recipient */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Payment Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Recipient
                </label>
                {WORKFORCE_RECIPIENT_ROLES.includes(formData.category) && workforce.some((member) => member.role === formData.category) ? (
                  <select
                    value={formData.recipient}
                    onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select recipient</option>
                    {workforce
                      .filter((member) => member.role === formData.category)
                      .map((member) => (
                        <option key={member.id} value={member.name}>
                          {member.name}
                        </option>
                      ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.recipient}
                    onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Paid Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.paidAmount}
                    onChange={(e) => {
                      const paid = e.target.value
                      const paidNum = parseFloat(paid) || 0
                      const amountNum = calculatedAmount
                      let status: 'pending' | 'partial' | 'paid' = 'pending'
                      if (paidNum === 0) {
                        status = 'pending'
                      } else if (paidNum >= amountNum) {
                        status = 'paid'
                      } else {
                        status = 'partial'
                      }
                      setFormData({ ...formData, paidAmount: paid, paymentStatus: status })
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Total Amount: {formatCurrency(calculatedAmount)}
                  </p>
                  {formData.paidAmount && parseFloat(formData.paidAmount) > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Remaining: {formatCurrency(Math.max(0, calculatedAmount - (parseFloat(formData.paidAmount) || 0)))}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Status
                  </label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as 'pending' | 'partial' | 'paid' })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Status will auto-update based on paid amount
                  </p>
                </div>
              </div>
            </div>

            {/* Bulk Allocation Details */}
            {isBulkExpense && selectedOrderIds.length >= 2 && calculatedAmount > 0 && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 overflow-hidden">
                <div
                  className="bg-indigo-100 px-4 py-3 border-b border-indigo-200 cursor-pointer"
                  onClick={() => setShowAllocationDetails(!showAllocationDetails)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaLayerGroup className="text-indigo-600" />
                      <h3 className="font-semibold text-indigo-900">
                        Allocation Breakdown
                      </h3>
                      <span className="text-sm text-indigo-600">
                        ({selectedOrderIds.length} events)
                      </span>
                    </div>
                    {showAllocationDetails ? <FaChevronUp className="text-indigo-600" /> : <FaChevronDown className="text-indigo-600" />}
                  </div>
                </div>

                {showAllocationDetails && (
                  <div className="p-4 space-y-4">
                    {/* Allocation Method Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Allocation Method
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {ALLOCATION_METHODS.map((method) => (
                          <button
                            key={method.value}
                            type="button"
                            onClick={() => handleAllocationMethodChange(method.value as any)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-center ${allocationMethod === method.value
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                              }`}
                            title={method.description}
                          >
                            {method.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {ALLOCATION_METHODS.find(m => m.value === allocationMethod)?.description}
                      </p>
                    </div>

                    {/* Allocation Table */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Event</th>
                            {allocationMethod === 'by-plates' && (
                              <th className="px-4 py-2 text-center font-semibold text-gray-700">Plates</th>
                            )}
                            {allocationMethod === 'by-percentage' && (
                              <th className="px-4 py-2 text-center font-semibold text-gray-700 w-24">%</th>
                            )}
                            <th className="px-4 py-2 text-right font-semibold text-gray-700 w-32">Amount</th>
                            {allocationMethod === 'manual' && (
                              <th className="px-4 py-2 w-10"></th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {bulkAllocations.map((allocation, idx) => (
                            <tr key={allocation.orderId} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900 truncate max-w-xs">
                                  {allocation.orderName}
                                </div>
                              </td>
                              {allocationMethod === 'by-plates' && (
                                <td className="px-4 py-3 text-center text-gray-600">
                                  {allocation.plates || '-'}
                                </td>
                              )}
                              {allocationMethod === 'by-percentage' && (
                                <td className="px-4 py-3">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={allocation.percentage?.toFixed(1) || ''}
                                    onChange={(e) => handlePercentageChange(allocation.orderId, parseFloat(e.target.value) || 0)}
                                    className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  />
                                </td>
                              )}
                              <td className="px-4 py-3 text-right">
                                {allocationMethod === 'manual' ? (
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={allocation.amount || ''}
                                    onChange={(e) => handleAllocationAmountChange(allocation.orderId, parseFloat(e.target.value) || 0)}
                                    className="w-28 px-2 py-1 text-right border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  />
                                ) : (
                                  <span className="font-medium text-gray-900">
                                    {formatCurrency(allocation.amount)}
                                  </span>
                                )}
                              </td>
                              {allocationMethod === 'manual' && (
                                <td className="px-2 py-3">
                                  <button
                                    type="button"
                                    onClick={() => handleOrderSelection(allocation.orderId, false)}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                  >
                                    <FaTimes />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50 font-semibold">
                          <tr>
                            <td className="px-4 py-3 text-gray-700">
                              Total
                            </td>
                            {allocationMethod === 'by-plates' && (
                              <td className="px-4 py-3 text-center text-gray-700">
                                {bulkAllocations.reduce((sum, a) => sum + (a.plates || 0), 0)}
                              </td>
                            )}
                            {allocationMethod === 'by-percentage' && (
                              <td className="px-4 py-3 text-center text-gray-700">
                                {bulkAllocations.reduce((sum, a) => sum + (a.percentage || 0), 0).toFixed(1)}%
                              </td>
                            )}
                            <td className={`px-4 py-3 text-right ${Math.abs(allocationDifference) > 0.01 ? 'text-red-600' : 'text-green-600'
                              }`}>
                              {formatCurrency(totalAllocated)}
                            </td>
                            {allocationMethod === 'manual' && <td></td>}
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Allocation Status */}
                    {Math.abs(allocationDifference) > 0.01 && (
                      <div className={`p-3 rounded-lg ${allocationDifference > 0
                        ? 'bg-yellow-50 border border-yellow-200'
                        : 'bg-red-50 border border-red-200'
                        }`}>
                        <p className={`text-sm font-medium ${allocationDifference > 0 ? 'text-yellow-700' : 'text-red-700'
                          }`}>
                          {allocationDifference > 0
                            ? `Under-allocated: ${formatCurrency(allocationDifference)} remaining to allocate`
                            : `Over-allocated: ${formatCurrency(Math.abs(allocationDifference))} exceeds total`
                          }
                        </p>
                      </div>
                    )}

                    {Math.abs(allocationDifference) <= 0.01 && (
                      <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                        <p className="text-sm font-medium text-green-700 flex items-center gap-2">
                          ✓ Allocation complete - {formatCurrency(calculatedAmount)} split across {selectedOrderIds.length} events
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Description and Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Brief description of the expense"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                placeholder="Additional notes (optional)"
              />
            </div>

            {/* Form Footer */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <FormError message={formError} className="mr-auto self-center" />
              <Link
                href="/expenses"
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : expenseId ? 'Update Expense' : 'Create Expense'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
