'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { Order, Bill, PaymentHistoryEntry } from '@/types'
import { FaArrowLeft, FaMoneyBillWave, FaSave, FaPlus, FaTrash, FaHistory, FaPercentage, FaTruck, FaStore } from 'react-icons/fa'
import { fetchWithLoader } from '@/lib/fetch-with-loader'
import toast from 'react-hot-toast'
import Link from 'next/link'
import FormError from '@/components/FormError'

export default function FinancialTrackingPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [formError, setFormError] = useState<string>('')
  const mealTypeOptions = ['breakfast', 'lunch', 'dinner', 'snacks', 'sweets', 'saree']
  
  const [formData, setFormData] = useState({
    transportCost: '0',
    discount: '0',
    stalls: [] as Array<{ category: string; description: string; cost: string }>,
    baseAdvancePaid: '0',
    additionalPayment: '',
    paymentMethod: 'cash' as any,
    paymentNotes: '',
    mealTypes: [] as Array<{
      menuType: string
      pricingMethod: 'manual' | 'plate-based'
      numberOfPlates: string
      platePrice: string
      manualAmount: string
      numberOfMembers: string
      addMembers: string
      services: string[]
      date: string
      originalMembers?: number
    }>,
  })

  useEffect(() => {
    loadOrder()
  }, [orderId])

  const loadOrder = async () => {
    try {
      const response = await fetchWithLoader(`/api/orders/${orderId}`)
      if (!response.ok) throw new Error('Order not found')
      const data = await response.json()
      setOrder(data)

      const mealTypes = Object.entries(data.mealTypeAmounts || {}).map(([menuType, detail]: any) => {
        const normalized = typeof detail === 'object' && detail !== null ? detail : { amount: detail || 0 }
        return {
          menuType,
          pricingMethod: normalized.pricingMethod || 'manual',
          numberOfPlates: normalized.numberOfPlates?.toString() || '',
          platePrice: normalized.platePrice?.toString() || '',
          manualAmount: normalized.manualAmount?.toString() || (normalized.amount?.toString() || '0'),
          numberOfMembers: normalized.numberOfMembers?.toString() || '',
          addMembers: '',
          services: Array.isArray(normalized.services) ? normalized.services : [],
          date: normalized.date || '',
          originalMembers: normalized.originalMembers,
        }
      })

      // Initialize form with existing values
      setFormData({
        transportCost: data.transportCost?.toString() || '0',
        discount: data.discount?.toString() || '0',
        stalls: (data.stalls || []).map((s: any) => ({
          category: s.category || '',
          description: s.description || '',
          cost: s.cost?.toString() || '0'
        })),
        baseAdvancePaid: data.advancePaid?.toString() || '0',
        additionalPayment: '',
        paymentMethod: 'cash',
        paymentNotes: '',
        mealTypes,
      })
    } catch (error) {
      toast.error('Failed to load order')
      router.push('/orders/history')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMealType = () => {
    setFormData(prev => ({
      ...prev,
      mealTypes: [
        ...prev.mealTypes,
        {
          menuType: '',
          pricingMethod: 'manual',
          numberOfPlates: '',
          platePrice: '',
          manualAmount: '',
          numberOfMembers: '',
          addMembers: '',
          services: [],
          date: '',
        },
      ],
    }))
  }

  const handleRemoveMealType = (index: number) => {
    setFormData(prev => ({
      ...prev,
      mealTypes: prev.mealTypes.filter((_, i) => i !== index),
    }))
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

  const handleUpdateStall = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      stalls: prev.stalls.map((s, i) => i === index ? { ...s, [field]: value } : s)
    }))
  }

  const getMealTypeAmount = (mealType: any) => {
    if (mealType.pricingMethod === 'plate-based') {
      const plates = parseFloat(mealType.numberOfPlates) || 0
      const price = parseFloat(mealType.platePrice) || 0
      return plates * price
    }
    return parseFloat(mealType.manualAmount) || 0
  }

  const calculateMembers = (mealType: any) => {
    const current = parseInt(mealType.numberOfMembers, 10) || 0
    const add = parseInt(mealType.addMembers, 10) || 0
    return Math.max(0, current + add)
  }

  const syncPlateBasedMembers = (mealType: any, updates: Record<string, string>) => {
    const next = { ...mealType, ...updates }
    if (next.pricingMethod !== 'plate-based') return next
    const totalMembers = calculateMembers(next)
    return {
      ...next,
      numberOfPlates: totalMembers ? totalMembers.toString() : '',
    }
  }

  const buildMealTypeAmounts = () => {
    const mealTypeAmounts: Record<string, any> = {}
    formData.mealTypes.forEach(mealType => {
      if (!mealType.menuType) {
        return
      }
      mealTypeAmounts[mealType.menuType] = {
        amount: getMealTypeAmount(mealType),
        date: mealType.date,
        services: mealType.services,
        numberOfMembers: calculateMembers(mealType),
        pricingMethod: mealType.pricingMethod,
        numberOfPlates: mealType.numberOfPlates ? parseFloat(mealType.numberOfPlates) : undefined,
        platePrice: mealType.platePrice ? parseFloat(mealType.platePrice) : undefined,
        manualAmount: mealType.manualAmount ? parseFloat(mealType.manualAmount) : undefined,
        originalMembers: mealType.originalMembers,
      }
    })
    return mealTypeAmounts
  }

  // Calculate new total based on meal type calculation + adjustments
  const calculatedTotals = useMemo(() => {
    if (!order) return { total: 0, paid: 0, remaining: 0 }
    
    // 1. Base amount from meal types (from form)
    let mealTypesTotal = 0
    formData.mealTypes.forEach(mealType => {
      mealTypesTotal += getMealTypeAmount(mealType)
    })

    // 2. Add current adjustments from form
    const transport = parseFloat(formData.transportCost) || 0
    const discount = parseFloat(formData.discount) || 0
    const stallsTotal = formData.stalls.reduce((sum, s) => sum + (parseFloat(s.cost) || 0), 0)
    
    const newTotal = Math.max(0, mealTypesTotal + transport + stallsTotal - discount)
    
    // 3. Payments
    const basePaid = parseFloat(formData.baseAdvancePaid) || 0
    const newPayment = parseFloat(formData.additionalPayment) || 0
    const totalPaid = basePaid + newPayment
    
    return {
      total: newTotal,
      paid: totalPaid,
      remaining: Math.max(0, newTotal - totalPaid)
    }
  }, [order, formData])

  const remainingAllowed = useMemo(() => {
    if (!order) return 0
    const basePaid = parseFloat(formData.baseAdvancePaid) || 0
    return Math.max(0, calculatedTotals.total - basePaid)
  }, [order, calculatedTotals.total, formData.baseAdvancePaid])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    
    try {
      if (formData.mealTypes.some(mealType => !mealType.menuType)) {
        toast.error('Please select menu type for all meal types')
        return
      }

      const basePaidValue = parseFloat(formData.baseAdvancePaid) || 0
      const additionalPaymentValue = parseFloat(formData.additionalPayment) || 0
      if (basePaidValue < 0) {
        toast.error('Advance paid cannot be negative.')
        return
      }
      if (basePaidValue > calculatedTotals.total) {
        toast.error('Advance paid cannot exceed total amount.')
        return
      }
      if (additionalPaymentValue > remainingAllowed) {
        toast.error(`Payment exceeds remaining balance (${formatCurrency(remainingAllowed)}).`)
        return
      }

      // We send the full update to the existing PUT endpoint
      // but only changing the financial bits. 
      // The API route is generic enough to handle this.
      
      const payload = {
        ...order, // Keep everything else (logistics) same
        transportCost: parseFloat(formData.transportCost) || 0,
        discount: parseFloat(formData.discount) || 0,
        stalls: formData.stalls,
        mealTypeAmounts: buildMealTypeAmounts(),
        additionalPayment: additionalPaymentValue,
        paymentMethod: formData.paymentMethod,
        paymentNotes: formData.paymentNotes,
        totalAmount: calculatedTotals.total,
        advancePaid: calculatedTotals.paid,
        remainingAmount: calculatedTotals.remaining,
      }

      const response = await fetchWithLoader(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const message = errorData.error || 'Failed to update finances'
        setFormError(message)
        throw new Error(message)
      }
      
      toast.success('Financial adjustments saved!')
      router.push(`/orders/summary/${orderId}`)
    } catch (error) {
      toast.error('Failed to save adjustments')
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (!order) return null

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-screen">
      <div className="max-w-4xl mx-auto">
        <Link
          href={`/orders/summary/${orderId}`}
          className="inline-flex items-center text-slate-500 hover:text-primary-600 transition-all font-semibold text-sm mb-6"
        >
          <FaArrowLeft className="mr-2" /> Back to Summary
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Financial Management</h1>
            <p className="text-slate-600 font-medium">Billing adjustments and payment tracking for <span className="text-primary-600">#{order.id.slice(0,8)}</span></p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Current Balance</span>
            <div className={`text-3xl font-black ${order.remainingAmount === 0 ? 'text-emerald-500' : 'text-rose-600'}`}>
              {formatCurrency(order.remainingAmount)}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6">
            {/* 1. Core Adjustments */}
            <div className="min-w-0 space-y-6">
              {/* Meal Type Calculation */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between mb-6">
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                    Meal Type Calculation
                  </h2>
                  <span className="text-xs font-bold text-slate-500">Update members and pricing here</span>
                </div>
                <div className="space-y-4">
                  {formData.mealTypes.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-2xl">
                      <p className="text-slate-400 text-xs font-bold">No meal types found for this order.</p>
                    </div>
                  ) : (
                    formData.mealTypes.map((mealType, index) => {
                      const calculatedAmount = getMealTypeAmount(mealType)
                      const newMembers = calculateMembers(mealType)
                      return (
                        <div key={`${mealType.menuType}-${index}`} className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                          <div className="flex flex-col gap-4 mb-4">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                              <div className="flex-1">
                                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Menu Type</label>
                                <select
                                  value={mealType.menuType}
                                  onChange={(e) => {
                                    const updated = [...formData.mealTypes]
                                    updated[index] = { ...mealType, menuType: e.target.value }
                                    setFormData({ ...formData, mealTypes: updated })
                                  }}
                                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                  <option value="">Select Menu Type</option>
                                  {mealTypeOptions.map(option => (
                                    <option key={option} value={option}>
                                      {option.charAt(0).toUpperCase() + option.slice(1)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="w-full md:w-52">
                                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Event Date</label>
                                <input
                                  type="date"
                                  value={mealType.date}
                                  onChange={(e) => {
                                    const updated = [...formData.mealTypes]
                                    updated[index] = { ...mealType, date: e.target.value }
                                    setFormData({ ...formData, mealTypes: updated })
                                  }}
                                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500"
                                />
                              </div>
                            </div>
                            <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 text-right">
                              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount</div>
                              <div className="text-lg font-black text-primary-600">{formatCurrency(calculatedAmount)}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveMealType(index)}
                              className="self-start inline-flex items-center gap-2 text-rose-600 text-xs font-black hover:text-rose-700"
                            >
                              <FaTrash /> Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Current Members</label>
                              <input
                                type="number"
                                min="0"
                                value={mealType.numberOfMembers}
                                onChange={(e) => {
                                  const updated = [...formData.mealTypes]
                                  updated[index] = syncPlateBasedMembers(mealType, { numberOfMembers: e.target.value })
                                  setFormData({ ...formData, mealTypes: updated })
                                }}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Add Members</label>
                              <input
                                type="number"
                                min="0"
                                value={mealType.addMembers}
                                onChange={(e) => {
                                  const updated = [...formData.mealTypes]
                                  updated[index] = syncPlateBasedMembers(mealType, { addMembers: e.target.value })
                                  setFormData({ ...formData, mealTypes: updated })
                                }}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="0"
                              />
                              <p className="mt-1 text-[10px] font-bold text-slate-500">New total: {newMembers}</p>
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Pricing Method</label>
                              <select
                                value={mealType.pricingMethod}
                                onChange={(e) => {
                                  const updated = [...formData.mealTypes]
                                  updated[index] = syncPlateBasedMembers(mealType, { pricingMethod: e.target.value })
                                  setFormData({ ...formData, mealTypes: updated })
                                }}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500"
                              >
                                <option value="manual">Manual</option>
                                <option value="plate-based">Plate-based</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            {mealType.pricingMethod === 'plate-based' ? (
                              <>
                                <div>
                                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Plates</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={mealType.numberOfPlates}
                                    readOnly={mealType.pricingMethod === 'plate-based'}
                                    className={`w-full px-4 py-3 rounded-xl text-sm font-bold outline-none ${
                                      mealType.pricingMethod === 'plate-based'
                                        ? 'bg-slate-100 border border-slate-200 text-slate-600'
                                        : 'bg-white border border-slate-200 text-slate-700 focus:ring-2 focus:ring-primary-500'
                                    }`}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Price per Plate</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={mealType.platePrice}
                                    onChange={(e) => {
                                      const updated = [...formData.mealTypes]
                                      updated[index] = { ...mealType, platePrice: e.target.value }
                                      setFormData({ ...formData, mealTypes: updated })
                                    }}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500"
                                  />
                                </div>
                              </>
                            ) : (
                              <div>
                                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Manual Amount</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={mealType.manualAmount}
                                  onChange={(e) => {
                                    const updated = [...formData.mealTypes]
                                    updated[index] = { ...mealType, manualAmount: e.target.value }
                                    setFormData({ ...formData, mealTypes: updated })
                                  }}
                                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
              {/* Transport & Discount */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-primary-500 rounded-full"></div>
                  Core Adjustments
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Transport Cost</label>
                    <div className="relative">
                      <FaTruck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input
                        type="number"
                        value={formData.transportCost}
                        onChange={(e) => setFormData({...formData, transportCost: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-bold text-slate-700"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Applied Discount</label>
                    <div className="relative">
                      <FaPercentage className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input
                        type="number"
                        value={formData.discount}
                        onChange={(e) => setFormData({...formData, discount: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-bold text-slate-700"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Stalls Section */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div>
                    Live Stalls
                  </h2>
                  <button
                    type="button"
                    onClick={handleAddStall}
                    className="flex items-center px-4 py-2 bg-amber-50 text-amber-600 rounded-xl font-bold text-xs hover:bg-amber-100 transition-all"
                  >
                    <FaPlus className="mr-2" /> Add Stall
                  </button>
                </div>
                
                <div className="space-y-4">
                  {formData.stalls.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-2xl">
                      <FaStore className="mx-auto text-3xl text-slate-100 mb-2" />
                      <p className="text-slate-400 text-xs font-bold">No stalls added to this order.</p>
                    </div>
                  ) : (
                    formData.stalls.map((stall, index) => (
                      <div key={index} className="flex gap-4 items-start p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex-1 space-y-3">
                          <select
                            value={stall.category}
                            onChange={(e) => handleUpdateStall(index, 'category', e.target.value)}
                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="">Select Category</option>
                            <option value="Sweet Stall">Sweet Stall</option>
                            <option value="Pan Stall">Pan Stall</option>
                            <option value="LED Counter">LED Counter</option>
                            <option value="Tiffin Counter">Tiffin Counter</option>
                            <option value="Chat Counter">Chat Counter</option>
                          </select>
                          <input
                            type="text"
                            value={stall.description}
                            onChange={(e) => handleUpdateStall(index, 'description', e.target.value)}
                            placeholder="Description / Note"
                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div className="w-32">
                          <input
                            type="number"
                            value={stall.cost}
                            onChange={(e) => handleUpdateStall(index, 'cost', e.target.value)}
                            placeholder="Cost"
                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveStall(index)}
                          className="p-3 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* New Payment Record */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                  Record New Payment
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Advance Paid (Edit)</label>
                    <input
                      type="number"
                      min="0"
                      max={calculatedTotals.total}
                      value={formData.baseAdvancePaid}
                      onChange={(e) => setFormData({ ...formData, baseAdvancePaid: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-black text-slate-900"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Amount Received</label>
                    <input
                      type="number"
                      min="0"
                      max={remainingAllowed}
                      value={formData.additionalPayment}
                      onChange={(e) => setFormData({...formData, additionalPayment: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-black text-slate-900"
                      placeholder="0.00"
                    />
                    <p className="mt-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Remaining balance: {formatCurrency(remainingAllowed)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Payment Method</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-900"
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI / Online</option>
                      <option value="card">Credit/Debit Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Internal Notes</label>
                  <input
                    type="text"
                    value={formData.paymentNotes}
                    onChange={(e) => setFormData({...formData, paymentNotes: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-slate-700"
                    placeholder="Transaction ID, specific notes, etc."
                  />
                </div>
              </div>
            </div>

            {/* 2. Sticky Summary & Actions */}
            <div className="min-w-0 space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-200 xl:sticky xl:top-8">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-primary-500 rounded-full"></div>
                  Final Impact
                </h2>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-slate-600">Projected Total</span>
                    <span className="text-slate-900">{formatCurrency(calculatedTotals.total)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-slate-600">Total Collected</span>
                    <span className="text-emerald-600">{formatCurrency(calculatedTotals.paid)}</span>
                  </div>
                  <div className="pt-4 border-t border-slate-50">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">New Balance</span>
                        <div className={`text-2xl font-black ${calculatedTotals.remaining === 0 ? 'text-emerald-500' : 'text-rose-600'}`}>
                          {formatCurrency(calculatedTotals.remaining)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <FormError message={formError} className="mb-4" />
                <button
                  type="submit"
                  className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black hover:bg-primary-700 transition-all shadow-xl shadow-primary-200 flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <FaSave /> Save Adjustments
                </button>
                
                <p className="mt-4 text-[10px] text-slate-500 font-bold text-center uppercase tracking-tighter">
                  This will update the ledger & bill record
                </p>
              </div>

              {/* Audit View Link */}
              <div className="p-6 bg-white rounded-3xl border border-slate-200 text-center">
                <FaHistory className="mx-auto text-2xl text-slate-200 mb-3" />
                <p className="text-xs font-bold text-slate-600 leading-relaxed px-4">
                  Menu item changes should be made in the <Link href={`/orders?edit=${orderId}`} className="text-primary-600 underline">Order Editor</Link>.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

