# Environment Files Guide for Next.js

## Which File to Use?

You have multiple environment files. Here's what to use:

### For Local Development:
**Use `.env.local`** - This is for your local machine only (gitignored, safe for secrets)

### For Production/Server:
**Add environment variables in your hosting platform** (Vercel, etc.) - NOT in files

---

## Next.js Environment File Priority:

1. `.env.local` - **Use this for local development** ✅ (gitignored, contains secrets)
2. `.env.production` - Production-specific (optional, can be committed)
3. `.env.development` - Development-specific (optional, can be committed)
4. `.env` - Default, loaded in all environments (can be committed, but NO secrets)

**Note:** `.env.server` is NOT a standard Next.js filename. Next.js doesn't recognize it.

---

## Setup Instructions:

### Step 1: For Local Development

Add email configuration to `.env.local`:

```env
# Application URL (local)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Gmail SMTP Configuration (for local development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

### Step 2: For Production/Server (Vercel)

**DO NOT** add these to any file. Instead:

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add each variable:
   - `SMTP_HOST` = `smtp.gmail.com`
   - `SMTP_PORT` = `587`
   - `SMTP_SECURE` = `false`
   - `SMTP_USER` = `your-email@gmail.com`
   - `SMTP_PASS` = `your-app-password`
   - `SMTP_FROM` = `your-email@gmail.com`
   - `NEXT_PUBLIC_APP_URL` = `https://yourdomain.com`
3. Select **Production** environment (and Preview/Development if needed)
4. Click **Save**
5. **Redeploy** your application for changes to take effect

---

## Summary:

| File | Use For | Contains Secrets? | Committed to Git? |
|------|---------|-------------------|-------------------|
| `.env.local` | Local development | ✅ YES | ❌ NO (gitignored) |
| `.env.production` | Production defaults | ⚠️ Optional | ✅ YES (if no secrets) |
| `.env` | Default values | ❌ NO | ✅ YES (example values only) |
| **Vercel Dashboard** | Production/Server | ✅ YES | N/A |

---

## Quick Action:

**Right now, add the email config to `.env.local` for local development.**

For production, add the variables in Vercel Dashboard (not in files).
