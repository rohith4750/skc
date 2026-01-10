# Email Configuration Guide

This application supports password reset emails through the forgot password functionality.

## Email Service Options

The application supports two email service options:

### Option 1: Resend (Recommended - Easy Setup)

Resend is a modern email API service with a free tier (100 emails/day).

1. **Sign up for Resend:**
   - Go to [https://resend.com](https://resend.com)
   - Create a free account
   - Verify your domain (or use their test domain for development)

2. **Get your API key:**
   - Go to API Keys in your Resend dashboard
   - Create a new API key
   - Copy the API key

3. **Configure environment variables:**
   Add these to your `.env` file:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   # Or for testing, use: onboarding@resend.dev
   ```

### Option 2: Nodemailer/SMTP (Free + Self-Hosted) ✅ Recommended for Free Option

Nodemailer is completely free and works with Gmail, Outlook, and any SMTP service.

1. **For Gmail (Recommended for Free Option):**
   - Enable 2-factor authentication on your Gmail account
   - Generate an App Password: https://myaccount.google.com/apppasswords
   - Use your Gmail address and the app password (not your regular password)

2. **Configure environment variables:**
   Add these to your `.env` file:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=your-email@gmail.com
   ```

   **For Outlook/Office 365:**
   ```env
   SMTP_HOST=smtp.office365.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@outlook.com
   SMTP_PASS=your-password
   SMTP_FROM=your-email@outlook.com
   ```

   **For Custom SMTP Server:**
   ```env
   SMTP_HOST=your-smtp-server.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-username
   SMTP_PASS=your-password
   SMTP_FROM=your-email@yourdomain.com
   ```

## Environment Variables

Create or update your `.env` file in the root directory:

```env
# App URL (for password reset links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
# For production: NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Resend Configuration (Option 1)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# OR SMTP Configuration (Option 2) - Free + Self-Hosted
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

## Testing

1. **Without email service configured:**
   - The reset token will be logged to the console
   - Check your server logs to see the reset link

2. **With email service configured:**
   - The reset email will be sent to the user's email address
   - Users will receive a professional HTML email with the reset link

## Troubleshooting

- **Emails not sending:** Check your environment variables are correctly set
- **Resend errors:** Verify your API key and domain verification status
- **SMTP errors:** Check your credentials and SMTP settings (port, security)
- **Development:** Use Resend's test domain `onboarding@resend.dev` for quick testing

## Security Notes

- Never commit your `.env` file to version control
- Use environment variables in production (Vercel, etc.)
- Keep your API keys and passwords secure
- The reset token expires in 1 hour for security
