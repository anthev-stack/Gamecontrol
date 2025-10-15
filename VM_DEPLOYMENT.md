# 🚀 VM Manager Deployment Guide

Complete guide to deploy the GameControl VM Manager to your VPS.

## Prerequisites

- A VPS with Ubuntu 22.04 LTS
- Minimum: 4GB RAM, 20GB storage, 2 CPU cores
- SSH access (root or sudo user)
- Your VPS IP address

### Recommended VPS Providers

| Provider | Starting Price | Specs | Link |
|----------|---------------|-------|------|
| **Hetzner** | €9/month | 4GB RAM, 2 vCPU | [hetzner.com](https://www.hetzner.com/cloud) |
| **DigitalOcean** | $12/month | 2GB RAM, 1 vCPU | [digitalocean.com](https://www.digitalocean.com) |
| **Vultr** | $12/month | 4GB RAM, 2 vCPU | [vultr.com](https://www.vultr.com) |
| **Linode** | $12/month | 4GB RAM, 2 vCPU | [linode.com](https://www.linode.com) |

---

## Method 1: GitHub Direct Download (Recommended) ⭐

This is the fastest and easiest method.

### Step 1: Connect to Your VPS

```bash
ssh root@YOUR-VPS-IP
```

### Step 2: System Setup

Run this complete setup block:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Configure firewall
sudo ufw allow 22/tcp              # SSH
sudo ufw allow 3001/tcp            # VM Manager API
sudo ufw allow 25565:25665/tcp     # Minecraft
sudo ufw allow 25565:25665/udp
sudo ufw allow 27015:27115/tcp     # CS2
sudo ufw allow 27015:27115/udp
sudo ufw allow 28015:28115/tcp     # Rust
sudo ufw allow 28015:28115/udp
sudo ufw --force enable

echo "✅ System setup complete!"
```

### Step 3: Download VM Manager

```bash
# Create directory
mkdir -p /opt/gamecontrol-vm
cd /opt/gamecontrol-vm

# Download files from GitHub
curl -L -o server.js https://raw.githubusercontent.com/anthev-stack/Gamecontrol/main/vm-manager/server.js

curl -L -o package.json https://raw.githubusercontent.com/anthev-stack/Gamecontrol/main/vm-manager/package.json

# Install dependencies
npm install

echo "✅ VM Manager downloaded!"
```

### Step 4: Configure Environment

```bash
# Generate secure API key
API_KEY=$(openssl rand -base64 32)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔑 Your API Key (SAVE THIS!):"
echo "$API_KEY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get public IP
VPS_IP=$(curl -s ifconfig.me)
echo "🌐 Your VPS IP: $VPS_IP"
echo ""

# Create .env file
cat > .env << EOF
PORT=3001
API_KEY=$API_KEY
VM_HOST=$VPS_IP
EOF

echo "✅ Configuration saved to .env"
```

**IMPORTANT:** Copy and save your API key somewhere safe! You'll need it for Vercel.

### Step 5: Start VM Manager

```bash
# Start with PM2
pm2 start server.js --name gamecontrol-vm

# Save PM2 configuration
pm2 save

# Set PM2 to start on system boot
pm2 startup
# ⚠️ IMPORTANT: Run the command that PM2 shows you!

# Check status
pm2 status
```

You should see output like:
```
┌─────┬──────────────────┬─────────┬─────────┬─────────┐
│ id  │ name             │ status  │ cpu     │ memory  │
├─────┼──────────────────┼─────────┼─────────┼─────────┤
│ 0   │ gamecontrol-vm   │ online  │ 0%      │ 45.2mb  │
└─────┴──────────────────┴─────────┴─────────┴─────────┘
```

### Step 6: View Logs (Verify It's Running)

```bash
pm2 logs gamecontrol-vm
```

You should see:
```
🎮 GameControl VM Manager
✅ Server running on port 3001
```

Press `Ctrl+C` to exit logs.

### Step 7: Test Connection

From your **local machine**, test the API:

```bash
# Test health endpoint (no auth needed)
curl http://YOUR-VPS-IP:3001/health

# Should return: {"status":"healthy","timestamp":"..."}
```

If you get a response, it's working! 🎉

### Step 8: Connect to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Open your GameControl project
3. Go to **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Add these two variables:

**Variable 1:**
```
Name:  VM_API_URL
Value: http://YOUR-VPS-IP:3001
```

**Variable 2:**
```
Name:  VM_API_KEY
Value: (paste the API key from Step 4)
```

6. Go to **Deployments** tab
7. Click the **"..."** menu on latest deployment
8. Click **"Redeploy"**
9. Wait for deployment to complete

### Step 9: Create Your First Server!

1. Go to your GameControl panel URL
2. Sign in
3. Click **"Create Server"**
4. Fill in the details
5. Click **"Create Server"**

**Check on VPS:**
```bash
docker ps
```

You should see your server container running! 🎮

---

## Method 2: SCP File Transfer

If you prefer to copy files from your local machine:

### On Your Local Machine (Windows PowerShell):

```powershell
# Navigate to project directory
cd C:\Users\YourUsername\OneDrive\Desktop\Gamecontrol

# Copy vm-manager folder to VPS
scp -r vm-manager root@YOUR-VPS-IP:/opt/gamecontrol-vm
```

### On Your Local Machine (Mac/Linux):

```bash
# Navigate to project directory
cd ~/path/to/Gamecontrol

# Copy vm-manager folder to VPS
scp -r vm-manager root@YOUR-VPS-IP:/opt/gamecontrol-vm
```

### Then on VPS:

```bash
# Navigate to directory
cd /opt/gamecontrol-vm

# Install dependencies
npm install

# Create .env file
nano .env
```

Add this content:
```env
PORT=3001
API_KEY=your-generated-api-key-here
VM_HOST=your-vps-ip-address
```

Generate API key with: `openssl rand -base64 32`

Save file: `Ctrl+X`, then `Y`, then `Enter`

```bash
# Start with PM2
pm2 start server.js --name gamecontrol-vm
pm2 save
pm2 startup
```

---

## Method 3: Git Clone

For developers who want the full repository:

```bash
# Install git
sudo apt install -y git

# Clone repository
cd /opt
git clone https://github.com/anthev-stack/Gamecontrol.git

# Navigate to VM Manager
cd Gamecontrol/vm-manager

# Install dependencies
npm install

# Create .env
nano .env
```

Add:
```env
PORT=3001
API_KEY=your-generated-api-key-here
VM_HOST=your-vps-ip-address
```

```bash
# Start VM Manager
pm2 start server.js --name gamecontrol-vm
pm2 save
pm2 startup
```

---

## Post-Installation

### Verify Installation

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs gamecontrol-vm

# Check Docker
docker --version
docker ps

# Check system resources
docker stats
```

### Download Game Server Images (Optional but Recommended)

Pre-download Docker images to speed up first server creation:

```bash
# Counter-Strike 2 (~15GB)
docker pull joedwards32/cs2:latest

# Minecraft (~500MB)
docker pull itzg/minecraft-server:latest

# Rust (~5GB)
docker pull didstopia/rust-server:latest
```

This can take 10-30 minutes depending on your connection.

---

## Monitoring & Management

### View VM Manager Logs

```bash
pm2 logs gamecontrol-vm
```

### Restart VM Manager

```bash
pm2 restart gamecontrol-vm
```

### Stop VM Manager

```bash
pm2 stop gamecontrol-vm
```

### View All Docker Containers

```bash
docker ps -a
```

### View Specific Container Logs

```bash
docker logs <container-id>

# Or follow logs in real-time
docker logs -f <container-id>
```

### Check System Resources

```bash
# Docker stats
docker stats

# System monitor
htop

# Disk usage
df -h

# Memory usage
free -h
```

---

## Troubleshooting

### Cannot Connect to VPS

**Check SSH:**
```bash
ssh -v root@YOUR-VPS-IP
```

**Check if port 22 is open:**
```bash
telnet YOUR-VPS-IP 22
```

### Node.js Not Found

```bash
# Verify installation
node --version
npm --version

# Reinstall if needed
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Docker Not Working

```bash
# Check Docker service
sudo systemctl status docker

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Test
docker ps
```

### Port Already in Use

```bash
# Check what's using port 3001
sudo lsof -i :3001

# Kill the process
sudo kill -9 <PID>

# Restart VM Manager
pm2 restart gamecontrol-vm
```

### PM2 Not Starting on Boot

```bash
# Run PM2 startup again
pm2 startup

# Copy and run the command it shows
# Then save
pm2 save
```

### Cannot Download from GitHub

```bash
# Check internet connection
ping google.com

# Check GitHub access
ping github.com

# Try with wget instead
wget https://raw.githubusercontent.com/anthev-stack/Gamecontrol/main/vm-manager/server.js
```

### Firewall Blocking Connections

```bash
# Check firewall status
sudo ufw status

# Allow required ports
sudo ufw allow 3001/tcp
sudo ufw allow 27015:27115/tcp
sudo ufw allow 27015:27115/udp
sudo ufw allow 25565:25665/tcp
sudo ufw allow 25565:25665/udp
sudo ufw allow 28015:28115/tcp
sudo ufw allow 28015:28115/udp

# Reload
sudo ufw reload
```

### VM Manager Crashes

```bash
# View crash logs
pm2 logs gamecontrol-vm --err

# View last 50 lines
pm2 logs gamecontrol-vm --lines 50

# Check for issues
pm2 show gamecontrol-vm
```

### GameControl Panel Can't Connect

1. **Verify API key matches** in both VPS and Vercel
2. **Check VM_API_URL** is correct (http://YOUR-IP:3001)
3. **Test from local machine:**
   ```bash
   curl -H "x-api-key: YOUR-API-KEY" http://YOUR-VPS-IP:3001/api/status
   ```
4. **Check firewall** allows port 3001
5. **View VM Manager logs** for errors

---

## Security Best Practices

### 1. Use Strong API Key

Always generate with:
```bash
openssl rand -base64 32
```

Never use simple passwords like "password123"!

### 2. Keep System Updated

```bash
# Update regularly
sudo apt update && sudo apt upgrade -y

# Enable automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

### 3. Use SSH Keys (Recommended)

Instead of password authentication:
```bash
# On your local machine, generate key
ssh-keygen -t ed25519

# Copy to VPS
ssh-copy-id root@YOUR-VPS-IP
```

### 4. Disable Root SSH (After Setup)

```bash
# Create non-root user first
adduser gameadmin
usermod -aG sudo gameadmin
usermod -aG docker gameadmin

# Test new user works
su - gameadmin

# Then disable root SSH
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd
```

### 5. Use HTTPS (Production)

For production, set up nginx + Let's Encrypt:

```bash
# Install nginx
sudo apt install -y nginx certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d gamecontrol.yourdomain.com

# Configure nginx reverse proxy
sudo nano /etc/nginx/sites-available/gamecontrol-vm
```

### 6. Regular Backups

Backup game server data:
```bash
# Backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
docker cp <container>:/data /backup/server-$DATE
```

---

## Updating VM Manager

When updates are pushed to GitHub:

```bash
cd /opt/gamecontrol-vm

# Backup current version
cp server.js server.js.backup

# Download latest
curl -L -o server.js https://raw.githubusercontent.com/anthev-stack/Gamecontrol/main/vm-manager/server.js

# Restart
pm2 restart gamecontrol-vm

# Check logs
pm2 logs gamecontrol-vm
```

---

## Complete Command Reference

### PM2 Commands

```bash
pm2 start server.js --name gamecontrol-vm  # Start
pm2 stop gamecontrol-vm                    # Stop
pm2 restart gamecontrol-vm                 # Restart
pm2 delete gamecontrol-vm                  # Remove
pm2 logs gamecontrol-vm                    # View logs
pm2 status                                 # Status of all processes
pm2 save                                   # Save current config
pm2 startup                                # Enable autostart
pm2 monit                                  # Monitor resources
```

### Docker Commands

```bash
docker ps                          # List running containers
docker ps -a                       # List all containers
docker logs <container>            # View logs
docker logs -f <container>         # Follow logs
docker stop <container>            # Stop container
docker start <container>           # Start container
docker restart <container>         # Restart container
docker rm <container>              # Remove container
docker images                      # List images
docker pull <image>                # Pull image
docker stats                       # Resource usage
docker exec -it <container> bash   # Enter container
```

### System Commands

```bash
htop                  # System monitor
df -h                 # Disk usage
free -h               # Memory usage
netstat -tulpn        # Network connections
sudo ufw status       # Firewall status
journalctl -xe        # System logs
systemctl status docker  # Docker status
```

---

## Next Steps

After successful deployment:

1. ✅ Create test server in GameControl panel
2. ✅ Verify container creation with `docker ps`
3. ✅ Test connecting to game server
4. ✅ Set up monitoring/alerts
5. ✅ Configure automated backups
6. ✅ Document your server IPs for players

---

## Support

- **GitHub Issues**: [Create an issue](https://github.com/anthev-stack/Gamecontrol/issues)
- **Documentation**: Check other .md files in repository
- **VM Manager Logs**: `pm2 logs gamecontrol-vm`
- **Docker Logs**: `docker logs <container-id>`

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Ubuntu Server Guide](https://ubuntu.com/server/docs)
- [CS2 Docker Image](https://github.com/joedwards32/CS2)
- [Minecraft Docker Image](https://github.com/itzg/docker-minecraft-server)
- [Rust Docker Image](https://github.com/Didstopia/rust-server)

---

**Your VM Manager is now ready to host game servers!** 🎉

For quick reference, see also:
- `VM_QUICKSTART.md` - Fast setup overview
- `docs/VM_SETUP_GUIDE.md` - Detailed walkthrough
- `docs/VM_INTEGRATION.md` - Technical architecture

