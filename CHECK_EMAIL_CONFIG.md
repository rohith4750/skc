# Check Email Configuration

## Current Issue
You're seeing: "Email service not configured. Reset link logged to console."

This means the environment variables are not being read.

## Quick Fix Steps:

### Step 1: Verify `.env.local` file exists and has the config

Open `.env.local` and make sure it has:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important:** Replace `your-email@gmail.com` and `your-app-password` with actual values!

### Step 2: Restart Development Server

**CRITICAL:** Environment variables are only loaded when the server starts.

1. **Stop the server:** Press `Ctrl+C` in the terminal where `npm run dev` is running
2. **Start it again:** Run `npm run dev`

### Step 3: Test Again

Try the forgot password flow again. You should see:
- ✅ "Email sent successfully to [email] using SMTP" (instead of the warning)

## Common Issues:

### Issue 1: Variables not in `.env.local`
- ✅ Use `.env.local` (not `.env` or `.env.server`)
- ✅ File must be in the root directory (same level as `package.json`)

### Issue 2: Server not restarted
- ✅ **MUST restart server** after changing environment variables
- ✅ Close terminal and open new one if needed

### Issue 3: Wrong variable names
- ✅ Check spelling: `SMTP_HOST` (not `SMTP_HOSTS`)
- ✅ Check case: All caps for variable names

### Issue 4: Missing values
- ✅ Make sure `SMTP_USER` has your actual Gmail address
- ✅ Make sure `SMTP_PASS` has your Gmail app password (16 characters)
- ✅ No quotes needed around values (unless they contain spaces)

## Verify Configuration:

To test if variables are loaded, you can temporarily add this to `lib/email-server.ts`:

```typescript
console.log('SMTP Config Check:', {
  hasHost: !!process.env.SMTP_HOST,
  hasUser: !!process.env.SMTP_USER,
  hasPass: !!process.env.SMTP_PASS ? '***' : false,
})
```

Then check the server console output.
