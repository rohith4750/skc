# AWS Free Tier Deployment Guide

This guide covers deploying your SKC Caterers application to AWS using the free tier.

## ⚠️ Important Notes

- **AWS Free Tier expires after 12 months**
- **Requires credit card** (won't charge during free tier if you stay within limits)
- **More complex than Vercel/Render**
- **Best for**: If you want to learn AWS or prefer AWS ecosystem

---

## 🎯 Option 1: AWS Amplify + RDS (Recommended AWS Option)

### Prerequisites
- AWS Account (create at aws.amazon.com)
- GitHub repository with your code
- Credit card for verification (won't charge during free tier)

### Step 1: Create RDS PostgreSQL Database

1. **Login to AWS Console**
   - Go to https://console.aws.amazon.com
   - Search for "RDS" in the services

2. **Create Database**
   - Click "Create database"
   - Choose "PostgreSQL"
   - Template: **"Free tier"**
   - Settings:
     - DB instance identifier: `skc-caterers-db`
     - Master username: `postgres` (or your choice)
     - Master password: (create a strong password - save this!)
   - Instance configuration: **db.t2.micro** (Free tier)
   - Storage: 20GB (free tier limit)
   - VPC: Default
   - Public access: **Yes** (for Amplify to connect)
   - Security group: Create new (we'll update later)
   - Click "Create database"

3. **Update Security Group**
   - Go to RDS → Databases → Your database
   - Click on "VPC security group"
   - Inbound rules → Edit inbound rules
   - Add rule:
     - Type: PostgreSQL
     - Source: Anywhere-IPv4 (0.0.0.0/0) OR your Amplify IP
     - Save rules

4. **Get Connection String**
   - In RDS console, click on your database
   - Copy the "Endpoint" (e.g., `skc-caterers-db.xxxxx.us-east-1.rds.amazonaws.com:5432`)
   - Connection string format:
     ```
     postgresql://username:password@endpoint:5432/postgres
     ```

### Step 2: Deploy to AWS Amplify

1. **Prepare Your Code**
   ```bash
   # Make sure code is on GitHub
   git add .
   git commit -m "Ready for AWS deployment"
   git push origin main
   ```

2. **Create Amplify App**
   - Go to AWS Console → Search "Amplify"
   - Click "New app" → "Host web app"
   - Connect to GitHub (authorize AWS)
   - Select your repository
   - Branch: `main` or `master`
   - App name: `skc-caterers`

3. **Configure Build Settings**
   - Amplify should auto-detect Next.js
   - Build settings (amplify.yml):
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
           - npx prisma generate
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
         - .next/cache/**/*
   ```

4. **Add Environment Variables**
   - In Amplify console → App settings → Environment variables
   - Add:
     - `DATABASE_URL`: (your RDS connection string from Step 1)

5. **Deploy**
   - Click "Save and deploy"
   - Wait 5-10 minutes for first deployment
   - Your app will be live at: `https://main.xxxxx.amplifyapp.com`

### Step 3: Run Database Migrations

After first deployment, you need to run Prisma migrations:

**Option A: Using AWS CloudShell**
1. In AWS Console, click CloudShell icon (top bar)
2. Run:
   ```bash
   git clone https://github.com/your-username/your-repo.git
   cd your-repo
   npm install
   npx prisma migrate deploy
   ```

**Option B: Local Machine**
```bash
# Set DATABASE_URL to your RDS connection string
export DATABASE_URL="postgresql://user:pass@rds-endpoint:5432/postgres"
npx prisma migrate deploy
```

---

## 🖥️ Option 2: AWS EC2 + RDS (More Control, More Complex)

### Free Tier Resources
- **EC2 t2.micro**: 750 hours/month free (1 instance always running = free)
- **RDS PostgreSQL**: Free for 12 months (db.t2.micro)
- **EBS Storage**: 30GB free
- **Data Transfer**: 15GB out free/month

### Step 1: Launch EC2 Instance

1. **EC2 Console**
   - Go to AWS Console → EC2
   - Click "Launch Instance"

2. **Configure Instance**
   - Name: `skc-caterers-server`
   - AMI: **Amazon Linux 2023** (free tier eligible)
   - Instance type: **t2.micro** (free tier)
   - Key pair: Create new (download .pem file - save securely!)
   - Network settings: Allow HTTP/HTTPS traffic
   - Storage: 20GB (free tier)

3. **Launch**
   - Click "Launch instance"
   - Wait 2-3 minutes for instance to start

### Step 2: Connect to EC2

```bash
# On your local machine
chmod 400 your-key.pem
ssh -i your-key.pem ec2-user@your-ec2-public-ip
```

### Step 3: Install Dependencies on EC2

```bash
# Update system
sudo yum update -y

# Install Node.js 18
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Install Git
sudo yum install git -y

# Install PostgreSQL client (for migrations)
sudo yum install postgresql15 -y
```

### Step 4: Clone and Setup Application

```bash
# Clone your repository
git clone https://github.com/your-username/your-repo.git
cd your-repo

# Install dependencies
npm install

# Set environment variable
export DATABASE_URL="postgresql://user:pass@rds-endpoint:5432/postgres"

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build application
npm run build
```

### Step 5: Run Application with PM2

```bash
# Install PM2 (process manager)
npm install -g pm2

# Start application
pm2 start npm --name "skc-caterers" -- start

# Make PM2 start on boot
pm2 startup
pm2 save
```

### Step 6: Setup Nginx Reverse Proxy

```bash
# Install Nginx
sudo amazon-linux-extras install nginx1 -y

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Configure Nginx
sudo nano /etc/nginx/nginx.conf
```

Add this server block:
```nginx
server {
    listen 80;
    server_name your-ec2-public-ip;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
```

### Step 7: Setup SSL (Optional but Recommended)

Use AWS Certificate Manager + Application Load Balancer (costs ~$15/month) OR use Let's Encrypt (free):

```bash
# Install Certbot
sudo yum install certbot python3-certbot-nginx -y

# Get certificate (need domain name)
sudo certbot --nginx -d yourdomain.com
```

---

## 💰 Cost After Free Tier Expires

### Amplify + RDS:
- RDS db.t2.micro: ~$15-20/month
- Amplify: Pay per use (usually $0-5/month for small apps)
- **Total: ~$15-25/month**

### EC2 + RDS:
- EC2 t2.micro: ~$8-10/month
- RDS db.t2.micro: ~$15-20/month
- **Total: ~$23-30/month**

---

## 🆚 Why Not AWS?

**AWS Free Tier Limitations:**
- ⏰ Expires after 12 months
- 🔧 More complex setup
- 💳 Requires credit card
- 📚 Steeper learning curve

**Better Free Alternatives:**
- ✅ **Vercel + Neon**: Free forever, easier setup
- ✅ **Render**: Free tier + $7/month for database (after 90 days)
- ✅ **Railway**: $5 free credit/month

---

## 🎯 Recommendation

**For SKC Caterers:**
1. **Start with Vercel + Neon** (free forever, 15 min setup)
2. **Move to AWS later** if you need AWS-specific features
3. **Use AWS if** you're learning AWS or need AWS services

**Quick Decision Guide:**
- Want free forever? → **Vercel + Neon**
- Prefer AWS ecosystem? → **Amplify + RDS**
- Need full server control? → **EC2 + RDS**
- Want simplest setup? → **Render.com**

---

## 📞 Need Help?

If you want help setting up any of these options, let me know which one you prefer!
