# Using Custom Domain with Vercel

## ✅ Yes! Vercel Supports Custom Domains

Vercel allows you to use your own custom domain (e.g., `skccaterers.com`) **FOR FREE**!

---

## 💰 Cost Breakdown

| Item | Cost |
|------|------|
| **Vercel hosting** | $0 (free forever) |
| **Custom domain connection** | $0 (free on Vercel) |
| **Domain name purchase** | $10-15/year (from domain registrar) |
| **SSL/HTTPS certificate** | $0 (automatically included) |
| **Total** | **$10-15/year** (just for the domain name) |

---

## 🎯 How It Works

1. **Buy domain name** (e.g., from Namecheap, GoDaddy, Google Domains)
   - Cost: ~$10-15/year
   - Example: `skccaterers.com`

2. **Deploy to Vercel** (get free subdomain first)
   - Free subdomain: `skc-caterers.vercel.app`
   - Works immediately

3. **Add custom domain to Vercel** (FREE)
   - Go to Vercel dashboard → Your project → Settings → Domains
   - Add your custom domain: `skccaterers.com`
   - Vercel provides DNS settings

4. **Update DNS at your domain registrar**
   - Copy DNS records from Vercel
   - Add them to your domain registrar
   - Wait 5-60 minutes for DNS propagation

5. **Done!** Your app is now live at `skccaterers.com` ✅

---

## 📋 Step-by-Step Guide

### Step 1: Buy Domain Name (If You Don't Have One)

**Recommended Registrars:**
- **Namecheap**: ~$12/year (.com) - Easy to use
- **Google Domains**: ~$12/year (.com) - Simple interface
- **Cloudflare**: ~$10/year (.com) - Cheapest, but requires Cloudflare account
- **GoDaddy**: ~$15/year (.com) - Popular but more expensive

**Steps:**
1. Go to domain registrar website
2. Search for your desired domain (e.g., `skccaterers.com`)
3. Add to cart and purchase
4. Complete checkout

---

### Step 2: Deploy to Vercel (If Not Already Done)

1. Push code to GitHub
2. Go to vercel.com
3. Sign up/login with GitHub
4. Click "New Project"
5. Import your repository
6. Deploy (you'll get free subdomain like `skc-caterers.vercel.app`)

---

### Step 3: Add Custom Domain in Vercel

1. **Go to Vercel Dashboard**
   - Click on your project
   - Go to **Settings** tab
   - Click **Domains** in the left sidebar

2. **Add Domain**
   - Enter your domain: `skccaterers.com`
   - Click "Add"
   - Vercel will show you DNS configuration

3. **Vercel Provides DNS Records**
   - Example DNS records you'll see:
     ```
     Type: A
     Name: @
     Value: 76.76.21.21
     
     Type: CNAME
     Name: www
     Value: cname.vercel-dns.com
     ```

---

### Step 4: Update DNS at Domain Registrar

1. **Login to your domain registrar** (Namecheap, GoDaddy, etc.)

2. **Find DNS Management**
   - Usually under "DNS Settings" or "Advanced DNS"
   - Or "Manage DNS" section

3. **Add DNS Records**
   - Copy the DNS records from Vercel
   - Add them to your domain registrar
   - Save changes

4. **Wait for DNS Propagation**
   - Usually 5-60 minutes
   - Can take up to 24 hours (rare)
   - Vercel will show status in dashboard

---

### Step 5: Verify Domain in Vercel

1. **Go back to Vercel Dashboard**
2. **Check domain status**
   - Should show "Valid Configuration" when DNS is correct
   - May show "Pending" while DNS propagates

3. **Test Your Domain**
   - Visit `https://skccaterers.com`
   - Should show your app!
   - HTTPS/SSL is automatically enabled ✅

---

## 🌐 Domain Configuration Examples

### Option 1: Root Domain Only
```
skccaterers.com → Your Vercel app
```
**DNS Settings:**
- Type: A
- Name: @
- Value: 76.76.21.21 (Vercel's IP)

### Option 2: WWW Subdomain
```
www.skccaterers.com → Your Vercel app
```
**DNS Settings:**
- Type: CNAME
- Name: www
- Value: cname.vercel-dns.com

### Option 3: Both (Recommended)
```
skccaterers.com → Your Vercel app
www.skccaterers.com → Your Vercel app (redirects to root)
```
**DNS Settings:**
- A record for root domain (@)
- CNAME record for www
- Vercel automatically redirects www to root

---

## 🔒 SSL/HTTPS Certificate

**Good News**: Vercel provides **FREE SSL certificates automatically**!

- ✅ HTTPS enabled automatically
- ✅ Valid SSL certificate
- ✅ Auto-renewal
- ✅ No configuration needed
- ✅ Works with custom domains

Your site will be accessible at: `https://skccaterers.com` (secure!)

---

## ⏱️ Timeline

| Step | Time |
|------|------|
| Buy domain | 5 minutes |
| Deploy to Vercel | 5-10 minutes |
| Add domain to Vercel | 2 minutes |
| Update DNS | 5 minutes |
| DNS propagation | 5-60 minutes |
| **Total** | **~30 minutes** |

---

## 💡 Pro Tips

1. **Start with Free Subdomain**
   - Deploy first: `skc-caterers.vercel.app`
   - Test everything works
   - Add custom domain later

2. **Both URLs Work**
   - After setup, both work:
     - `skc-caterers.vercel.app` (free subdomain)
     - `skccaterers.com` (custom domain)
   - You can keep both or remove the subdomain

3. **Domain Redirects**
   - Vercel can automatically redirect:
     - `www.skccaterers.com` → `skccaterers.com`
     - Or vice versa
   - Configure in Vercel domain settings

4. **Multiple Domains**
   - Can add multiple domains to same project
   - All point to same app
   - Useful for different TLDs (`.com`, `.in`, etc.)

---

## ❓ Common Questions

### Q: Do I need to keep the free subdomain?
**A**: No, but you can keep it. Both URLs work. Many people keep it as a backup.

### Q: Can I use subdomains?
**A**: Yes! You can add:
- `app.skccaterers.com`
- `admin.skccaterers.com`
- `api.skccaterers.com`
All for free on Vercel!

### Q: What if DNS doesn't work?
**A**: 
- Check DNS records are correct
- Wait longer (can take up to 24 hours)
- Contact Vercel support (they're helpful!)

### Q: Can I transfer domain later?
**A**: Yes! Domains can be transferred between registrars. DNS settings stay the same.

### Q: What happens to free subdomain?
**A**: It keeps working! You can use either URL. Many people use custom domain for public, subdomain for testing.

---

## 🎯 Summary

**Question**: Can I keep custom domain on Vercel?

**Answer**: 
- ✅ **YES!** Custom domains are fully supported
- ✅ **FREE** to connect custom domain to Vercel
- ✅ **$10-15/year** for domain name (from registrar)
- ✅ **FREE SSL/HTTPS** certificate automatically
- ✅ **Easy setup** (~30 minutes total)
- ✅ **Both URLs work** (custom domain + free subdomain)

**Process:**
1. Buy domain ($10-15/year)
2. Deploy to Vercel (free)
3. Add domain in Vercel (free)
4. Update DNS (free)
5. Done! ✅

---

## 🚀 Next Steps

1. **Deploy to Vercel first** (get free subdomain working)
2. **Buy domain name** (if you want custom domain)
3. **Add domain to Vercel** (free, takes 5 minutes)
4. **Update DNS** (5 minutes)
5. **Enjoy your custom domain!** 🎉

Need help with any step? Let me know!
