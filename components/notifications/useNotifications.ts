'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { isAuthenticated } from '@/lib/auth'
import type { NotificationEvent } from '@/lib/notifications'

const MAX_NOTIFICATIONS = 20

export function useNotifications(enabled: boolean) {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([])
  const [connected, setConnected] = useState(false)
  const sourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!enabled || !isAuthenticated()) return

    const source = new EventSource('/api/notifications/stream')
    sourceRef.current = source

    const handleOpen = () => setConnected(true)
    const handleError = () => setConnected(false)

    const handleNotification = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as NotificationEvent
        setNotifications((prev) => [payload, ...prev].slice(0, MAX_NOTIFICATIONS))
        // Notifications are stored but not shown as toast - view them in notification center
      } catch (err) {
        console.error('Failed to parse notification payload', err)
      }
    }

    source.addEventListener('open', handleOpen)
    source.addEventListener('error', handleError)
    source.addEventListener('notification', handleNotification as EventListener)

    return () => {
      source.removeEventListener('open', handleOpen)
      source.removeEventListener('error', handleError)
      source.removeEventListener('notification', handleNotification as EventListener)
      source.close()
    }
  }, [enabled])

  const unreadCount = useMemo(() => notifications.length, [notifications.length])

  return {
    notifications,
    connected,
    unreadCount,
  }
}
