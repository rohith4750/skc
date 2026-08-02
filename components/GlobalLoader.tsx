'use client'

import { useEffect, useMemo, useState } from 'react'
import { getGlobalLoaderEventNames } from '@/lib/loading-events'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

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
    <LoadingSpinner fullScreen message="SKC Catering" subtext="Loading, please wait..." />
  )
}
