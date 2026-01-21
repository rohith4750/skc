'use client'

import { useMemo, useState } from 'react'
import { FaBell, FaCircle } from 'react-icons/fa'
import { isAuthenticated } from '@/lib/auth'
import { useNotifications } from './useNotifications'

export default function NotificationCenter({ compact = false }: { compact?: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const enabled = isAuthenticated()
  const { notifications, connected, unreadCount } = useNotifications(enabled)

  const badge = useMemo(() => {
    if (!unreadCount) return null
    return unreadCount > 99 ? '99+' : `${unreadCount}`
  }, [unreadCount])

  if (!enabled) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative flex items-center gap-2 rounded-full ${
          compact ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'
        } px-3 py-2 shadow-sm transition-colors`}
        aria-label="Toggle notifications"
      >
        <FaBell className="text-sm" />
        {!compact && <span className="text-sm font-semibold">Notifications</span>}
        {badge && (
          <span className="ml-1 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold text-white">
            {badge}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 max-w-[90vw] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden z-50">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800">Realtime Updates</span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  connected ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}
              >
                <FaCircle className="text-[6px]" />
                {connected ? 'Live' : 'Offline'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              Close
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">No notifications yet.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {notifications.map((item) => (
                  <li key={item.id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                    <div className="text-sm font-semibold text-slate-800">{item.title}</div>
                    <div className="text-xs text-slate-500">{item.message}</div>
                    <div className="mt-1 text-[10px] text-slate-400">
                      {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
