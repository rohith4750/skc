# Session Timeout Update

## Summary
Updated JWT access token expiration from **15 minutes** to **1 hour (60 minutes)** to prevent premature session expiration while users are actively working.

---

## Changes Made

### 1. **JWT Token Expiration** (`lib/jwt.ts`)
- **Line 9:** Changed `ACCESS_TOKEN_DEFAULT_MS` from `15 * 60 * 1000` to `60 * 60 * 1000`
- **Updated:** Comment from "15 minutes" to "1 hour (60 minutes)"
- **Updated:** Function comment from "default 15m" to "default 1h"

**Before:**
```typescript
const ACCESS_TOKEN_DEFAULT_MS = 15 * 60 * 1000 // 15 minutes
```

**After:**
```typescript
const ACCESS_TOKEN_DEFAULT_MS = 60 * 60 * 1000 // 1 hour (60 minutes)
```

---

### 2. **Login Route Cookie** (`app/api/auth/login/route.ts`)
- **Line 185:** Updated `maxAge` from `15 * 60` to `60 * 60`
- **Updated:** Comment from "15 minutes" to "1 hour"

**Before:**
```typescript
maxAge: 15 * 60, // 15 minutes
```

**After:**
```typescript
maxAge: 60 * 60, // 1 hour (60 minutes)
```

---

### 3. **Refresh Route Cookie** (`app/api/auth/refresh/route.ts`)
- **Line 89:** Updated `maxAge` from `15 * 60` to `60 * 60`

**Before:**
```typescript
maxAge: 15 * 60, // 15 minutes
```

**After:**
```typescript
maxAge: 60 * 60, // 1 hour (60 minutes)
```

---

### 4. **Auto-Refresh Mechanism** (`lib/auth-context.tsx`)
- **Line 136-138:** Updated refresh interval from `14 minutes` to `55 minutes`
- **Reason:** Refreshes 5 minutes before token expiry to maintain active session

**Before:**
```typescript
// Auto-refresh access token every 14 minutes (before 15-minute expiry)
const interval = setInterval(() => {
  refreshAuth()
}, 14 * 60 * 1000) // 14 minutes
```

**After:**
```typescript
// Auto-refresh access token every 55 minutes (before 1-hour expiry)
const interval = setInterval(() => {
  refreshAuth()
}, 55 * 60 * 1000) // 55 minutes (5 minutes before 1-hour expiry)
```

---

## Impact

### ✅ Benefits
1. **No More Premature Logouts:** Users won't be logged out while actively working
2. **Better User Experience:** 1-hour sessions allow uninterrupted work
3. **Automatic Refresh:** Token auto-refreshes at 55 minutes, maintaining session continuity
4. **Reduced Frustration:** No need to re-login every 15 minutes

### 🔒 Security
- Refresh token still expires after 7 days (or 30 days with "Remember Me")
- HttpOnly cookies prevent XSS attacks
- Secure flag enabled in production
- Auto-refresh keeps sessions active without compromising security

### ⏱️ Timeline
- **Access Token Expiration:** 15 minutes → **1 hour**
- **Auto-Refresh Interval:** 14 minutes → **55 minutes**
- **Refresh Token Expiration:** 7/30 days (unchanged)

---

## Testing

After deploying these changes:

1. **Login to the application**
2. **Wait 20-30 minutes** without any activity
3. **Perform an action** (e.g., navigate to a different page)
4. **Expected Result:** Session should still be active (no redirect to login)
5. **After 55 minutes:** Token should auto-refresh in the background
6. **After 1 hour+ without refresh:** If no activity, session will expire

---

## Deployment Notes

- No database migration required
- No environment variable changes needed
- Changes take effect immediately after deployment
- Existing logged-in users will need to re-login once to get new 1-hour tokens

---

*Last Updated: February 11, 2026*
*Change Requested By: User (session expiring while still logged in)*
