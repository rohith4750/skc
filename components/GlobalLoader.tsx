'use client'

import { useEffect, useMemo, useState } from 'react'
import { getGlobalLoaderEventNames } from '@/lib/loading-events'

export default function GlobalLoader() {
  const [pendingCount, setPendingCount] = useState(0)
  const [visible, setVisible] = useState(false)
  const eventNames = useMemo(() => getGlobalLoaderEventNames(), [])

  useEffect(() => {
    let showTimer: ReturnType<typeof setTimeout> | null = null

    const handleStart = () => {
      setPendingCount((count) => count + 1)
    }
    const handleStop = () => {
      setPendingCount((count) => Math.max(0, count - 1))
    }

    window.addEventListener(eventNames.start, handleStart)
    window.addEventListener(eventNames.stop, handleStop)

    return () => {
      window.removeEventListener(eventNames.start, handleStart)
      window.removeEventListener(eventNames.stop, handleStop)
      if (showTimer) clearTimeout(showTimer)
    }
  }, [eventNames])

  useEffect(() => {
    if (pendingCount > 0) {
      if (!visible) {
        const timer = setTimeout(() => setVisible(true), 150)
        return () => clearTimeout(timer)
      }
    } else {
      setVisible(false)
    }
  }, [pendingCount, visible])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
      <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-lg">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        <span className="text-sm font-medium text-gray-700">Loading, please wait...</span>
      </div>
    </div>
  )
}
