'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  FaHome, 
  FaUsers, 
  FaUtensils, 
  FaShoppingCart, 
  FaFileInvoiceDollar,
  FaUserTie
} from 'react-icons/fa'
import Logo from '@/components/Logo'

const menuItems = [
  { href: '/', icon: FaHome, label: 'Dashboard' },
  { href: '/customers', icon: FaUsers, label: 'Customers' },
  { href: '/menu', icon: FaUtensils, label: 'Menu' },
  { href: '/orders', icon: FaShoppingCart, label: 'Create Order' },
  { href: '/orders/history', icon: FaShoppingCart, label: 'Orders History' },
  { href: '/bills', icon: FaFileInvoiceDollar, label: 'Bills' },
  { href: '/supervisors', icon: FaUserTie, label: 'Supervisors' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-gray-900 text-white shadow-lg">
      <div className="p-6 border-b border-gray-800">
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
              className={`flex items-center px-6 py-4 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
                isActive ? 'bg-gray-800 text-white border-r-4 border-primary-500' : ''
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
