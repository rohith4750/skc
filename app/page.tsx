'use client'

import { useEffect, useState } from 'react'
import { Storage } from '@/lib/storage-api'
import { fetchWithLoader } from '@/lib/fetch-with-loader'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import {
  FaUsers,
  FaUtensils,
  FaShoppingCart,
  FaFileInvoiceDollar,
  FaMoneyBillWave,
  FaUserShield,
  FaUserTie,
  FaBox,
  FaWarehouse,
  FaChartLine,
  FaArrowUp,
  FaArrowDown,
  FaExclamationTriangle,
  FaWallet,
  FaPercent,
  FaCalculator
} from 'react-icons/fa'
import { isSuperAdmin, getUserRole } from '@/lib/auth'

export default function Dashboard() {
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    setUserRole(getUserRole())
  }, [])

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [stats, setStats] = useState({
    customers: 0,
    menuItems: 0,
    orders: 0,
    bills: 0,
    expenses: 0,
    users: 0,
    workforce: 0,
    stockItems: 0,
    lowStockItems: 0,
    inventoryItems: 0,
    totalCollected: 0,
    totalExpenses: 0,
    totalBilled: 0,
    totalReceivable: 0,
    avgOrderValue: 0,
    profitMargin: 0,
    collectionRate: 0,
    pendingOrders: 0,
    completedOrders: 0,
    paidBills: 0,
    pendingBills: 0,
    pendingExpenses: 0,
    outstandingExpenses: 0,
  })
  const [loading, setLoading] = useState(true)
  const [isSuperAdminUser, setIsSuperAdminUser] = useState(false)

  useEffect(() => {
    setIsSuperAdminUser(isSuperAdmin())
  }, [])

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [customers, menuItems, rawOrders, rawBills, rawExpenses] = await Promise.all([
          Storage.getCustomers(),
          Storage.getMenuItems(),
          Storage.getOrders(),
          Storage.getBills(),
          Storage.getExpenses(),
        ])

        // Filter by catering date (eventDate)
        const filterByMonthYear = (itemDate: string | Date | null) => {
          if (!itemDate) return false
          const d = new Date(itemDate)
          return (d.getMonth() + 1) === selectedMonth && d.getFullYear() === selectedYear
        }

        const orders = rawOrders.filter((o: any) => filterByMonthYear(o.eventDate))
        const bills = rawBills.filter((b: any) => filterByMonthYear(b.order?.eventDate))
        const expenses = rawExpenses.filter((e: any) => filterByMonthYear(e.eventDate))

        // Calculate financial stats
        const totalCollected = bills.reduce((sum: number, bill: any) => sum + (parseFloat(bill.paidAmount) || 0), 0)
        const totalExpenses = expenses.reduce((sum: number, expense: any) => sum + (parseFloat(expense.amount) || 0), 0)
        const totalBilled = bills.reduce((sum: number, bill: any) => sum + (parseFloat(bill.totalAmount) || 0), 0)
        const totalReceivable = bills.reduce((sum: number, bill: any) => sum + (parseFloat(bill.remainingAmount) || 0), 0)
        const avgOrderValue = orders.length > 0 ? totalBilled / orders.length : 0
        const profitMargin = totalBilled > 0 ? ((totalBilled - totalExpenses) / totalBilled) * 100 : 0
        const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0

        // Order status counts
        const pendingOrders = orders.filter((o: any) => o.status === 'pending' || o.status === 'in_progress').length
        const completedOrders = orders.filter((o: any) => o.status === 'completed').length

        // Bill status counts
        const paidBills = bills.filter((b: any) => b.status === 'paid').length
        const pendingBills = bills.filter((b: any) => b.status === 'pending' || b.status === 'partial').length
        const pendingExpensesList = expenses.filter((expense: any) => {
          if (expense.paymentStatus) {
            return expense.paymentStatus !== 'paid'
          }
          return (parseFloat(expense.paidAmount) || 0) < (parseFloat(expense.amount) || 0)
        })
        const pendingExpenses = pendingExpensesList.length
        const outstandingExpenses = pendingExpensesList.reduce((sum: number, expense: any) => {
          const amount = parseFloat(expense.amount) || 0
          const paidAmount = parseFloat(expense.paidAmount) || 0
          return sum + Math.max(0, amount - paidAmount)
        }, 0)

        // Get user and workforce counts (only for super admin)
        let usersCount = 0
        let workforceCount = 0
        let stockItems = 0
        let lowStockItems = 0
        let inventoryItems = 0
        if (isSuperAdminUser) {
          try {
            const [usersRes, workforceRes, stockRes, inventoryRes] = await Promise.all([
              fetchWithLoader('/api/users'),
              fetchWithLoader('/api/workforce'),
              fetchWithLoader('/api/stock'),
              fetchWithLoader('/api/inventory'),
            ])
            if (usersRes.ok) {
              const usersData = await usersRes.json()
              usersCount = usersData.length
            }
            if (workforceRes.ok) {
              const workforceData = await workforceRes.json()
              workforceCount = workforceData.length
            }
            if (stockRes.ok) {
              const stockData = await stockRes.json()
              stockItems = stockData.length
              lowStockItems = stockData.filter((item: any) => {
                if (item.minStock === null || item.minStock === undefined) return false
                return (item.currentStock || 0) <= item.minStock
              }).length
            }
            if (inventoryRes.ok) {
              const inventoryData = await inventoryRes.json()
              inventoryItems = inventoryData.length
            }
          } catch (error) {
            console.error('Error fetching admin stats:', error)
          }
        }

        setStats({
          customers: customers.length,
          menuItems: menuItems.length,
          orders: orders.length,
          bills: bills.length,
          expenses: expenses.length,
          users: usersCount,
          workforce: workforceCount,
          stockItems,
          lowStockItems,
          inventoryItems,
          totalCollected,
          totalExpenses,
          totalBilled,
          totalReceivable,
          avgOrderValue,
          profitMargin,
          collectionRate,
          pendingOrders,
          completedOrders,
          paidBills,
          pendingBills,
          pendingExpenses,
          outstandingExpenses,
        })
      } catch (error) {
        console.error('Failed to load stats:', error)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [isSuperAdminUser, selectedMonth, selectedYear])

  const mainStatCards = [
    {
      title: 'Total Customers',
      value: stats.customers,
      icon: FaUsers,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      href: '/customers',
    },
    {
      title: 'Total Billed (Gross)',
      value: formatCurrency(stats.totalBilled),
      icon: FaFileInvoiceDollar,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      href: '/bills',
      subValue: `Collected: ${formatCurrency(stats.totalCollected)}`,
    },
    {
      title: 'Total Collected',
      value: formatCurrency(stats.totalCollected),
      icon: FaArrowUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      href: '/bills',
      subValue: `Collected: ${formatCurrency(stats.totalCollected)}`,
    },
    {
      title: 'Net Profit',
      value: formatCurrency(stats.totalBilled - stats.totalExpenses),
      icon: FaChartLine,
      color: stats.totalBilled - stats.totalExpenses >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: stats.totalBilled - stats.totalExpenses >= 0 ? 'bg-green-50' : 'bg-red-50',
      href: '/analytics',
      subValue: `${stats.profitMargin.toFixed(1)}% margin`,
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(stats.totalExpenses),
      icon: FaMoneyBillWave,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      href: '/expenses',
      subValue: `${stats.pendingExpenses} pending`,
    },
  ]

  const adminStatCards = isSuperAdminUser ? [
    {
      title: 'Menu Items',
      value: stats.menuItems,
      icon: FaUtensils,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      href: '/menu',
    },
    {
      title: 'Users',
      value: stats.users,
      icon: FaUserShield,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      href: '/users',
    },
    {
      title: 'Workforce',
      value: stats.workforce,
      icon: FaUserTie,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '/workforce',
    },
    {
      title: 'Stock',
      value: stats.stockItems,
      icon: FaBox,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      href: '/stock',
      subValue: `${stats.lowStockItems} low stock`,
    },
    {
      title: 'Inventory',
      value: stats.inventoryItems,
      icon: FaWarehouse,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      href: '/inventory',
    },
  ] : []

  const analyticsCards = [
    {
      title: 'Order Status',
      icon: FaChartLine,
      items: [
        { label: 'Completed', value: stats.completedOrders, color: 'text-green-600' },
        { label: 'Pending', value: stats.pendingOrders, color: 'text-yellow-600' },
        { label: 'Total', value: stats.orders, color: 'text-gray-600' },
      ],
    },
    {
      title: 'Payment Status',
      icon: FaFileInvoiceDollar,
      items: [
        { label: 'Paid Bills', value: stats.paidBills, color: 'text-green-600' },
        { label: 'Pending Bills', value: stats.pendingBills, color: 'text-red-600' },
        { label: 'Total Bills', value: stats.bills, color: 'text-gray-600' },
      ],
    },
    {
      title: 'Financial Summary (Gross)',
      icon: FaMoneyBillWave,
      items: [
        { label: 'Gross Revenue', value: formatCurrency(stats.totalBilled), color: 'text-green-600', icon: FaArrowUp },
        { label: 'Total Expenses', value: formatCurrency(stats.totalExpenses), color: 'text-red-600', icon: FaArrowDown },
        { label: 'Total Collected', value: formatCurrency(stats.totalCollected), color: 'text-green-600', icon: FaArrowUp },
        { label: 'Net Profit (Gross)', value: formatCurrency(stats.totalBilled - stats.totalExpenses - stats.totalCollected), color: stats.totalBilled - stats.totalExpenses >= 0 ? 'text-green-600' : 'text-red-600' },
      ],
    },
  ]

  const superAdminHighlights = isSuperAdminUser ? [
    {
      title: 'Outstanding Receivables',
      value: formatCurrency(stats.totalReceivable),
      icon: FaWallet,
      color: 'text-orange-600',
      note: `${stats.pendingBills} pending bills`,
    },
    {
      title: 'Collection Rate',
      value: `${stats.collectionRate.toFixed(1)}%`,
      icon: FaPercent,
      color: stats.collectionRate >= 80 ? 'text-green-600' : 'text-yellow-600',
      note: 'Paid vs billed',
    },
    {
      title: 'Profit Margin',
      value: `${stats.profitMargin.toFixed(1)}%`,
      icon: FaChartLine,
      color: stats.profitMargin >= 0 ? 'text-green-600' : 'text-red-600',
      note: 'Net profit ratio',
    },
    {
      title: 'Average Order Value',
      value: formatCurrency(stats.avgOrderValue),
      icon: FaCalculator,
      color: 'text-blue-600',
      note: 'Revenue per order',
    },
  ] : []

  const superAdminAlerts = isSuperAdminUser ? [
    {
      label: 'Pending Orders',
      value: stats.pendingOrders,
      color: 'text-yellow-600',
    },
    {
      label: 'Pending Bills',
      value: stats.pendingBills,
      color: 'text-red-600',
    },
    {
      label: 'Unpaid Expenses',
      value: stats.pendingExpenses,
      color: 'text-orange-600',
    },
    {
      label: 'Outstanding Expenses',
      value: formatCurrency(stats.outstandingExpenses),
      color: 'text-orange-700',
    },
  ] : []

  // Simple landing page cards for admin users
  const adminLandingCards = [
    {
      title: 'Customers',
      description: 'Add new customer',
      icon: FaUsers,
      color: 'bg-blue-500 hover:bg-blue-600',
      href: '/customers/create',
    },
    {
      title: 'Create Order',
      description: 'Create new orders',
      icon: FaShoppingCart,
      color: 'bg-green-500 hover:bg-green-600',
      href: '/orders',
    },
    {
      title: 'Orders History',
      description: 'View all orders',
      icon: FaShoppingCart,
      color: 'bg-purple-500 hover:bg-purple-600',
      href: '/orders/history',
    },
    {
      title: 'Bills',
      description: 'Manage bills and invoices',
      icon: FaFileInvoiceDollar,
      color: 'bg-orange-500 hover:bg-orange-600',
      href: '/bills',
    },
    {
      title: 'Menu',
      description: 'Manage menu items',
      icon: FaUtensils,
      color: 'bg-red-500 hover:bg-red-600',
      href: '/menu',
    },
  ]

  // Simple landing page for admin users
  if (userRole === 'admin' && !isSuperAdminUser) {
    return (
      <div className="p-3 sm:p-4 md:p-5 lg:p-5 xl:p-6 pt-12 sm:pt-14 lg:pt-5 xl:pt-6 min-h-screen bg-gray-50">
        <div className="mb-4 sm:mb-5 md:mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 text-center sm:text-left">Welcome</h1>
          <p className="text-gray-600 mt-1 sm:mt-1.5 md:mt-2 text-sm sm:text-base text-center sm:text-left">Select an option to continue</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6 max-w-5xl">
          {adminLandingCards.map((card) => {
            const Icon = card.icon
            return (
              <Link
                key={card.title}
                href={card.href}
                className="bg-white rounded-xl shadow-md hover:shadow-xl active:scale-[0.98] transition-all duration-200 p-4 sm:p-5 md:p-6 group touch-manipulation"
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`${card.color} p-3 sm:p-4 rounded-full mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-1.5 sm:mb-2">{card.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{card.description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 md:p-5 lg:p-5 xl:p-6 pt-12 sm:pt-14 lg:pt-5 xl:pt-6">
      <div className="mb-4 sm:mb-5 md:mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 text-center sm:text-left">Dashboard</h1>
          <p className="text-gray-600 mt-1 sm:mt-1.5 md:mt-2 text-xs sm:text-sm md:text-base text-center sm:text-left">
            {isSuperAdminUser ? 'Complete Business Analytics & Management Overview' : 'Business Overview'}
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-center sm:justify-end gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="bg-transparent text-sm font-bold text-gray-700 outline-none px-2 py-1 cursor-pointer"
          >
            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="bg-transparent text-sm font-bold text-gray-700 outline-none px-2 py-1 cursor-pointer"
          >
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6 lg:mb-8">
        {mainStatCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.title}
              href={stat.href}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-primary-100 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  {stat.subValue && (
                    <p className="text-xs font-medium text-gray-400 mt-1">{stat.subValue}</p>
                  )}
                </div>
                <div className={`${stat.bgColor} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Admin Statistics Cards */}
      {isSuperAdminUser && adminStatCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5 mb-6 lg:mb-8">
          {adminStatCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Link
                key={stat.title}
                href={stat.href}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-primary-100 transition-all duration-300 group"
              >
                <div className="flex items-center gap-4">
                  <div className={`${stat.bgColor} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-medium">{stat.title}</p>
                    <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {analyticsCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-50 p-2.5 rounded-xl">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-800">{card.title}</h2>
              </div>
              <div className="space-y-4">
                {card.items.map((item, idx) => {
                  const ItemIcon = 'icon' in item ? item.icon : null
                  return (
                    <div key={idx} className="flex items-center justify-between group">
                      <span className="text-sm font-medium text-gray-500">{item.label}</span>
                      <div className="flex items-center gap-2">
                        {ItemIcon && <ItemIcon className={`w-3.5 h-3.5 ${item.color}`} />}
                        <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {isSuperAdminUser && superAdminHighlights.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {superAdminHighlights.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{card.title}</h3>
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <Icon className={`w-4 h-4 ${card.color}`} />
                    </div>
                  </div>
                  <p className={`text-2xl font-black ${card.color}`}>{card.value}</p>
                </div>
                <p className="text-xs font-medium text-gray-400 mt-4 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-200"></span>
                  {card.note}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {isSuperAdminUser && superAdminAlerts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-orange-50 p-2 rounded-xl">
              <FaExclamationTriangle className="w-5 h-5 text-orange-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Operational Alerts</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {superAdminAlerts.map((alert) => (
              <div key={alert.label} className="bg-gray-50/50 rounded-xl p-4 border border-gray-50">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-tight">{alert.label}</p>
                <p className={`text-lg font-bold ${alert.color}`}>{alert.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-6 font-display">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          <Link href="/customers" className="p-4 bg-primary-50/50 rounded-2xl hover:bg-primary-50 transition-all text-center border border-transparent hover:border-primary-100 group">
            <FaUsers className="w-6 h-6 text-primary-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-gray-700">Customers</p>
          </Link>
          <Link href="/orders" className="p-4 bg-accent-50/50 rounded-2xl hover:bg-accent-50 transition-all text-center border border-transparent hover:border-accent-100 group">
            <FaShoppingCart className="w-6 h-6 text-accent-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-gray-700">New Order</p>
          </Link>
          <Link href="/orders/history" className="p-4 bg-blue-50/50 rounded-2xl hover:bg-blue-50 transition-all text-center border border-transparent hover:border-blue-100 group">
            <FaFileInvoiceDollar className="w-6 h-6 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-gray-700">Orders</p>
          </Link>
          <Link href="/bills" className="p-4 bg-green-50/50 rounded-2xl hover:bg-green-50 transition-all text-center border border-transparent hover:border-green-100 group">
            <FaFileInvoiceDollar className="w-6 h-6 text-green-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-gray-700">Bills</p>
          </Link>
          <Link href="/expenses" className="p-4 bg-red-50/50 rounded-2xl hover:bg-red-50 transition-all text-center border border-transparent hover:border-red-100 group">
            <FaMoneyBillWave className="w-6 h-6 text-red-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-gray-700">Expenses</p>
          </Link>
          {isSuperAdminUser && (
            <>
              <Link href="/users" className="p-4 bg-purple-50/50 rounded-2xl hover:bg-purple-50 transition-all text-center border border-transparent hover:border-purple-100 group">
                <FaUserShield className="w-6 h-6 text-purple-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-bold text-gray-700">Users</p>
              </Link>
              <Link href="/workforce" className="p-4 bg-blue-50/50 rounded-2xl hover:bg-blue-50 transition-all text-center border border-transparent hover:border-blue-100 group">
                <FaUserTie className="w-6 h-6 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-bold text-gray-700">Workforce</p>
              </Link>
              <Link href="/stock" className="p-4 bg-yellow-50/50 rounded-2xl hover:bg-yellow-50 transition-all text-center border border-transparent hover:border-yellow-100 group">
                <FaBox className="w-6 h-6 text-yellow-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-bold text-gray-700">Stock</p>
              </Link>
              <Link href="/inventory" className="p-4 bg-gray-50/50 rounded-2xl hover:bg-gray-50 transition-all text-center border border-transparent hover:border-gray-200 group">
                <FaWarehouse className="w-6 h-6 text-gray-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-bold text-gray-700">Inventory</p>
              </Link>
              <Link href="/analytics" className="p-4 bg-blue-50/50 rounded-2xl hover:bg-blue-50 transition-all text-center border border-transparent hover:border-blue-100 group">
                <FaChartLine className="w-6 h-6 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-bold text-gray-700">Analytics</p>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
