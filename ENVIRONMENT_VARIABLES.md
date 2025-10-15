# Environment Variables Reference

Complete guide to all environment variables needed for GameControl deployment.

---

## 📋 Quick Summary

### Vercel (GameControl Panel) - 5 Variables
```env
STORAGE_DATABASE_URL=...    # PostgreSQL connection
NEXTAUTH_SECRET=...         # Authentication secret
NEXTAUTH_URL=...            # Your Vercel URL
VM_API_URL=...              # Your VPS URL
VM_API_KEY=...              # VM authentication
```

### VPS (VM Manager) - 3 Variables
```env
PORT=3001                   # API port
API_KEY=...                 # Authentication key
VM_HOST=...                 # Your VPS IP
```

---

## 🌐 Vercel Environment Variables (GameControl Panel)

### 1. STORAGE_DATABASE_URL ⚡ **REQUIRED**

**What it is:** PostgreSQL database connection string

**Where to get it:** From your Neon/Supabase/Vercel Postgres database

**Your current value:**
```env
STORAGE_DATABASE_URL=postgresql://neondb_owner:npg_n6DcNLQVd1OP@ep-little-hall-a7akbdq0-pooler.ap-southeast-2.aws.neon.tech/neondb?connect_timeout=15&sslmode=require
```

**How to set:**
1. Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Add `STORAGE_DATABASE_URL`
4. Paste your Neon connection string
5. Select: Production, Preview, Development

---

### 2. NEXTAUTH_SECRET ⚡ **REQUIRED**

**What it is:** Secret key for encrypting authentication tokens

**Your current value:**
```env
NEXTAUTH_SECRET=ZIkp38fwDBqOk16uUlJi9ccGsRXqxiB5cuFAw+fWmS4=
```

**How to generate a new one:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**How to set:**
1. Vercel Dashboard → Settings → Environment Variables
2. Add `NEXTAUTH_SECRET`
3. Paste the generated secret
4. Select: Production, Preview, Development

⚠️ **Important:** Keep this secret secure! Never share it.

---

### 3. NEXTAUTH_URL ⚡ **REQUIRED**

**What it is:** Your application's public URL

**Value:**
```env
NEXTAUTH_URL=https://gamecontrol.vercel.app
```

Or if using custom domain:
```env
NEXTAUTH_URL=https://yourdomain.com
```

**How to set:**
1. After first Vercel deployment, copy your URL
2. Settings → Environment Variables
3. Add `NEXTAUTH_URL`
4. Paste your Vercel URL
5. Redeploy

---

### 4. VM_API_URL ⚙️ **OPTIONAL** (Required for actual servers)

**What it is:** URL to your VM Manager API on VPS

**Value:**
```env
VM_API_URL=http://YOUR-VPS-IP:3001
```

Or with SSL:
```env
VM_API_URL=https://vm.yourdomain.com
```

**Where to get it:**
- Your VPS IP address + port 3001
- Or your domain if you set up nginx reverse proxy

**How to set:**
1. Vercel Dashboard → Settings → Environment Variables
2. Add `VM_API_URL`
3. Value: `http://YOUR-VPS-IP:3001`
4. Select: Production, Preview, Development

**If not set:** Panel works but servers won't deploy to VM (database-only mode).

---

### 5. VM_API_KEY ⚙️ **OPTIONAL** (Required for actual servers)

**What it is:** Authentication key for VM Manager API

**Value:** The same API key you set in VM Manager's `.env`

**Example:**
```env
VM_API_KEY=kP9mN2xL5vR8yT4wZ1bC3dF6gH8jK0lM
```

**How to get it:**
- Generated when you set up VM Manager
- Or generate new: `openssl rand -base64 32`

**How to set:**
1. Vercel Dashboard → Settings → Environment Variables
2. Add `VM_API_KEY`
3. Paste the same key from your VPS
4. Select: Production, Preview, Development

⚠️ **Important:** Must match the `API_KEY` in VM Manager's `.env`

---

## 🖥️ VPS Environment Variables (VM Manager)

Located at: `/opt/gamecontrol-vm/.env`

### 1. PORT ⚡ **REQUIRED**

**What it is:** Port VM Manager API listens on

**Default value:**
```env
PORT=3001
```

**Can change to:** Any unused port (e.g., 3002, 8080)

**If you change it:**
- Update firewall: `sudo ufw allow YOUR-PORT/tcp`
- Update Vercel's `VM_API_URL` to match

