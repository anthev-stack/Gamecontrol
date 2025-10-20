# Railway Deployment Guide for GameControl

Deploy your GameControl application to Railway - a modern platform with built-in PostgreSQL and excellent Next.js support.

## 🚀 Quick Start (5 minutes)

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Connect your GameControl repository

### Step 2: Deploy Your App

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your GameControl repository
4. Railway will automatically detect it's a Next.js app

### Step 3: Add PostgreSQL Database

1. In your project dashboard, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will create a database and provide connection details

### Step 4: Set Environment Variables

In your project settings, add these variables:

```env
# Database (Railway will provide this automatically)
DATABASE_URL=postgresql://postgres:password@containers-us-west-xyz.railway.app:5432/railway

# Authentication
NEXTAUTH_SECRET=your-generated-secret-here
NEXTAUTH_URL=https://your-app-name.railway.app

# VM Manager (Optional - for actual server deployment)
VM_API_URL=http://your-vps-ip:3001
VM_API_KEY=your-vm-api-key
```

### Step 5: Update Prisma Schema

Update your `prisma/schema.prisma` to use `DATABASE_URL` instead of `STORAGE_DATABASE_URL`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Step 6: Deploy!

Railway will automatically:
1. Install dependencies
2. Run `prisma generate`
3. Run `prisma db push`
4. Build your Next.js app
5. Deploy it!

## 🔧 Detailed Setup

### Prerequisites

- GitHub account
- Railway account (free)
- Your GameControl code in a GitHub repository

### Step-by-Step Instructions

#### 1. Prepare Your Repository

Make sure your `package.json` has the correct scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "postinstall": "prisma generate"
  }
}
```

#### 2. Update Prisma Configuration

Since Railway uses `DATABASE_URL` by default, update your schema:

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

#### 3. Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your GameControl repository
5. Railway will auto-detect Next.js and configure it

#### 4. Add Database

1. In your project dashboard
2. Click "New" → "Database" → "PostgreSQL"
3. Railway creates the database automatically
4. The `DATABASE_URL` will be available as an environment variable

#### 5. Configure Environment Variables

Go to your project → Variables tab and add:

```env
# Railway provides DATABASE_URL automatically
# You need to add these:

NEXTAUTH_SECRET=ZIkp38fwDBqOk16uUlJi9ccGsRXqxiB5cuFAw+fWmS4=
NEXTAUTH_URL=https://your-app-name.railway.app

# Optional - for VM integration
VM_API_URL=http://your-vps-ip:3001
VM_API_KEY=your-generated-api-key
```

#### 6. Generate NEXTAUTH_SECRET

If you need a new secret:

```bash
# Generate a secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### 7. Deploy

Railway will automatically:
- Install dependencies (`npm install`)
- Generate Prisma client (`prisma generate`)
- Push database schema (`prisma db push`)
- Build your app (`next build`)
- Deploy it!

## 🌐 Custom Domain (Optional)

1. Go to your project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` to your custom domain
5. Redeploy

## 📊 Monitoring & Logs

### View Logs
- Go to your project dashboard
- Click on your service
- View real-time logs

### Monitor Performance
- Railway provides built-in metrics
- Monitor CPU, memory, and network usage
- Set up alerts for downtime

## 🔧 Troubleshooting

### Common Issues

#### "Cannot connect to database"
- Check `DATABASE_URL` is set correctly
- Verify database is running in Railway dashboard
- Try redeploying

#### "NextAuth configuration error"
- Ensure `NEXTAUTH_SECRET` is set
- Verify `NEXTAUTH_URL` matches your Railway URL
- Check for typos in environment variables

#### "Build failed"
- Check build logs in Railway dashboard
- Ensure all dependencies are in `package.json`
- Verify `prisma generate` runs successfully

### Debug Commands

```bash
# Check environment variables
railway variables

# View logs
railway logs

# Connect to database
railway connect postgres
```

## 💰 Pricing

### Free Tier
- 500 hours/month of usage
- 1GB RAM
- 1GB storage
- Perfect for development and small projects

### Pro Plan ($5/month)
- Unlimited usage
- 8GB RAM
- 100GB storage
- Custom domains
- Better performance

## 🚀 Advanced Features

### Automatic Deployments
- Push to `main` branch = automatic production deploy
- Push to other branches = preview deployments
- Rollback to previous versions easily

### Environment Management
- Separate environments for dev/staging/prod
- Easy variable management
- Secret management

### Database Management
- Built-in PostgreSQL
- Automatic backups
- Easy scaling
- Database browser in dashboard

## 🔐 Security

### Environment Variables
- All variables are encrypted
- Never logged or exposed
- Easy to rotate secrets

### HTTPS
- Automatic SSL certificates
- HTTPS by default
- Secure connections

## 📈 Scaling

### Horizontal Scaling
- Add more instances easily
- Load balancing included
- Auto-scaling based on traffic

### Database Scaling
- Upgrade database plan
- Read replicas available
- Connection pooling

## 🎯 Why Railway is Perfect for GameControl

1. **Built-in PostgreSQL** - No external database needed
2. **Next.js Optimized** - Perfect for your stack
3. **Easy Environment Variables** - Simple configuration
4. **Automatic Deployments** - Push to deploy
5. **Free Tier** - Great for development
6. **Reliable** - 99.9% uptime SLA
7. **Fast** - Global CDN included

## 📞 Support

- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- Documentation: [docs.railway.app](https://docs.railway.app)
- Status Page: [status.railway.app](https://status.railway.app)

---

🚀 **Ready to deploy? Start with Railway and get your GameControl app online in minutes!**

