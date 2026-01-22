'use client'

import { useEffect, useState, useMemo } from 'react'
import { formatDateTime } from '@/lib/utils'
import { 
  FaBell, 
  FaExclamationTriangle, 
  FaBox, 
  FaMoneyBillWave, 
  FaCalendarAlt, 
  FaShieldAlt,
  FaFilter,
  FaTimes,
  FaSync,
  FaExclamationCircle,
  FaInfoCircle,
  FaCheckCircle,
  FaArrowRight,
  FaEye
} from 'react-icons/fa'
import Link from 'next/link'

interface Alert {
  id: string
  type: 'low_stock' | 'payment_reminder' | 'upcoming_event' | 'failed_login'
  title: string
  message: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  entityId: string
  entityType: string
  createdAt: string
  data: any
}

interface AlertSummary {
  total: number
  critical: number
  high: number
  medium: number
  low: number
  byType: {
    low_stock: number
    payment_reminder: number
    upcoming_event: number
    failed_login: number
  }
}

const alertTypeConfig = {
  low_stock: {
    icon: FaBox,
    label: 'Low Stock',
    color: 'orange',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-300',
    iconBg: 'bg-orange-100',
    link: '/inventory'
  },
  payment_reminder: {
    icon: FaMoneyBillWave,
    label: 'Payment Due',
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-300',
    iconBg: 'bg-blue-100',
    link: '/bills'
  },
  upcoming_event: {
    icon: FaCalendarAlt,
    label: 'Upcoming Event',
    color: 'purple',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-300',
    iconBg: 'bg-purple-100',
    link: '/orders/history'
  },
  failed_login: {
    icon: FaShieldAlt,
    label: 'Security Alert',
    color: 'red',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-300',
    iconBg: 'bg-red-100',
    link: '/audit-logs'
  }
}

