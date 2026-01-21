'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { FaUserCircle, FaSignOutAlt } from 'react-icons/fa'
import { clearAuth, getUserRole } from '@/lib/auth'
import NotificationCenter from '@/components/notifications/NotificationCenter'

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    setUserRole(getUserRole())
    
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  const handleLogout = () => {
    clearAuth()
    router.push('/login')
  }

  // Get page title from pathname
  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard'
    const path = pathname.replace('/', '').split('/')[0]
    return path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ')
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30 shadow-sm">
      <div className="h-full flex items-center justify-between px-4 lg:pl-72 lg:pr-6">
        {/* Page Title */}
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-800 hidden sm:block">
            {getPageTitle()}
          </h1>
          <div className="text-sm text-gray-500 hidden md:block">
            {formatDate(currentTime)} • {formatTime(currentTime)}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <NotificationCenter compact />
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-gray-800">
                {userRole === 'super_admin' ? 'Super Admin' : 'Admin'}
              </span>
              <span className="text-xs text-gray-500">Logged in</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white">
              <FaUserCircle className="w-6 h-6" />
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Logout"
          >
            <FaSignOutAlt className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
