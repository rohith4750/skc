'use client'

import { useEffect, useState } from 'react'
import { Storage } from '@/lib/storage-api'
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
  FaArrowDown
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
    totalRevenue: 0,
    totalExpenses: 0,
    pendingOrders: 0,
    completedOrders: 0,
    paidBills: 0,
    pendingBills: 0,
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
        
        // Order status counts
        const pendingOrders = orders.filter((o: any) => o.status === 'pending' || o.status === 'in-progress').length
        const completedOrders = orders.filter((o: any) => o.status === 'completed').length

        // Bill status counts
        const paidBills = bills.filter((b: any) => b.status === 'paid').length
        const pendingBills = bills.filter((b: any) => b.status === 'pending' || b.status === 'partial').length

        // Get user and workforce counts (only for super admin)
        let usersCount = 0
        let workforceCount = 0
        if (isSuperAdminUser) {
          try {
            const [usersRes, workforceRes] = await Promise.all([
              fetch('/api/users'),
              fetch('/api/workforce'),
            ])
            if (usersRes.ok) {
              const usersData = await usersRes.json()
              usersCount = usersData.length
            }
            if (workforceRes.ok) {
              const workforceData = await workforceRes.json()
              workforceCount = workforceData.length
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
          totalRevenue,
          totalExpenses,
          pendingOrders,
          completedOrders,
          paidBills,
          pendingBills,
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
      value: 'Coming Soon',
      icon: FaBox,
      color: 'bg-yellow-500',
      href: '#',
      disabled: true,
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
      <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 min-h-screen bg-gray-50">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Welcome</h1>
          <p className="text-gray-600 mt-2">Select an option to continue</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
          {adminLandingCards.map((card) => {
            const Icon = card.icon
            return (
              <Link
                key={card.title}
                href={card.href}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 p-6 group"
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`${card.color} p-4 rounded-full mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{card.title}</h3>
                  <p className="text-sm text-gray-600">{card.description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
          {isSuperAdminUser ? 'Complete Business Analytics & Management Overview' : 'Business Overview'}
        </p>
      </div>

      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {mainStatCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.title}
              href={stat.href}
              className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-600 text-xs sm:text-sm font-medium truncate">{stat.title}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1 sm:mt-2">{stat.value}</p>
                  {stat.subValue && (
                    <p className="text-xs text-gray-500 mt-1">{stat.subValue}</p>
                  )}
                </div>
                <div className={`${stat.color} p-3 sm:p-4 rounded-full flex-shrink-0 ml-3`}>
                  <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Admin Statistics Cards */}
      {isSuperAdminUser && adminStatCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {adminStatCards.map((stat) => {
            const Icon = stat.icon
            if (stat.disabled) {
              return (
                <div
                  key={stat.title}
                  className="bg-white rounded-lg shadow-md p-4 sm:p-6 opacity-60 cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-600 text-xs sm:text-sm font-medium truncate">{stat.title}</p>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1 sm:mt-2">{stat.value}</p>
                    </div>
                    <div className={`${stat.color} p-3 sm:p-4 rounded-full flex-shrink-0 ml-3`}>
                      <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                  </div>
                </div>
              )
            }
            return (
              <Link
                key={stat.title}
                href={stat.href}
                className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-600 text-xs sm:text-sm font-medium truncate">{stat.title}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1 sm:mt-2">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 sm:p-4 rounded-full flex-shrink-0 ml-3`}>
                    <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {analyticsCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.title} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
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

      {/* Quick Links */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Link href="/customers" className="p-3 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors text-center">
            <FaUsers className="w-6 h-6 text-primary-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-gray-700">Customers</p>
          </Link>
          <Link href="/orders" className="p-3 bg-accent-50 rounded-lg hover:bg-accent-100 transition-colors text-center">
            <FaShoppingCart className="w-6 h-6 text-accent-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-gray-700">New Order</p>
          </Link>
          <Link href="/orders/history" className="p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center">
            <FaFileInvoiceDollar className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-gray-700">Orders</p>
          </Link>
          <Link href="/bills" className="p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center">
            <FaFileInvoiceDollar className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-gray-700">Bills</p>
          </Link>
          <Link href="/expenses" className="p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-center">
            <FaMoneyBillWave className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-gray-700">Expenses</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
