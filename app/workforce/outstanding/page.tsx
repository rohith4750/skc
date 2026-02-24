'use client'

import { useEffect, useState, Fragment } from 'react'
import { FaDollarSign, FaUtensils, FaUserTie, FaTruck, FaUsers, FaUserFriends, FaGasPump, FaBox, FaStore, FaCircle, FaReceipt, FaChevronDown, FaChevronUp, FaFileAlt } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import RoleGuard from '@/components/RoleGuard'

const roleIcons: Record<string, any> = {
  chef: FaUtensils,
  supervisor: FaUserTie,
  transport: FaTruck,
  boys: FaUsers,
  labours: FaUserFriends,
  gas: FaGasPump,
  pan: FaBox,
  store: FaStore,
  other: FaCircle,
}

const roleColors: Record<string, string> = {
  chef: 'bg-orange-100 text-orange-800',
  supervisor: 'bg-green-100 text-green-800',
  transport: 'bg-yellow-100 text-yellow-800',
  boys: 'bg-purple-100 text-purple-800',
  labours: 'bg-indigo-100 text-indigo-800',
  gas: 'bg-red-100 text-red-800',
  pan: 'bg-pink-100 text-pink-800',
  store: 'bg-indigo-100 text-indigo-800',
  other: 'bg-gray-100 text-gray-800',
}

const WORKFORCE_ROLES = ['supervisor', 'chef', 'labours', 'boys', 'transport', 'gas', 'pan', 'store', 'other']
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
  other: 'Other',
}
const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
]

interface RoleSummary {
  role: string
  totalDues: number
  totalPaidFromExpenses: number
  totalPayments: number
  totalPaid: number
  outstanding: number
  expenseCount: number
  paymentCount: number
  expenses: any[]
  payments: any[]
}

interface EventItem {
  orderId: string
  eventName: string
  eventDate: string | null
  customerName: string | null
  expenses: any[]
  totalAmount: number
}

