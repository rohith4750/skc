# Quick Deployment Guide - Vercel

**Total Time: ~15 minutes**

---

## 🚀 Quick Steps

### 1. Push to GitHub (5 min)
```bash
git init
git add .
git commit -m "Ready for deployment"
git remote add origin https://github.com/YOUR_USERNAME/skc-caterers.git
git push -u origin main
```

### 2. Create Database (5 min)
- Go to https://neon.tech
- Sign up with GitHub
- Create project → Copy connection string

### 3. Deploy to Vercel (5 min)
- Go to https://vercel.com
- Sign up with GitHub
- Import repository
- Add environment variable: `DATABASE_URL` = (Neon connection string)
- Click Deploy

### 4. Run Migrations (2 min)
```bash
# Install Vercel CLI
npm install -g vercel

# Login and link
vercel login
vercel link
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy
```

### 5. Done! ✅
Visit your app at: `https://your-app.vercel.app`

---

## 📝 Full Details

See `VERCEL_DEPLOYMENT_STEPS.md` for detailed instructions.

---

## ⚡ Even Faster Alternative: Render

If you want everything in one place:
- Render.com provides database + hosting
- See `DEPLOYMENT_GUIDE.md` for Render setup