const severityConfig = {
  critical: {
    label: 'Critical',
    bgColor: 'bg-red-500',
    textColor: 'text-white',
    borderColor: 'border-red-500',
    dotColor: 'bg-red-500',
    icon: FaExclamationCircle
  },
  high: {
    label: 'High',
    bgColor: 'bg-orange-500',
    textColor: 'text-white',
    borderColor: 'border-orange-500',
    dotColor: 'bg-orange-500',
    icon: FaExclamationTriangle
  },
  medium: {
    label: 'Medium',
    bgColor: 'bg-yellow-500',
    textColor: 'text-white',
    borderColor: 'border-yellow-500',
    dotColor: 'bg-yellow-500',
    icon: FaInfoCircle
  },
  low: {
    label: 'Low',
    bgColor: 'bg-green-500',
    textColor: 'text-white',
    borderColor: 'border-green-500',
    dotColor: 'bg-green-500',
    icon: FaCheckCircle
  }
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [summary, setSummary] = useState<AlertSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/alerts')
      if (!response.ok) throw new Error('Failed to fetch alerts')
      const data = await response.json()
      setAlerts(data.alerts || [])
      setSummary(data.summary || null)
    } catch (error: any) {
      console.error('Failed to load alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAlerts = useMemo(() => {
    let filtered = alerts
    
    if (selectedType !== 'all') {
      filtered = filtered.filter(a => a.type === selectedType)
    }
    
    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(a => a.severity === selectedSeverity)
    }
    
    return filtered
  }, [alerts, selectedType, selectedSeverity])

  const clearFilters = () => {
    setSelectedType('all')
    setSelectedSeverity('all')
  }

  const activeFiltersCount = [
    selectedType !== 'all',
    selectedSeverity !== 'all',
  ].filter(Boolean).length

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FaBell className="text-red-500" />
            Alerts & Notifications
          </h1>
          <p className="text-gray-600 mt-1">Monitor stock levels, payments, events, and security</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters
                ? 'bg-red-500 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FaFilter className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="bg-white text-red-500 text-xs rounded-full px-2 py-0.5 font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
          <button
            onClick={loadAlerts}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <FaSync className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          {/* Total */}
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-500 col-span-2 sm:col-span-1">
            <p className="text-xs text-gray-500 uppercase font-semibold">Total Alerts</p>
            <p className="text-2xl font-bold text-gray-800">{summary.total}</p>
          </div>
          
          {/* By Severity */}
          <div 
            className={`bg-white rounded-lg shadow p-4 border-l-4 border-red-500 cursor-pointer hover:bg-red-50 transition-colors ${selectedSeverity === 'critical' ? 'ring-2 ring-red-500' : ''}`}
            onClick={() => setSelectedSeverity(selectedSeverity === 'critical' ? 'all' : 'critical')}
          >
            <p className="text-xs text-gray-500 uppercase font-semibold">Critical</p>
            <p className="text-2xl font-bold text-red-600">{summary.critical}</p>
          </div>
          <div 
            className={`bg-white rounded-lg shadow p-4 border-l-4 border-orange-500 cursor-pointer hover:bg-orange-50 transition-colors ${selectedSeverity === 'high' ? 'ring-2 ring-orange-500' : ''}`}
            onClick={() => setSelectedSeverity(selectedSeverity === 'high' ? 'all' : 'high')}
          >
            <p className="text-xs text-gray-500 uppercase font-semibold">High</p>
            <p className="text-2xl font-bold text-orange-600">{summary.high}</p>
          </div>
          <div 
            className={`bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500 cursor-pointer hover:bg-yellow-50 transition-colors ${selectedSeverity === 'medium' ? 'ring-2 ring-yellow-500' : ''}`}
            onClick={() => setSelectedSeverity(selectedSeverity === 'medium' ? 'all' : 'medium')}
          >
            <p className="text-xs text-gray-500 uppercase font-semibold">Medium</p>
            <p className="text-2xl font-bold text-yellow-600">{summary.medium}</p>
          </div>
          
          {/* By Type */}
          <div 
            className={`bg-white rounded-lg shadow p-4 border-l-4 border-orange-400 cursor-pointer hover:bg-orange-50 transition-colors ${selectedType === 'low_stock' ? 'ring-2 ring-orange-400' : ''}`}
            onClick={() => setSelectedType(selectedType === 'low_stock' ? 'all' : 'low_stock')}
          >
            <p className="text-xs text-gray-500 uppercase font-semibold flex items-center gap-1">
              <FaBox className="text-orange-500" /> Stock
            </p>
            <p className="text-2xl font-bold text-orange-600">{summary.byType.low_stock}</p>
          </div>
          <div 
            className={`bg-white rounded-lg shadow p-4 border-l-4 border-blue-500 cursor-pointer hover:bg-blue-50 transition-colors ${selectedType === 'payment_reminder' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setSelectedType(selectedType === 'payment_reminder' ? 'all' : 'payment_reminder')}
          >
            <p className="text-xs text-gray-500 uppercase font-semibold flex items-center gap-1">
              <FaMoneyBillWave className="text-blue-500" /> Payments
            </p>
            <p className="text-2xl font-bold text-blue-600">{summary.byType.payment_reminder}</p>
          </div>
          <div 
            className={`bg-white rounded-lg shadow p-4 border-l-4 border-purple-500 cursor-pointer hover:bg-purple-50 transition-colors ${selectedType === 'upcoming_event' ? 'ring-2 ring-purple-500' : ''}`}
            onClick={() => setSelectedType(selectedType === 'upcoming_event' ? 'all' : 'upcoming_event')}
          >
            <p className="text-xs text-gray-500 uppercase font-semibold flex items-center gap-1">
              <FaCalendarAlt className="text-purple-500" /> Events
            </p>
            <p className="text-2xl font-bold text-purple-600">{summary.byType.upcoming_event}</p>
          </div>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Clear All
                </button>
              )}
              <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimes />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Alert Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="all">All Types</option>
                <option value="low_stock">🔶 Low Stock</option>
                <option value="payment_reminder">💰 Payment Reminders</option>
                <option value="upcoming_event">📅 Upcoming Events</option>
                <option value="failed_login">🔒 Security Alerts</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="all">All Severities</option>
                <option value="critical">🔴 Critical</option>
                <option value="high">🟠 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FaExclamationTriangle />
            Active Alerts ({filteredAlerts.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <FaSync className="w-8 h-8 animate-spin mx-auto mb-4 text-red-500" />
            Loading alerts...
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-8 text-center">
            <FaCheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
            <p className="text-xl font-semibold text-gray-700">All Clear!</p>
            <p className="text-gray-500 mt-1">No alerts match your current filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredAlerts.map((alert) => {
              const typeConfig = alertTypeConfig[alert.type]
              const sevConfig = severityConfig[alert.severity]
              const TypeIcon = typeConfig.icon
              const SevIcon = sevConfig.icon

              return (
                <div 
                  key={alert.id} 
                  className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${sevConfig.borderColor}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Type Icon */}
                    <div className={`p-3 rounded-lg ${typeConfig.iconBg} flex-shrink-0`}>
                      <TypeIcon className={`w-5 h-5 ${typeConfig.textColor}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${sevConfig.bgColor} ${sevConfig.textColor}`}>
                              {sevConfig.label}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeConfig.bgColor} ${typeConfig.textColor}`}>
                              {typeConfig.label}
                            </span>
                          </div>
                          <p className="text-gray-600 mt-1">{alert.message}</p>
                        </div>
                      </div>

                      {/* Additional Data */}
                      {alert.type === 'low_stock' && alert.data && (
                        <div className="mt-2 flex items-center gap-4 text-sm">
                          <span className="text-gray-500">
                            Current: <strong className={alert.data.currentQty === 0 ? 'text-red-600' : 'text-orange-600'}>
                              {alert.data.currentQty} {alert.data.unit}
                            </strong>
                          </span>
                          <span className="text-gray-500">
                            Minimum: <strong>{alert.data.minQty} {alert.data.unit}</strong>
                          </span>
                        </div>
                      )}

                      {alert.type === 'payment_reminder' && alert.data && (
                        <div className="mt-2 flex items-center gap-4 text-sm flex-wrap">
                          <span className="text-gray-500">
                            Bill: <strong>{alert.data.billNumber}</strong>
                          </span>
                          <span className="text-gray-500">
                            Total: <strong>₹{alert.data.totalAmount?.toLocaleString()}</strong>
                          </span>
                          <span className="text-green-600">
                            Paid: ₹{alert.data.paidAmount?.toLocaleString()}
                          </span>
                          <span className="text-red-600 font-semibold">
                            Pending: ₹{alert.data.pendingAmount?.toLocaleString()}
                          </span>
                        </div>
                      )}

                      {alert.type === 'upcoming_event' && alert.data && (
                        <div className="mt-2 flex items-center gap-4 text-sm flex-wrap">
                          <span className="text-gray-500">
                            Event: <strong>{alert.data.eventType}</strong>
                          </span>
                          <span className="text-gray-500">
                            Guests: <strong>{alert.data.numberOfMembers}</strong>
                          </span>
                          {alert.data.venue && (
                            <span className="text-gray-500">
                              Venue: <strong>{alert.data.venue}</strong>
                            </span>
                          )}
                        </div>
                      )}

                      {alert.type === 'failed_login' && alert.data && (
                        <div className="mt-2 flex items-center gap-4 text-sm flex-wrap">
                          <span className="text-red-600 font-semibold">
                            {alert.data.failureCount} failed attempts
                          </span>
                          <span className="text-gray-500">
                            Device: <strong>{alert.data.device}</strong>
                          </span>
                          <span className="text-gray-500">
                            Browser: <strong>{alert.data.browser}</strong>
                          </span>
                          <span className="text-gray-500">
                            IP: <strong className="font-mono">{alert.data.ipAddress}</strong>
                          </span>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {formatDateTime(alert.createdAt)}
                        </span>
                        <Link
                          href={typeConfig.link}
                          className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700"
                        >
                          <FaEye className="w-3 h-3" />
                          View Details
                          <FaArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer */}
        {filteredAlerts.length > 0 && (
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {filteredAlerts.length} of {alerts.length} alerts
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

