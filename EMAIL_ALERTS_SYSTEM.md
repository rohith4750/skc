# Email Alerts System for Internal Users

## Overview

The SKC Caterers Management System now includes an automated email alert system that sends notifications to all internal users (staff members) for important business events. This ensures all team members stay informed about critical operations.

## Features

### 📧 Email Alerts Sent to All Internal Users

The system sends email notifications for the following events:

1. **New Order Created** 🎉
   - Triggered when a new order is placed
   - Includes customer details, meal types, event dates, and financial information
   - Link to view order history

2. **Payment Received** 💰
   - Triggered when advance payment or additional payment is received
   - Shows payment amount, total advance, and remaining balance
   - Link to view bills

3. **Tomorrow's Orders** 📅
   - Daily automated check (runs at 6 PM every day)
   - Lists all orders scheduled for tomorrow
   - Helps team prepare in advance
   - Link to view order details

4. **Low Stock Alert** ⚠️
   - Triggered when stock item falls below minimum threshold
   - Shows current stock level and minimum required
   - Link to inventory management

5. **New Expense Created** 💸
   - Triggered when a new expense is recorded
   - Shows category, recipient, amount, and description
   - Link to expense management

## How It Works

### User Email Management

- The system automatically sends emails to all **active internal users** (staff members) who have email addresses registered in the system
- To receive alerts, users must:
  1. Have an active account (`isActive: true`)
  2. Have a valid email address registered in their user profile

### Email Configuration

The system supports two email providers:

#### Option 1: SMTP (Gmail, Outlook, etc.) - **Currently Configured** ✅

Your system is already configured with SMTP settings:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_USER="pujyasri1989cya@gmail.com"
SMTP_PASS="tynaorpestrrxcgz"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_FROM="pujyasri1989cya@gmail.com"
```

#### Option 2: Resend (Alternative)

You can also use Resend (100 free emails/day):

```env
RESEND_API_KEY="your-resend-api-key"
RESEND_FROM_EMAIL="your-verified-email@yourdomain.com"
```

## Email Template

All alert emails use a **black and white** design (printer-friendly) with:

- **SKC Caterers logo** (circular image, 80x80px) displayed at the top
- SKC Caterers header and branding
- Alert type badge with emoji
- Clear title and message
- Detailed information table
- Action button to view details
- Contact information footer

### Sample Email Structure:

```
═══════════════════════════════════════
          [SKC LOGO IMAGE]
        (80x80px circular)
        
   SRIVATSASA & KOWNDINYA CATERERS
   Management System Alert
═══════════════════════════════════════

🎉 New Order Created

New Order Created
A new order has been created for John Doe

Details:
Customer:         John Doe
Customer Phone:   9876543210
Event Name:       Wedding Reception
Meal Types:       breakfast, lunch, dinner
Event Dates:      12/02/2026, 13/02/2026
Total Amount:     ₹50,000.00
Advance Paid:     ₹10,000.00
Balance:          ₹40,000.00

[View Details Button]

───────────────────────────────────────
This is an automated notification from 
SKC Caterers Management System

📞 9866525102, 9963691393, 9390015302
📧 pujyasri1989cya@gmail.com
═══════════════════════════════════════
```

## Tomorrow's Orders - Daily Check

### Automated Schedule

A cron job runs **daily at 6:00 PM** to check for tomorrow's orders and send email notifications.

### Configuration

The cron job is configured in `vercel.json`:

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

**Schedule Format:** `0 18 * * *` means:
- Minute: 0
- Hour: 18 (6 PM)
- Day of month: * (every day)
- Month: * (every month)
- Day of week: * (every day)

### Security

The cron endpoint is protected by a secret token:

```env
CRON_SECRET=skc_cron_secret_2026_secure_key_xyz123
```

Only requests with the correct `Authorization: Bearer <CRON_SECRET>` header can trigger the cron job.

### Manual Testing

You can manually test the tomorrow's orders check using cURL or Postman:

```bash
curl -X GET https://your-domain.com/api/cron/tomorrow-orders \
  -H "Authorization: Bearer skc_cron_secret_2026_secure_key_xyz123"
