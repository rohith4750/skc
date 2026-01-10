'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  FaHome, 
  FaUsers, 
  FaUtensils, 
  FaShoppingCart, 
  FaFileInvoiceDollar,
  FaUserTie,
  FaBars,
  FaTimes,
  FaMoneyBillWave,
  FaSignOutAlt,
  FaUserShield,
  FaBox,
  FaWarehouse
} from 'react-icons/fa'
import Logo from '@/components/Logo'
import { clearAuth, isSuperAdmin, getUserRole } from '@/lib/auth'

const menuItems = [
  { href: '/', icon: FaHome, label: 'Home' },
  { href: '/customers', icon: FaUsers, label: 'Customers' },
  { href: '/menu', icon: FaUtensils, label: 'Menu' },
  { href: '/orders', icon: FaShoppingCart, label: 'Create Order' },
  { href: '/orders/history', icon: FaShoppingCart, label: 'Orders History' },
  { href: '/bills', icon: FaFileInvoiceDollar, label: 'Bills' },
  { href: '/expenses', icon: FaMoneyBillWave, label: 'Expenses', hideForRole: 'admin' },
  { href: '/workforce', icon: FaUserTie, label: 'Workforce', requiredRole: 'super_admin' },
  { href: '/users', icon: FaUserShield, label: 'User Management', requiredRole: 'super_admin' },
  { href: '/stock', icon: FaBox, label: 'Stock', hideForRole: 'admin' },
  { href: '/inventory', icon: FaWarehouse, label: 'Inventory', hideForRole: 'admin' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isSuperAdminUser, setIsSuperAdminUser] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    // Check role on mount and when pathname changes (in case user navigates after login)
    setIsSuperAdminUser(isSuperAdmin())
    setUserRole(getUserRole())
  }, [pathname])

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleLogout = () => {
    // Clear authentication data
    clearAuth()
    // Redirect to login page
    window.location.href = '/login'
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-gray-900 text-white p-3 rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-gray-900 text-white shadow-xl
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col h-screen
        `}
      >
        {/* Logo Section - Fixed at top */}
        <div className="w-full border-b border-gray-800 flex-shrink-0 bg-gray-900 flex items-center justify-center py-4">
          <div className="w-full px-4">
            <Logo variant="icon" size="lg" className="w-full" />
          </div>
        </div>
        
        {/* Navigation Menu - Scrollable */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 min-h-0">
          <div className="space-y-1 px-3">
            {menuItems.map((item) => {
              // Filter menu items based on role
              if ('requiredRole' in item && item.requiredRole === 'super_admin' && !isSuperAdminUser) {
                return null
              }

              // Hide items for specific roles (e.g., hide expenses/stock/inventory for admin)
              if ('hideForRole' in item && item.hideForRole === userRole) {
                return null
              }

              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200 ${
                    isActive ? 'bg-gray-800 text-white shadow-md border-l-4 border-primary-500 font-semibold' : ''
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
        
        {/* Logout Button - Fixed at Bottom */}
        <div className="border-t border-gray-800 flex-shrink-0 p-4 bg-gray-900">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full px-4 py-3 rounded-lg text-red-400 hover:bg-red-900 hover:bg-opacity-30 hover:text-red-300 transition-all duration-200 font-medium text-sm group"
          >
            <FaSignOutAlt className="w-5 h-5 mr-3 flex-shrink-0 group-hover:scale-110 transition-transform" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  )
}
