'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { 
  FaHome, 
  FaUsers, 
  FaUtensils, 
  FaShoppingCart, 
  FaFileInvoiceDollar,
  FaUserTie,
  FaChevronLeft,
  FaChevronRight,
  FaMoneyBillWave,
  FaUserShield,
  FaBox,
  FaWarehouse,
  FaHistory,
  FaUserCircle,
  FaChartLine,
  FaFileInvoice,
  FaClipboardList,
  FaBell,
  FaEnvelope
} from 'react-icons/fa'
import { isSuperAdmin, getUserRole } from '@/lib/auth'

// Menu items organized by catering management workflow
const menuItems = [
  // 1. Core Business Operations - Order Management Flow
  { href: '/', icon: FaHome, label: 'Dashboard', section: 'core' },
  { href: '/alerts', icon: FaBell, label: 'Alerts', section: 'core' },
  { href: '/customers', icon: FaUsers, label: 'Customers', section: 'core' },
  { href: '/menu', icon: FaUtensils, label: 'Menu', section: 'core' },
  { href: '/orders', icon: FaShoppingCart, label: 'Create Order', section: 'core' },
  { href: '/orders/history', icon: FaHistory, label: 'Order History', section: 'core' },
  { href: '/orders/overview', icon: FaChartLine, label: 'Order Center', section: 'core' },
  { href: '/bills', icon: FaFileInvoiceDollar, label: 'Bills', section: 'core' },
  
  // 2. Financial Management
  { href: '/expenses', icon: FaMoneyBillWave, label: 'Expenses', requiredRole: 'super_admin', section: 'financial' },
  { href: '/workforce', icon: FaUserTie, label: 'Workforce', requiredRole: 'super_admin', section: 'financial' },
  { href: '/analytics', icon: FaChartLine, label: 'Analytics', requiredRole: 'super_admin', section: 'financial' },
  
  // 3. Tax Management
  { href: '/tax', icon: FaFileInvoice, label: 'Income Tax Return', requiredRole: 'super_admin', section: 'tax' },
  
  // 4. Inventory & Stock Management
  { href: '/stock', icon: FaBox, label: 'Stock', hideForRole: 'admin', section: 'inventory' },
  { href: '/inventory', icon: FaWarehouse, label: 'Inventory', hideForRole: 'admin', section: 'inventory' },
  
  // 5. System Administration
  { href: '/users', icon: FaUserShield, label: 'User Management', requiredRole: 'super_admin', section: 'system' },
  { href: '/audit-logs', icon: FaClipboardList, label: 'Login Audit Logs', requiredRole: 'super_admin', section: 'system' },
  { href: '/enquiries', icon: FaEnvelope, label: 'Enquiries', requiredRole: 'super_admin', section: 'system' },
  
  // 6. Profile
  { href: '/profile', icon: FaUserCircle, label: 'Profile', section: 'profile' },
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

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-0 z-50 bg-gray-900 text-white p-3 rounded-r-lg shadow-lg hover:bg-gray-800 active:scale-95 transition-all touch-manipulation"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <FaChevronLeft className="w-5 h-5 transition-transform" />
        ) : (
          <FaChevronRight className="w-5 h-5 transition-transform" />
        )}
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
          w-56 bg-gray-900 text-white shadow-xl
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col h-screen
        `}
      >
        {/* Brand Section - Fixed at top */}
        <div className="w-full border-b border-gray-800 flex-shrink-0 bg-gray-900 flex flex-col items-center justify-center py-2 px-2">
          <Link href="/" className="flex flex-col items-center">
            <Image 
              src="/images/logo-dark.png" 
              alt="SKC Logo" 
              width={80} 
              height={80}
              className="drop-shadow-lg"
              priority
            />
            <div className="text-[8px] text-amber-400/80 mt-0.5 font-medium tracking-wide">
              Proprietor: Telidevara Rajendraprasad
            </div>
          </Link>
        </div>
        
        {/* Navigation Menu - Scrollable */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 min-h-0">
          <div className="space-y-0.5 px-2">
            {(() => {
              // Filter menu items based on role first
              const filteredItems = menuItems.filter((item) => {
                if ('requiredRole' in item && item.requiredRole === 'super_admin' && !isSuperAdminUser) {
                  return false
                }
                if ('hideForRole' in item && item.hideForRole === userRole) {
                  return false
                }
                return true
              })

              // Group items by section
              const sections = {
                core: filteredItems.filter(item => item.section === 'core'),
                financial: filteredItems.filter(item => item.section === 'financial'),
                tax: filteredItems.filter(item => item.section === 'tax'),
                inventory: filteredItems.filter(item => item.section === 'inventory'),
                system: filteredItems.filter(item => item.section === 'system'),
                profile: filteredItems.filter(item => item.section === 'profile'),
              }

              const sectionTitles: Record<string, string> = {
                core: 'Order Management',
                financial: 'Financial Management',
                tax: 'Tax Management',
                inventory: 'Stock & Inventory',
                system: 'System Administration',
                profile: 'My Account',
              }

              const sectionOrder = ['core', 'financial', 'tax', 'inventory', 'system', 'profile']

              return sectionOrder.map((sectionKey, index) => {
                const items = sections[sectionKey as keyof typeof sections]
                if (items.length === 0) return null

                return (
                  <div key={sectionKey}>
                    {/* Section Header */}
                    <div className="px-3 py-1.5 mb-0.5">
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                        {sectionTitles[sectionKey]}
                      </span>
                    </div>
                    {/* Section Items */}
                    {items.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href
                      
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200 ${
                            isActive ? 'bg-gray-800 text-white shadow-md border-l-4 border-primary-500 font-semibold' : ''
                          }`}
                          onClick={() => setIsOpen(false)}
                        >
                          <Icon className="w-4 h-4 mr-2.5 flex-shrink-0" />
                          <span className="font-medium text-xs">{item.label}</span>
                        </Link>
                      )
                    })}
                    {/* Section Separator */}
                    {index < sectionOrder.length - 1 && (
                      <div className="mx-3 my-2 border-t border-gray-800"></div>
                    )}
                  </div>
                )
              })
            })()}
          </div>
        </nav>
      </div>
    </>
  )
}
