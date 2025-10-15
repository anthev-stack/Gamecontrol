# VM Integration Guide

This guide explains how to connect GameControl to a Virtual Machine for actual game server hosting.

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   GameControl   │         │   VM Manager     │         │   Game Server   │
│   (Vercel)      │ ───────>│   API            │ ───────>│   (Docker)      │
│                 │  HTTPS  │   (Your VPS)     │  Docker │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

## Components

### 1. GameControl Panel (Current)
- Web UI for managing servers
- Database for storing server configurations
- API endpoints for CRUD operations

### 2. VM Manager API (To Build)
- Runs on your VPS/dedicated server
- Manages Docker containers
- Allocates ports and resources
- Provides status updates

### 3. Game Server Containers
- Docker containers running actual game servers
- CS2, Minecraft, or Rust servers
- Isolated environments

---

## VM Setup

### Prerequisites

- Ubuntu Server 22.04 LTS (or similar)
- Docker installed
- Node.js 18+ (for VM Manager API)
- Minimum 4GB RAM, 20GB storage
- Open ports: 25565-25665 (Minecraft), 27015-27115 (CS2), 28015-28115 (Rust)

### Step 1: Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Start Docker
sudo systemctl enable docker
sudo systemctl start docker
```

### Step 2: Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 3: Set Up VM Manager API

Create `/opt/gamecontrol-vm/` directory:

```bash
sudo mkdir -p /opt/gamecontrol-vm
cd /opt/gamecontrol-vm
```

---

## VM Manager API

Here's a basic VM Manager API to place on your VPS:

### package.json

```json
{
  "name": "gamecontrol-vm-manager",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "express": "^4.18.2",
    "dockerode": "^4.0.0",
    "dotenv": "^16.3.1"
  }
}
```

### server.js

```javascript
import express from 'express'
import Docker from 'dockerode'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const docker = new Docker()
const PORT = process.env.PORT || 3001
const API_KEY = process.env.API_KEY || 'your-secure-api-key'

app.use(express.json())

// Authentication middleware
const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key']
  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

// Port management
const portRanges = {
  CS2: { start: 27015, end: 27115 },
  MINECRAFT: { start: 25565, end: 25665 },
  RUST: { start: 28015, end: 28115 }
}

const usedPorts = new Set()

function allocatePort(gameType) {
  const range = portRanges[gameType]
  for (let port = range.start; port <= range.end; port++) {
    if (!usedPorts.has(port)) {
      usedPorts.add(port)
      return port
    }
  }
  throw new Error('No available ports')
}

function releasePort(port) {
  usedPorts.delete(port)
}