---

### 2. API_KEY ⚡ **REQUIRED**

**What it is:** Secret key for authenticating requests from GameControl

**How to generate:**
```bash
openssl rand -base64 32
```

**Example:**
```env
API_KEY=kP9mN2xL5vR8yT4wZ1bC3dF6gH8jK0lM
```

**Requirements:**
- Minimum 20 characters
- Random and secure
- Must match Vercel's `VM_API_KEY`

⚠️ **Important:** Keep this secret! Anyone with this key can control your VM.

---

### 3. VM_HOST ⚡ **REQUIRED**

**What it is:** Your VPS's public IP address or domain

**How to get your IP:**
```bash
curl ifconfig.me
```

**Example:**
```env
VM_HOST=192.168.1.100
```

Or with domain:
```env
VM_HOST=gamecontrol.yourdomain.com
```

**Used for:** Returning connection info to GameControl panel

---

## 📝 Complete .env Files

### Vercel (.env on Vercel Dashboard)

```env
# Database (Required)
STORAGE_DATABASE_URL=postgresql://neondb_owner:npg_n6DcNLQVd1OP@ep-little-hall-a7akbdq0-pooler.ap-southeast-2.aws.neon.tech/neondb?connect_timeout=15&sslmode=require

# Authentication (Required)
NEXTAUTH_SECRET=ZIkp38fwDBqOk16uUlJi9ccGsRXqxiB5cuFAw+fWmS4=
NEXTAUTH_URL=https://gamecontrol.vercel.app

# VM Connection (Optional - for actual server deployment)
VM_API_URL=http://YOUR-VPS-IP:3001
VM_API_KEY=your-generated-api-key-here
```

### VPS (.env in /opt/gamecontrol-vm/)

```env
# VM Manager Configuration
PORT=3001
API_KEY=your-generated-api-key-here
VM_HOST=your-vps-public-ip
```

---

## 🔑 How to Generate Secure Keys

### For NEXTAUTH_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### For API_KEY:
```bash
openssl rand -base64 32
```

---

## ✅ Validation Checklist

### Vercel Variables:
- [ ] `STORAGE_DATABASE_URL` - Can you connect to database?
- [ ] `NEXTAUTH_SECRET` - Is it 32+ characters?
- [ ] `NEXTAUTH_URL` - Matches your Vercel URL?
- [ ] `VM_API_URL` - Can you ping your VPS?
- [ ] `VM_API_KEY` - Matches your VPS API_KEY?

### VPS Variables:
- [ ] `PORT` - Is port 3001 available?
- [ ] `API_KEY` - Is it secure (32+ chars)?
- [ ] `VM_HOST` - Is this your public IP?
- [ ] Keys match between Vercel and VPS?

---

## 🔍 Testing Variables

### Test Database Connection:
```bash
# From your local machine
npx prisma db push
```

Should connect successfully.

### Test VM Connection:
```bash
# From your local machine (replace values)
curl -H "x-api-key: YOUR-VM-API-KEY" http://YOUR-VPS-IP:3001/api/status
```

Should return VM status JSON.

### Test Full Flow:
1. Login to GameControl panel
2. Create a server
3. Check if it appears on VPS: `docker ps`

If all works, your environment variables are correct!

---

## 🚨 Common Mistakes

### ❌ Wrong Database URL Variable Name

**Wrong:**
```env
DATABASE_URL=postgresql://...
```

**Correct:**
```env
STORAGE_DATABASE_URL=postgresql://...
```

GameControl uses `STORAGE_DATABASE_URL` (from Neon integration).

---

### ❌ API Keys Don't Match

**Problem:** Different keys in Vercel and VPS

**Vercel:**
```env
VM_API_KEY=abc123
```

**VPS:**
```env
API_KEY=xyz789  ← WRONG!
```

**Solution:** Must be the **same** value!

---

### ❌ Wrong NEXTAUTH_URL

**Wrong:**
```env
NEXTAUTH_URL=http://localhost:3000
```

**Correct:**
```env
NEXTAUTH_URL=https://gamecontrol.vercel.app
```

Must be your **actual** Vercel URL!

---

### ❌ Missing HTTP/HTTPS in VM_API_URL

**Wrong:**
```env
VM_API_URL=192.168.1.100:3001
```

**Correct:**
```env
VM_API_URL=http://192.168.1.100:3001
```

Must include `http://` or `https://`!

---

