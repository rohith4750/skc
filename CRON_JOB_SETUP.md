# Cron Job Setup Guide

## 🔐 Cron Job Secret Configuration

### What is the Cron Secret?

The `CRON_SECRET` is an optional security token used to protect your cron job endpoint from unauthorized manual calls. 

**Current Secret (in `.env.local`):**
```env
CRON_SECRET=skc_cron_secret_2026_secure_key_xyz123
```

### How It Works

When using **Vercel Cron Jobs** (configured in `vercel.json`):
- ✅ Vercel **automatically authenticates** scheduled cron jobs
- ✅ No need to pass the secret when Vercel triggers the job
- ✅ The secret is only needed for **manual testing**

The endpoint now accepts requests from:
1. **Vercel Cron** (automatic, no auth needed)
2. **Manual calls** with correct `Authorization: Bearer <CRON_SECRET>` header

---

## 📋 Step-by-Step Setup for Vercel

### Step 1: Add Environment Variable to Vercel

The cron secret should be added to your Vercel project:

#### Option A: Via Vercel Dashboard (Recommended)

1. Go to **https://vercel.com/dashboard**
2. Select your project: **skc**
3. Click **Settings** → **Environment Variables**
4. Add new variable:
   - **Name:** `CRON_SECRET`
   - **Value:** `skc_cron_secret_2026_secure_key_xyz123`
   - **Environments:** Select all (Production, Preview, Development)
5. Click **Save**

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variable
vercel env add CRON_SECRET
# When prompted, enter: skc_cron_secret_2026_secure_key_xyz123
# Select: Production, Preview, Development
```

### Step 2: Verify `vercel.json` Configuration

Your `vercel.json` should have:

```json
{
  "crons": [
    {
      "path": "/api/cron/tomorrow-orders",
      "schedule": "0 18 * * *"
    }
  ]
}
```

**Schedule Explanation:**
- `0 18 * * *` = Every day at 6:00 PM (18:00)
- Format: `minute hour day month day-of-week`

### Step 3: Deploy to Vercel

```bash
git add .
git commit -m "Add email alerts and cron job"
git push origin main
```

Vercel will automatically:
- Deploy your changes
- Register the cron job
- Start running it daily at 6 PM

---

## 🧪 Testing the Cron Job

### Option 1: Test via Vercel Dashboard (Easiest)

1. Go to **Vercel Dashboard** → Your Project
2. Click **Deployments** → Select latest deployment
3. Click **Functions** tab
4. Find `/api/cron/tomorrow-orders`
5. Click **Invoke** button

### Option 2: Manual Test with Secret

```bash
curl -X GET https://skc-tan.vercel.app/api/cron/tomorrow-orders \
  -H "Authorization: Bearer skc_cron_secret_2026_secure_key_xyz123"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Tomorrow orders check completed",
  "timestamp": "2026-02-11T12:34:56.789Z"
}
```

### Option 3: Test Locally

```bash
# Start your dev server
npm run dev

# In another terminal, call the endpoint
curl http://localhost:3000/api/cron/tomorrow-orders \
  -H "Authorization: Bearer skc_cron_secret_2026_secure_key_xyz123"
