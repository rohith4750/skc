# Environment Variables Setup

## Quick Setup for Email Configuration

Add these variables to your `.env` file in the root directory:

### Option 1: Using Gmail with Nodemailer (Free + Recommended)

```env
# App URL (for password reset links)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Gmail SMTP Configuration (Free)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

**To get Gmail App Password:**
1. Enable 2-factor authentication on your Gmail account
2. Go to: https://myaccount.google.com/apppasswords
3. Generate an app password for "Mail"
4. Use that 16-character password in `SMTP_PASS`

### Option 2: Using Resend (Easy Setup)

```env
# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev
```

### Full Example .env File

```env
# Database (if using PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/catering_db?schema=public"

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email Configuration - Choose ONE option:

# Option 1: Gmail SMTP (Free)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com

# Option 2: Resend (uncomment to use instead of SMTP)
# RESEND_API_KEY=re_xxxxxxxxxxxxx
# RESEND_FROM_EMAIL=onboarding@resend.dev
```

## Steps to Setup:

1. **Create `.env` file** in the root directory (if it doesn't exist)
2. **Copy the configuration** above that you want to use
3. **Replace placeholders** with your actual values:
   - `your-email@gmail.com` → Your actual Gmail address
   - `your-app-password` → Your Gmail app password (16 characters)
4. **Restart your development server** for changes to take effect

## Notes:

- Never commit your `.env` file to git (it's in .gitignore)
- For production, add these variables in your hosting platform (Vercel, etc.)
- Gmail app password is different from your Gmail account password
