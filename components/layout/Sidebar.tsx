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
  FaMoneyBillWave
} from 'react-icons/fa'
import Logo from '@/components/Logo'

const menuItems = [
  { href: '/', icon: FaHome, label: 'Dashboard' },
  { href: '/customers', icon: FaUsers, label: 'Customers' },
  { href: '/menu', icon: FaUtensils, label: 'Menu' },
  { href: '/orders', icon: FaShoppingCart, label: 'Create Order' },
  { href: '/orders/history', icon: FaShoppingCart, label: 'Orders History' },
  { href: '/bills', icon: FaFileInvoiceDollar, label: 'Bills' },
  { href: '/expenses', icon: FaMoneyBillWave, label: 'Expenses' },
  { href: '/supervisors', icon: FaUserTie, label: 'Supervisors' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

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
          w-64 bg-gray-900 text-white shadow-lg
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-4 lg:p-6 border-b border-gray-800">
          <Logo variant="compact" size="sm" textColor="white" />
        </div>
        
        <nav className="mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 lg:px-6 py-3 lg:py-4 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
                  isActive ? 'bg-gray-800 text-white border-r-4 border-primary-500' : ''
                }`}
                onClick={() => setIsOpen(false)}
              >
                <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
