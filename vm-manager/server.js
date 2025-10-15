import express from 'express'
import Docker from 'dockerode'
import dotenv from 'dotenv'
import bodyParser from 'body-parser'

dotenv.config()

const app = express()
const docker = new Docker()
const PORT = process.env.PORT || 3001
const API_KEY = process.env.API_KEY || 'change-this-insecure-default'
const VM_HOST = process.env.VM_HOST || 'localhost'

app.use(bodyParser.json())

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// Authentication middleware
const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key']
  if (apiKey !== API_KEY) {
    console.log('❌ Unauthorized access attempt')
    return res.status(401).json({ error: 'Unauthorized - Invalid API key' })
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

// Load currently used ports on startup
async function loadUsedPorts() {
  try {
    const containers = await docker.listContainers({ all: true })
    containers.forEach(container => {
      const ports = container.Ports || []
      ports.forEach(portInfo => {
        if (portInfo.PublicPort) {
          usedPorts.add(portInfo.PublicPort)
          console.log(`📌 Port ${portInfo.PublicPort} is in use`)
        }
      })
    })
    console.log(`✅ Loaded ${usedPorts.size} used ports`)
  } catch (error) {
    console.error('Error loading used ports:', error)
  }
}

function allocatePort(gameType) {
  const range = portRanges[gameType]
  for (let port = range.start; port <= range.end; port++) {
    if (!usedPorts.has(port)) {
      usedPorts.add(port)
      console.log(`✅ Allocated port ${port} for ${gameType}`)
      return port
    }
  }
  throw new Error(`No available ports for ${gameType}`)
}

function releasePort(port) {
  usedPorts.delete(port)
  console.log(`🔓 Released port ${port}`)
}

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

// Get VM status
app.get('/api/status', authenticate, async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true })
    const info = await docker.info()
    
    res.json({
      status: 'online',
      containers: containers.length,
      memory: info.MemTotal,
      cpus: info.NCPU,
      dockerVersion: info.ServerVersion,
      os: info.OperatingSystem
    })
  } catch (error) {
    console.error('❌ Error getting status:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create game server
app.post('/api/servers', authenticate, async (req, res) => {
  try {
    const { gameType, name, config, serverId } = req.body
    
    console.log(`🎮 Creating ${gameType} server: ${name}`)
    console.log('Config:', JSON.stringify(config, null, 2))
    
    const port = allocatePort(gameType)
    const rconPort = port + 100
    const containerName = `gamecontrol-${gameType.toLowerCase()}-${serverId || Date.now()}`
    
    let containerConfig = {}
    
    if (gameType === 'CS2') {
      containerConfig = {
        Image: 'joedwards32/cs2:latest',
        name: containerName,
        Env: [
          `PORT=${port}`,
          `RCON_PORT=${rconPort}`,
          `RCON_PASSWORD=${config.rconPassword || 'changeme'}`,
          `TICKRATE=${config.tickrate || 128}`,
          `MAXPLAYERS=${config.maxPlayers || 10}`,
          `STARTMAP=${config.map || 'de_dust2'}`,
          `GAMEMODE=${config.gameMode || 'competitive'}`,
          `HOSTNAME=${name}`,
          'CS2_SERVERNAME=GameControl Server',
          'CS2_CHEATS=0',
          'CS2_SERVER_HIBERNATE=0',
          'CS2_RCON_PORT=${rconPort}',
          'CS2_LAN=0',
          'CS2_RCONPW=${config.rconPassword || "changeme"}',
          'CS2_PW=""',
          'CS2_MAXPLAYERS=${config.maxPlayers || 10}',
          'CS2_ADDITIONAL_ARGS=""',
          'CS2_CFG_URL=""',
          // Auto-update settings
          'STEAMCMD_VALIDATE=1',  // Validates files on each start
          'CS2_GAMETYPE=0',
          'CS2_GAMEMODE=1',
          'CS2_MAPGROUP=mg_active',
          'CS2_STARTMAP=${config.map || "de_dust2"}'
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
          Memory: (config.allocatedRam || 2048) * 1024 * 1024,
          RestartPolicy: {
            Name: 'unless-stopped'
          }
        }
      }
    } else if (gameType === 'MINECRAFT') {
      containerConfig = {
        Image: 'itzg/minecraft-server:latest',
        name: containerName,
        Env: [
          'EULA=TRUE',
          `SERVER_PORT=${port}`,
          `RCON_PORT=${rconPort}`,
          `RCON_PASSWORD=${config.rconPassword || 'changeme'}`,
          `MAX_PLAYERS=${config.maxPlayers || 20}`,
          `DIFFICULTY=${config.difficulty || 'normal'}`,
          `LEVEL_TYPE=${config.worldType || 'default'}`,
          `PVP=${config.pvp ? 'true' : 'false'}`,
          `HARDCORE=${config.hardcore ? 'true' : 'false'}`,
          `SPAWN_PROTECTION=${config.spawnProtection || 16}`,
          `ALLOW_NETHER=${config.allowNether ? 'true' : 'false'}`,
          `ALLOW_FLIGHT=${config.allowFlight ? 'true' : 'false'}`,
          `MOTD=${name}`,
          'ENABLE_RCON=true'
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
          Memory: (config.allocatedRam || 4096) * 1024 * 1024,
          RestartPolicy: {
            Name: 'unless-stopped'
          }
        }
      }
    } else if (gameType === 'RUST') {
      containerConfig = {
        Image: 'didstopia/rust-server:latest',
        name: containerName,
        Env: [
          `RUST_SERVER_HOSTNAME=${name}`,
          `RUST_SERVER_PORT=${port}`,
          `RUST_RCON_PORT=${rconPort}`,
          `RUST_RCON_PASSWORD=${config.rconPassword || 'changeme'}`,
          `RUST_SERVER_MAXPLAYERS=${config.maxPlayers || 100}`,
          `RUST_SERVER_WORLDSIZE=${config.worldSize || 4000}`,
          `RUST_SERVER_SEED=${config.worldSeed || ''}`,
          `RUST_SERVER_SAVE_INTERVAL=${config.saveInterval || 600}`,
          'RUST_SERVER_STARTUP_ARGUMENTS=-batchmode -load',
          // Auto-update settings
          'RUST_UPDATE_CHECKING=1',  // Check for updates
          'RUST_UPDATE_BRANCH=public',  // Use public branch
          'RUST_START_MODE=2',  // Update and start
          'RUST_OXIDE_ENABLED=0',  // Disable Oxide/uMod by default
          'RUST_RCON_WEB=1',  // Enable RCON web interface
          'RUST_APP_PORT=28082'  // App port for web interface
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
          Memory: (config.allocatedRam || 6144) * 1024 * 1024,
          RestartPolicy: {
            Name: 'unless-stopped'
          }
        }
      }
    } else {
      throw new Error(`Unsupported game type: ${gameType}`)
    }
    
    console.log('📦 Creating container...')
    const container = await docker.createContainer(containerConfig)
    console.log(`✅ Container created: ${container.id}`)
    
    res.json({
      containerId: container.id,
      containerName: containerName,
      port: port,
      rconPort: rconPort,
      host: VM_HOST,
      status: 'created'
    })
  } catch (error) {
    console.error('❌ Error creating server:', error)
    // Release port if allocation happened but container creation failed
    if (error.port) {
      releasePort(error.port)
    }
    res.status(500).json({ error: error.message })
  }
})

// Start server
app.post('/api/servers/:containerId/start', authenticate, async (req, res) => {
  try {
    console.log(`▶️  Starting container: ${req.params.containerId}`)
    const container = docker.getContainer(req.params.containerId)
    await container.start()
    console.log(`✅ Container started`)
    res.json({ message: 'Server started', status: 'running' })
  } catch (error) {
    console.error('❌ Error starting server:', error)
    res.status(500).json({ error: error.message })
  }
})

// Stop server
app.post('/api/servers/:containerId/stop', authenticate, async (req, res) => {
  try {
    console.log(`⏸️  Stopping container: ${req.params.containerId}`)
    const container = docker.getContainer(req.params.containerId)
    await container.stop({ t: 30 }) // 30 second grace period
    console.log(`✅ Container stopped`)
    res.json({ message: 'Server stopped', status: 'stopped' })
  } catch (error) {
    console.error('❌ Error stopping server:', error)
    res.status(500).json({ error: error.message })
  }
})

// Restart server
app.post('/api/servers/:containerId/restart', authenticate, async (req, res) => {
  try {
    console.log(`🔄 Restarting container: ${req.params.containerId}`)
    const container = docker.getContainer(req.params.containerId)
    await container.restart({ t: 30 })
    console.log(`✅ Container restarted`)
    res.json({ message: 'Server restarted', status: 'running' })
  } catch (error) {
    console.error('❌ Error restarting server:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update server (pull latest image and recreate container)
app.post('/api/servers/:containerId/update', authenticate, async (req, res) => {
  try {
    console.log(`🔄 Updating container: ${req.params.containerId}`)
    const container = docker.getContainer(req.params.containerId)
    const info = await container.inspect()
    
    // Get image name
    const imageName = info.Config.Image
    console.log(`📥 Pulling latest ${imageName}...`)
    
    // Pull latest image
    await new Promise((resolve, reject) => {
      docker.pull(imageName, (err, stream) => {
        if (err) return reject(err)
        docker.modem.followProgress(stream, (err, output) => {
          if (err) return reject(err)
          resolve(output)
        })
      })
    })
    
    console.log(`✅ Image updated, restarting container...`)
    
    // Restart container to use new image
    await container.restart({ t: 30 })
    
    console.log(`✅ Server updated and restarted`)
    res.json({ 
      message: 'Server updated successfully', 
      status: 'running',
      note: 'Server will download updates on next restart'
    })
  } catch (error) {
    console.error('❌ Error updating server:', error)
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
      started: info.State.StartedAt,
      memory: info.HostConfig.Memory,
      ports: info.NetworkSettings.Ports
    })
  } catch (error) {
    console.error('❌ Error getting server status:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete server
app.delete('/api/servers/:containerId', authenticate, async (req, res) => {
  try {
    console.log(`🗑️  Deleting container: ${req.params.containerId}`)
    const container = docker.getContainer(req.params.containerId)
    const info = await container.inspect()
    
    // Extract and release ports
    const ports = Object.keys(info.HostConfig.PortBindings || {})
    ports.forEach(portKey => {
      const port = parseInt(portKey.split('/')[0])
      releasePort(port)
    })
    
    // Stop if running
    if (info.State.Running) {
      console.log('⏸️  Stopping container before removal...')
      await container.stop({ t: 10 })
    }
    
    // Remove container
    await container.remove()
    console.log(`✅ Container deleted`)
    
    res.json({ message: 'Server deleted successfully' })
  } catch (error) {
    console.error('❌ Error deleting server:', error)
    res.status(500).json({ error: error.message })
  }
})

// List all containers
app.get('/api/containers', authenticate, async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true })
    res.json({
      total: containers.length,
      containers: containers.map(c => ({
        id: c.Id,
        name: c.Names[0],
        image: c.Image,
        status: c.State,
        ports: c.Ports
      }))
    })
  } catch (error) {
    console.error('❌ Error listing containers:', error)
    res.status(500).json({ error: error.message })
  }
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error', message: err.message })
})

// Start server
loadUsedPorts().then(() => {
  app.listen(PORT, () => {
    console.log('')
    console.log('═══════════════════════════════════════════════════')
    console.log('🎮 GameControl VM Manager')
    console.log('═══════════════════════════════════════════════════')
    console.log(`✅ Server running on port ${PORT}`)
    console.log(`🌐 VM Host: ${VM_HOST}`)
    console.log(`📦 Docker ready`)
    console.log(`🔑 API Key: ${API_KEY.substring(0, 8)}...`)
    console.log('═══════════════════════════════════════════════════')
    console.log('')
    console.log('Endpoints:')
    console.log('  GET  /health                    - Health check')
    console.log('  GET  /api/status                - VM status')
    console.log('  POST /api/servers               - Create server')
    console.log('  POST /api/servers/:id/start     - Start server')
    console.log('  POST /api/servers/:id/stop      - Stop server')
    console.log('  POST /api/servers/:id/restart   - Restart server')
    console.log('  POST /api/servers/:id/update    - Update server (Steam)')
    console.log('  GET  /api/servers/:id           - Get server status')
    console.log('  DELETE /api/servers/:id         - Delete server')
    console.log('')
  })
})

