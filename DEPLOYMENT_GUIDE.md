# Free Hosting Options for SKC Caterers Application

This guide covers free hosting options for your Next.js + PostgreSQL application.

## 🌐 Domain Name - Do You Need One?

**Short Answer: NO, you don't need to buy a domain!**

All hosting platforms provide **FREE subdomains**:
- ✅ **Vercel**: `your-app.vercel.app` (free forever)
- ✅ **Render**: `your-app.onrender.com` (free forever)
- ✅ **AWS Amplify**: `your-app.amplifyapp.com` (free)
- ✅ **Railway**: `your-app.railway.app` (free)

**Custom Domain (Optional):**
- 💰 Domain name: ~$10-15/year (from registrar like Namecheap, GoDaddy)
- ✅ **Vercel connection: FREE** (no cost to connect custom domain)
- ✅ Professional looking (skccaterers.com vs your-app.vercel.app)
- ✅ Better for branding
- ✅ Free SSL/HTTPS certificate included
- ❌ Not required - free subdomain works perfectly!

**Example:**
- Free subdomain: `skc-caterers.vercel.app` ✅ Works great!
- Custom domain: `skccaterers.com` 💰 Optional, costs $10-15/year for domain only

**Vercel Custom Domain Support:**
- ✅ **YES!** You can use custom domain on Vercel
- ✅ **FREE** to connect (just pay for domain name)
- ✅ Easy setup (~30 minutes)
- ✅ Both URLs work (custom domain + free subdomain)

See `VERCEL_CUSTOM_DOMAIN.md` for detailed setup guide!

You can always add a custom domain later if you want!

## 🎯 Recommended: Easiest Option

### **Vercel (Hosting) + Neon/Supabase (Database)**

**Why this is best:**
- ✅ Completely free forever (with generous limits)
- ✅ Designed for Next.js (made by Next.js creators)
- ✅ Automatic deployments from GitHub
- ✅ Fast setup (10-15 minutes)

**Free Limits:**
- Vercel: 100GB bandwidth/month, unlimited requests
- Neon: 0.5GB database, unlimited projects
- Supabase: 500MB database, 2GB bandwidth

**Setup Steps:**
1. Push your code to GitHub
2. Create free accounts:
   - Vercel.com
   - Neon.tech OR Supabase.com
3. Connect Vercel to your GitHub repo
4. Add database URL to Vercel environment variables
5. Deploy!

---

## ☁️ AWS Free Tier Options

AWS has a free tier, but it's more complex. Here are your options:

### **Option 1: AWS Amplify + RDS PostgreSQL (Easiest AWS Option)**

**Free Tier:**
- ✅ AWS Amplify: Free (pay for usage after free tier)
- ⚠️ RDS PostgreSQL: Free for 12 months (t2.micro, 20GB storage)

**Limitations:**
- RDS free tier expires after 12 months
- More complex setup than Vercel
- Need AWS account and credit card (won't charge during free tier)

**Steps:**
1. Create AWS account
2. Set up RDS PostgreSQL database (free tier)
3. Deploy to AWS Amplify
4. Connect database URL

**Cost after 12 months:**
- RDS: ~$15-20/month
- Amplify: Pay per use (usually free for small apps)

---

### **Option 2: EC2 + RDS (Full Control)**

**Free Tier:**
- ✅ EC2 t2.micro: Free for 12 months (750 hours/month)
- ✅ RDS PostgreSQL: Free for 12 months
- ✅ 15GB data transfer out free

**Limitations:**
- Most complex setup
- Need to manage server yourself
- Free tier expires after 12 months
- Requires Linux server knowledge

---

### **Option 3: AWS Lightsail (Simpler EC2 Alternative)**

**Pricing:**
- 💰 $3.50/month (not free, but very cheap)
- Includes: 512MB RAM, 1 vCPU, 20GB SSD, 1TB transfer

**Benefits:**
- Simpler than EC2
- Includes database option
- Predictable pricing

---

## 📊 Comparison Table

| Platform | Cost | Setup Time | Difficulty | Database Included | Best For |
|----------|------|------------|------------|-------------------|----------|
| **Vercel + Neon** | Free Forever | 15 min | ⭐ Easy | ✅ Yes (separate) | Recommended |
| **AWS Amplify + RDS** | Free 12mo | 30-45 min | ⭐⭐ Medium | ✅ Yes (separate) | AWS Ecosystem |
| **AWS EC2 + RDS** | Free 12mo | 1-2 hours | ⭐⭐⭐ Hard | ✅ Yes (separate) | Full Control |
| **Render** | Free | 20 min | ⭐ Easy | ✅ Yes (included) | Alternative |
| **Railway** | Free ($5 credit/mo) | 15 min | ⭐ Easy | ✅ Yes (included) | Simple Setup |

---

## 🚀 Quick Setup Guide: Vercel + Neon (Recommended)

### Step 1: Prepare Your Code
```bash
# Make sure your code is on GitHub
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Create Neon Database
1. Go to https://neon.tech
2. Sign up with GitHub
3. Create a new project
4. Copy the connection string (looks like: `postgresql://user:pass@host/dbname`)

### Step 3: Deploy to Vercel
1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variable:
   - Name: `DATABASE_URL`
   - Value: (paste your Neon connection string)
6. Click "Deploy"

### Step 4: Run Database Migrations
After deployment, you need to run migrations. You can do this via Vercel CLI:
```bash
npm i -g vercel
vercel login
vercel env pull .env.local
npx prisma migrate deploy
```

Or create a migration script in your Vercel deployment settings.

---

## 🔧 Alternative: Render (Also Free & Easy)

Render.com offers:
- ✅ Free tier for web services
- ✅ Free PostgreSQL database (90 days, then $7/month)
- ✅ Easy setup similar to Vercel
- ✅ Automatic deployments

**Setup:**
1. Push code to GitHub
2. Create account at render.com
3. Create PostgreSQL database
4. Create Web Service (connect to GitHub)
5. Add DATABASE_URL environment variable
6. Deploy!

---

## 💡 Recommendation

**For your use case (SKC Caterers):**
1. **Best Choice**: Vercel + Neon (free forever, easiest)
2. **AWS Option**: AWS Amplify + RDS (if you prefer AWS, free for 12 months)
3. **Budget Option**: Render (free for 3 months, then $7/month)

**Why Vercel + Neon?**
- Built specifically for Next.js
- Free forever (no expiration)
- Zero maintenance
- Fast global CDN
- Automatic SSL certificates
- Easy environment variable management

---

## 📝 Notes

- All options require a credit card for AWS (they won't charge during free tier)
- Free tiers have usage limits (usually enough for small-medium apps)
- Your app is perfect for free tier limits
- Consider paid plans only if you get significant traffic

Would you like me to help you set up any of these options?
