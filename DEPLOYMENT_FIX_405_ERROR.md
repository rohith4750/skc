# Fix for 405 Method Not Allowed Error

## Problem
Getting `405 Method Not Allowed` when calling `PUT /api/bills` in production.

## Root Cause
The PUT method exists in the code, but production might be serving an old version or the route wasn't properly deployed.

## Solution

### Step 1: Verify Code is Correct ✅
The code in `app/api/bills/route.ts` is correct - PUT method is properly exported.

### Step 2: Ensure All Changes are Committed
```bash
git status
git add app/api/bills/route.ts
git commit -m "Add PUT method to bills API route"
git push
```

### Step 3: Redeploy
- If using Vercel: It should auto-deploy after push
- Check build logs to ensure no errors
- Wait for deployment to complete

### Step 4: Verify Deployment
1. Check build logs for any errors related to `/api/bills/route.ts`
2. Verify the route file was included in the build
3. Try the PUT request again after deployment completes

## Alternative: Use PATCH Method (If PUT Still Doesn't Work)

If PUT method still doesn't work after redeploying, you can change to PATCH method:

**In `app/api/bills/route.ts`:**
```typescript
export async function PATCH(request: NextRequest) {
  // ... same code
}
```

**In `app/bills/page.tsx`:**
```typescript
const response = await fetch('/api/bills', {
  method: 'PATCH',  // Change from PUT to PATCH
  // ... rest of code
})
```

However, PUT should work - this is just a fallback option.

## Quick Check

Run this locally to verify the route works:
```bash
# Start dev server
npm run dev

# In another terminal, test the endpoint (you'll need a valid bill ID)
curl -X PUT http://localhost:3000/api/bills \
  -H "Content-Type: application/json" \
  -d '{"id":"test-id","paidAmount":1000,"remainingAmount":0,"status":"paid"}'
```

If it works locally but not in production, it's a deployment issue.

## Next Steps

1. ✅ Verify code is committed and pushed
2. ✅ Redeploy to production
3. ✅ Check build logs for errors
4. ✅ Test PUT request after deployment
5. ✅ Check Vercel function logs if error persists

---

**Note:** 405 errors in Next.js API routes usually mean:
- The HTTP method handler isn't exported (but yours is ✅)
- The route file has a syntax error (but yours doesn't ✅)
- The deployment is serving old/cached code (most likely cause)

**Solution:** Redeploy and ensure the latest code is built and deployed.
