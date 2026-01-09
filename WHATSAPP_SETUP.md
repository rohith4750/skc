# WhatsApp Business Account Setup

## Current Configuration

Your WhatsApp Business number is configured in the `.env` file:
```
NEXT_PUBLIC_WHATSAPP_NUMBER=919701417885
```

## ⚠️ Important: Automatic Sending Limitation

### Current Free Method (wa.me links)
- ❌ **CANNOT send automatically** from your business account
- ❌ **Opens WhatsApp Web** on desktop (requires manual click)
- ⚠️ Requires manual "Send" button click
- Uses whatever WhatsApp account is logged in on your device

### Why This Limitation Exists
WhatsApp's free `wa.me` links are designed for:
- Opening WhatsApp with a pre-filled message
- User manually clicks "Send"
- Security reasons (prevents spam)

### ✅ Solution: WhatsApp Business API (Paid)

To send messages **automatically from your business account (919701417885) without navigating to WhatsApp Web**, you need:

**WhatsApp Business API** - Paid service that allows:
- ✅ Automatic sending from 919701417885
- ✅ No navigation to WhatsApp Web
- ✅ No manual clicking required
- ✅ Programmatic sending from backend

**Cost**: ~$0.005-$0.01 per message

## Getting WhatsApp Business API Access

### Option 1: WhatsApp Cloud API (Meta) - Direct
1. Register: https://business.facebook.com
2. Apply for WhatsApp Business API
3. Get API credentials (Access Token, Phone Number ID)
4. Requires business verification (1-2 weeks)

### Option 2: Third-Party Providers (Easier)

**Gupshup WhatsApp API** 🇮🇳 (Highly Recommended for Indian Businesses)
- Sign up: https://www.gupshup.io/developer/whatsapp-api
- **Popular in India** - Market leader for WhatsApp Business API in India
- **Indian pricing** - Competitive rates optimized for Indian market
- **Easy onboarding** - Streamlined setup process for Indian businesses
- **Excellent support** - Local support team familiar with Indian business needs
- Faster approval process
- Good documentation and resources
- **Cost**: Competitive pricing (contact for exact rates based on volume)
- Pay-as-you-go or subscription plans available
- Free trial/credits often available

**Twilio WhatsApp API** (Recommended for beginners, global)
- Sign up: https://www.twilio.com/whatsapp
- Faster approval than direct API
- Good documentation
- **Cost Breakdown**:
  - Twilio fee: **$0.005 per message** (sent or received)
  - Meta (Facebook) fee: **$0.005-$0.015 per message** (varies by country and message type)
  - **Total: ~$0.01-$0.02 per message** (average)
  
  **Example for India:**
  - Twilio: $0.005
  - Meta: ~$0.005-$0.009 (utility messages)
  - **Total: ~$0.01-$0.014 per message** (₹0.83-₹1.17 at current rates)
  
  **Monthly Cost Estimate:**
  - 100 messages: ~$1-$2 (₹83-₹167)
  - 500 messages: ~$5-$10 (₹417-₹833)
  - 1000 messages: ~$10-$20 (₹833-₹1,667)
  
- No monthly subscription fee (pay-as-you-go)
- Free trial credits available for new accounts

**Other Options**:
- 360dialog (€99+/month)
- Wati.io ($49+/month)
- MessageBird

## Current Implementation

### Floating WhatsApp Button
- ✅ Connects customers to your business number (919701417885)
- ✅ Works perfectly for customers to message you

### Sending Messages to Customers
- ⚠️ Opens WhatsApp (app on mobile, web on desktop)
- ⚠️ Message is pre-filled
- ⚠️ You must manually click "Send"
- ⚠️ Uses account logged into your device

### To Ensure Messages Use Your Business Account:
1. **On Mobile**: Install WhatsApp Business app, login with 919701417885
2. **On Desktop**: Scan WhatsApp Web QR code with your Business account
3. Make sure only your Business account is logged in

## Upgrading to Automatic Sending

When you get WhatsApp Business API access, you'll need to:

1. **Add API credentials** to `.env`:

   **For Gupshup:**
   ```
   GUPSHUP_API_KEY=xxx
   GUPSHUP_APP_NAME=xxx
   GUPSHUP_USER_ID=xxx
   GUPSHUP_PASSWORD=xxx
   ```

   **For Twilio:**
   ```
   TWILIO_ACCOUNT_SID=xxx
   TWILIO_AUTH_TOKEN=xxx
   TWILIO_WHATSAPP_FROM=whatsapp:+919701417885
   ```

2. **Create API route** (`app/api/whatsapp/send/route.ts`)
   - Handle message sending via API
   - Return success/error responses

3. **Update `lib/utils.ts`**
   - Replace `sendWhatsAppMessage` with API-based function
   - Make it async and call the API route

4. **Update customer pages**
   - Use new async API function
   - Handle success/error with toast messages

## Quick Start: Free Method (Current)

For now, use the current free method:
1. Login to WhatsApp Business (919701417885) on your device
2. Click "Send WhatsApp" in the app
3. WhatsApp opens with message pre-filled
4. Tap "Send" button manually
5. Message sent from your business account

## Recommendation

- **For Now**: Use free method (manual send)
- **For Production**: Get WhatsApp Business API for automatic sending
- **Best Option for Indian Businesses**: **Gupshup** - Popular in India, Indian pricing, easy onboarding, excellent support
- **Alternative Global Option**: Twilio (good for beginners, works worldwide)

## Need Help?

See WhatsApp Business API documentation:
- **Gupshup**: https://docs.gupshup.io/docs/whatsapp-api-overview
- **Twilio**: https://www.twilio.com/docs/whatsapp
- **Meta Cloud API**: https://developers.facebook.com/docs/whatsapp/cloud-api
