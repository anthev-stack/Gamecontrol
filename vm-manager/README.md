# GameControl VM Manager

This is the VM Manager API that runs on your VPS/VM to manage Docker containers for game servers.

## Quick Setup

### 1. Prerequisites
- Ubuntu 22.04 LTS
- Docker installed
- Node.js 18+ installed
- Ports 3001 and game server ports open

### 2. Installation

```bash
# Create directory
mkdir -p /opt/gamecontrol-vm
cd /opt/gamecontrol-vm

# Copy these files to your VPS:
# - server.js
# - package.json
# - .env.example

# Install dependencies
npm install

# Create .env file
cp .env.example .env
nano .env
```

### 3. Configure

Edit `.env`:
```env
PORT=3001
API_KEY=<generate-with-openssl-rand-base64-32>
VM_HOST=<your-vps-ip-address>
```

### 4. Test Run

```bash
node server.js
```

Should see:
```
🎮 GameControl VM Manager
✅ Server running on port 3001
```

### 5. Production Run

```bash
# Install PM2
sudo npm install -g pm2

# Start server
pm2 start server.js --name gamecontrol-vm

# Save configuration
pm2 save

# Set to start on boot
pm2 startup
```

## API Endpoints

All endpoints require `x-api-key` header.

### Health Check
```
GET /health
```

### VM Status
```
GET /api/status
```

### Create Server
```
POST /api/servers
Body: {
  gameType: "CS2" | "MINECRAFT" | "RUST",
  name: "Server Name",
  config: { ... },
  serverId: "unique-id"
}
```

### Start Server
```
POST /api/servers/:containerId/start
```

### Stop Server
```
POST /api/servers/:containerId/stop
```

### Restart Server
```
POST /api/servers/:containerId/restart
```

### Get Server Status
```
GET /api/servers/:containerId
```

### Delete Server
```
DELETE /api/servers/:containerId
```

## Monitoring

```bash
# View logs
pm2 logs gamecontrol-vm

# View status
pm2 status

# Restart
pm2 restart gamecontrol-vm

# Stop
pm2 stop gamecontrol-vm
```

## Docker Commands

```bash
# List containers
docker ps -a

# View container logs
docker logs <container-id>

# Stop container
docker stop <container-id>

# Remove container
docker rm <container-id>
```

## Troubleshooting

### Port already in use
```bash
sudo lsof -i :3001
sudo kill -9 <PID>
```

### Docker permission denied
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Container won't start
```bash
# Check Docker logs
docker logs <container-id>

# Check port availability
sudo lsof -i :<port>
```

## Security

- Always use a strong API key
- Keep the API key secret
- Use HTTPS in production (nginx + Let's Encrypt)
- Keep system updated
- Monitor logs regularly

## Support

For full setup guide, see: `/docs/VM_SETUP_GUIDE.md` in the main GameControl repository.

