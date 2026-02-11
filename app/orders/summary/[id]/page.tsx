'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { Bill, Order, PaymentHistoryEntry } from '@/types'
import { FaUser, FaCalendarAlt, FaMoneyBillWave, FaHistory, FaUtensils, FaTruck, FaTag, FaArrowLeft, FaEdit, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa'

export default function OrderSummaryPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params?.id as string
  const [order, setOrder] = useState<Order & { bill?: Bill } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`, {
          cache: 'no-store',
        })
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to load order')
        }
        const orderData = await response.json()
        setOrder(orderData)
      } catch (error: any) {
        console.error('Failed to load order summary:', error)
        toast.error(error.message || 'Failed to load order summary.')
        router.push('/orders/history')
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      loadOrder()
    }
  }, [orderId, router])

  if (loading) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg shadow p-6">Loading order summary...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg shadow p-6">Order not found.</div>
      </div>
    )
  }

  const paymentHistory: PaymentHistoryEntry[] = Array.isArray(order.bill?.paymentHistory)
    ? (order.bill?.paymentHistory as PaymentHistoryEntry[])
    : []

  // Group order items by their menu item type
  const itemsByMealType: Record<string, any[]> = {}
  order.items?.forEach((item: any) => {
    const type = item.menuItem?.type?.toLowerCase() || 'other'
    if (!itemsByMealType[type]) {
      itemsByMealType[type] = []
    }
    itemsByMealType[type].push(item)
  })

  const totalAmount = order.totalAmount || 0
  const paidAmount = order.advancePaid || 0
  const percentPaidRaw = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0
  const percentPaid = Math.min(100, Math.round(percentPaidRaw))
  const overpaidAmount = Math.max(0, paidAmount - totalAmount)

  const mealTypeIcons: Record<string, any> = {
    breakfast: <FaUtensils className="text-orange-500" />,
    lunch: <FaUtensils className="text-green-500" />,
    dinner: <FaUtensils className="text-indigo-500" />,
    high_tea: <FaUtensils className="text-yellow-500" />,
    snacks: <FaUtensils className="text-red-500" />,
  }

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Top Navigation */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/orders/history"
            className="group flex items-center text-slate-500 hover:text-primary-600 transition-all font-semibold text-sm"
          >
            <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mr-3 group-hover:bg-primary-50 group-hover:text-primary-600 transition-all">
              <FaArrowLeft />
            </div>
            Back to Dashboard
          </Link>
          <Link
            href={`/orders/financial/${order.id}`}
            className="flex items-center px-6 py-2.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 active:scale-95"
          >
            <FaMoneyBillWave className="mr-2" /> Financial Summary
          </Link>
        </div>

        {/* Hero Banner Section */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 mb-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50/50 rounded-full -mr-32 -mt-32 blur-3xl -z-0"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${
                  order.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                  order.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                  'bg-primary-50 text-primary-600 border-primary-100'
                }`}>
                  {order.status}
                </span>
                <span className="text-xs font-bold text-slate-400">#SKC-ORDER-{(order as any).serialNumber || order.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">
                {order.eventName || 'Premium Catering Event'}
              </h1>
              <div className="flex items-center gap-4 text-slate-500 font-semibold text-sm">
                <div className="flex items-center gap-1.5">
                  <FaCalendarAlt className="text-primary-400" />
                  {formatDateTime(order.createdAt)}
                </div>
                <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                <div className="flex items-center gap-1.5 text-slate-900">
                  <FaUser className="text-primary-400" />
                  {order.customer?.name}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Outstanding Balance</span>
              <div className="text-4xl font-black text-rose-600 tabular-nums tracking-tighter">
                {order.remainingAmount === 0 ? (
                  <span className="text-emerald-500 flex items-center gap-2">
                    <FaCheckCircle className="text-2xl" /> PAID
                  </span>
                ) : formatCurrency(order.remainingAmount)}
              </div>
              <div className="mt-2 text-xs font-bold text-slate-400">
                Total Bill: <span className="text-slate-900">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Customer & Logistics Quick Info */}
          <div className="bg-white rounded-[2rem] p-6 shadow-md shadow-slate-200/40 border border-slate-50">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-primary-500 rounded-full"></div>
              Logistics & Assignment
            </h2>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Supervisor</span>
                  <span className="text-sm font-black text-slate-900">{(order as any).supervisor?.name || 'Unassigned'}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Transport</span>
                  <span className="text-sm font-black text-slate-900">{formatCurrency(order.transportCost || 0)}</span>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Contact Details</span>
                <span className="text-sm font-black text-slate-900 block">{order.customer?.phone}</span>
                <span className="text-xs font-medium text-slate-500 block mt-0.5">{order.customer?.address}</span>
              </div>
            </div>
          </div>

          {/* Financial Progress Card */}
          <div className="bg-slate-900 rounded-[2rem] p-6 shadow-xl shadow-slate-900/20 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10">
              <FaMoneyBillWave className="text-[10rem]" />
            </div>
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
              <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
              Payment Breakdown
            </h2>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center group">
                <span className="text-slate-400 text-sm font-semibold group-hover:text-slate-300 transition-colors">Advance Received</span>
                <span className="text-emerald-400 font-black text-lg">{formatCurrency(order.advancePaid)}</span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-slate-400 text-sm font-semibold group-hover:text-slate-300 transition-colors">Applied Discount</span>
                <span className="text-slate-300 font-bold">{formatCurrency(order.discount || 0)}</span>
              </div>
              <div className="pt-4 border-t border-slate-800">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase block mb-1 tracking-widest">Percentage Paid</span>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-white">
                        {percentPaid}%
                      </span>
                      <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000"
                          style={{ width: `${percentPaid}%` }}
                        ></div>
                      </div>
                    </div>
                    {overpaidAmount > 0 && (
                      <p className="mt-3 text-[10px] font-black text-rose-400 uppercase tracking-widest">
                        Overpaid: {formatCurrency(overpaidAmount)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Meal Plans - Full Width Premium Grid */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Catering Plans</h2>
            <div className="flex-grow h-px bg-slate-200"></div>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {Object.entries(order.mealTypeAmounts || {}).map(([mealType, data]) => {
              const detail = typeof data === 'object' && data !== null ? data : null;
              const items = itemsByMealType[mealType.toLowerCase()] || [];
              
              return (
                <div key={mealType} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary-100 transition-all group overflow-hidden">
                  <div className="flex flex-col md:flex-row h-full">
                    {/* Left: Meal Category Header */}
                    <div className={`w-full md:w-64 p-6 flex flex-col justify-center items-center text-center ${
                      mealType.toLowerCase() === 'breakfast' ? 'bg-orange-50/50' :
                      mealType.toLowerCase() === 'lunch' ? 'bg-emerald-50/50' :
                      mealType.toLowerCase() === 'dinner' ? 'bg-indigo-50/50' :
                      'bg-slate-50/50'
                    }`}>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm mb-3 ${
                        mealType.toLowerCase() === 'breakfast' ? 'bg-orange-100 text-orange-600' :
                        mealType.toLowerCase() === 'lunch' ? 'bg-emerald-100 text-emerald-600' :
                        mealType.toLowerCase() === 'dinner' ? 'bg-indigo-100 text-indigo-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        <FaUtensils className="text-xl" />
                      </div>
                      <h3 className="text-xl font-black capitalize text-slate-900 leading-none">{mealType}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest">
                        {detail?.date ? formatDate(detail.date) : 'Date Pending'}
                      </p>
                    </div>

                    {/* Right: Details & Items */}
                    <div className="flex-grow p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
                        <div className="flex gap-8">
                          <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Guest Count</span>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-black text-slate-900">{detail?.numberOfMembers || 'N/A'}</span>
                              {detail?.originalMembers !== undefined && detail?.numberOfMembers !== undefined && detail.originalMembers !== detail.numberOfMembers && (
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                                  (detail.numberOfMembers ?? 0) > (detail.originalMembers ?? 0) ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                }`}>
                                  {(detail.numberOfMembers ?? 0) > (detail.originalMembers ?? 0) ? '↑' : '↓'}
                                  {Math.abs((detail.numberOfMembers ?? 0) - (detail.originalMembers ?? 0))}
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Pricing</span>
                            <span className="text-lg font-black text-slate-900 capitalize">{detail?.pricingMethod || 'Manual'}</span>
                          </div>
                        </div>
                        <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 text-right">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Amount</span>
                          <span className="text-xl font-black text-primary-600">
                            {formatCurrency(detail?.amount || (typeof data === 'number' ? data : 0))}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Selected Menu Items</span>
                        <div className="flex flex-wrap gap-2">
                          {items.length > 0 ? items.map((item) => (
                            <span key={item.id} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-sm hover:border-primary-300 transition-colors">
                              {item.menuItem?.name}
                            </span>
                          )) : <p className="text-xs text-slate-300 font-bold italic">No menu items added.</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Professional Transaction Ledger */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-12">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-primary-600">
                <FaHistory className="text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Audit Ledger</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Transaction & Revision History</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Balance</span>
              <span className={`text-xl font-black ${order.remainingAmount === 0 ? 'text-emerald-500' : 'text-slate-900'}`}>
                {formatCurrency(order.remainingAmount)}
              </span>
            </div>
          </div>
          
          <div className="p-0">
            {paymentHistory.length === 0 ? (
              <div className="p-20 text-center">
                <FaExclamationCircle className="mx-auto text-5xl text-slate-100 mb-4" />
                <p className="text-slate-400 font-bold tracking-tight">No records found in ledger.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Timestamp</th>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Type</th>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Activity</th>
                      <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paymentHistory.map((payment, index) => {
                      const isPayment = payment.amount > 0;
                      const isBooking = payment.source === 'booking' || payment.source === 'status-update';
                      const isRevision = payment.source === 'revision' || payment.source === 'order-edit';
                      const isPaymentAction = payment.source === 'payment' || payment.source === 'bill-update';

                      return (
                        <tr key={index} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-8 py-5 text-xs font-bold text-slate-500 whitespace-nowrap">{formatDateTime(payment.date)}</td>
                          <td className="px-8 py-5 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                              isBooking ? 'bg-blue-100 text-blue-700' :
                              isRevision ? 'bg-amber-100 text-amber-700' :
                              'bg-emerald-100 text-emerald-700'
                            }`}>
                              {isBooking ? 'Booking' : isRevision ? 'Revision' : 'Payment'}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900 leading-tight">
                                {payment.notes || (isPayment ? `Payment via ${payment.method || 'Cash'}` : 'Configuration update')}
                              </span>
                              {payment.membersChanged && (
                                <span className={`text-[10px] font-black ${payment.membersChanged > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {payment.membersChanged > 0 ? 'Increased' : 'Decreased'} by {Math.abs(payment.membersChanged)} guests
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right whitespace-nowrap">
                            {payment.totalPriceChange ? (
                              <div className={`text-[10px] font-black mb-1 ${payment.totalPriceChange > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {payment.totalPriceChange > 0 ? '+' : ''}{formatCurrency(payment.totalPriceChange)}
                              </div>
                            ) : null}
                            <div className={`text-base font-black ${isPayment ? 'text-slate-900' : 'text-slate-300'}`}>
                              {isPayment ? formatCurrency(payment.amount) : '-'}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

