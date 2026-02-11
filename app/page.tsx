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
    totalRevenue: 0,
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
        const [customers, menuItems, orders, bills, expenses] = await Promise.all([
          Storage.getCustomers(),
          Storage.getMenuItems(),
          Storage.getOrders(),
          Storage.getBills(),
          Storage.getExpenses(),
        ])

        // Calculate revenue from paid bills
        const totalRevenue = bills.reduce((sum: number, bill: any) => sum + (bill.paidAmount || 0), 0)
        const totalExpenses = expenses.reduce((sum: number, expense: any) => sum + (expense.amount || 0), 0)
        const totalBilled = bills.reduce((sum: number, bill: any) => sum + (bill.totalAmount || 0), 0)
        const totalReceivable = bills.reduce((sum: number, bill: any) => sum + (bill.remainingAmount || 0), 0)
        const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0
        const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0
        const collectionRate = totalBilled > 0 ? (totalRevenue / totalBilled) * 100 : 0
        
        // Order status counts
        const pendingOrders = orders.filter((o: any) => o.status === 'pending' || o.status === 'in-progress').length
        const completedOrders = orders.filter((o: any) => o.status === 'completed').length

        // Bill status counts
        const paidBills = bills.filter((b: any) => b.status === 'paid').length
        const pendingBills = bills.filter((b: any) => b.status === 'pending' || b.status === 'partial').length
        const pendingExpensesList = expenses.filter((expense: any) => {
          if (expense.paymentStatus) {
            return expense.paymentStatus !== 'paid'
          }
          return (expense.paidAmount || 0) < (expense.amount || 0)
        })
        const pendingExpenses = pendingExpensesList.length
        const outstandingExpenses = pendingExpensesList.reduce((sum: number, expense: any) => {
          const amount = expense.amount || 0
          const paidAmount = expense.paidAmount || 0
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
          totalRevenue,
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
  }, [isSuperAdminUser])

  const mainStatCards = [
    {
      title: 'Total Customers',
      value: stats.customers,
      icon: FaUsers,
      color: 'bg-primary-500',
      href: '/customers',
    },
    {
      title: 'Total Orders',
      value: stats.orders,
      icon: FaShoppingCart,
      color: 'bg-accent-500',
      href: '/orders/history',
      subValue: `${stats.pendingOrders} pending`,
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: FaFileInvoiceDollar,
      color: 'bg-green-500',
      href: '/bills',
      subValue: `${stats.paidBills} paid bills`,
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(stats.totalExpenses),
      icon: FaMoneyBillWave,
      color: 'bg-secondary-500',
      href: '/expenses',
    },
  ]

  const adminStatCards = isSuperAdminUser ? [
    {
      title: 'Menu Items',
      value: stats.menuItems,
      icon: FaUtensils,
      color: 'bg-primary-600',
      href: '/menu',
    },
    {
      title: 'Users',
      value: stats.users,
      icon: FaUserShield,
      color: 'bg-purple-500',
      href: '/users',
    },
    {
      title: 'Workforce',
      value: stats.workforce,
      icon: FaUserTie,
      color: 'bg-blue-500',
      href: '/workforce',
    },
    {
      title: 'Stock Management',
      value: stats.stockItems,
      icon: FaBox,
      color: 'bg-yellow-500',
      href: '/stock',
      subValue: `${stats.lowStockItems} low stock`,
    },
    {
      title: 'Inventory Items',
      value: stats.inventoryItems,
      icon: FaWarehouse,
      color: 'bg-gray-600',
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
      title: 'Financial Summary',
      icon: FaMoneyBillWave,
      items: [
        { label: 'Revenue', value: formatCurrency(stats.totalRevenue), color: 'text-green-600', icon: FaArrowUp },
        { label: 'Expenses', value: formatCurrency(stats.totalExpenses), color: 'text-red-600', icon: FaArrowDown },
        { label: 'Net Profit', value: formatCurrency(stats.totalRevenue - stats.totalExpenses), color: stats.totalRevenue - stats.totalExpenses >= 0 ? 'text-green-600' : 'text-red-600' },
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
      <div className="mb-4 sm:mb-5 md:mb-6 lg:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 text-center sm:text-left">Dashboard</h1>
        <p className="text-gray-600 mt-1 sm:mt-1.5 md:mt-2 text-xs sm:text-sm md:text-base text-center sm:text-left">
          {isSuperAdminUser ? 'Complete Business Analytics & Management Overview' : 'Business Overview'}
        </p>
      </div>

      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 mb-4 sm:mb-5 md:mb-6 lg:mb-8">
        {mainStatCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.title}
              href={stat.href}
              className="bg-white rounded-lg shadow-md p-4 sm:p-5 md:p-6 hover:shadow-lg active:scale-[0.98] transition-all relative overflow-hidden"
            >
              {/* Icon at top right corner */}
              <div className={`${stat.color} absolute top-0 right-0 p-3 sm:p-4 rounded-bl-2xl`}>
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              
              {/* Content */}
              <div className="relative pr-12 sm:pr-16">
                <p className="text-gray-600 text-xs sm:text-sm font-medium mb-3">{stat.title}</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 break-words leading-tight">{stat.value}</p>
                {stat.subValue && (
                  <p className="text-xs text-gray-500 mt-2">{stat.subValue}</p>
                )}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Admin Statistics Cards */}
      {isSuperAdminUser && adminStatCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 mb-4 sm:mb-5 md:mb-6 lg:mb-8">
          {adminStatCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Link
                key={stat.title}
                href={stat.href}
                className="bg-white rounded-lg shadow-md p-4 sm:p-5 md:p-6 hover:shadow-lg active:scale-[0.98] transition-all relative overflow-hidden"
              >
                {/* Icon at top right corner */}
                <div className={`${stat.color} absolute top-0 right-0 p-3 sm:p-4 rounded-bl-2xl`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                
                {/* Content */}
                <div className="relative pr-12 sm:pr-16">
                  <p className="text-gray-600 text-xs sm:text-sm font-medium mb-3">{stat.title}</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 break-words leading-tight">{stat.value}</p>
                  {'subValue' in stat && stat.subValue && (
                    <p className="text-xs text-gray-500 mt-2">{stat.subValue}</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6 mb-4 sm:mb-5 md:mb-6 lg:mb-8">
        {analyticsCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.title} className="bg-white rounded-lg shadow-md p-4 sm:p-5 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary-100 p-2 rounded-lg">
                  <Icon className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-800">{card.title}</h2>
              </div>
              <div className="space-y-3">
                {card.items.map((item, idx) => {
                  const ItemIcon = 'icon' in item ? item.icon : null
                  return (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <span className="text-sm text-gray-600">{item.label}</span>
                      <div className="flex items-center gap-2">
                        {ItemIcon && <ItemIcon className={`w-4 h-4 ${item.color}`} />}
                        <span className={`text-sm font-semibold ${item.color}`}>{item.value}</span>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 mb-4 sm:mb-5 md:mb-6 lg:mb-8">
          {superAdminHighlights.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.title} className="bg-white rounded-lg shadow-md p-4 sm:p-5 md:p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-600">{card.title}</h3>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <p className={`text-lg sm:text-xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-xs text-gray-500 mt-2">{card.note}</p>
              </div>
            )
          })}
        </div>
      )}

      {isSuperAdminUser && superAdminAlerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 lg:mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FaExclamationTriangle className="text-orange-500" />
            <h2 className="text-base sm:text-lg font-bold text-gray-800">Operational Alerts</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {superAdminAlerts.map((alert) => (
              <div key={alert.label} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">{alert.label}</p>
                <p className={`text-sm font-semibold ${alert.color}`}>{alert.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 md:p-6">
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
          <Link href="/customers" className="p-3 sm:p-4 bg-primary-50 rounded-lg hover:bg-primary-100 active:scale-95 transition-all text-center touch-manipulation">
            <FaUsers className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 mx-auto mb-1.5 sm:mb-2" />
            <p className="text-xs sm:text-sm font-medium text-gray-700">Customers</p>
          </Link>
          <Link href="/orders" className="p-3 sm:p-4 bg-accent-50 rounded-lg hover:bg-accent-100 active:scale-95 transition-all text-center touch-manipulation">
            <FaShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-accent-600 mx-auto mb-1.5 sm:mb-2" />
            <p className="text-xs sm:text-sm font-medium text-gray-700">New Order</p>
          </Link>
          <Link href="/orders/history" className="p-3 sm:p-4 bg-blue-50 rounded-lg hover:bg-blue-100 active:scale-95 transition-all text-center touch-manipulation">
            <FaFileInvoiceDollar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mx-auto mb-1.5 sm:mb-2" />
            <p className="text-xs sm:text-sm font-medium text-gray-700">Orders</p>
          </Link>
          <Link href="/bills" className="p-3 sm:p-4 bg-green-50 rounded-lg hover:bg-green-100 active:scale-95 transition-all text-center touch-manipulation">
            <FaFileInvoiceDollar className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mx-auto mb-1.5 sm:mb-2" />
            <p className="text-xs sm:text-sm font-medium text-gray-700">Bills</p>
          </Link>
          <Link href="/expenses" className="p-3 sm:p-4 bg-red-50 rounded-lg hover:bg-red-100 active:scale-95 transition-all text-center touch-manipulation">
            <FaMoneyBillWave className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 mx-auto mb-1.5 sm:mb-2" />
            <p className="text-xs sm:text-sm font-medium text-gray-700">Expenses</p>
          </Link>
          {isSuperAdminUser && (
            <>
              <Link href="/users" className="p-3 sm:p-4 bg-purple-50 rounded-lg hover:bg-purple-100 active:scale-95 transition-all text-center touch-manipulation">
                <FaUserShield className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 mx-auto mb-1.5 sm:mb-2" />
                <p className="text-xs sm:text-sm font-medium text-gray-700">Users</p>
              </Link>
              <Link href="/workforce" className="p-3 sm:p-4 bg-blue-50 rounded-lg hover:bg-blue-100 active:scale-95 transition-all text-center touch-manipulation">
                <FaUserTie className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mx-auto mb-1.5 sm:mb-2" />
                <p className="text-xs sm:text-sm font-medium text-gray-700">Workforce</p>
              </Link>
              <Link href="/stock" className="p-3 sm:p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 active:scale-95 transition-all text-center touch-manipulation">
                <FaBox className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 mx-auto mb-1.5 sm:mb-2" />
                <p className="text-xs sm:text-sm font-medium text-gray-700">Stock</p>
              </Link>
              <Link href="/inventory" className="p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 active:scale-95 transition-all text-center touch-manipulation">
                <FaWarehouse className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 mx-auto mb-1.5 sm:mb-2" />
                <p className="text-xs sm:text-sm font-medium text-gray-700">Inventory</p>
              </Link>
              <Link href="/analytics" className="p-3 sm:p-4 bg-primary-50 rounded-lg hover:bg-primary-100 active:scale-95 transition-all text-center touch-manipulation">
                <FaChartLine className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 mx-auto mb-1.5 sm:mb-2" />
                <p className="text-xs sm:text-sm font-medium text-gray-700">Analytics</p>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
