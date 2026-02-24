# Authentication System Documentation

## Overview

This application uses **JWT with HttpOnly Cookies** - the most secure authentication approach for Next.js applications. This combines the stateless nature of JWT tokens with the security of httpOnly cookies.

## Architecture

### Key Components

1. **JWT Tokens** (`lib/jwt.ts`)
   - Access Token: Short-lived (15 minutes), stored in httpOnly cookie
   - Refresh Token: Long-lived (7-30 days), stored in httpOnly cookie

2. **Middleware** (`middleware.ts`)
   - Runs on every request at the edge
   - Verifies tokens from cookies
   - Redirects unauthorized users to login

3. **API Endpoints**
   - `/api/auth/login` - Authenticate user, set cookies
   - `/api/auth/refresh` - Refresh access token
   - `/api/auth/logout` - Clear cookies
   - `/api/auth/validate` - Validate current session

4. **Server-Side Auth** (`lib/auth-server.ts`)
   - Functions for Server Components
   - Get user from cookies server-side

5. **Client-Side Auth** (`lib/auth-context.tsx`)
   - React Context for client components
   - Auto-refresh tokens
   - Handle login/logout

6. **API Client** (`lib/api-client-auth.ts`)
   - Automatic token refresh on 401
   - Retry failed requests after refresh

## Security Features

### ✅ What Makes This Secure?

1. **HttpOnly Cookies**
   - Tokens stored in httpOnly cookies (not localStorage)
   - JavaScript cannot access tokens (XSS protection)
   - Cookies automatically sent with every request

2. **Short-Lived Access Tokens**
   - Access token expires in 15 minutes
   - Limits damage if token is compromised
   - Automatically refreshed

3. **Long-Lived Refresh Tokens**
   - Refresh token lasts 7-30 days
   - Used only to get new access tokens
   - Separate secret from access token

4. **Automatic Token Refresh**
   - Access token refreshed automatically before expiry
   - Seamless user experience
   - No manual intervention needed

5. **Secure Cookie Settings**
   - `httpOnly: true` - No JavaScript access
   - `secure: true` - HTTPS only (production)
   - `sameSite: 'lax'` - CSRF protection

6. **Edge Middleware Protection**
   - Runs before page loads
   - Fast token verification
   - Automatic redirects

## Authentication Flow

### Login Flow

```
1. User submits credentials → /api/auth/login
2. Backend validates credentials
3. Backend generates access + refresh tokens
4. Backend sets TWO httpOnly cookies:
   - accessToken (15 min)
   - refreshToken (7-30 days)
5. Backend returns user data (NOT tokens)
6. Frontend stores user in React state
7. Redirect to dashboard
```

### Request Flow

```
1. User makes API request
2. Browser automatically sends cookies
3. API route reads accessToken from cookie
4. Verifies token signature and expiry
5. If valid → process request
6. If expired → try refresh (see below)
7. If invalid → return 401
```

### Refresh Flow

```
1. Access token expires (15 min)
2. Client detects 401 response
3. Client calls /api/auth/refresh
4. Backend reads refreshToken from cookie
5. Backend validates refresh token
6. If valid → generates new access token
7. Backend sets new accessToken cookie
8. Client retries original request
9. Original request succeeds
```

### Logout Flow

```
1. User clicks logout
2. Frontend calls /api/auth/logout
3. Backend clears both cookies
4. Frontend clears user state
5. Redirect to login page
```

## Usage Guide

### 1. Client Components (React)

```typescript
'use client'

import { useAuth } from '@/lib/auth-context'

export function MyComponent() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return <div>Please log in</div>
  }

  return (
    <div>
      <p>Welcome {user.username}!</p>
      <p>Role: {user.role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

### 2. Server Components

```typescript
import { getServerAuth, requireServerAuth } from '@/lib/auth-server'

// Optional auth
export default async function MyPage() {
  const auth = await getServerAuth()
  
  if (!auth.isAuthenticated) {
    return <div>Please log in</div>
  }

  return <div>Welcome {auth.user?.username}!</div>
}

// Required auth (throws if not authenticated)
export default async function SecurePage() {
  const user = await requireServerAuth()
  
  return <div>Welcome {user.username}!</div>
}
```

### 3. API Routes

```typescript
import { requireAuth } from '@/lib/require-auth'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth.response) return auth.response // Unauthorized

  const user = auth.payload // { sub, username, role }

  // Your logic here
  return NextResponse.json({ data: 'success', user: user.username })
}
```

### 4. Making API Calls (Client)

```typescript
import { api } from '@/lib/api-client-auth'

