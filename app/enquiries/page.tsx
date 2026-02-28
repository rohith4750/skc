"use client";
import { useEffect, useMemo, useState } from 'react'
import { FaEnvelope, FaSearch, FaSync, FaTimes, FaEnvelopeOpenText, FaGlobe } from 'react-icons/fa'
import RoleGuard from '@/components/RoleGuard'
import Table from '@/components/Table'
import { formatDateTime } from '@/lib/utils'

interface Enquiry {
  id: string
  name: string
  phone: string
  email: string
  subject: string
  message: string
  source: string
  createdAt: string
}

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSource, setSelectedSource] = useState('all')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null)

  useEffect(() => {
    loadEnquiries()
  }, [])

  const loadEnquiries = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/enquiry')
      if (!response.ok) throw new Error('Failed to fetch enquiries')
      const data = await response.json()
      setEnquiries(data)
    } catch (error) {
      console.error('Failed to load enquiries:', error)
    } finally {
      setLoading(false)
    }
  }

  const uniqueSources = useMemo(() => {
    const sources = new Set<string>()
    enquiries.forEach((enquiry) => sources.add(enquiry.source || 'unknown'))
    return Array.from(sources).sort()
  }, [enquiries])

  const filteredEnquiries = useMemo(() => {
    let filtered = enquiries

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter((enquiry) =>
        enquiry.name.toLowerCase().includes(search) ||
        enquiry.email.toLowerCase().includes(search) ||
        enquiry.phone.toLowerCase().includes(search) ||
        enquiry.subject.toLowerCase().includes(search) ||
        enquiry.message.toLowerCase().includes(search)
      )
    }

    if (selectedSource !== 'all') {
      filtered = filtered.filter((enquiry) => enquiry.source === selectedSource)
    }

    if (dateRange.start) {
      const startDate = new Date(dateRange.start)
      startDate.setHours(0, 0, 0, 0)
      filtered = filtered.filter((enquiry) => new Date(enquiry.createdAt) >= startDate)
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end)
      endDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter((enquiry) => new Date(enquiry.createdAt) <= endDate)
    }

    return filtered
  }, [enquiries, searchTerm, selectedSource, dateRange])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedSource, dateRange])

  const stats = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 6)
    weekStart.setHours(0, 0, 0, 0)

    const total = enquiries.length
    const today = enquiries.filter((enquiry) => new Date(enquiry.createdAt) >= todayStart).length
    const week = enquiries.filter((enquiry) => new Date(enquiry.createdAt) >= weekStart).length
    const sources = new Set(enquiries.map((enquiry) => enquiry.source || 'unknown')).size

    return { total, today, week, sources }
  }, [enquiries])

  const columns = [
    {
      key: 'name',
      header: 'Contact',
      render: (enquiry: Enquiry) => (
        <div>
          <div className="font-semibold text-gray-900">{enquiry.name}</div>
          <div className="text-xs text-gray-500">{enquiry.email}</div>
          <div className="text-xs text-gray-500">{enquiry.phone}</div>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (enquiry: Enquiry) => <div className="text-sm text-gray-800">{enquiry.subject}</div>,
    },
    {
      key: 'message',
      header: 'Message',
      render: (enquiry: Enquiry) => (
        <div className="max-w-[280px] truncate text-sm text-gray-600" title={enquiry.message}>
          {enquiry.message}
        </div>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      render: (enquiry: Enquiry) => (
        <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
          <FaGlobe className="w-3 h-3" />
          {enquiry.source || 'unknown'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Received',
      render: (enquiry: Enquiry) => (
        <span className="text-sm text-gray-600">{formatDateTime(enquiry.createdAt)}</span>
      ),
    },
  ]

  return (
    <RoleGuard requiredRole="super_admin">
      <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
              <FaEnvelope className="text-indigo-500" />
              Customer Enquiries
            </h1>
            <p className="text-gray-600 mt-1">Track and review enquiries submitted from the website</p>
          </div>
          <button
            onClick={loadEnquiries}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            <FaSync className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-indigo-500">
            <p className="text-sm text-gray-500">Total Enquiries</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-500">Today</p>
            <p className="text-2xl font-bold text-green-600">{stats.today}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-500">Last 7 Days</p>
            <p className="text-2xl font-bold text-blue-600">{stats.week}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
            <p className="text-sm text-gray-500">Sources</p>
            <p className="text-2xl font-bold text-purple-600">{stats.sources}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by name, email, phone, subject..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
              <select
                value={selectedSource}
                onChange={(event) => setSelectedSource(event.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Sources</option>
                {uniqueSources.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(event) => setDateRange({ ...dateRange, start: event.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(event) => setDateRange({ ...dateRange, end: event.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredEnquiries}
          emptyMessage={loading ? 'Loading enquiries...' : 'No enquiries found.'}
          getItemId={(enquiry) => enquiry.id}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          totalItems={filteredEnquiries.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemName="enquiries"
          renderActions={(enquiry) => (
            <button
              onClick={() => setSelectedEnquiry(enquiry)}
              className="text-indigo-600 hover:text-indigo-700 p-2 hover:bg-indigo-50 rounded"
              title="View Message"
            >
              <FaEnvelopeOpenText />
            </button>
          )}
        />

        {selectedEnquiry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Enquiry Details</h2>
                <button
                  onClick={() => setSelectedEnquiry(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase text-gray-500">Name</p>
                    <p className="text-sm font-medium text-gray-800">{selectedEnquiry.name}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-800">{selectedEnquiry.email}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-800">{selectedEnquiry.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">Source</p>
                    <p className="text-sm font-medium text-gray-800">{selectedEnquiry.source}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Subject</p>
                  <p className="text-sm font-medium text-gray-800">{selectedEnquiry.subject}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Message</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedEnquiry.message}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Received</p>
                  <p className="text-sm text-gray-700">{formatDateTime(selectedEnquiry.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  )
}
