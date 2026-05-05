"use client";
import React, { useEffect, useState, useMemo } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  FaSearch,
  FaCalendarAlt,
  FaPrint,
  FaUtensils,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa'
import { toast } from 'sonner'
import Table from '@/components/Table'

interface PrepOrder {
  orderId: string;
  serialNumber: number;
  customerName: string;
  eventDate: string | null;
  quantity: number;
  mealType: string | null;
  customization: string | null;
  numberOfMembers: number | null;
}

interface PrepItem {
  menuItem: {
    id: string;
    name: string;
    type: string[];
    price: number | null;
    unit: string | null;
  };
  totalQuantity: number;
  orders: PrepOrder[];
}

export default function KitchenPrepListPage() {
  const [prepList, setPrepList] = useState<PrepItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState<number>(10)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  useEffect(() => {
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setSelectedDate(dateStr);
  }, []);

  useEffect(() => {
    if (selectedDate !== '') {
      loadData()
    }
  }, [selectedDate])

  const loadData = async () => {
    try {
      setLoading(true)
      const url = selectedDate ? `/api/reports/prep-list?date=${selectedDate}` : '/api/reports/prep-list'
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch prep list')
      const data = await response.json()
      setPrepList(data)
    } catch (error) {
      console.error('Failed to load prep list:', error)
      toast.error('Failed to load prep list. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filteredPrepList = useMemo(() => {
    let filtered = prepList

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(item =>
        item.menuItem.name.toLowerCase().includes(searchLower) ||
        item.menuItem.type.some((t: string) => t.toLowerCase().includes(searchLower))
      )
    }

    return filtered
  }, [prepList, searchTerm])

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const handlePrint = () => {
    window.print();
  }

  const columns = [
    {
      key: 'menuItemName',
      header: 'Menu Item',
      accessor: (row: PrepItem) => (
        <div>
          <div className="font-bold text-slate-900 flex items-center gap-2">
            <FaUtensils className="text-slate-400 text-xs" />
            {row.menuItem.name}
          </div>
          <div className="flex gap-1 mt-1">
            {row.menuItem.type.map((t: string, idx: number) => (
              <span key={idx} className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase font-bold tracking-wider">
                {t}
              </span>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: 'totalQuantity',
      header: 'Total Required',
      accessor: (row: PrepItem) => (
        <div className="flex items-baseline gap-1.5">
          <span className="font-black text-2xl text-indigo-600">
            {row.totalQuantity}
          </span>
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
            {row.menuItem.unit || 'units'}
          </span>
        </div>
      ),
    },
    {
      key: 'orderCount',
      header: 'Orders',
      accessor: (row: PrepItem) => (
        <div className="flex flex-col items-start gap-1">
          <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md text-xs">
            {row.orders.length} Order(s)
          </span>
          <button 
            onClick={() => toggleRow(row.menuItem.id)}
            className="text-[10px] text-indigo-600 font-bold uppercase hover:underline flex items-center gap-1"
          >
            {expandedRows[row.menuItem.id] ? 'Hide Details' : 'View Details'}
            {expandedRows[row.menuItem.id] ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 print:bg-white print:p-0">
      {/* Header */}
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Kitchen Prep List (KDS)</h1>
            <p className="text-slate-500 mt-1">Consolidated view of all required menu items for preparation</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <FaCalendarAlt className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-bold text-slate-700 shadow-sm"
              />
            </div>
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                Clear Date
              </button>
            )}
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95 font-bold text-sm"
            >
              <FaPrint />
              Print List
            </button>
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block text-center mb-8 border-b-2 border-slate-900 pb-4">
          <h1 className="text-3xl font-black uppercase tracking-widest text-slate-900">Kitchen Prep List</h1>
          <p className="text-lg font-bold text-slate-600 mt-2">
            For: {selectedDate ? formatDate(selectedDate) : 'All Upcoming Orders'}
          </p>
        </div>

        {/* Filters Panel - hidden when printing */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                Search Menu Item
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3.5 top-3.5 text-slate-300" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="Search by name or category..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all placeholder:text-slate-300 text-sm font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Prep List Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border-none print:rounded-none">
          {loading ? (
             <div className="p-12 text-center text-slate-400 font-bold">Loading prep list...</div>
          ) : filteredPrepList.length === 0 ? (
             <div className="p-12 text-center">
               <h3 className="text-lg font-bold text-slate-700">No Prep Items Found</h3>
               <p className="text-slate-500 mt-1">There are no orders requiring preparation for the selected date.</p>
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {columns.map((col, idx) => (
                      <th key={idx} className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPrepList.map((row) => (
                    <React.Fragment key={row.menuItem.id}>
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        {columns.map((col, colIdx) => (
                          <td key={colIdx} className="px-6 py-4 align-top">
                            {col.accessor(row)}
                          </td>
                        ))}
                      </tr>
                      {expandedRows[row.menuItem.id] && (
                        <tr className="bg-indigo-50/30">
                          <td colSpan={columns.length} className="px-6 py-4">
                            <div className="rounded-xl border border-indigo-100 bg-white overflow-hidden shadow-sm">
                              <table className="w-full text-left text-sm">
                                <thead className="bg-indigo-50/50 text-[10px] font-black uppercase text-indigo-400 tracking-wider">
                                  <tr>
                                    <th className="px-4 py-2">Order #</th>
                                    <th className="px-4 py-2">Customer</th>
                                    <th className="px-4 py-2 text-right">Quantity</th>
                                    <th className="px-4 py-2">Details</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-indigo-50">
                                  {row.orders.map((order, oIdx) => (
                                    <tr key={oIdx}>
                                      <td className="px-4 py-3 font-bold text-slate-700">
                                        #{order.serialNumber}
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="font-medium text-slate-900">{order.customerName}</div>
                                        {order.eventDate && (
                                          <div className="text-[10px] text-slate-400">{formatDate(order.eventDate)}</div>
                                        )}
                                      </td>
                                      <td className="px-4 py-3 text-right font-bold text-indigo-600">
                                        {order.quantity}
                                      </td>
                                      <td className="px-4 py-3 text-xs text-slate-500">
                                        {order.mealType && (
                                          <span className="bg-slate-100 px-2 py-0.5 rounded-full mr-2">
                                            {order.mealType}
                                          </span>
                                        )}
                                        {order.customization && (
                                          <span className="italic">Note: {order.customization}</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
