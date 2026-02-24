# Authentication Quick Start Guide

## 🚀 Setup in 5 Minutes

### 1. Environment Variables (Already Done ✅)

Your `.env` and `.env.local` files already have the JWT secrets configured:

```bash
JWT_SECRET=v+OQbz4oOAvt8nC+fzxbh5Hp7srWqFd2mTzqtTEmBhI=
JWT_REFRESH_SECRET=p8XhXEinpuw2AzrmY3P9X/SA1avygCEDyXSrQrHhS4U=
```

### 2. Add AuthProvider to Root Layout

Update `app/layout.tsx`:

```typescript
import { AuthProvider } from '@/lib/auth-context'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

### 3. Update Login Page

Your login page should use the new auth context:

```typescript
'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await login(username, password, rememberMe)
      router.push('/dashboard') // or wherever you want to redirect
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Your form fields */}
    </form>
  )
}
```

### 4. Update Protected Components

Replace old auth checks with new hook:

**Before:**
```typescript
import { isAuthenticated } from '@/lib/auth'

if (!isAuthenticated()) {
  router.push('/login')
}
```

**After:**
```typescript
'use client'
import { useRequireAuth } from '@/lib/auth-context'

export default function ProtectedPage() {
  const { user, isLoading } = useRequireAuth()
  
  if (isLoading) return <div>Loading...</div>
  
  return <div>Welcome {user?.username}!</div>
}
```

### 5. Update API Calls

Replace fetch with the new API client:

**Before:**
```typescript
const response = await fetch('/api/data', {
  headers: {
    Authorization: `Bearer ${token}`
  }
})
```

**After:**
```typescript
import { api } from '@/lib/api-client-auth'

const data = await api.get('/api/data')
```

### 6. Update Logout

**Before:**
```typescript
localStorage.clear()
sessionStorage.clear()
router.push('/login')
```

**After:**
```typescript
const { logout } = useAuth()
await logout() // Handles everything automatically
```

## ✅ What's Changed?

### Old System (localStorage)
- ❌ Tokens in localStorage (vulnerable to XSS)
- ❌ Manual token management
- ❌ Manual Authorization headers
- ❌ Manual refresh logic
- ❌ Client-side only

### New System (httpOnly Cookies)
- ✅ Tokens in httpOnly cookies (XSS protected)
- ✅ Automatic token management
- ✅ Automatic cookie sending
- ✅ Automatic token refresh
- ✅ Server + Client support

## 🔑 Key Benefits

1. **More Secure**: Tokens can't be accessed by JavaScript
2. **Easier to Use**: No manual token management
3. **Auto-Refresh**: Tokens refresh automatically
4. **Better UX**: Seamless experience, no interruptions
5. **SSR Support**: Works in Server Components too

## 📚 Full Documentation

See [AUTHENTICATION_SYSTEM.md](./AUTHENTICATION_SYSTEM.md) for complete details.

## 🧪 Testing

### Test Login
1. Go to `/login`
2. Enter credentials
3. Check cookies in DevTools → Application → Cookies
4. Should see `accessToken` and `refreshToken`

### Test Protected Route
1. Visit a protected page
2. Should stay on page (if logged in)
3. Clear cookies
4. Refresh page
5. Should redirect to login

### Test Auto-Refresh
1. Login
2. Wait 15+ minutes
3. Make an API call
4. Should auto-refresh and succeed

### Test Logout
1. Click logout
2. Check cookies → should be cleared
3. Should redirect to login
4. Try accessing protected route → should redirect

## 🐛 Common Issues

### "No access token" error
**Fix**: Add `credentials: 'include'` to fetch calls

### Cookies not being set
**Fix**: Ensure backend returns `Set-Cookie` headers

### Redirect loops
**Fix**: Check `/login` is in public paths in middleware

### 401 errors
**Fix**: Check JWT secrets are set in environment

## 📝 Checklist

Before deployment, verify:

- [ ] JWT secrets are set in environment
- [ ] AuthProvider wraps the app
- [ ] Login uses new auth context
- [ ] Protected routes use `useRequireAuth()`
- [ ] API calls use `api.*` or `fetchWithAuth()`
- [ ] Logout uses `logout()` from context
- [ ] Cookies are being sent (`credentials: 'include'`)
- [ ] HTTPS is enabled in production
- [ ] Secure flag is true in production cookies

## 🎉 You're All Set!

Your authentication system is now:
- ✅ Production-ready
- ✅ Secure
- ✅ Easy to use
- ✅ Automatically managed

Happy coding! 🚀
