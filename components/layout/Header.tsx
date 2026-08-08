"use client";
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { FaUserCircle, FaSignOutAlt, FaChevronLeft } from 'react-icons/fa'
import { clearAuth, getUserRole } from '@/lib/auth'
import NotificationCenter from '@/components/notifications/NotificationCenter'
import { getRouteTitle } from '@/constants/menu'

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
    <header className="fixed top-0 left-0 right-0 lg:left-64 xl:left-72 h-14 bg-white border-b border-gray-200 lg:border-l lg:border-gray-200 z-[100000] shadow-xs">
      <div className="h-full flex items-center justify-between px-4 lg:pl-6 lg:pr-6">
        {/* Page Title & Back Button */}
        <div className="flex items-center gap-3">
          {pathname !== '/' && (
            <button
              onClick={() => router.back()}
              className="p-1.5 px-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-[5px] transition-all flex items-center gap-1.5 group font-bold text-xs border border-slate-200 hover:border-slate-300"
              title="Go Back"
            >
              <FaChevronLeft className="w-2.5 h-2.5 group-hover:-translate-x-0.5 transition-transform text-slate-400 group-hover:text-slate-700" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
          <h1 className="text-base font-bold text-slate-800 hidden sm:block">
            {getRouteTitle(pathname)}
          </h1>
          <div className="text-xs text-slate-400 font-medium hidden md:block">
            {formatDate(currentTime)} • {formatTime(currentTime)}
          </div>
        </div>

        {/* Right Section - Explicit Profile & Logout Action Buttons */}
        <div className="flex items-center gap-2.5">
          <NotificationCenter compact />

          {/* Profile Action Button */}
          <Link
            href="/profile"
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-[5px] hover:bg-slate-100 hover:border-slate-300 transition-all shadow-xs group"
            title="View Profile Settings"
          >
            <div className="w-6 h-6 rounded-[5px] bg-indigo-600 text-white flex items-center justify-center text-xs shadow-xs">
              <FaUserCircle className="w-4 h-4" />
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-none group-hover:text-indigo-600 transition-colors">
                {userRole === 'super_admin' ? 'Super Admin' : 'Admin'}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 leading-tight">Profile</span>
            </div>
          </Link>

          {/* Logout Action Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white rounded-[5px] transition-all text-xs font-bold shadow-xs group"
            title="Sign out of system"
          >
            <FaSignOutAlt className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}
