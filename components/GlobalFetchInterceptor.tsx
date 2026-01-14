'use client'

import { useEffect } from 'react'
import { emitGlobalLoaderStart, emitGlobalLoaderStop } from '@/lib/loading-events'

const SKIP_HEADER = 'x-skip-global-loader'

export default function GlobalFetchInterceptor() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const globalAny = window as typeof window & {
      __globalFetchPatched?: boolean
      __originalFetch?: typeof fetch
    }

    if (globalAny.__globalFetchPatched) return

    const originalFetch = window.fetch.bind(window)
    globalAny.__originalFetch = originalFetch

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers || {})
      const shouldSkip = headers.get(SKIP_HEADER) === '1'

      if (!shouldSkip) {
        emitGlobalLoaderStart()
      }

      try {
        return await originalFetch(input, init)
      } finally {
        if (!shouldSkip) {
          emitGlobalLoaderStop()
        }
      }
    }

    globalAny.__globalFetchPatched = true
  }, [])

  return null
}
