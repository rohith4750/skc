# Quick Start Guide: Email Alerts to Internal Users

## ✅ What's Been Done

I've implemented a complete email alert system that sends notifications to **all internal users** (not customers) for important business events.

### Email Alerts Now Sent For:

1. **New Order Booked** 🎉
   - Customer details, meal types, event dates
   - Total amount, advance paid, balance
   
2. **Payment Received** 💰
   - Payment amount and remaining balance
   - Customer information

3. **Tomorrow's Orders** 📅 (Daily at 6 PM)
   - Lists all orders scheduled for next day
   - Helps team prepare in advance

4. **Low Stock Alert** ⚠️
   - When inventory falls below minimum
   - Current stock vs required minimum

5. **New Expense Created** 💸
   - Category, amount, recipient
   - Description details

## 🎯 Who Receives Emails?

All **active internal users** with registered email addresses in the system will receive alerts.

The system automatically:
- Finds all users with `isActive: true`
- Filters users with valid email addresses
- Sends emails to all matching users

## 📧 Your Current Setup

✅ **SMTP Already Configured:**
- Provider: Gmail SMTP
- From Email: pujyasri1989cya@gmail.com
- Status: Ready to send emails

## 🚀 How to Test

### Test 1: Send Test Email Alert

Visit this URL in your browser or use cURL:

```
https://skc-tan.vercel.app/api/test/email-alert
```

**Expected Result:** All active internal users should receive a test email.

### Test 2: Create a New Order

1. Go to Orders page
2. Create a new order
3. Check email inboxes - all users should receive "New Order Created" email

### Test 3: Add Payment

1. Open an existing order
2. Add advance payment
3. Check email inboxes - all users should receive "Payment Received" email

### Test 4: Tomorrow's Orders Check

Manually trigger the check:

```bash
curl -X GET https://skc-tan.vercel.app/api/cron/tomorrow-orders \
  -H "Authorization: Bearer skc_cron_secret_2026_secure_key_xyz123"
```

**Or** just wait until 6 PM - it will run automatically every day!

## 📝 Managing User Emails

### To Add/Update User Email:

1. Go to **User Management** (or profile section)
2. Edit the user
3. Add their Gmail address
4. Save
5. User will now receive all alerts

### Check Current Users:

Run this in your database console or create a simple admin page:

```sql
SELECT id, username, email, isActive FROM "User" WHERE isActive = true;
```

## 📅 Daily Schedule

**Tomorrow's Orders Check:**
- **Time:** 6:00 PM every day (18:00)
- **Action:** Automatically checks orders for next day
- **Notification:** Sends email to all users if orders exist

**To Change Schedule:**

Edit `vercel.json`:
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

Then deploy to Vercel.

## 🔍 Viewing Logs

### In Vercel:

1. Go to your project dashboard
2. Click on "Logs" tab
3. Search for:
   - "Email sent successfully"
   - "Alert sent to X users"
   - Any error messages

### In Local Development:

Check your terminal/console for:
```
Sending alert to 3 users: New Order Created
Email sent successfully to user1@gmail.com using SMTP
Email sent successfully to user2@gmail.com using SMTP
Alert sent to 3 users
```

## 🎨 Email Design

All emails use a **black and white** design for printer-friendly output:
- **SKC Caterers logo** at the top (circular, 80x80px)
- Clear header with SKC branding
- Alert type with emoji badge
- Details in tabular format
- Action button to view more
- Contact info in footer

## 🔧 Files Created/Modified

### New Files:
- ✅ `lib/email-alerts.ts` - Core email alert functions
- ✅ `app/api/cron/tomorrow-orders/route.ts` - Daily cron job
- ✅ `app/api/test/email-alert/route.ts` - Test endpoint
- ✅ `vercel.json` - Cron job configuration
- ✅ `EMAIL_ALERTS_SYSTEM.md` - Full documentation

### Modified Files:
- ✅ `app/api/orders/route.ts` - Added order creation & payment alerts
- ✅ `app/api/orders/[id]/route.ts` - Added payment received alerts
- ✅ `app/api/stock/[id]/transactions/route.ts` - Added low stock alerts
- ✅ `.env.local` - Added CRON_SECRET

## 🎯 Next Steps

1. **Test the system:** Visit `/api/test/email-alert` to send a test email
2. **Add user emails:** Ensure all staff have email addresses in their profiles
3. **Create a test order:** Verify order creation emails work
4. **Wait for 6 PM:** Check if tomorrow's orders alert runs automatically
5. **Monitor logs:** Keep an eye on Vercel logs for any issues

## 🔐 Cron Job Secret Setup

### What is it?
The `CRON_SECRET` protects your cron job endpoint from unauthorized access.

**Your Current Secret:**
```
skc_cron_secret_2026_secure_key_xyz123
```

### Do I need to configure it?

**For Vercel Cron Jobs (Recommended):** ✅
- Vercel automatically handles authentication
- The secret is **optional** for scheduled jobs
- Only needed for manual testing

**To add to Vercel (Optional but recommended):**

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add:
   - Name: `CRON_SECRET`
   - Value: `skc_cron_secret_2026_secure_key_xyz123`
   - Select all environments
3. Save and redeploy

### How to manually test with the secret:

```bash
curl -X GET https://skc-tan.vercel.app/api/cron/tomorrow-orders \
  -H "Authorization: Bearer skc_cron_secret_2026_secure_key_xyz123"
```

📖 For detailed setup instructions, see `CRON_JOB_SETUP.md`

---

## 🛠 Customization

### Add More Alert Types:

Edit `lib/email-alerts.ts` and add new functions like:
```typescript
export async function sendCustomAlert(data: any) {
  await sendAlertToUsers({
    type: 'custom_type',
    title: 'Your Title',
    message: 'Your message',
    details: { /* your details */ },
  })
}
```

Then call it from the appropriate API route.

### Change Email Template:

Edit `generateAlertEmailHTML()` in `lib/email-alerts.ts` to customize:
- Colors and styling
- Layout and structure
- Content and wording

## ⚠️ Important Notes

1. **Gmail Limits:** Free Gmail has a daily limit of ~500 emails/day
2. **Spam Filters:** First emails might land in spam - mark as "Not Spam"
3. **Vercel Crons:** Cron jobs only work on Vercel deployment (not localhost)
4. **Testing Locally:** Use the test endpoint `/api/test/email-alert` for local testing

## 📞 Support

If you encounter any issues:
- Check server logs for errors
- Verify user email addresses in database
- Test SMTP connection
- Review `EMAIL_ALERTS_SYSTEM.md` for detailed troubleshooting

## 🎉 You're All Set!

The email alert system is now active and will automatically notify all internal users about important events. Test it out and let the notifications flow! 

---

**Quick Test:** Visit https://skc-tan.vercel.app/api/test/email-alert right now to send your first test email! 🚀
