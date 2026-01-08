# Step-by-Step Vercel Deployment Guide

Complete guide to deploy your SKC Caterers application to Vercel.

---

## 📋 Prerequisites

- ✅ Your code is ready
- ✅ GitHub account (free)
- ✅ Email address

---

## Step 1: Push Code to GitHub

If your code is not on GitHub yet:

1. **Create GitHub Repository**
   - Go to https://github.com
   - Sign up/login
   - Click "New repository"
   - Name: `skc-caterers` (or any name)
   - Make it **Public** or **Private** (your choice)
   - Don't initialize with README
   - Click "Create repository"

2. **Push Your Code**
   ```bash
   # In your project directory
   git init
   git add .
   git commit -m "Initial commit - SKC Caterers app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/skc-caterers.git
   git push -u origin main
   ```

   Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 2: Create Database (Neon - Recommended)

1. **Go to Neon**
   - Visit https://neon.tech
   - Click "Sign Up" (use GitHub login - easiest!)

2. **Create Project**
   - Click "Create Project"
   - Project name: `skc-caterers`
   - Region: Choose closest to you (e.g., US East, Asia Pacific)
   - Click "Create Project"

3. **Get Connection String**
   - After project creation, you'll see a connection string
   - It looks like:
     ```
     postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
     ```
   - **Copy this connection string** - you'll need it!
   - Click "Copy" button

4. **Save Connection String**
   - Keep this safe - you'll use it in Vercel

---

## Step 3: Deploy to Vercel

1. **Sign Up for Vercel**
   - Go to https://vercel.com
   - Click "Sign Up"
   - Choose "Continue with GitHub" (recommended)
   - Authorize Vercel to access your GitHub

2. **Create New Project**
   - In Vercel dashboard, click "Add New..." → "Project"
   - You'll see your GitHub repositories
   - Find `skc-caterers` (or your repo name)
   - Click "Import"

3. **Configure Project**
   - **Project Name**: `skc-caterers` (or leave default)
   - **Framework Preset**: Should auto-detect "Next.js" ✅
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

4. **Add Environment Variables**
   - Scroll down to "Environment Variables"
   - Click "Add" or edit
   - Add this variable:
     - **Key**: `DATABASE_URL`
     - **Value**: (Paste your Neon connection string from Step 2)
     - **Environment**: Select all (Production, Preview, Development)
     - Click "Save"

5. **Deploy**
   - Scroll down and click "Deploy"
   - Wait 2-5 minutes for deployment
   - Vercel will build your app automatically

---

## Step 4: Run Database Migrations

After deployment, you need to create your database tables:

### Option A: Using Vercel CLI (Recommended)

1. **Install Vercel CLI** (on your local machine)
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```
   - Follow the prompts to login

3. **Link Your Project**
   ```bash
   cd /path/to/your/project
   vercel link
   ```
   - Select your account
   - Select your project
   - Overwrite settings? No

4. **Pull Environment Variables**
   ```bash
   vercel env pull .env.local
   ```

5. **Run Migrations**
   ```bash
   # Make sure DATABASE_URL is set
   npx prisma migrate deploy
   ```

### Option B: Using Neon SQL Editor (Alternative)

1. **Go to Neon Dashboard**
   - Open your project in Neon
   - Click "SQL Editor"

2. **Copy Migration SQL**
   - In your local project, go to `prisma/migrations`
   - Find the latest migration folder
   - Open `migration.sql`
   - Copy all SQL content

3. **Run in Neon SQL Editor**
   - Paste SQL in Neon SQL Editor
   - Click "Run"
   - Tables will be created

### Option C: Using Prisma Studio (Alternative)

1. **Set DATABASE_URL locally**
   ```bash
   # In your project directory
   export DATABASE_URL="your-neon-connection-string"
   # Or create .env.local file with DATABASE_URL
   ```

2. **Run migrations**
   ```bash
   npx prisma migrate deploy
   ```

---

## Step 5: Verify Deployment

1. **Check Vercel Dashboard**
   - Go to your Vercel dashboard
   - Click on your project
   - You should see "Ready" status ✅

2. **Visit Your App**
   - Click on the deployment
   - Click the URL (e.g., `skc-caterers.vercel.app`)
   - Your app should load!

3. **Test Your App**
   - Try creating a customer
   - Try creating a menu item
   - Try creating an order
   - Everything should work! ✅

---

## Step 6: (Optional) Initialize Menu Items

If you want to populate menu items:

1. **Access Your App**
   - Go to your deployed app URL
   - Navigate to Menu page
   - Click "Initialize Menu Items" button
   - Confirm the action
   - Menu items will be added!

---

## 🔧 Troubleshooting

### Build Fails

**Error: Prisma Client not generated**
```bash
# Solution: Add build command override
# In Vercel project settings → Build & Development Settings
# Override build command:
npm run build
# Or add prebuild script in package.json
```

**Fix**: Add to `package.json`:
```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma generate && next build"
  }
}
```

### Database Connection Error

**Error: Can't connect to database**
- Check DATABASE_URL environment variable is set correctly
- Verify connection string from Neon includes `?sslmode=require`
- Check Neon project is active (not paused)

### Migration Errors

**Error: Tables already exist**
- This is OK if you've run migrations before
- Skip to Step 5 (Verification)

---

## 📝 Important Notes

1. **Environment Variables**
   - DATABASE_URL is the only required variable
   - Add any other env vars in Vercel → Settings → Environment Variables

2. **Automatic Deployments**
   - Every push to `main` branch = new deployment
   - Preview deployments for pull requests
   - All automatic! ✅

3. **Database**
   - Neon free tier: 0.5GB storage, unlimited projects
   - Enough for small-medium apps
   - Upgrade later if needed

4. **Custom Domain**
   - Free subdomain works: `your-app.vercel.app`
   - Can add custom domain later (see `VERCEL_CUSTOM_DOMAIN.md`)

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Neon database created
- [ ] Connection string copied
- [ ] Vercel account created
- [ ] Project imported from GitHub
- [ ] DATABASE_URL environment variable added
- [ ] Deployment successful
- [ ] Database migrations run
- [ ] App tested and working

---

## 🎉 Success!

Your app is now live at:
- **URL**: `https://your-app-name.vercel.app`
- **Free forever** (within limits)
- **Auto-deployments** from GitHub
- **HTTPS/SSL** included
- **Global CDN** for fast loading

---

## 🔄 Future Updates

To update your app:
1. Make changes to your code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update app"
   git push
   ```
3. Vercel automatically deploys! 🚀

No manual deployment needed!

---

## 📞 Need Help?

Common issues:
- **Build errors**: Check Vercel deployment logs
- **Database errors**: Verify DATABASE_URL is correct
- **Migration errors**: Run `npx prisma migrate deploy` locally first

Your app should be live now! 🎉