```

## Managing Internal Users

### Adding User Email Addresses

To ensure users receive email alerts, make sure their email addresses are registered:

1. Go to **User Management** section
2. Edit user profile
3. Add/update email address
4. Ensure user is marked as "Active"

### Checking Who Receives Alerts

All active users with valid email addresses will receive alerts. The system automatically:
- Filters users with `isActive: true`
- Validates email addresses (must contain '@')
- Sends to all matching users in parallel

## Implementation Details

### New Files Created

1. **`lib/email-alerts.ts`**
   - Core email alert functions
   - Email template generation
   - User email fetching logic

2. **`app/api/cron/tomorrow-orders/route.ts`**
   - Cron job endpoint for daily order checks
   - Protected by secret token

3. **`vercel.json`**
   - Cron job scheduling configuration

### Modified Files

1. **`app/api/orders/route.ts`**
   - Added order creation email alert
   - Added payment received email alert

2. **`app/api/orders/[id]/route.ts`**
   - Added payment received email alert on order update

3. **`app/api/stock/[id]/transactions/route.ts`**
   - Added low stock email alert after stock transactions

4. **`.env.local`**
   - Added `CRON_SECRET` for cron job authentication

## Customization

### Changing Email Schedule

To change when the daily order check runs, modify `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/tomorrow-orders",
      "schedule": "0 20 * * *"  // Change to 8 PM
    }
  ]
}
```

### Customizing Email Templates

Edit `lib/email-alerts.ts` → `generateAlertEmailHTML()` function to customize:
- Email styling
- Header/footer content
- Alert types and colors
- Information layout

### Adding New Alert Types

To add a new alert type:

1. Add type to `AlertEmailData` interface in `lib/email-alerts.ts`
2. Add config to `typeConfig` in `generateAlertEmailHTML()`
3. Create a new function like `sendYourAlertType()`
4. Call it from the appropriate API route

## Testing

### Test Email Sending

Create a test endpoint or use the existing functions:

```typescript
// Test order created alert
await sendOrderCreatedAlert('order-id-here')

// Test payment received alert
await sendPaymentReceivedAlert('order-id-here', 5000)

// Test tomorrow's orders check
await checkTomorrowOrders()

// Test low stock alert
await sendLowStockAlert('stock-id-here')
```

### Verify Email Configuration

Check server logs for:
- `Email sent successfully to user@example.com using SMTP`
- `Alert sent to X users`
- Any error messages

## Troubleshooting

### Emails Not Being Sent

1. **Check user emails:** Ensure users have valid email addresses in the database
2. **Check SMTP credentials:** Verify Gmail app password is correct
3. **Check logs:** Look for error messages in server console
4. **Test SMTP connection:** Use nodemailer test directly

### Cron Job Not Running

1. **Verify deployment:** Ensure `vercel.json` is deployed to Vercel
2. **Check Vercel dashboard:** Go to Project Settings > Cron Jobs to see execution logs
3. **Test manually:** Call the cron endpoint with correct authorization header
4. **Check logs:** Look for execution logs in Vercel

### Gmail Security

If using Gmail SMTP:
- Ensure "App Passwords" is enabled in Google Account settings
- Use the 16-character app password (not your regular Gmail password)
- Enable 2-Step Verification first

## Future Enhancements

Possible improvements:
- ✅ Email notifications to all internal users
- ✅ Daily tomorrow's orders check
- [ ] Email preferences per user (opt-in/opt-out for specific alerts)
- [ ] Email templates in multiple languages (Telugu support)
- [ ] SMS alerts integration
- [ ] WhatsApp notifications
- [ ] Weekly summary emails
- [ ] Custom alert rules and thresholds

## Support

For issues or questions:
- Email: pujyasri1989cya@gmail.com
- Phone: 9866525102, 9963691393, 9390015302

---

**Last Updated:** February 11, 2026
**Version:** 1.0.0
