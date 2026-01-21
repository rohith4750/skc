import { NextRequest, NextResponse } from 'next/server'
import { getNotificationHistory, subscribeNotifications, type NotificationEvent } from '@/lib/notifications'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()
  let unsubscribe: (() => void) | null = null
  let isClosed = false

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: NotificationEvent) => {
        if (isClosed) return
        controller.enqueue(encoder.encode(`event: notification\ndata: ${JSON.stringify(event)}\n\n`))
      }

      controller.enqueue(encoder.encode(': connected\n\n'))

      const history = getNotificationHistory(20)
      history.forEach((event) => {
        controller.enqueue(encoder.encode(`event: notification\ndata: ${JSON.stringify(event)}\n\n`))
      })
      unsubscribe = subscribeNotifications(send)

      const ping = setInterval(() => {
        if (isClosed) return
        controller.enqueue(encoder.encode('event: ping\ndata: {}\n\n'))
      }, 25000)

      const close = () => {
        if (isClosed) return
        isClosed = true
        clearInterval(ping)
        unsubscribe?.()
        controller.close()
      }

      request.signal.addEventListener('abort', close)
    },
    cancel() {
      if (!isClosed) {
        isClosed = true
        unsubscribe?.()
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
