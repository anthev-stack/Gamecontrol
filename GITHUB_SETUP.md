# 🚀 Push to GitHub & Deploy to Vercel

Follow these steps to push your GameControl project to GitHub and deploy it to Vercel.

## Step 1: Create GitHub Repository

### Option A: Via GitHub Website (Easier)

1. Go to [github.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right
3. Select **"New repository"**
4. Name it: **`Gamecontrol`**
5. Description: "Game server management panel for CS2, Minecraft, and Rust"
6. Keep it **Public** or **Private** (your choice)
7. **DO NOT** initialize with README, .gitignore, or license (we already have them)
8. Click **"Create repository"**

### Option B: Via GitHub CLI

```bash
gh repo create Gamecontrol --public --source=. --remote=origin
```

## Step 2: Push Your Code to GitHub

Copy the commands from GitHub's "…or push an existing repository from the command line" section, or use these:

```bash
# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR-USERNAME/Gamecontrol.git

# Rename branch to main (if needed)
git branch -M main

# Push your code
git push -u origin main
```

**Replace `YOUR-USERNAME`** with your actual GitHub username!

### Example:
```bash
git remote add origin https://github.com/johndoe/Gamecontrol.git
git branch -M main
git push -u origin main
```

You'll be prompted for your GitHub credentials or token.

## Step 3: Verify on GitHub

1. Refresh your GitHub repository page
2. You should see all your files uploaded
3. The README will display automatically

## Step 4: Deploy to Vercel

### 4.1 Set Up Database First

Before deploying, you need a production database. Choose one:

**Recommended: Vercel Postgres**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Storage" → "Create Database"
3. Select "Postgres"
4. Choose a name: `gamecontrol-db`
5. Select region closest to you
6. Click "Create"
7. Copy the `POSTGRES_URL` - you'll need this!

**Alternative: Supabase (Free)**
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Wait for database to initialize
4. Go to Settings → Database
5. Copy "Connection Pooling" URL
6. Use this as your `DATABASE_URL`

### 4.2 Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New"** → **"Project"**
3. **Import** your GitHub repository (Gamecontrol)
4. Configure project:
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: `./`
   - **Build Command**: Leave default
   - **Output Directory**: Leave default

### 4.3 Add Environment Variables

Click **"Environment Variables"** and add these three:

| Name | Value |
|------|-------|
| `DATABASE_URL` | Your PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Generate with: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Will be your Vercel URL (add after first deploy) |

**For now, set `NEXTAUTH_URL` to:** `https://your-project.vercel.app` (you'll update this)

### 4.4 Deploy!

1. Click **"Deploy"**
2. Wait for build to complete (2-3 minutes)
3. You'll get a URL like: `https://gamecontrol-abc123.vercel.app`

### 4.5 Update NEXTAUTH_URL

1. Copy your deployment URL
2. Go to Vercel project → Settings → Environment Variables
3. Edit `NEXTAUTH_URL` to your actual URL
4. Click **"Save"**
5. Go to Deployments → Click "..." → **"Redeploy"**

### 4.6 Run Database Migration

You need to create the database tables:

**Option A: Via Local Machine**
```bash
# Set your production database URL
$env:DATABASE_URL="your-production-database-url"  # Windows PowerShell
# OR
export DATABASE_URL="your-production-database-url"  # Mac/Linux

# Run migration
npx prisma migrate deploy
```

**Option B: Add Build Script**

This was already set up in `package.json`:
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

The first time you deploy, manually run:
```bash
npx prisma db push
```
against your production database URL.

## Step 5: Create Your First User

1. Visit your deployed URL: `https://your-app.vercel.app`
2. Click **"Sign up"**
3. Create your account
4. Sign in
5. Start adding servers! 🎮

## Step 6: Set Up Custom Domain (Optional)

1. Go to Vercel project → Settings → Domains
2. Add your custom domain (e.g., `gamecontrol.yourdomain.com`)
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` environment variable
5. Redeploy

## Troubleshooting

### "Cannot connect to database"
- Verify `DATABASE_URL` is correct in Vercel
- Check database is running
- Ensure firewall allows Vercel's IPs

### "Internal Server Error"
- Check Vercel logs: Project → Deployments → View Logs
- Verify all environment variables are set
- Run `npx prisma generate` locally and push again

### "NextAuth configuration error"
- Ensure `NEXTAUTH_SECRET` is set
- Verify `NEXTAUTH_URL` matches your domain
- Must be HTTPS in production

### Build fails
- Check build logs in Vercel
- Verify `package.json` has all dependencies
- Try `npm install && npm run build` locally first

## Continuous Deployment

Now every time you push to GitHub, Vercel will automatically:
1. Build your changes
2. Run tests
3. Deploy if successful
4. Give you a preview URL

### Making Changes

```bash
# Make your changes
# ...

# Stage and commit
git add .
git commit -m "Add feature XYZ"

# Push to GitHub
git push

# Vercel automatically deploys! 🚀
```

## Environment Variables Quick Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | Secret for JWT encryption | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your app's public URL | `https://gamecontrol.vercel.app` |

## Security Checklist

- [ ] Strong database password
- [ ] Random NEXTAUTH_SECRET (32+ chars)
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Database connection uses SSL
- [ ] Environment variables not in code
- [ ] .env files in .gitignore
- [ ] GitHub repo security settings configured

## What's Next?

✅ **Project deployed!**

Now you can:
- Share the URL with your team
- Add game servers
- Monitor your servers
- Customize the design
- Add more features

## Getting Help

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **Prisma Docs**: [prisma.io/docs](https://prisma.io/docs)
- **Open an Issue**: On your GitHub repo

---

**Congratulations! 🎉 Your GameControl panel is live!**