```

---

## 📊 Monitoring Cron Jobs in Vercel

### View Cron Job Logs

1. Go to **Vercel Dashboard** → Your Project
2. Click **Logs** tab
3. Filter by function: `/api/cron/tomorrow-orders`
4. You'll see:
   - When the cron ran
   - Success/failure status
   - Any console logs
   - Errors (if any)

### View Cron Schedule

1. Go to **Vercel Dashboard** → Your Project
2. Click **Settings** → **Cron Jobs**
3. You'll see:
   - Configured cron jobs
   - Schedule (0 18 * * *)
   - Last run time
   - Next run time

---

## 🔄 Changing the Schedule

To change when the cron runs, edit `vercel.json`:

### Examples:

**Every day at 8 PM:**
```json
"schedule": "0 20 * * *"
```

**Every day at 9 AM:**
```json
"schedule": "0 9 * * *"
```

**Twice a day (9 AM and 6 PM):**
```json
{
  "crons": [
    {
      "path": "/api/cron/tomorrow-orders",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/tomorrow-orders",
      "schedule": "0 18 * * *"
    }
  ]
}
```

**Every Monday at 10 AM:**
```json
"schedule": "0 10 * * 1"
```

After changing, redeploy:
```bash
git add vercel.json
git commit -m "Update cron schedule"
git push origin main
```

---

## 🔒 Security Best Practices

### 1. Keep the Secret Secure

- ✅ **DO:** Store in environment variables
- ✅ **DO:** Use different secrets for dev/prod
- ❌ **DON'T:** Commit secrets to Git
- ❌ **DON'T:** Share secrets publicly

### 2. Generate a Strong Secret

If you want to change the secret, generate a new one:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32

# Or use a password generator
```

### 3. Rotate Secrets Periodically

Update the secret every few months:
1. Generate new secret
2. Update in `.env.local`
3. Update in Vercel environment variables
4. Redeploy

---

## 🐛 Troubleshooting

### Cron Job Not Running

**Check 1: Verify it's deployed**
- Go to Vercel Dashboard → Settings → Cron Jobs
- Ensure the cron job appears in the list

**Check 2: Check logs**
- Go to Vercel Dashboard → Logs
- Look for cron execution logs around scheduled time

**Check 3: Time zone**
- Vercel cron jobs run in **UTC timezone**
- `0 18 * * *` = 6:00 PM UTC
- Convert to your local timezone if needed

**Check 4: Function timeout**
- Free tier: 10 seconds max
- Pro tier: 60 seconds max
- Ensure your function completes within limits

### "Unauthorized" Error

**If testing manually:**
1. Verify you're passing the correct secret
2. Check the Authorization header format: `Bearer <secret>`
3. Ensure no extra spaces or line breaks

**If cron job fails:**
1. Check Vercel logs for errors
2. Verify environment variable is set in Vercel
3. Redeploy after adding environment variable

### No Emails Sent

**Check 1: Email configuration**
- Verify SMTP settings in environment variables
- Test email sending with `/api/test/email-alert`

**Check 2: User emails**
- Ensure internal users have email addresses in database
- Check if users are marked as active

**Check 3: Tomorrow's orders**
- Verify there are actually orders for tomorrow
- Check database query results in logs

---

## 📱 Alternative: External Cron Services

If you prefer not to use Vercel Cron, you can use external services:

### 1. cron-job.org (Free)

1. Sign up at https://cron-job.org
2. Create new cron job:
   - URL: `https://skc-tan.vercel.app/api/cron/tomorrow-orders`
   - Schedule: Daily at 18:00
   - Add header: `Authorization: Bearer skc_cron_secret_2026_secure_key_xyz123`

### 2. EasyCron (Free tier available)

1. Sign up at https://www.easycron.com
2. Create cron job with same settings as above

### 3. GitHub Actions

Create `.github/workflows/daily-cron.yml`:

```yaml
name: Daily Tomorrow Orders Check

on:
  schedule:
    - cron: '0 18 * * *'  # 6 PM UTC daily
  workflow_dispatch:  # Allow manual trigger

jobs:
  check-orders:
    runs-on: ubuntu-latest
    steps:
      - name: Call cron endpoint
        run: |
          curl -X GET https://skc-tan.vercel.app/api/cron/tomorrow-orders \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Add `CRON_SECRET` to GitHub repository secrets.

---

## 📞 Support

If you have issues:
1. Check Vercel logs first
2. Review this guide
3. Test manually with curl
4. Contact: pujyasri1989cya@gmail.com

---

**Last Updated:** February 11, 2026
**Version:** 1.0.0