// Get VM status
app.get('/api/status', authenticate, async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true })
    const info = await docker.info()
    
    res.json({
      status: 'online',
      containers: containers.length,
      memory: info.MemTotal,
      cpus: info.NCPU
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create server
app.post('/api/servers', authenticate, async (req, res) => {
  try {
    const { gameType, name, config } = req.body
    
    const port = allocatePort(gameType)
    const rconPort = port + 100
    
    let containerConfig = {}
    
    if (gameType === 'CS2') {
      containerConfig = {
        Image: 'joedwards32/cs2:latest',
        name: `cs2-${port}`,
        Env: [
          `PORT=${port}`,
          `RCON_PORT=${rconPort}`,
          `TICKRATE=${config.tickrate || 128}`,
          `MAXPLAYERS=${config.maxPlayers || 10}`,
          `MAP=${config.map || 'de_dust2'}`,
          `GAMEMODE=${config.gameMode || 'competitive'}`
        ],
        ExposedPorts: {
          [`${port}/tcp`]: {},
          [`${port}/udp`]: {},
          [`${rconPort}/tcp`]: {}
        },
        HostConfig: {
          PortBindings: {
            [`${port}/tcp`]: [{ HostPort: `${port}` }],
            [`${port}/udp`]: [{ HostPort: `${port}` }],
            [`${rconPort}/tcp`]: [{ HostPort: `${rconPort}` }]
          },
          Memory: 2 * 1024 * 1024 * 1024 // 2GB
        }
      }
    } else if (gameType === 'MINECRAFT') {
      containerConfig = {
        Image: 'itzg/minecraft-server:latest',
        name: `minecraft-${port}`,
        Env: [
          'EULA=TRUE',
          `SERVER_PORT=${port}`,
          `RCON_PORT=${rconPort}`,
          `MAX_PLAYERS=${config.maxPlayers || 20}`,
          `DIFFICULTY=${config.difficulty || 'normal'}`,
          `LEVEL_TYPE=${config.worldType || 'default'}`,
          `PVP=${config.pvp ? 'true' : 'false'}`,
          `HARDCORE=${config.hardcore ? 'true' : 'false'}`,
          `SPAWN_PROTECTION=${config.spawnProtection || 16}`,
          `ALLOW_NETHER=${config.allowNether ? 'true' : 'false'}`,
          `ALLOW_FLIGHT=${config.allowFlight ? 'true' : 'false'}`
        ],
        ExposedPorts: {
          [`${port}/tcp`]: {},
          [`${rconPort}/tcp`]: {}
        },
        HostConfig: {
          PortBindings: {
            [`${port}/tcp`]: [{ HostPort: `${port}` }],
            [`${rconPort}/tcp`]: [{ HostPort: `${rconPort}` }]
          },
          Memory: 4 * 1024 * 1024 * 1024 // 4GB
        }
      }
    } else if (gameType === 'RUST') {
      containerConfig = {
        Image: 'didstopia/rust-server:latest',
        name: `rust-${port}`,
        Env: [
          `RUST_SERVER_PORT=${port}`,
          `RUST_RCON_PORT=${rconPort}`,
          `RUST_SERVER_MAXPLAYERS=${config.maxPlayers || 100}`,
          `RUST_SERVER_WORLDSIZE=${config.worldSize || 4000}`,
          `RUST_SERVER_SEED=${config.worldSeed || ''}`,
          `RUST_SERVER_SAVE_INTERVAL=${config.saveInterval || 600}`
        ],
        ExposedPorts: {
          [`${port}/tcp`]: {},
          [`${port}/udp`]: {},
          [`${rconPort}/tcp`]: {}
        },
        HostConfig: {
          PortBindings: {
            [`${port}/tcp`]: [{ HostPort: `${port}` }],
            [`${port}/udp`]: [{ HostPort: `${port}` }],
            [`${rconPort}/tcp`]: [{ HostPort: `${rconPort}` }]
          },
          Memory: 6 * 1024 * 1024 * 1024 // 6GB
        }
      }
    }
    
    const container = await docker.createContainer(containerConfig)
    
    res.json({
      containerId: container.id,
      port: port,
      rconPort: rconPort,
      host: req.hostname || 'localhost'
    })
  } catch (error) {
    console.error('Error creating server:', error)
    res.status(500).json({ error: error.message })
  }
})

// Start server
app.post('/api/servers/:containerId/start', authenticate, async (req, res) => {
  try {
    const container = docker.getContainer(req.params.containerId)
    await container.start()
    res.json({ message: 'Server started' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Stop server
app.post('/api/servers/:containerId/stop', authenticate, async (req, res) => {
  try {
    const container = docker.getContainer(req.params.containerId)
    await container.stop()
    res.json({ message: 'Server stopped' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete server
app.delete('/api/servers/:containerId', authenticate, async (req, res) => {
  try {
    const container = docker.getContainer(req.params.containerId)
    const info = await container.inspect()
    
    // Extract port from container config
    const ports = Object.keys(info.HostConfig.PortBindings || {})
    ports.forEach(portKey => {
      const port = parseInt(portKey.split('/')[0])
      releasePort(port)
    })
    
    await container.stop()
    await container.remove()
    res.json({ message: 'Server deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get server status
app.get('/api/servers/:containerId', authenticate, async (req, res) => {
  try {
    const container = docker.getContainer(req.params.containerId)
    const info = await container.inspect()
    
    res.json({
      status: info.State.Running ? 'running' : 'stopped',
      created: info.Created,
      started: info.State.StartedAt
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`VM Manager API running on port ${PORT}`)
})
```

### .env

```env
PORT=3001
API_KEY=your-very-secure-api-key-here
```

### Run VM Manager

```bash
npm install
node server.js

# Or use PM2 for production
npm install -g pm2
pm2 start server.js --name gamecontrol-vm
pm2 save
pm2 startup
```

---

## Connecting GameControl to VM

### Update GameControl Environment Variables

Add to your Vercel environment variables:

```
VM_API_URL=https://your-vps-ip:3001
VM_API_KEY=your-very-secure-api-key-here
```

### Modify GameControl API

Update `app/api/servers/route.ts` to call VM API:

```typescript
// After creating server in database
if (process.env.VM_API_URL) {
  const vmResponse = await fetch(`${process.env.VM_API_URL}/api/servers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.VM_API_KEY!
    },
    body: JSON.stringify({
      gameType: server.game,
      name: server.name,
      config: serverData
    })
  })
  
  const vmData = await vmResponse.json()
  
  // Update server with actual VM details
  await prisma.server.update({
    where: { id: server.id },
    data: {
      host: vmData.host,
      port: vmData.port,
      rconPort: vmData.rconPort,
      containerId: vmData.containerId
    }
  })
}
```

---

## Docker Images

### Counter-Strike 2
- Image: `joedwards32/cs2:latest`
- Ports: 27015 (game), 27016 (RCON)
- RAM: 2-4GB

### Minecraft
- Image: `itzg/minecraft-server:latest`
- Ports: 25565 (game), 25575 (RCON)
- RAM: 2-8GB depending on mods

### Rust
- Image: `didstopia/rust-server:latest`
- Ports: 28015 (game), 28016 (RCON)
- RAM: 4-8GB

---

## Security

1. **Firewall Rules**
```bash
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 3001/tcp    # VM API
sudo ufw allow 25565:25665/tcp  # Minecraft range
sudo ufw allow 27015:27115/tcp  # CS2 range
sudo ufw allow 27015:27115/udp  # CS2 range
sudo ufw allow 28015:28115/tcp  # Rust range
sudo ufw allow 28015:28115/udp  # Rust range
sudo ufw enable
```

2. **HTTPS for VM API**
- Use nginx as reverse proxy
- Get SSL certificate with Let's Encrypt
- Protect API with strong API key

3. **Resource Limits**
- Set memory limits per container
- Implement rate limiting
- Monitor resource usage

---

## Next Steps

1. **Set up VPS** with Docker
2. **Deploy VM Manager API** on VPS
3. **Add VM credentials** to GameControl
4. **Update API routes** to call VM
5. **Test server creation** end-to-end

---

## Monitoring

Use these tools to monitor your VM:

- **Portainer**: Docker management UI
- **Netdata**: Real-time performance monitoring
- **Grafana + Prometheus**: Metrics and alerting

---

For questions or issues, refer to the main README or open an issue on GitHub.

