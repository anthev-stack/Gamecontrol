# Complete VM Setup Guide

This guide will walk you through setting up a Virtual Machine to actually host your game servers.

## Prerequisites

Before starting, you need:
- A VPS/VM with Ubuntu 22.04 LTS
- Minimum specs: 4GB RAM, 20GB storage, 2 CPU cores
- Root or sudo access
- Open ports for game servers

### Recommended VPS Providers

| Provider | Price | Specs | Good For |
|----------|-------|-------|----------|
| **Hetzner** | €5-20/mo | 4-16GB RAM | Best value for Europe |
| **DigitalOcean** | $12-48/mo | 2-8GB RAM | Easy to use, good docs |
| **Vultr** | $12-48/mo | 4-16GB RAM | Good global locations |
| **Linode** | $12-48/mo | 4-8GB RAM | Reliable, good support |
| **OVH** | $8-30/mo | 4-16GB RAM | Cheap, great for game hosting |

For testing: Start with **4GB RAM, 2 CPU cores** (~$12-20/month)

---

## Part 1: Initial VPS Setup

### Step 1: Connect to Your VPS

```bash
# SSH into your VPS (replace with your IP)
ssh root@your-vps-ip

# Or if using a key:
ssh -i ~/.ssh/your-key.pem root@your-vps-ip
```

### Step 2: Update System

```bash
# Update package lists
sudo apt update

# Upgrade all packages
sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git nano ufw
```

### Step 3: Create Non-Root User (Recommended)

```bash
# Create user
adduser gamecontrol

# Add to sudo group
usermod -aG sudo gamecontrol

# Switch to new user
su - gamecontrol
```

---

## Part 2: Install Docker

Docker will run your game server containers.

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Activate changes
newgrp docker

# Test Docker
docker --version
docker ps
```

Should see: `Docker version 24.x.x` and an empty container list.

---

## Part 3: Install Node.js

The VM Manager API runs on Node.js.

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

---

## Part 4: Configure Firewall

Open ports for your game servers and API.

```bash
# Enable firewall
sudo ufw enable

# Allow SSH (IMPORTANT - don't lock yourself out!)
sudo ufw allow 22/tcp

# Allow VM Manager API
sudo ufw allow 3001/tcp

# Game server ports
sudo ufw allow 25565:25665/tcp  # Minecraft
sudo ufw allow 25565:25665/udp  # Minecraft
sudo ufw allow 27015:27115/tcp  # CS2
sudo ufw allow 27015:27115/udp  # CS2  
sudo ufw allow 28015:28115/tcp  # Rust
sudo ufw allow 28015:28115/udp  # Rust

# Check firewall status
sudo ufw status
```

---

## Part 5: Create VM Manager Directory

```bash
# Create application directory
sudo mkdir -p /opt/gamecontrol-vm
sudo chown $USER:$USER /opt/gamecontrol-vm
cd /opt/gamecontrol-vm
```

---

## Part 6: Set Up VM Manager API

### Create package.json

```bash
nano package.json
```

Paste this content:

```json
{
  "name": "gamecontrol-vm-manager",
  "version": "1.0.0",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "dockerode": "^4.0.0",
    "dotenv": "^16.3.1",
    "body-parser": "^1.20.2"
  }
}
```

Save and exit (Ctrl+X, Y, Enter).

### Install Dependencies

```bash
npm install
```

### Create Environment File

```bash
nano .env
```

Paste this content (update the API key!):

```env
PORT=3001
API_KEY=your-super-secret-api-key-change-this
VM_HOST=your-vps-ip-address
```

**IMPORTANT**: Generate a secure API key:
```bash
openssl rand -base64 32
```

Replace `your-super-secret-api-key-change-this` with the output.

Save and exit.

---

## Part 7: Create VM Manager Server

I'll provide the complete server code in the next section!

---

## Part 8: Download Game Server Images

Pre-download Docker images to speed up first server creation:

```bash
# CS2 (Counter-Strike 2)
docker pull joedwards32/cs2:latest

# Minecraft
docker pull itzg/minecraft-server:latest

