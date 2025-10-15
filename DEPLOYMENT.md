# Deployment Guide for GameControl

This guide walks you through deploying GameControl to production.

## Prerequisites

- A GitHub account
- A Vercel account (free tier works great)
- A PostgreSQL database (see database options below)

## Step 1: Database Setup

Choose one of these PostgreSQL hosting options:

### Option A: Vercel Postgres (Recommended)

1. Go to your Vercel dashboard
2. Create a new Postgres database
3. Copy the `DATABASE_URL` from the connection string

### Option B: Supabase (Free Tier Available)

1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string (use "Connection Pooling" mode)
5. Format: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

### Option C: Railway

1. Sign up at [railway.app](https://railway.app)
2. Create a new PostgreSQL database
3. Copy the `DATABASE_URL` from the connection tab

### Option D: Neon

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string

## Step 2: Push Code to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - GameControl panel"

# Create main branch
git branch -M main

# Add GitHub remote (replace with your repository URL)
git remote add origin https://github.com/yourusername/Gamecontrol.git

# Push to GitHub
git push -u origin main
```

## Step 3: Deploy to Vercel

### Via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Install Command**: `npm install`

### Environment Variables

Add these in Vercel's environment variables section:

```env
DATABASE_URL=your-postgres-connection-string
NEXTAUTH_SECRET=your-generated-secret
NEXTAUTH_URL=https://your-app.vercel.app
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

5. Click "Deploy"

### Via Vercel CLI (Alternative)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Add environment variables
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL

# Redeploy with env vars
vercel --prod
```

## Step 4: Run Database Migrations

After deployment, you need to run Prisma migrations:

### Option A: Via Local Machine

```bash
# Set production database URL
export DATABASE_URL="your-production-database-url"

# Run migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

### Option B: Via Vercel CLI

```bash
vercel env pull .env.production
npx prisma migrate deploy
```

### Option C: Automatic Migrations

Add to `package.json` scripts:

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "vercel-build": "prisma migrate deploy && next build"
  }
}
```

## Step 5: Create Admin Account

1. Visit your deployed app: `https://your-app.vercel.app`
2. Go to `/register`
3. Create your admin account
4. Sign in at `/login`

## Step 6: Custom Domain (Optional)

1. Go to Vercel project settings
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as instructed
5. Update `NEXTAUTH_URL` environment variable to your custom domain

## Verification Checklist

After deployment, verify:

- [ ] App loads at your Vercel URL
- [ ] Registration page works
- [ ] Login works
- [ ] Dashboard loads
- [ ] Can create a server
- [ ] Can edit a server
- [ ] Can delete a server
- [ ] Server status buttons respond

## Troubleshooting

### "Module not found" errors

```bash
# Clear Vercel cache and redeploy
vercel --prod --force
```

### Database connection issues

- Verify `DATABASE_URL` is correct
- Check database is accessible from Vercel's region
- Ensure SSL mode is correct (add `?sslmode=require` if needed)

### Authentication not working

- Verify `NEXTAUTH_SECRET` is set
- Ensure `NEXTAUTH_URL` matches your deployment URL
- Check browser console for errors

### Prisma Client errors

```bash
# Regenerate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push
```

## Monitoring

### Vercel Analytics

Enable in Vercel dashboard:
1. Project Settings → Analytics
2. Toggle on "Enable Analytics"

### Database Monitoring

Monitor your database using:
- Prisma Studio: `npx prisma studio`
- Supabase Dashboard (if using Supabase)
- Railway Dashboard (if using Railway)

## Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use strong passwords** - For database and admin accounts
3. **Enable 2FA** - On Vercel and GitHub accounts
4. **Rotate secrets** - Change `NEXTAUTH_SECRET` periodically
5. **Monitor access logs** - Check Vercel logs regularly

## Scaling

As your user base grows:

1. **Upgrade database** - Move to production tier
2. **Enable caching** - Add Redis for session storage
3. **CDN assets** - Use Vercel's edge network
4. **Database pooling** - Use connection pooling (PgBouncer)
5. **Monitoring** - Add Sentry or LogRocket

## Cost Estimates

### Free Tier (Perfect for starting)
- Vercel: Free (Hobby plan)
- Supabase: Free (500MB database, 2GB bandwidth)
- Total: **$0/month**

### Production Tier
- Vercel Pro: $20/month
- Supabase Pro: $25/month
- Total: **$45/month**

### Enterprise
- Custom pricing based on usage

## Support

Need help deploying? Check:
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)

---

🚀 **You're all set! Happy deploying!**

