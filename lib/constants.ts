// Session & auth constants

/** Idle timeout: logout after this many ms with no activity (2.5 hours) */
export const IDLE_TIMEOUT_MS = 2.5 * 60 * 60 * 1000

/** Grace period after init: do not trigger expiry in first 5 seconds */
export const GRACE_PERIOD_MS = 5 * 1000

/** Public paths that do not require authentication */
export const PUBLIC_PATHS = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/validate',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
] as const

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}
