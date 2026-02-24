# Email Logo Fix Guide

## Issue
Logo is not showing in email alerts sent to internal users.

## Root Cause
Email clients often block external images by default for security reasons. Additionally, the image must be publicly accessible via HTTPS.

## Solutions Applied

### 1. **Fixed Email HTML Template**
- ✅ Changed to use table-based layout (better email client compatibility)
- ✅ Added explicit width/height attributes
- ✅ Used inline styles (required for emails)
- ✅ Updated default URL to use production URL

### 2. **Logo URL Configuration**

**File:** `lib/email-alerts.ts`

```typescript
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://skc-tan.vercel.app'
const logoUrl = `${appUrl}/images/logo.jpg`
```

**Your Logo URL:** `https://skc-tan.vercel.app/images/logo.jpg`

## Testing Steps

### Step 1: Verify Logo is Publicly Accessible

Open this URL in your browser:
```
https://skc-tan.vercel.app/images/logo.jpg
```

✅ If you see the logo → Logo is accessible
❌ If you get 404 error → Logo file is missing

### Step 2: Test Email

Send a test email:
```
https://skc-tan.vercel.app/api/test/email-alert
```

### Step 3: Check Email Client

When you receive the email:

1. **Gmail:** 
   - If images are blocked, you'll see a message at the top: "Images are not displayed. Display images below"
   - Click "Display images" to see the logo
   - Or enable "Always display images from this sender"

2. **Outlook:**
   - Click "Download pictures" at the top
   - Or add sender to safe list

3. **Other Clients:**
   - Look for "Show images" or similar option

## Why Emails Block Images

Email clients block external images by default to:
- Protect privacy (prevent tracking pixels)
- Save bandwidth
- Prevent malicious content

## Solutions to Try

### Solution 1: Enable Images in Email Client (User Action)
Users need to:
1. Click "Show images" in the email
2. Add sender to safe list
3. Enable "Always show images from this sender"

### Solution 2: Verify Logo File Exists

Check that the file exists at:
```
public/images/logo.jpg
```

And is deployed to Vercel (push to GitHub).

### Solution 3: Alternative - Text-Based Logo (No Images)

If images continue to be problematic, I can replace the logo with a text-based design that always displays:

```
═════════════════════════════
    🍽️ SKC CATERERS 🍽️
═════════════════════════════
SRIVATSASA & KOWNDINYA CATERERS
    Management System Alert
═════════════════════════════
```

Would you like me to implement this text-based alternative?

## Current Email Template

```html
<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td align="center">
      <img src="https://skc-tan.vercel.app/images/logo.jpg" 
           alt="SKC Caterers Logo" 
           width="80" 
           height="80" 
           style="display: block; border-radius: 50%; border: 2px solid #000;" />
    </td>
  </tr>
</table>
```

## Quick Test Commands

```bash
# Test if logo URL works
curl -I https://skc-tan.vercel.app/images/logo.jpg

# Should return: HTTP/2 200 OK
```

## Recommendation

For production emails, consider:
1. ✅ **Keep current approach** - Logo URL works, users just need to enable images
2. ⚠️ **Or use CDN** - Upload logo to Cloudinary/ImgBB for better reliability
3. 🎨 **Or use text logo** - No image blocking issues

---

**Status:** Logo URL configured correctly
**Action Required:** Users need to enable images in their email client
**Alternative:** Can implement text-based logo if needed
