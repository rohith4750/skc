'use client'

import { useEffect, useState, useMemo } from 'react'
import { formatDateTime } from '@/lib/utils'
import { 
  FaHistory, 
  FaDesktop, 
  FaMobileAlt, 
  FaTabletAlt, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaChrome, 
  FaFirefox, 
  FaSafari, 
  FaEdge, 
  FaGlobe, 
  FaWindows, 
  FaApple, 
  FaAndroid, 
  FaLinux,
  FaUser,
  FaFilter,
  FaTimes,
  FaSearch,
  FaSync
} from 'react-icons/fa'
import RoleGuard from '@/components/RoleGuard'

interface AuditLog {
  id: string
  userId: string
  username: string
  ipAddress: string
  userAgent: string
  device: string
  browser: string
  os: string
  loginTime: string
  success: boolean
  failReason?: string
  user?: {
    username: string
    email: string
    role: string
  }
}

// Device icons
const deviceIcons: Record<string, any> = {
  Desktop: FaDesktop,
  Mobile: FaMobileAlt,
  Tablet: FaTabletAlt,
}

// Browser icons
const browserIcons: Record<string, any> = {
  Chrome: FaChrome,
  Firefox: FaFirefox,
  Safari: FaSafari,
  Edge: FaEdge,
}

// OS icons
const osIcons: Record<string, any> = {
  'Windows': FaWindows,
  'Windows 10/11': FaWindows,
  'macOS': FaApple,
  'iOS': FaApple,
  'Android': FaAndroid,
  'Linux': FaLinux,
}

const roleColors: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-800',
  admin: 'bg-blue-100 text-blue-800',
}

