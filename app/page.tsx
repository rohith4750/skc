'use client'

import { useEffect, useState } from 'react'
import { Storage } from '@/lib/storage-api'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { FaUsers, FaUtensils, FaShoppingCart, FaFileInvoiceDollar } from 'react-icons/fa'

export default function Dashboard() {
  const [stats, setStats] = useState({
    customers: 0,
    menuItems: 0,
    orders: 0,
    bills: 0,
    totalRevenue: 0,
  })

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [customers, menuItems, orders, bills] = await Promise.all([
          Storage.getCustomers(),
          Storage.getMenuItems(),
          Storage.getOrders(),
          Storage.getBills(),
        ])
        
        const totalRevenue = bills.reduce((sum: number, bill: any) => sum + (bill.paidAmount || 0), 0)

        setStats({
          customers: customers.length,
          menuItems: menuItems.length,
          orders: orders.length,
          bills: bills.length,
          totalRevenue,
        })
      } catch (error) {
        console.error('Failed to load stats:', error)
      }
    }
    loadStats()
  }, [])

  const statCards = [
    {
      title: 'Total Customers',
      value: stats.customers,
      icon: FaUsers,
      color: 'bg-blue-500',
      href: '/customers',
    },
    {
      title: 'Menu Items',
      value: stats.menuItems,
      icon: FaUtensils,
      color: 'bg-green-500',
      href: '/menu',
    },
    {
      title: 'Total Orders',
      value: stats.orders,
      icon: FaShoppingCart,
      color: 'bg-yellow-500',
      href: '/orders',
    },
    {
      title: 'Total Bills',
      value: stats.bills,
      icon: FaFileInvoiceDollar,
      color: 'bg-purple-500',
      href: '/bills',
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to Catering Management System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.title}
              href={stat.href}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-4 rounded-full`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Total Revenue</h2>
        <p className="text-4xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
      </div>
    </div>
  )
}
