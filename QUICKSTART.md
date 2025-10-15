# 🚀 Quick Start Guide

Get GameControl up and running in minutes!

## Prerequisites

- Node.js 18 or higher
- PostgreSQL database (local or hosted)
- Git

## Setup in 5 Minutes

### 1️⃣ Install Dependencies

```bash
npm install
```

### 2️⃣ Configure Environment

Create a `.env` file:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/gamecontrol"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

### 3️⃣ Set Up Database

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4️⃣ Start Development Server

```bash
npm run dev
```

### 5️⃣ Create Account

1. Open http://localhost:3000
2. Click "Sign up" 
3. Create your account
4. Start adding servers!

---

## Alternative: Use Setup Scripts

### Windows (PowerShell)
```powershell
.\scripts\setup.ps1
```

### Linux/Mac
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

---

## Quick Database Options

### Option 1: Local PostgreSQL
```bash
# Install PostgreSQL, then:
createdb gamecontrol
```

### Option 2: Free Cloud Database (Supabase)
1. Go to [supabase.com](https://supabase.com)
2. Create free account
3. Create new project
4. Copy database URL from Settings → Database
5. Use "Connection Pooling" URL in your `.env`

### Option 3: Vercel Postgres
1. Go to [vercel.com](https://vercel.com)
2. Create Postgres database
3. Copy connection string
4. Add to `.env`

---

## Creating Your First Server

1. **Log in** to your dashboard
2. **Click "Create Server"**
3. **Fill in details:**
   - Name: "My CS2 Server"
   - Game: Counter-Strike 2
   - Host: Your server IP
   - Port: 27015
   - Max Players: 10

4. **Click "Create"** - Done! ✨

---

## Common Issues

### "Cannot connect to database"
- Check DATABASE_URL is correct
- Verify PostgreSQL is running
- Test connection: `npx prisma db push`

### "Module not found"
- Delete `node_modules` and `.next`
- Run `npm install` again

### "NextAuth error"
- Make sure NEXTAUTH_SECRET is set
- Verify NEXTAUTH_URL matches your URL

---

## Next Steps

- 📖 Read the full [README.md](README.md)
- 🚀 Check [DEPLOYMENT.md](DEPLOYMENT.md) for production
- 🤝 See [CONTRIBUTING.md](CONTRIBUTING.md) to contribute

---

**Need Help?** Open an issue on GitHub!

Happy gaming! 🎮