export default function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDevice, setSelectedDevice] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedUser, setSelectedUser] = useState('all')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  useEffect(() => {
    loadAuditLogs()
  }, [])

  const loadAuditLogs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users/audit-logs?limit=500')
      if (!response.ok) throw new Error('Failed to fetch audit logs')
      const data = await response.json()
      setAuditLogs(data)
    } catch (error: any) {
      console.error('Failed to load audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get unique users for filter
  const uniqueUsers = useMemo(() => {
    const users = new Set<string>()
    auditLogs.forEach(log => users.add(log.username))
    return Array.from(users).sort()
  }, [auditLogs])

  // Filter logs
  const filteredLogs = useMemo(() => {
    let filtered = auditLogs

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(log => 
        log.username.toLowerCase().includes(search) ||
        log.ipAddress?.toLowerCase().includes(search) ||
        log.device?.toLowerCase().includes(search) ||
        log.browser?.toLowerCase().includes(search) ||
        log.os?.toLowerCase().includes(search)
      )
    }

    // Device filter
    if (selectedDevice !== 'all') {
      filtered = filtered.filter(log => log.device === selectedDevice)
    }

    // Status filter
    if (selectedStatus !== 'all') {
      const isSuccess = selectedStatus === 'success'
      filtered = filtered.filter(log => log.success === isSuccess)
    }

    // User filter
    if (selectedUser !== 'all') {
      filtered = filtered.filter(log => log.username === selectedUser)
    }

    // Date range filter
    if (dateRange.start) {
      const startDate = new Date(dateRange.start)
      startDate.setHours(0, 0, 0, 0)
      filtered = filtered.filter(log => new Date(log.loginTime) >= startDate)
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end)
      endDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(log => new Date(log.loginTime) <= endDate)
    }

    return filtered
  }, [auditLogs, searchTerm, selectedDevice, selectedStatus, selectedUser, dateRange])

  // Stats
  const stats = useMemo(() => {
    const totalLogins = filteredLogs.length
    const successfulLogins = filteredLogs.filter(l => l.success).length
    const failedLogins = filteredLogs.filter(l => !l.success).length
    const uniqueDevices = new Set(filteredLogs.map(l => l.device)).size
    const mobileLogins = filteredLogs.filter(l => l.device === 'Mobile').length
    const desktopLogins = filteredLogs.filter(l => l.device === 'Desktop').length
    
    return { totalLogins, successfulLogins, failedLogins, uniqueDevices, mobileLogins, desktopLogins }
  }, [filteredLogs])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedDevice('all')
    setSelectedStatus('all')
    setSelectedUser('all')
    setDateRange({ start: '', end: '' })
  }

  const activeFiltersCount = [
    searchTerm !== '',
    selectedDevice !== 'all',
    selectedStatus !== 'all',
    selectedUser !== 'all',
    dateRange.start !== '' || dateRange.end !== '',
  ].filter(Boolean).length

  return (
    <RoleGuard requiredRole="super_admin">
      <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
              <FaHistory className="text-indigo-500" />
              Login Audit Logs
            </h1>
            <p className="text-gray-600 mt-1">Track user login activity, devices, and security events</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showFilters
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FaFilter className="w-4 h-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            <button
              onClick={loadAuditLogs}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              <FaSync className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-indigo-500">
            <p className="text-sm text-gray-500">Total Logins</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalLogins}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-500">Successful</p>
            <p className="text-2xl font-bold text-green-600">{stats.successfulLogins}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <p className="text-sm text-gray-500">Failed</p>
            <p className="text-2xl font-bold text-red-600">{stats.failedLogins}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-500">Desktop</p>
            <p className="text-2xl font-bold text-blue-600">{stats.desktopLogins}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-500">Mobile</p>
            <p className="text-2xl font-bold text-green-600">{stats.mobileLogins}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
            <p className="text-sm text-gray-500">Unique Users</p>
            <p className="text-2xl font-bold text-purple-600">{uniqueUsers.length}</p>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
              <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Clear All
                  </button>
                )}
                <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
                  <FaTimes />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by username, IP, device..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* User Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Users</option>
                  {uniqueUsers.map(user => (
                    <option key={user} value={user}>{user}</option>
                  ))}
                </select>
              </div>

              {/* Device Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Device</label>
                <select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Devices</option>
                  <option value="Desktop">Desktop</option>
                  <option value="Mobile">Mobile</option>
                  <option value="Tablet">Tablet</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Status</option>
                  <option value="success">Successful</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Audit Logs Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <FaSync className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
                Loading audit logs...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FaHistory className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No login records found</p>
                <p className="text-sm mt-1">Audit logs will appear here after users log in.</p>
              </div>
            ) : (
              <table className="w-full min-w-[1000px]">
                <thead className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase">User</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase">Login Time</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase">Device</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase">Browser</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase">Operating System</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase">IP Address</th>
                    <th className="px-4 py-4 text-center text-xs font-semibold uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLogs.map((log, idx) => {
                    const DeviceIcon = deviceIcons[log.device] || FaDesktop
                    const BrowserIcon = browserIcons[log.browser] || FaGlobe
                    const OsIcon = osIcons[log.os] || FaGlobe
                    
                    return (
                      <tr 
                        key={log.id} 
                        className={`hover:bg-gray-50 transition-colors ${
                          !log.success ? 'bg-red-50 hover:bg-red-100' : ''
                        } ${idx % 2 === 0 ? '' : 'bg-gray-50'}`}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${roleColors[log.user?.role || 'admin'] || 'bg-gray-100'}`}>
                              <FaUser className="w-3 h-3" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{log.username}</div>
                              <div className="text-xs text-gray-500">{log.user?.email || ''}</div>
                              {log.user?.role && (
                                <span className={`text-xs px-2 py-0.5 rounded ${roleColors[log.user.role]}`}>
                                  {log.user.role.replace('_', ' ').toUpperCase()}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {formatDateTime(log.loginTime)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${
                              log.device === 'Mobile' ? 'bg-green-100' :
                              log.device === 'Tablet' ? 'bg-blue-100' : 'bg-gray-100'
                            }`}>
                              <DeviceIcon className={`w-4 h-4 ${
                                log.device === 'Mobile' ? 'text-green-600' :
                                log.device === 'Tablet' ? 'text-blue-600' : 'text-gray-600'
                              }`} />
                            </div>
                            <span className="text-sm font-medium text-gray-700">{log.device}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <BrowserIcon className={`w-5 h-5 ${
                              log.browser === 'Chrome' ? 'text-yellow-500' :
                              log.browser === 'Firefox' ? 'text-orange-500' :
                              log.browser === 'Safari' ? 'text-blue-500' :
                              log.browser === 'Edge' ? 'text-blue-600' : 'text-gray-500'
                            }`} />
                            <span className="text-sm text-gray-700">{log.browser}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <OsIcon className={`w-5 h-5 ${
                              log.os?.includes('Windows') ? 'text-blue-500' :
                              log.os?.includes('mac') || log.os?.includes('iOS') ? 'text-gray-700' :
                              log.os === 'Android' ? 'text-green-500' :
                              log.os === 'Linux' ? 'text-yellow-600' : 'text-gray-500'
                            }`} />
                            <span className="text-sm text-gray-700">{log.os}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                            {log.ipAddress || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {log.success ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                              <FaCheckCircle />
                              Success
                            </span>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                <FaTimesCircle />
                                Failed
                              </span>
                              {log.failReason && (
                                <div className="text-xs text-red-500 mt-1 max-w-[150px] truncate" title={log.failReason}>
                                  {log.failReason}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Footer */}
          {filteredLogs.length > 0 && (
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {filteredLogs.length} of {auditLogs.length} login records
              </p>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  )
}

