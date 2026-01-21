export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error'
export type NotificationType = 'orders' | 'payments' | 'expenses' | 'stock' | 'workforce' | 'auth'

export interface NotificationEvent {
  id: string
  type: NotificationType
  title: string
  message: string
  entityId?: string
  createdAt: string
  severity?: NotificationSeverity
}

type Subscriber = (event: NotificationEvent) => void

type NotificationBus = {
  subscribers: Set<Subscriber>
  history: NotificationEvent[]
}

const globalForNotifications = globalThis as unknown as {
  __skcNotificationBus?: NotificationBus
}

const notificationBus: NotificationBus = globalForNotifications.__skcNotificationBus ?? {
  subscribers: new Set<Subscriber>(),
  history: [],
}

if (!globalForNotifications.__skcNotificationBus) {
  globalForNotifications.__skcNotificationBus = notificationBus
}
if (!notificationBus.history) {
  notificationBus.history = []
}

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

export function subscribeNotifications(callback: Subscriber) {
  notificationBus.subscribers.add(callback)
  return () => {
    notificationBus.subscribers.delete(callback)
  }
}

export function getNotificationHistory(limit = 20) {
  if (limit <= 0) return []
  return notificationBus.history.slice(-limit)
}

export function publishNotification(
  event: Omit<NotificationEvent, 'id' | 'createdAt'> & Partial<Pick<NotificationEvent, 'id' | 'createdAt'>>
) {
  const payload: NotificationEvent = {
    id: event.id ?? generateId(),
    createdAt: event.createdAt ?? new Date().toISOString(),
    ...event,
  }

  notificationBus.history.push(payload)
  if (notificationBus.history.length > 50) {
    notificationBus.history.splice(0, notificationBus.history.length - 50)
  }

  notificationBus.subscribers.forEach((subscriber) => {
    subscriber(payload)
  })
}
