/**
 * Idle timeout: 15 minutes with no activity → callback runs (logout).
 * Activity: mousedown, mousemove, keypress, scroll, touchstart, click (debounced) reset the timer.
 * Tab visibility: when tab becomes visible, check if idle time passed limit; if so, callback. Else update last activity.
 * Grace period: first 5 seconds after init do not trigger expiry.
 */

import { IDLE_TIMEOUT_MS, GRACE_PERIOD_MS } from '@/lib/constants'

let timeoutId: ReturnType<typeof setTimeout> | null = null
let lastActivityAt = 0
let initializedAt = 0
let listenersAttached = false

const debounceMs = 200
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function resetTimer() {
  lastActivityAt = Date.now()
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
  timeoutId = setTimeout(() => checkExpiry(), IDLE_TIMEOUT_MS)
}

function checkExpiry() {
  const now = Date.now()
  if (now - initializedAt < GRACE_PERIOD_MS) return
  if (now - lastActivityAt >= IDLE_TIMEOUT_MS) {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = null
    onTimeoutCallback?.()
  }
}

let onTimeoutCallback: (() => void) | null = null

function handleActivity() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    resetTimer()
  }, debounceMs)
}

function handleVisibility() {
  if (document.visibilityState === 'visible') {
    const now = Date.now()
    if (now - lastActivityAt >= IDLE_TIMEOUT_MS && now - initializedAt >= GRACE_PERIOD_MS) {
      onTimeoutCallback?.()
    } else {
      lastActivityAt = now
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => checkExpiry(), IDLE_TIMEOUT_MS)
      }
    }
  }
}

function setupListeners() {
  if (listenersAttached) return
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'] as const
  events.forEach((e) => document.addEventListener(e, handleActivity))
  document.addEventListener('visibilitychange', handleVisibility)
  listenersAttached = true
}

function removeListeners() {
  if (!listenersAttached) return
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'] as const
  events.forEach((e) => document.removeEventListener(e, handleActivity))
  document.removeEventListener('visibilitychange', handleVisibility)
  listenersAttached = false
}

/**
 * Initialize session timeout. Call when user is authenticated.
 */
export function initSessionTimeout(onTimeout: () => void): void {
  onTimeoutCallback = onTimeout
  initializedAt = Date.now()
  lastActivityAt = Date.now()
  resetTimer()
  setupListeners()
}

/**
 * Reset the idle timer (e.g. after activity).
 */
export function resetSessionTimeout(onTimeout: () => void): void {
  onTimeoutCallback = onTimeout
  resetTimer()
}

/**
 * Clear session timeout and remove listeners. Call on logout or when on public page.
 */
export function clearSessionTimeout(): void {
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  onTimeoutCallback = null
  removeListeners()
}

/**
 * Setup session listeners and return cleanup function.
 */
export function setupSessionListeners(onTimeout: () => void): () => void {
  onTimeoutCallback = onTimeout
  initializedAt = Date.now()
  lastActivityAt = Date.now()
  resetTimer()
  setupListeners()
  return () => {
    clearSessionTimeout()
  }
}