export default function OutstandingPage() {
  const [loading, setLoading] = useState(true)
  const [totalOutstanding, setTotalOutstanding] = useState(0)
  const [totalDues, setTotalDues] = useState(0)
  const [totalPaid, setTotalPaid] = useState(0)
  const [events, setEvents] = useState<EventItem[]>([])
  const [roleSummary, setRoleSummary] = useState<RoleSummary[]>([])
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'cash',
    notes: '',
    paymentDate: new Date().toISOString().split('T')[0],
  })
  const [paymentSubmitting, setPaymentSubmitting] = useState(false)
  const [expandedStatement, setExpandedStatement] = useState<string | null>(null)

  const buildStatement = (r: RoleSummary) => {
    const lines: { date: string; desc: string; amount: number; method: string; type: 'workforce' | 'expense' }[] = []
    r.payments?.forEach((p: any) => {
      lines.push({
        date: p.paymentDate,
        desc: p.notes || 'Recorded payment',
        amount: Number(p.amount || 0),
        method: PAYMENT_METHOD_LABELS[String(p.paymentMethod || 'cash')] || String(p.paymentMethod || 'cash').replace('_', ' '),
        type: 'workforce',
      })
    })
    r.expenses?.forEach((e: any) => {
      const paid = Number(e.paidAmount || 0)
      if (paid > 0) {
        const desc = e.recipient ? `Expense – ${e.recipient}` : (e.description || 'Expense payment')
        lines.push({
          date: e.paymentDate,
          desc,
          amount: paid,
          method: 'Expense',
          type: 'expense',
        })
      }
    })
    lines.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return lines
  }

  const loadOutstanding = async () => {
    try {
      const res = await fetch('/api/workforce/outstanding')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setTotalOutstanding(data.totalOutstanding ?? 0)
      setTotalDues(data.totalDues ?? 0)
      setTotalPaid(data.totalPaid ?? 0)
      setEvents(data.events ?? [])
      setRoleSummary(data.roleSummary ?? [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load outstanding')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOutstanding()
  }, [])

  const openPaymentModal = (role: string) => {
    setSelectedRole(role)
    setShowPaymentModal(true)
    setPaymentForm({
      amount: '',
      paymentMethod: 'cash',
      notes: '',
      paymentDate: new Date().toISOString().split('T')[0],
    })
  }

  const submitPayment = async () => {
    const amount = parseFloat(paymentForm.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    if (!selectedRole) {
      toast.error('Select a role')
      return
    }
    setPaymentSubmitting(true)
    try {
      const res = await fetch('/api/workforce/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          role: selectedRole,
          paymentMethod: paymentForm.paymentMethod,
          notes: paymentForm.notes || undefined,
          paymentDate: paymentForm.paymentDate,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to record payment')
      }
      toast.success(`Payment of ${formatCurrency(amount)} recorded for ${selectedRole}`)
      setShowPaymentModal(false)
      setSelectedRole(null)
      setPaymentForm({ amount: '', paymentMethod: 'cash', notes: '', paymentDate: new Date().toISOString().split('T')[0] })
      await loadOutstanding()
    } catch (e: any) {
      toast.error(e.message || 'Failed to record payment')
    } finally {
      setPaymentSubmitting(false)
    }
  }

  if (loading) {
    return (
      <RoleGuard requiredRole="super_admin">
        <div className="p-6 flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
        </div>
      </RoleGuard>
    )
  }

  return (
    <RoleGuard requiredRole="super_admin">
      <div className="p-3 sm:p-4 md:p-5 lg:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
              <FaDollarSign className="text-primary-500" /> Outstanding
            </h1>
            <p className="text-gray-600 mt-1 text-sm">Events, workforce dues, and role-based payments</p>
          </div>
          <Link
            href="/workforce"
            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            ← Workforce
          </Link>
        </div>

        {/* Total Outstanding */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-6 mb-6">
          <h2 className="text-sm font-medium text-amber-800 mb-1">Total Outstanding</h2>
          <p className="text-2xl sm:text-3xl font-bold text-amber-900">{formatCurrency(totalOutstanding)}</p>
          <p className="text-sm text-amber-700 mt-2">
            Total dues: {formatCurrency(totalDues)} · Paid: {formatCurrency(totalPaid)}
          </p>
        </div>

        {/* Events & Event Money */}
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden mb-6">
          <h2 className="text-lg font-semibold text-gray-800 p-4 border-b border-gray-200">Events & Event Money</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-xs sm:text-sm text-gray-600">
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">Event Date</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      No events with expenses yet
                    </td>
                  </tr>
                ) : (
                  events.map((ev) => (
                    <tr key={ev.orderId} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{ev.eventName || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{ev.eventDate ? formatDate(ev.eventDate) : '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{ev.customerName || '—'}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(ev.totalAmount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Record Payment by Role */}
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <h2 className="text-lg font-semibold text-gray-800 p-4 border-b border-gray-200">Outstanding by Role · Record Payment</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-xs sm:text-sm text-gray-600">
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium text-right">Total Dues</th>
                  <th className="px-4 py-3 font-medium text-right">Paid</th>
                  <th className="px-4 py-3 font-medium text-right">Outstanding</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roleSummary.filter((r) => r.totalDues > 0 || r.payments?.length > 0).map((r) => {
                  const Icon = roleIcons[r.role]
                  const statement = buildStatement(r)
                  const isExpanded = expandedStatement === r.role
                  return (
                    <Fragment key={r.role}>
                      <tr className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${roleColors[r.role]}`}>
                            {Icon && <Icon className="w-4 h-4" />}
                            {r.role.charAt(0).toUpperCase() + r.role.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">{formatCurrency(r.totalDues)}</td>
                        <td className="px-4 py-3 text-right text-green-600">{formatCurrency(r.totalPaid)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-amber-700">{formatCurrency(r.outstanding)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setExpandedStatement(isExpanded ? null : r.role)}
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
                            >
                              <FaFileAlt className="w-4 h-4" />
                              {isExpanded ? <><FaChevronUp className="w-4 h-4" /> Hide</> : <><FaChevronDown className="w-4 h-4" /> Statement</>}
                            </button>
                            <button
                              onClick={() => openPaymentModal(r.role)}
                              disabled={r.outstanding <= 0}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <FaReceipt className="w-4 h-4" /> Record Payment
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && statement.length > 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-3 bg-gray-50">
                            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                              <div className="px-4 py-2 bg-gray-100">
                                <h4 className="font-medium text-gray-800">Payment Statement – {r.role.charAt(0).toUpperCase() + r.role.slice(1)}</h4>
                                <p className="text-xs text-gray-500">How the amount was transferred</p>
                              </div>
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-gray-50 text-left text-gray-600">
                                    <th className="px-4 py-2 font-medium">Date</th>
                                    <th className="px-4 py-2 font-medium">Description</th>
                                    <th className="px-4 py-2 font-medium">Method</th>
                                    <th className="px-4 py-2 font-medium text-right">Amount</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {statement.map((line, i) => (
                                    <tr key={i} className="border-t border-gray-100">
                                      <td className="px-4 py-2 text-gray-700">{formatDate(line.date)}</td>
                                      <td className="px-4 py-2 text-gray-700">{line.desc}</td>
                                      <td className="px-4 py-2 text-gray-600 capitalize">{line.method}</td>
                                      <td className="px-4 py-2 text-right font-medium text-green-600">{formatCurrency(line.amount)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                      {isExpanded && statement.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-3 bg-gray-50">
                            <p className="text-sm text-gray-500 italic">No payments recorded yet.</p>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && selectedRole && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Record Payment – {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm((f) => ({ ...f, paymentDate: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                  <input
                    type="text"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Optional notes"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowPaymentModal(false)
                    setSelectedRole(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={submitPayment}
                  disabled={paymentSubmitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                >
                  {paymentSubmitting ? 'Recording…' : 'Record Payment'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  )
}