## 🔧 How to Update Variables

### On Vercel:

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your GameControl project
3. Click **Settings** → **Environment Variables**
4. Find the variable you want to update
5. Click **"..."** → **Edit**
6. Update the value
7. Click **Save**
8. Go to **Deployments** → **Redeploy**

### On VPS:

```bash
# Edit .env file
cd /opt/gamecontrol-vm
nano .env

# Make changes, save (Ctrl+X, Y, Enter)

# Restart VM Manager
pm2 restart gamecontrol-vm

# Verify new values loaded
pm2 logs gamecontrol-vm
```

---

## 📊 Variable Usage Map

### What Each Variable Does:

| Variable | Used By | Purpose |
|----------|---------|---------|
| `STORAGE_DATABASE_URL` | Prisma | Connect to PostgreSQL |
| `NEXTAUTH_SECRET` | NextAuth | Encrypt JWT tokens |
| `NEXTAUTH_URL` | NextAuth | Generate callback URLs |
| `VM_API_URL` | GameControl API | Call VM Manager |
| `VM_API_KEY` | GameControl API | Authenticate with VM |
| `PORT` | VM Manager | Listen for requests |
| `API_KEY` | VM Manager | Validate incoming requests |
| `VM_HOST` | VM Manager | Return server connection details |

---

## 🎯 Deployment Scenarios

### Scenario 1: Panel Only (No VM Yet)

**Vercel:**
```env
STORAGE_DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://gamecontrol.vercel.app
# VM_API_URL - not set
# VM_API_KEY - not set
```

**Result:** Panel works, can create servers in database, but they won't deploy to VM.

---

### Scenario 2: Full Deployment (Panel + VM)

**Vercel:**
```env
STORAGE_DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://gamecontrol.vercel.app
VM_API_URL=http://192.168.1.100:3001
VM_API_KEY=abc123xyz...
```

**VPS:**
```env
PORT=3001
API_KEY=abc123xyz...  ← Must match Vercel's VM_API_KEY
VM_HOST=192.168.1.100
```

**Result:** Full functionality - servers deploy to VM!

---

## 📱 Copy-Paste Template

### For Vercel Dashboard:

```
Name:  STORAGE_DATABASE_URL
Value: postgresql://neondb_owner:npg_n6DcNLQVd1OP@ep-little-hall-a7akbdq0-pooler.ap-southeast-2.aws.neon.tech/neondb?connect_timeout=15&sslmode=require

Name:  NEXTAUTH_SECRET
Value: ZIkp38fwDBqOk16uUlJi9ccGsRXqxiB5cuFAw+fWmS4=

Name:  NEXTAUTH_URL
Value: https://gamecontrol.vercel.app

Name:  VM_API_URL
Value: http://YOUR-VPS-IP:3001

Name:  VM_API_KEY
Value: (paste the API_KEY from your VPS .env)
```

### For VPS (/opt/gamecontrol-vm/.env):

```env
PORT=3001
API_KEY=paste-generated-key-here
VM_HOST=your-vps-public-ip
```

---

## 🔐 Security Notes

### Never Commit to Git:
- ❌ `.env` files
- ❌ API keys
- ❌ Database passwords
- ❌ Secrets

**Already protected:** `.env` is in `.gitignore`

### Keep Secure:
- ✅ `NEXTAUTH_SECRET` - Compromised = stolen sessions
- ✅ `API_KEY` / `VM_API_KEY` - Compromised = VM control
- ✅ `STORAGE_DATABASE_URL` - Contains DB password

### Can Be Public:
- ✅ `NEXTAUTH_URL` - Public URL anyway
- ✅ `VM_API_URL` - Public IP anyway
- ✅ `PORT` - Standard port number
- ✅ `VM_HOST` - Public IP anyway

---

## 🧪 Testing Your Variables

### Test 1: Database Connection
```bash
# Set the database URL
$env:STORAGE_DATABASE_URL="your-database-url"

# Test connection
npx prisma db push
```

**Success:** `✔ Your database is now in sync`

---

### Test 2: VM Manager Running
```bash
# On VPS, check logs
pm2 logs gamecontrol-vm
```

**Success:** `✅ Server running on port 3001`

---

### Test 3: GameControl → VM Connection
```bash
# From local machine
curl -H "x-api-key: YOUR-VM-API-KEY" http://YOUR-VPS-IP:3001/api/status
```

**Success:** Returns JSON with VM status