# Rust
docker pull didstopia/rust-server:latest
```

This will take 5-15 minutes depending on your connection.

---

## Part 9: Start VM Manager

### Test Run (temporary)

```bash
cd /opt/gamecontrol-vm
node server.js
```

You should see:
```
VM Manager API running on port 3001
```

Press Ctrl+C to stop.

### Production Run with PM2

Install PM2 (process manager):

```bash
sudo npm install -g pm2
```

Start VM Manager:

```bash
cd /opt/gamecontrol-vm
pm2 start server.js --name gamecontrol-vm

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
# Follow the command it shows
```

Check status:
```bash
pm2 status
pm2 logs gamecontrol-vm
```

---

## Part 10: Test the API

```bash
# Test from your local machine (not the VPS)
curl -H "x-api-key: your-api-key" http://your-vps-ip:3001/api/status
```

Should return:
```json
{
  "status": "online",
  "containers": 0,
  "memory": 4294967296,
  "cpus": 2
}
```

---

## Part 11: Set Up SSL (Optional but Recommended)

### Install Nginx

```bash
sudo apt install -y nginx
```

### Install Certbot (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Get SSL Certificate

```bash
# Replace with your domain
sudo certbot --nginx -d gamecontrol.yourdomain.com
```

### Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/gamecontrol-vm
```

Paste:

```nginx
server {
    listen 443 ssl;
    server_name gamecontrol.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/gamecontrol.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gamecontrol.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/gamecontrol-vm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Part 12: Connect GameControl Panel to VM

### Add Environment Variables to Vercel

1. Go to Vercel Dashboard
2. Your project → Settings → Environment Variables
3. Add these two:

```
VM_API_URL=https://gamecontrol.yourdomain.com
VM_API_KEY=your-api-key-from-step-6
```

Or if not using SSL:
```
VM_API_URL=http://your-vps-ip:3001
VM_API_KEY=your-api-key-from-step-6
```

4. Redeploy your Vercel app

---

## Part 13: Test End-to-End

1. **Go to your GameControl panel**
2. **Create a new server** (any game)
3. **Check VM Manager logs:**
   ```bash
   pm2 logs gamecontrol-vm
   ```
4. **Check Docker containers:**
   ```bash
   docker ps
   ```

You should see your server container!

---

## Monitoring & Maintenance

### View VM Manager Logs
```bash
pm2 logs gamecontrol-vm
```

### Restart VM Manager
```bash
pm2 restart gamecontrol-vm
```

### View Docker Containers
```bash
docker ps -a
```

### View Container Logs
```bash
docker logs container-name
```

### Stop a Container
```bash
docker stop container-id
```

### Remove a Container
```bash
docker rm container-id
```

### System Resources
```bash
# CPU and RAM usage
htop

# Or
docker stats
```

---

## Troubleshooting

### "Cannot connect to Docker daemon"
```bash
# Check if Docker is running
sudo systemctl status docker

# Start Docker
sudo systemctl start docker

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### "Port already in use"
```bash
# Check what's using the port
sudo lsof -i :27015

# Kill the process
sudo kill -9 <PID>
```

### "VM Manager not starting"
```bash
# Check logs
pm2 logs gamecontrol-vm

# Check if port 3001 is available
sudo lsof -i :3001
```

### "Can't reach VM API from Vercel"
- Check firewall allows port 3001
- Verify API key matches
- Test with curl from another machine
- Check PM2 status: `pm2 status`

---

## Security Best Practices

1. **Use SSL** - Always use HTTPS for VM API
2. **Strong API Key** - 32+ random characters
3. **Firewall** - Only open necessary ports
4. **Regular Updates** - Keep system updated
5. **Monitoring** - Set up alerts for issues
6. **Backups** - Backup game server data regularly

---

## Cost Estimation

### 4GB VPS (2-3 small servers)
- Hetzner: €5/mo
- DigitalOcean: $12/mo
- Vultr: $12/mo

### 8GB VPS (5-7 small servers or 2-3 large)
- Hetzner: €10/mo
- DigitalOcean: $24/mo
- Vultr: $24/mo

### 16GB VPS (10+ small or 5-7 large servers)
- Hetzner: €20/mo
- DigitalOcean: $48/mo
- Vultr: $48/mo

---

## Next Steps

1. ✅ Set up VPS
2. ✅ Install Docker & Node.js
3. ✅ Deploy VM Manager
4. ✅ Connect to GameControl
5. 🎮 Create your first game server!

---

Need help? Check the VM_INTEGRATION.md file or open an issue on GitHub!