// Automatic token refresh on 401
async function fetchData() {
  try {
    const data = await api.get('/api/my-endpoint')
    console.log(data)
  } catch (error) {
    console.error('Request failed:', error)
  }
}

// POST request
async function createItem(item: any) {
  const result = await api.post('/api/items', item)
  return result
}
```

### 5. Login Component

```typescript
'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

export function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    try {
      await login(username, password, rememberMe)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <label>
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
        />
        Remember me (30 days)
      </label>
      {error && <div className="error">{error}</div>}
      <button type="submit">Login</button>
    </form>
  )
}
```

### 6. Protected Page with Role Check

```typescript
'use client'

import { useRequireRole } from '@/lib/auth-context'

export default function AdminPage() {
  const { user, isLoading } = useRequireRole(['admin', 'super_admin'])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1>Admin Panel</h1>
      <p>Welcome, {user?.username}!</p>
    </div>
  )
}
```

## Token Configuration

### Access Token
- **Lifetime**: 15 minutes
- **Secret**: JWT_SECRET environment variable
- **Contains**: userId, username, role
- **Stored**: httpOnly cookie named `accessToken`
- **Auto-refreshed**: Every 14 minutes

### Refresh Token
- **Lifetime**: 7 days (or 30 days with "Remember Me")
- **Secret**: JWT_REFRESH_SECRET environment variable
- **Contains**: Only userId
- **Stored**: httpOnly cookie named `refreshToken`
- **Used**: Only for refreshing access token

## Environment Variables

Required in `.env` or `.env.local`:

```bash
# JWT Secrets (use cryptographically secure random strings)
JWT_SECRET=your-access-token-secret-32-chars-minimum
JWT_REFRESH_SECRET=your-refresh-token-secret-32-chars-minimum

# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Troubleshooting

### Problem: Getting 401 errors

**Solution**: Check if cookies are being sent
- Open DevTools → Network
- Check request headers for `Cookie: accessToken=...`
- Verify `credentials: 'include'` in fetch calls

### Problem: Redirect loops

**Solution**: Check middleware configuration
- Ensure `/login` is in public paths
- Check that middleware is not protecting auth endpoints

### Problem: Tokens not refreshing

**Solution**: Check refresh endpoint
- Verify refresh token cookie exists
- Check JWT_REFRESH_SECRET is set correctly
- Look for errors in browser console

### Problem: CORS issues

**Solution**: Ensure same-origin
- API and frontend must be on same domain
- Use relative URLs (/api/...) not absolute
- Set proper CORS headers if needed

## Best Practices

### ✅ DO

- Always use `credentials: 'include'` in fetch calls
- Use relative URLs for API calls (/api/...)
- Let the system handle token refresh automatically
- Store minimal data in React state (just user info)
- Use httpOnly cookies for tokens (never localStorage)

### ❌ DON'T

- Don't store tokens in localStorage/sessionStorage
- Don't expose tokens to JavaScript
- Don't manually manage token refresh
- Don't send tokens in URL parameters
- Don't use long-lived access tokens

## Migration from Old System

If you're migrating from localStorage-based auth:

1. Update login flow to not save tokens in localStorage
2. Replace `fetch` with `fetchWithAuth` or `api.*` methods
3. Add `credentials: 'include'` to all fetch calls
4. Remove manual Authorization headers
5. Wrap app with `<AuthProvider>`
6. Update components to use `useAuth()` hook
7. Remove localStorage.clear() on logout

## Security Checklist

- [x] HttpOnly cookies for tokens
- [x] Secure flag in production
- [x] SameSite flag for CSRF protection
- [x] Short-lived access tokens (15 min)
- [x] Automatic token refresh
- [x] Middleware route protection
- [x] Strong JWT secrets (32+ bytes)
- [x] HTTPS in production
- [x] Token validation on every request
- [x] Logout clears all cookies

## Performance

- **Edge Middleware**: Lightning fast token verification
- **Automatic Refresh**: No user-facing delays
- **Cookie Size**: Minimal (~200 bytes per token)
- **Database Queries**: Only on token refresh
- **Caching**: Tokens are self-contained (no DB lookup needed)

## Next Steps

1. Set up AuthProvider in root layout
2. Update login page to use new auth context
3. Replace localStorage auth with cookie-based auth
4. Test login/logout flow
5. Test protected routes
6. Test API calls with auto-refresh
7. Deploy with proper JWT secrets

## Support

For issues or questions:
1. Check browser DevTools → Application → Cookies
2. Check Network tab for cookie headers
3. Check server logs for JWT errors
4. Verify environment variables are set
5. Test with a fresh browser session