---

### Test 4: Create Server End-to-End
1. Login to GameControl panel
2. Create a server
3. Check VPS: `docker ps`

**Success:** Container appears!

---

## 🔄 When to Update Variables

### Update NEXTAUTH_URL:
- When you get a custom domain
- When Vercel changes your URL
- After first deployment (if it changes)

### Update VM_API_URL:
- When you get a new VPS
- When VPS IP changes
- When you add SSL/domain

### Regenerate NEXTAUTH_SECRET:
- If compromised
- Every 6-12 months (security best practice)
- When team members leave

### Regenerate API_KEY:
- If compromised
- When changing security policies
- If leaked in logs/code

### Update STORAGE_DATABASE_URL:
- When migrating databases
- When changing database providers
- If password is reset

---

## 📖 Variable Relationships

### These Must Match:
```
Vercel: VM_API_KEY     ←→  VPS: API_KEY
                (same value)
```

### These Are Independent:
```
Vercel: STORAGE_DATABASE_URL    (not on VPS)
Vercel: NEXTAUTH_SECRET         (not on VPS)
Vercel: NEXTAUTH_URL            (not on VPS)
VPS:    PORT                    (not on Vercel)
VPS:    VM_HOST                 (not on Vercel)
```

---

## 💡 Pro Tips

### 1. Use Password Manager
Store all your environment variables in a password manager:
- 1Password
- LastPass
- Bitwarden
- KeePass

### 2. Document Your Setup
Keep a private note with:
- Vercel project URL
- VPS IP address
- Where database is hosted
- When keys were generated

### 3. Backup .env Files
```bash
# On VPS, backup
cp /opt/gamecontrol-vm/.env /opt/gamecontrol-vm/.env.backup
```

### 4. Test Before Deploying
Always test new environment variables:
```bash
# Vercel CLI
vercel env pull .env.local
# Test locally with production env
```

---

## 🚨 Troubleshooting

### "Cannot connect to database"
**Check:** `STORAGE_DATABASE_URL` is correct
```bash
# Test from local
$env:STORAGE_DATABASE_URL="your-url"
npx prisma studio
```

### "NextAuth error"
**Check:** `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are set
- Secret should be 32+ chars
- URL should match your domain

### "VM not responding"
**Check:** `VM_API_URL` and `VM_API_KEY` in Vercel
```bash
curl -H "x-api-key: KEY" http://URL/api/status
```

### "API key invalid"
**Check:** Keys match between Vercel and VPS
- Vercel: `VM_API_KEY`
- VPS: `API_KEY`
- Must be identical!

---

## 📋 Setup Checklist

### Before Deploying to Vercel:
- [ ] Have database URL from Neon
- [ ] Generated NEXTAUTH_SECRET
- [ ] Know your Vercel URL (or use placeholder)

### Before Deploying VM Manager:
- [ ] Have VPS with public IP
- [ ] Generated API_KEY
- [ ] Noted your VPS IP

### After Both Deployed:
- [ ] Added VM variables to Vercel
- [ ] Verified keys match
- [ ] Tested connection
- [ ] Created test server

---

## 🎯 Quick Reference Card

**Print this and keep it handy:**

```
┌─────────────────────────────────────────────────────┐
│ GAMECONTROL ENVIRONMENT VARIABLES                   │
├─────────────────────────────────────────────────────┤
│ VERCEL (GameControl Panel):                        │
│                                                     │
│ STORAGE_DATABASE_URL = Neon connection string      │
│ NEXTAUTH_SECRET      = Random 32-char string       │
│ NEXTAUTH_URL         = https://yourapp.vercel.app  │
│ VM_API_URL           = http://vps-ip:3001          │
│ VM_API_KEY           = Same as VPS API_KEY         │
│                                                     │
├─────────────────────────────────────────────────────┤
│ VPS (VM Manager):                                   │
│                                                     │
│ PORT     = 3001                                     │
│ API_KEY  = Same as Vercel VM_API_KEY               │
│ VM_HOST  = Your VPS public IP                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 📞 Need Help?

**Variable not working?**
1. Check spelling (case-sensitive!)
2. Check for extra spaces
3. Verify URL format (http:// or https://)
4. Restart services after changes

**Still stuck?**
- Review Vercel logs for errors
- Check PM2 logs: `pm2 logs gamecontrol-vm`
- Open issue on GitHub with error details

---

**Keep this file as reference when deploying!** 📌

