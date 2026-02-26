'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa'
import type { UserRole } from '@/lib/auth-storage'
import { getPermissions, getUserRole } from '@/lib/auth'
import { getSidebarSections, matchesRoute } from '@/constants/menu'
import { MENU_ICON_MAP } from '@/constants/menu-icons'

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [permissions, setPermissions] = useState<string[]>([])

  useEffect(() => {
    setUserRole(getUserRole())
    setPermissions(getPermissions())
  }, [])

  const sidebarSections = useMemo(
    () => getSidebarSections(userRole, permissions),
    [userRole, permissions]
  )

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
        className="lg:hidden fixed top-4 left-0 z-50 bg-slate-900/90 backdrop-blur-md text-white p-3 rounded-r-2xl shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-slate-700/50 border-l-0 hover:bg-slate-800 active:scale-95 transition-all duration-300 touch-manipulation"
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
          w-56 lg:w-72 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 shadow-[4px_0_24px_rgba(0,0,0,0.4)] border-r border-slate-800/50
          transform transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col h-screen
        `}
      >
        {/* Brand Section - Fixed at top */}
        <div className="w-full border-b border-slate-800/60 flex-shrink-0 bg-transparent flex flex-col items-center justify-center py-4 px-4 relative overflow-hidden">
          {/* Subtle glow effect behind logo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-amber-500/10 blur-2xl rounded-full pointer-events-none"></div>
          <Link href="/" className="flex flex-col items-center relative z-10 group">
            <div className="relative transform transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/images/logo-dark.png"
                alt="SKC Logo"
                width={80}
                height={80}
                className="drop-shadow-[0_0_15px_rgba(245,158,11,0.3)] w-20 h-20 lg:w-24 lg:h-24"
                priority
              />
            </div>
            <div className="text-[7.5px] whitespace-nowrap text-amber-400/90 mt-2 font-semibold tracking-widest uppercase opacity-80 group-hover:opacity-100 transition-opacity">
              Proprietor: Telidevara Rajendraprasad
            </div>
          </Link>
        </div>

        {/* Navigation Menu - Scrollable */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 min-h-0 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent dark-scrollbar">
          <div className="space-y-0.5 px-2">
            {sidebarSections.map((section, index) => (
              <div key={section.key}>
                {/* Section Header */}
                <div className="px-4 py-2 mt-2 mb-1">
                  <span className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center">
                    <span className="h-px w-3 bg-slate-700 mr-2 rounded-full"></span>
                    {section.title}
                  </span>
                </div>
                {/* Section Items */}
                {section.items.map((item) => {
                  const Icon = MENU_ICON_MAP[item.icon!]
                  const isActive = matchesRoute(pathname, item.route)

                  return (
                    <Link
                      key={item.route}
                      href={item.route}
                      className={`group flex items-center px-4 py-2.5 mx-2 mb-1 rounded-xl transition-all duration-300 ${isActive
                        ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-400 shadow-[inset_4px_0_0_rgba(245,158,11,1)] ring-1 ring-amber-500/20 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/50 hover:text-white hover:shadow-md'
                        }`}
                      onClick={() => setIsOpen(false)}
                    >
                      <Icon className={`w-4 h-4 mr-3 lg:w-5 lg:h-5 flex-shrink-0 transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'group-hover:scale-110 group-hover:text-amber-400/80'}`} />
                      <span className="font-medium text-sm tracking-wide">{item.name}</span>
                    </Link>
                  )
                })}
                {/* Section Separator */}
                {index < sidebarSections.length - 1 && (
                  <div className="mx-6 my-3 border-t border-slate-800/50"></div>
                )}
              </div>
            ))}
          </div>
        </nav >
      </div >
    </>
  )
}
