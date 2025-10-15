# 🚀 VM Quick Start - Get Your Game Servers Running!

This is the **fastest way** to get your GameControl panel actually hosting game servers.

## What You Need

1. **A VPS** (Virtual Private Server) - see recommendations below
2. **15 minutes** of setup time
3. **SSH access** to your VPS

---

## Step 1: Get a VPS (5 minutes)

### Recommended: Hetzner (Best Value)
1. Go to [hetzner.com](https://www.hetzner.com/cloud)
2. Create account
3. Create server:
   - **Location**: Choose closest to you
   - **Image**: Ubuntu 22.04
   - **Type**: CPX21 (4GB RAM, €9.18/mo) or higher
4. Note your **IP address**

### Alternative: DigitalOcean
1. Go to [digitalocean.com](https://www.digitalocean.com)
2. Create droplet:
   - **Image**: Ubuntu 22.04 LTS
   - **Size**: Basic ($12/mo or $24/mo)
3. Note your **IP address**

---

## Step 2: Connect to Your VPS (1 minute)

### Windows (PowerShell):
```powershell
ssh root@YOUR-VPS-IP
```

### Mac/Linux (Terminal):
```bash
ssh root@YOUR-VPS-IP
```

Type `yes` when asked about fingerprint.

---

## Step 3: Run One-Command Setup (5 minutes)

Copy and paste this entire command:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 3001/tcp
sudo ufw allow 25565:25665/tcp
sudo ufw allow 25565:25665/udp
sudo ufw allow 27015:27115/tcp
sudo ufw allow 27015:27115/udp
sudo ufw allow 28015:28115/tcp
sudo ufw allow 28015:28115/udp
sudo ufw --force enable

echo "✅ System setup complete!"
```

---

## Step 4: Install VM Manager (3 minutes)

```bash
# Create directory
mkdir -p /opt/gamecontrol-vm
cd /opt/gamecontrol-vm

# Download files from GitHub
curl -o server.js https://raw.githubusercontent.com/anthev-stack/Gamecontrol/main/vm-manager/server.js
curl -o package.json https://raw.githubusercontent.com/anthev-stack/Gamecontrol/main/vm-manager/package.json

# Install dependencies
npm install

# Generate API key
echo "Your API Key: $(openssl rand -base64 32)"
```

**IMPORTANT**: Copy the API key that's printed!

---

## Step 5: Configure VM Manager (2 minutes)

```bash
nano .env
```

Paste this (replace the placeholders):

```env
PORT=3001
API_KEY=paste-the-api-key-from-step-4-here
VM_HOST=your-vps-ip-address
```

Save: Press `Ctrl+X`, then `Y`, then `Enter`

---

## Step 6: Start VM Manager

```bash
# Start the server
pm2 start server.js --name gamecontrol-vm

# Save configuration
pm2 save

# Set to start on boot
pm2 startup
# Copy and run the command it shows
```

Test it's running:
```bash
pm2 logs gamecontrol-vm
```

You should see: `✅ Server running on port 3001`

---

## Step 7: Connect GameControl Panel to VM (2 minutes)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Your GameControl project → **Settings** → **Environment Variables**
3. Add these two:

**Variable 1:**
- Name: `VM_API_URL`
- Value: `http://YOUR-VPS-IP:3001`

**Variable 2:**
- Name: `VM_API_KEY`  
- Value: `(paste the API key from Step 4)`

4. Go to **Deployments** → Click latest → **Redeploy**

---

## Step 8: Test It! 🎉

1. **Go to your GameControl panel**
2. **Create a new server**:
   - Name: "Test Server"
   - Game: Minecraft
   - Players: 10
   - RAM: 4GB
3. Click **"Create Server"**

### Check VM:
```bash
# On your VPS, check Docker
docker ps
```

You should see your Minecraft server container! 🎮

### Check Logs:
```bash
docker logs <container-id>
```

---

## Troubleshooting

### Can't SSH to VPS
- Check your VPS IP is correct
- Check your firewall allows port 22
- Try: `ssh -v root@YOUR-IP` for verbose output

### VM Manager Won't Start
```bash
# Check logs
pm2 logs gamecontrol-vm

# Check if port 3001 is available
sudo lsof -i :3001

# Restart
pm2 restart gamecontrol-vm
```

### GameControl Can't Connect to VM
1. Check firewall allows port 3001:
   ```bash
   sudo ufw status
   ```
2. Test from your local machine:
   ```bash
   curl http://YOUR-VPS-IP:3001/health
   ```
3. Check API key matches in both places

### Server Container Won't Start
```bash
# Check Docker is running
sudo systemctl status docker

# Check container logs
docker logs <container-id>

# Check disk space
df -h
```

---

## What Happens When You Create a Server?

1. **GameControl Panel** → Saves server config to database
2. **Panel API** → Calls VM Manager API  
3. **VM Manager** → Creates Docker container with game server
4. **VM Manager** → Returns IP, port, container ID
5. **Panel** → Updates database with real server details
6. **You** → Can now connect to your game server!

---

## Example: Creating a CS2 Server

```
GameControl Panel:
├─ Name: "My CS2 Server"
├─ Game: Counter-Strike 2
├─ Map: de_dust2
├─ Tickrate: 128
├─ Players: 10
├─ RAM: 3GB
└─ Click "Create"

↓

VM Manager receives request
├─ Allocates port 27015
├─ Creates Docker container
├─ Starts CS2 server
└─ Returns: IP + Port + Container ID

↓

GameControl updates database
└─ Server now shows: "192.168.1.100:27015"

↓

Players can connect! 🎉
```

---

## Monitoring

### Check VM Status
```bash
# VM Manager logs
pm2 logs gamecontrol-vm

# Docker containers
docker ps -a

# System resources
docker stats
htop
```

### Check Specific Server
```bash
# Find container
docker ps | grep gamecontrol

# View logs
docker logs gamecontrol-minecraft-xxxxx

# Check resource usage
docker stats gamecontrol-minecraft-xxxxx
```

---

## Costs

### VPS Costs:
- **4GB RAM**: €9-12/mo (2-3 small servers)
- **8GB RAM**: €18-24/mo (5-7 small servers)
- **16GB RAM**: €36-48/mo (10+ small servers)

### Recommended Starting Point:
**4GB VPS** = Perfect for:
- 1 Minecraft server (20 players)
- 2-3 CS2 servers (10 players each)
- 1 small Rust server (50 players)

---

## Next Steps

1. ✅ Create more servers in the panel
2. ✅ Test start/stop/restart buttons
3. ✅ Share server IPs with friends
4. ✅ Monitor performance
5. 🎮 **Play!**

---

## Full Documentation

For detailed guides, see:
- **`docs/VM_SETUP_GUIDE.md`** - Complete detailed setup
- **`docs/VM_INTEGRATION.md`** - Technical architecture
- **`vm-manager/README.md`** - VM Manager API docs
- **`docs/GAME_CONFIG_GUIDE.md`** - Game-specific settings

---

## Need Help?

- Check the documentation files above
- Open an issue on GitHub
- Review VM Manager logs: `pm2 logs gamecontrol-vm`
- Check Docker logs: `docker logs <container-id>`

---

**You're now hosting real game servers! 🚀🎮**

Enjoy your GameControl panel!

