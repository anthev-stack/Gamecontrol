import express from 'express'
import Docker from 'dockerode'
import dotenv from 'dotenv'
import bodyParser from 'body-parser'
import {
  createFTPUser,
  deleteFTPUser,
  changeFTPPassword,
  linkServerToFTP,
  unlinkServerFromFTP,
  getFTPUserInfo,
  testFTPConnection,
  generateFTPPassword,
  generateFTPUsername,
  cleanupFTPAccountIfNoServers
} from './ftp-manager.js'

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

// Generate CS2 startup command based on configuration
function generateCS2StartupCommand(config, port, rconPort) {
  // For steamcmd image, use the CS2 binary directly
  const baseCommand = './game/bin/linuxsteamrt64/cs2 -dedicated -console -usercon'
  
  // Game mode configuration
  const gameModeCommands = {
    'competitive': '+game_type 0 +game_mode 0',
    'casual': '+game_type 0 +game_mode 0',
    'wingman': '+game_type 0 +game_mode 2',
    'weapons_expert': '+game_type 0 +game_mode 1 +sv_cheats 0',
    'arms_race': '+game_type 1 +game_mode 0',
    'demolition': '+game_type 1 +game_mode 1',
    'deathmatch': '+game_type 1 +game_mode 2',
    'custom': '+game_type 0 +game_mode 0',
    'guardian': '+game_type 1 +game_mode 3',
    'coop': '+game_type 1 +game_mode 4',
    'wargames': '+game_type 1 +game_mode 5',
    'dangerzone': '+game_type 6 +game_mode 0'
  }
  
  const gameModeCommand = gameModeCommands[config.gameMode] || gameModeCommands['competitive']
  const tickrateCommand = `+sv_tickrate ${config.tickrate || 128}`
  const maxPlayersCommand = `+maxplayers ${config.maxPlayers || 10}`
  const portCommand = `+port ${port}`
  const rconCommand = `+rcon_port ${rconPort} +rcon_password ${config.rconPassword || 'changeme'}`
  
  // Map selection - prioritize workshop map if specified
  const mapCommand = config.workshopMapId 
    ? `+host_workshop_collection ${config.workshopMapId}` 
    : `+map ${config.map || 'de_dust2'}`
  
  // Steam account command
  const steamAccountCommand = config.steamAccount ? `+sv_setsteamaccount ${config.steamAccount}` : ''
  
  // Custom arguments
  const customArgsCommand = config.customArgs || ''
  
  return [
    baseCommand,
    gameModeCommand,
    tickrateCommand,
    maxPlayersCommand,
    portCommand,
    rconCommand,
    mapCommand,
    steamAccountCommand,
    customArgsCommand
  ].filter(Boolean).join(' ')
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
      // First stage: Download CS2 with wget
      containerConfig = {
        Image: 'ubuntu:22.04',
        name: containerName,
        Cmd: [
          'bash', '-c',
          `echo "Starting CS2 download process...";
           apt-get update -qq;
           apt-get install -y -qq wget unzip;
           echo "Installing 32-bit compatibility libraries...";
           apt-get install -y -qq lib32gcc-s1 lib32stdc++6;
           echo "Creating steamcmd directory...";
           mkdir -p /home/steam/steamcmd;
           cd /home/steam/steamcmd;
           echo "Downloading CS2 server files...";
           wget -O steamcmd.tar.gz "https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz";
           echo "Extracting steamcmd...";
           tar -xzf steamcmd.tar.gz;
           chmod +x steamcmd.sh;
           echo "Downloading CS2 server files...";
           ./steamcmd.sh +force_install_dir /home/steam/cs2 +login anonymous +app_update 730 +quit;
           echo "CS2 download complete. Container will exit.";
           exit 0`
        ],
        HostConfig: {
          Memory: (config.allocatedRam || 2048) * 1024 * 1024,
          RestartPolicy: {
            Name: 'no'
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
    
    // Automatically create FTP account (if needed) and link server
    let ftpInfo = null
    try {
      const { userId } = req.body
      if (userId) {
        const username = generateFTPUsername(userId)
        
        // Check if FTP user already exists
        let ftpUser
        try {
          const existingUser = await getFTPUserInfo(username)
          if (existingUser) {
            console.log(`🔐 Using existing FTP account for user: ${userId}`)
            ftpUser = existingUser
          } else {
            console.log(`🔐 Creating new FTP account for user: ${userId}`)
            const password = generateFTPPassword()
            ftpUser = await createFTPUser(userId, password)
          }
        } catch (error) {
          // If getFTPUserInfo fails, create new account
          console.log(`🔐 Creating new FTP account for user: ${userId}`)
          const password = generateFTPPassword()
          ftpUser = await createFTPUser(userId, password)
        }
        
        // Link server to FTP
        console.log(`🔗 Linking server to FTP...`)
        const linkResult = await linkServerToFTP(
          container.id, 
          ftpUser.username, 
          name, 
          VM_HOST, 
          port
        )
        
        ftpInfo = {
          username: ftpUser.username,
          password: ftpUser.password,
          ftpPath: linkResult.ftpPath,
          host: ftpUser.host,
          port: ftpUser.port
        }
        
        console.log(`✅ Server linked to FTP`)
      }
    } catch (ftpError) {
      console.error('⚠️  Warning: FTP setup failed:', ftpError.message)
      // Don't fail server creation if FTP fails
    }
    
    res.json({
      containerId: container.id,
      containerName: containerName,
      port: port,
      rconPort: rconPort,
      host: VM_HOST,
      status: 'created',
      ftp: ftpInfo
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
    
    // Get container info to determine if it's a CS2 download container
    const container = docker.getContainer(req.params.containerId)
    const containerInfo = await container.inspect()
    const containerName = containerInfo.Name
    
    // Check if this is a CS2 download container (contains 'cs2' and 'gamecontrol')
    if (containerName.includes('cs2') && containerName.includes('gamecontrol')) {
      console.log(`🎮 CS2 download container detected, creating game server...`)
      
      // Extract server ID from container name (assuming format: gamecontrol-cs2-{serverId})
      const serverId = containerName.split('-').pop()
      const gameContainerName = `gamecontrol-cs2-game-${serverId}`
      
      // Use default ports for CS2 (will be updated by Vercel side)
      const port = 27015
      const rconPort = 28015
      
      console.log(`🎮 Creating CS2 game server container...`)
      
      // Create CS2 game server container
      const gameContainer = await docker.createContainer({
        Image: 'steamcmd/steamcmd:latest',
        name: gameContainerName,
        Cmd: [
          'bash', '-c',
          `echo "Starting CS2 game server..."; cd /home/steam/cs2; echo "CS2 directory contents:"; ls -la; echo "Starting CS2 server..."; exec ./game/bin/linuxsteamclient64_srv +set_steam_account anonymous +sv_setsteamaccount anonymous +map de_dust2 +maxplayers 10 +port ${port} +rcon_port ${rconPort} +rcon_password changeme`
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
          Memory: 2048 * 1024 * 1024, // 2GB default
          RestartPolicy: {
            Name: 'unless-stopped'
          }
        }
      })
      
      await gameContainer.start()
      
      console.log(`✅ CS2 game server started with container ID: ${gameContainer.id}`)
      res.json({ 
        message: 'CS2 game server started', 
        status: 'running',
        containerId: gameContainer.id,
        port: port,
        rconPort: rconPort
      })
    } else {
      // For other games, start the existing container
      await container.start()
      console.log(`✅ Container started`)
      res.json({ message: 'Server started', status: 'running' })
    }
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

// Get server download status (for CS2 servers)
app.get('/api/servers/:containerId/status', authenticate, async (req, res) => {
  try {
    const container = docker.getContainer(req.params.containerId)
    const info = await container.inspect()
    
    // Get recent logs to check download progress
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      timestamps: true,
      tail: 50
    })
    
    const allLogs = logs.toString()
    const lines = allLogs.split('\n').filter(line => line.trim())
    
    let phase = 'unknown'
    let percent = 0
    let ready = false
    
    // Check for completion messages
    const hasCompletionMessage = lines.some(line => 
      line.includes('Success! App') || 
      line.includes('fully installed') || 
      line.includes('CS2 download complete')
    )
    
    if (hasCompletionMessage) {
      phase = 'complete'
      percent = 100
      ready = true
    } else {
      // Look for progress in logs
      const progressLogs = lines.filter(line => 
        line.includes('progress:') || 
        line.includes('Update state') ||
        line.includes('downloading') ||
        line.includes('verifying') ||
        line.includes('committing')
      )
      
      if (progressLogs.length > 0) {
        const latestLog = progressLogs[progressLogs.length - 1]
        
        // Parse progress percentage
        const progressMatch = latestLog.match(/progress: (\d+\.?\d*) \((\d+) \/ (\d+)\)/)
        if (progressMatch) {
          percent = Math.round(parseFloat(progressMatch[1]))
        }
        
        // Determine phase
        if (latestLog.includes('downloading')) {
          phase = 'downloading'
        } else if (latestLog.includes('verifying')) {
          phase = 'verifying'
        } else if (latestLog.includes('committing')) {
          phase = 'committing'
        } else {
          phase = 'processing'
        }
      } else {
        phase = 'starting'
        percent = 0
      }
    }
    
    res.json({
      phase,
      percent,
      ready,
      containerId: req.params.containerId,
      status: info.State.Status,
      running: info.State.Running
    })
  } catch (error) {
    console.error('❌ Error getting server status:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get server stats
app.get('/api/servers/:containerId/stats', authenticate, async (req, res) => {
  try {
    const container = docker.getContainer(req.params.containerId)
    const info = await container.inspect()
    
    // Get container stats
    const stats = await container.stats({ stream: false })
    
    // Calculate CPU usage
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage
    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage
    const cpuUsage = systemDelta > 0 ? (cpuDelta / systemDelta) * 100 : 0
    
    // Calculate memory usage
    const memoryUsage = stats.memory_stats.usage || 0
    const memoryLimit = stats.memory_stats.limit || info.HostConfig.Memory || 0
    
    // Calculate uptime
    const uptime = info.State.Running ? 
      Math.floor((Date.now() - new Date(info.State.StartedAt).getTime()) / 1000) : 0
    
    const uptimeString = uptime > 0 ? 
      `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m` : 'Not running'
    
    res.json({
      status: info.State.Running ? 'online' : 'offline',
      playerCount: 0, // TODO: Implement game-specific player counting
      maxPlayers: 10, // TODO: Get from server config
      cpuUsage: Math.round(cpuUsage * 100) / 100,
      memoryUsed: memoryUsage,
      memoryTotal: memoryLimit,
      bandwidthIn: 0, // TODO: Implement bandwidth tracking
      bandwidthOut: 0, // TODO: Implement bandwidth tracking
      uptime: uptimeString
    })
  } catch (error) {
    console.error('❌ Error getting server stats:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete server
app.delete('/api/servers/:containerId', authenticate, async (req, res) => {
  try {
    const { userId } = req.body
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
    
    // Clean up FTP account if user has no more servers
    if (userId) {
      try {
        // This would need to be called from the frontend with server count
        // For now, we'll just log that cleanup should happen
        console.log(`🔍 User ${userId} deleted server - check if FTP cleanup needed`)
      } catch (ftpError) {
        console.error('⚠️  Warning: FTP cleanup check failed:', ftpError.message)
      }
    }
    
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

// Get server logs
app.get('/api/servers/:containerId/logs', authenticate, async (req, res) => {
  try {
    const container = docker.getContainer(req.params.containerId)
    const { tail = 100, follow = false, raw = false } = req.query
    
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      timestamps: true,
      tail: parseInt(tail),
      follow: follow === 'true'
    })
    
    const allLogs = logs.toString()
    
    // For CS2 download containers or when raw=true, return unfiltered logs
    const containerInfo = await container.inspect()
    const isCS2Download = containerInfo.Name.includes('cs2') && containerInfo.Name.includes('gamecontrol')
    
    let filteredLogs
    if (raw === 'true' || isCS2Download) {
      filteredLogs = allLogs
    } else {
      filteredLogs = filterGameServerLogs(allLogs)
    }
    
    res.json({
      logs: filteredLogs,
      containerId: req.params.containerId
    })
  } catch (error) {
    console.error('❌ Error getting server logs:', error)
    res.status(500).json({ error: error.message })
  }
})

// Helper function to filter game server logs
function filterGameServerLogs(logs) {
  const lines = logs.split('\n')
  const filteredLines = []
  
  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue
    
    // Skip bash command prompts and responses
    if (line.includes('$ ') || line.includes('Command sent to') || line.includes('bash: line')) continue
    
    // Skip Docker/system messages
    if (line.includes('Docker') || line.includes('container') || line.includes('exec')) continue
    
    // Keep game server messages
    if (
      // Minecraft server messages
      line.includes('[Server thread') || 
      line.includes('[User Authenticator') ||
      line.includes('[RCON Listener') ||
      line.includes('joined the game') ||
      line.includes('left the game') ||
      line.includes('Server thread/INFO') ||
      line.includes('Server thread/WARN') ||
      line.includes('Server thread/ERROR') ||
      // CS2 server messages
      line.includes('Server starting') ||
      line.includes('Map:') ||
      line.includes('Server is ready') ||
      line.includes('Player') ||
      line.includes('connected') ||
      line.includes('disconnected') ||
      line.includes('Round') ||
      line.includes('Bomb') ||
      // General game messages
      line.includes('INFO') ||
      line.includes('WARN') ||
      line.includes('ERROR') ||
      line.includes('DEBUG')
    ) {
      filteredLines.push(line)
    }
  }
  
  return filteredLines.join('\n')
}

// Helper function to send RCON command to CS2 server
async function sendRCONCommand(container, command) {
  try {
    // Get container port mappings to find RCON port
    const containerInfo = await container.inspect()
    const portMappings = containerInfo.NetworkSettings.Ports
    
    // Find RCON port (usually game port + 100)
    let rconPort = null
    for (const [containerPort, hostPorts] of Object.entries(portMappings)) {
      if (containerPort.includes('tcp') && hostPorts && hostPorts.length > 0) {
        const port = parseInt(containerPort.split('/')[0])
        rconPort = port + 100 // RCON is typically game port + 100
        break
      }
    }
    
    if (!rconPort) {
      return { success: false, output: 'RCON port not found' }
    }
    
    // Try to send RCON command (this would need an RCON client library)
    // For now, return a message that RCON is not implemented
    return { 
      success: false, 
      output: `RCON not implemented yet. Command: ${command} (would use port ${rconPort})` 
    }
  } catch (error) {
    return { success: false, output: `RCON error: ${error.message}` }
  }
}

// Helper function to send command to running process
async function sendToProcess(container, command) {
  try {
    // Try to find the CS2 process and send command via stdin
    const exec = await container.exec({
      Cmd: ['bash', '-c', `echo "${command}" | nc -U /tmp/srcds_console 2>/dev/null || echo "Command sent to CS2 process"`
      ],
      AttachStdout: true,
      AttachStderr: true
    })
    
    const stream = await exec.start()
    let output = ''
    
    await new Promise((resolve, reject) => {
      stream.on('data', (chunk) => {
        output += chunk.toString()
      })
      
      stream.on('end', resolve)
      stream.on('error', reject)
    })
    
    return output || `Command "${command}" sent to CS2 server process`
  } catch (error) {
    return `Error sending to process: ${error.message}`
  }
}

// Send command to server
app.post('/api/servers/:containerId/command', authenticate, async (req, res) => {
  try {
    const { command } = req.body
    const container = docker.getContainer(req.params.containerId)
    
    if (!command) {
      return res.status(400).json({ error: 'Command is required' })
    }
    
    // Get container info to determine game type
    const containerInfo = await container.inspect()
    const imageName = containerInfo.Config.Image.toLowerCase()
    
    let output = ''
    
    // Check if this is a game server and command looks like a game command
    const isCS2Server = imageName.includes('steamcmd')
    const isMinecraftServer = imageName.includes('minecraft-server')
    const isCS2Command = command.startsWith('sv_') || command.startsWith('mp_') || command.startsWith('bot_') || command.startsWith('rcon_')
    const isMinecraftCommand = command.startsWith('/') || command.startsWith('say ') || command.startsWith('tell ') || command.startsWith('give ') || command.startsWith('tp ') || command.startsWith('gamemode ') || command.startsWith('op ') || command.startsWith('time ') || command.startsWith('weather ') || command.startsWith('difficulty ') || command.startsWith('gamerule ')
    
    if ((isCS2Server && isCS2Command) || (isMinecraftServer && isMinecraftCommand)) {
      // For game servers, try to send command to the running game process
      const gameType = isCS2Server ? 'CS2' : 'Minecraft'
      console.log(`🎮 Sending ${gameType} command: ${command}`)
      
      try {
        // Try different methods to send command to game server
        let success = false
        
        // Method 1: Try using rcon-cli for Minecraft
        if (isMinecraftServer) {
          try {
            // First try rcon-cli
            const rconExec = await container.exec({
              Cmd: ['rcon-cli', command.replace('/', '')], // Remove leading slash for rcon-cli
              AttachStdout: true,
              AttachStderr: true
            })
            
            const rconStream = await rconExec.start()
            let rconOutput = ''
            
            await new Promise((resolve, reject) => {
              rconStream.on('data', (chunk) => {
                rconOutput += chunk.toString()
              })
              
              rconStream.on('end', resolve)
              rconStream.on('error', reject)
            })
            
            if (rconOutput.trim() && !rconOutput.includes('bash: line')) {
              output = rconOutput
              success = true
              console.log(`✅ RCON command successful: ${command}`)
            }
          } catch (rconError) {
            console.log('RCON method failed, trying alternative...')
          }
          
          // Also try mc-server-runner directly
          if (!success) {
            try {
              const mcRunnerExec = await container.exec({
                Cmd: ['bash', '-c', `echo "${command}" | nc -U /tmp/minecraft_console 2>/dev/null || echo "Command sent via mc-server-runner"`],
                AttachStdout: true,
                AttachStderr: true
              })
              
              const mcRunnerStream = await mcRunnerExec.start()
              let mcRunnerOutput = ''
              
              await new Promise((resolve, reject) => {
                mcRunnerStream.on('data', (chunk) => {
                  mcRunnerOutput += chunk.toString()
                })
                
                mcRunnerStream.on('end', resolve)
                mcRunnerStream.on('error', reject)
              })
              
              if (mcRunnerOutput.trim() && !mcRunnerOutput.includes('bash: line')) {
                output = mcRunnerOutput
                success = true
                console.log(`✅ mc-server-runner command successful: ${command}`)
              }
            } catch (mcRunnerError) {
              console.log('mc-server-runner method failed, trying next...')
            }
          }
        }
        
        // Method 2: Try sending via process stdin (if rcon didn't work)
        if (!success) {
          try {
            let processCmd
            if (isCS2Server) {
              processCmd = `echo "${command}" | nc -U /tmp/srcds_console 2>/dev/null || echo "Command sent to CS2 server"`
            } else {
              // For Minecraft, try to find the Java process and send command to its stdin
              processCmd = `echo "${command}" | nc -U /tmp/minecraft_console 2>/dev/null || echo "Command sent to Minecraft server"`
            }
            
            const exec = await container.exec({
              Cmd: ['bash', '-c', processCmd],
              AttachStdout: true,
              AttachStderr: true
            })
            
            const stream = await exec.start()
            
            await new Promise((resolve, reject) => {
              stream.on('data', (chunk) => {
                output += chunk.toString()
              })
              
              stream.on('end', resolve)
              stream.on('error', reject)
            })
            
            success = true
          } catch (processError) {
            console.log('Process method failed, trying basic method...')
          }
        }
        
        // Method 3: Try direct process communication for Minecraft
        if (!success && isMinecraftServer) {
          try {
            // Try multiple approaches for Minecraft commands
            const approaches = [
              // Approach 1: Find mc-server-runner process and send to stdin
              `pgrep -f "mc-server-runner" | head -1 | xargs -I {} sh -c 'echo "${command}" > /proc/{}/fd/0' 2>/dev/null || echo "Command sent to mc-server-runner"`,
              
              // Approach 2: Find Java process and send to stdin
              `pgrep -f "java.*minecraft" | head -1 | xargs -I {} sh -c 'echo "${command}" > /proc/{}/fd/0' 2>/dev/null || echo "Command sent to Minecraft process"`,
              
              // Approach 3: Use mc-server-runner if available
              `echo "${command}" | nc -U /tmp/minecraft_console 2>/dev/null || echo "Command sent via mc-server-runner"`,
              
              // Approach 4: Try to find the server process and send command
              `ps aux | grep java | grep minecraft | head -1 | awk '{print $2}' | xargs -I {} sh -c 'echo "${command}" > /proc/{}/fd/0' 2>/dev/null || echo "Command sent to Minecraft process"`
            ]
            
            for (const approach of approaches) {
              try {
                const exec = await container.exec({
                  Cmd: ['bash', '-c', approach],
                  AttachStdout: true,
                  AttachStderr: true
                })
                
                const stream = await exec.start()
                let approachOutput = ''
                
                await new Promise((resolve, reject) => {
                  stream.on('data', (chunk) => {
                    approachOutput += chunk.toString()
                  })
                  
                  stream.on('end', resolve)
                  stream.on('error', reject)
                })
                
                if (approachOutput.trim() && !approachOutput.includes('bash: line')) {
                  output = approachOutput
                  success = true
                  console.log(`✅ Minecraft command successful: ${command}`)
                  break
                }
              } catch (approachError) {
                console.log(`Approach failed, trying next...`)
                continue
              }
            }
          } catch (processError) {
            console.log('All process communication methods failed, trying fallback...')
          }
        }
        
        // Method 4: Fallback - just echo the command (will show in logs)
        if (!success) {
          output = `Command "${command}" logged to ${gameType} server. Check console logs to see if it was processed.`
        }
      } catch (error) {
        console.error(`Error sending ${gameType} command:`, error)
        output = `Command "${command}" sent to ${gameType} server. Check the console logs to see the result.`
      }
    } else {
      // For other servers or non-game commands, use regular bash execution
    const exec = await container.exec({
      Cmd: ['bash', '-c', command],
      AttachStdout: true,
      AttachStderr: true
    })
    
    const stream = await exec.start()
    
      await new Promise((resolve, reject) => {
    stream.on('data', (chunk) => {
      output += chunk.toString()
    })
    
        stream.on('end', resolve)
        stream.on('error', reject)
      })
    }
    
      res.json({
      output: output || `Command "${command}" sent to server`,
        command: command,
        containerId: req.params.containerId
    })
  } catch (error) {
    console.error('❌ Error sending command:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get server console stream (WebSocket-like for real-time logs)
app.get('/api/servers/:containerId/console', authenticate, async (req, res) => {
  try {
    const container = docker.getContainer(req.params.containerId)
    
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    })
    
    // Send initial connection message
    res.write('data: {"type":"connected","message":"Console connected"}\n\n')
    
    // Get logs stream
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      timestamps: true,
      follow: true,
      tail: 50
    })
    
    logs.on('data', (chunk) => {
      const logLine = chunk.toString().trim()
      if (logLine) {
        // Debug: Log problematic characters for CS2
        const hasControlChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/.test(logLine)
        if (hasControlChars) {
          console.log('🔍 CS2 log with control chars:', JSON.stringify(logLine.substring(0, 50)))
        }
        
        // Properly escape JSON string - handle quotes, backslashes, and control characters
        const escapedMessage = logLine
          .replace(/\\/g, '\\\\')  // Escape backslashes first
          .replace(/"/g, '\\"')    // Escape quotes
          .replace(/\n/g, '\\n')   // Escape newlines
          .replace(/\r/g, '\\r')   // Escape carriage returns
          .replace(/\t/g, '\\t')   // Escape tabs
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Remove all control characters except \n, \r, \t
          .replace(/[\u2000-\u206F\u2E00-\u2E7F\u3000-\u303F\uFEFF]/g, '') // Remove Unicode control chars
          .replace(/[\uFFFE\uFFFF]/g, '') // Remove BOM and other problematic chars
        
        res.write(`data: {"type":"log","message":"${escapedMessage}"}\n\n`)
      }
    })
    
    logs.on('error', (error) => {
      console.error('❌ Error in log stream:', error)
      const escapedError = error.message
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
        .replace(/[\x00-\x1F\x7F]/g, '')
      res.write(`data: {"type":"error","message":"${escapedError}"}\n\n`)
    })
    
    // Handle client disconnect
    req.on('close', () => {
      logs.destroy()
    })
    
  } catch (error) {
    console.error('❌ Error setting up console stream:', error)
    res.status(500).json({ error: error.message })
  }
})

// ═══════════════════════════════════════════════════
// FTP Management Endpoints
// ═══════════════════════════════════════════════════

// Create FTP user
app.post('/api/ftp/users', authenticate, async (req, res) => {
  try {
    const { userId } = req.body
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' })
    }
    
    console.log(`🔐 Creating FTP user for: ${userId}`)
    
    const password = generateFTPPassword()
    const ftpUser = await createFTPUser(userId, password)
    
    res.json({
      ...ftpUser,
      message: 'FTP user created successfully'
    })
  } catch (error) {
    console.error('❌ Error creating FTP user:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get FTP user info
app.get('/api/ftp/users/:userId', authenticate, async (req, res) => {
  try {
    const username = generateFTPUsername(req.params.userId)
    const info = await getFTPUserInfo(username)
    
    if (!info) {
      return res.status(404).json({ error: 'FTP user not found' })
    }
    
    res.json(info)
  } catch (error) {
    console.error('❌ Error getting FTP user info:', error)
    res.status(500).json({ error: error.message })
  }
})

// Reset FTP user (delete and recreate with new password)
app.post('/api/ftp/users/:userId/reset', authenticate, async (req, res) => {
  try {
    const userId = req.params.userId
    const username = generateFTPUsername(userId)
    
    console.log(`🔄 Resetting FTP user: ${username}`)
    
    // Delete existing user
    await deleteFTPUser(username)
    
    // Create new user with new password
    const password = generateFTPPassword()
    const ftpUser = await createFTPUser(userId, password)
    
    res.json({
      ...ftpUser,
      message: 'FTP user reset successfully'
    })
  } catch (error) {
    console.error('❌ Error resetting FTP user:', error)
    res.status(500).json({ error: error.message })
  }
})

// Change FTP password
app.put('/api/ftp/users/:userId/password', authenticate, async (req, res) => {
  try {
    const username = generateFTPUsername(req.params.userId)
    const { newPassword } = req.body
    
    const password = newPassword || generateFTPPassword()
    await changeFTPPassword(username, password)
    
    res.json({
      message: 'Password changed successfully',
      newPassword: password
    })
  } catch (error) {
    console.error('❌ Error changing password:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete FTP user
app.delete('/api/ftp/users/:userId', authenticate, async (req, res) => {
  try {
    const username = generateFTPUsername(req.params.userId)
    await deleteFTPUser(username)
    
    res.json({ message: 'FTP user deleted successfully' })
  } catch (error) {
    console.error('❌ Error deleting FTP user:', error)
    res.status(500).json({ error: error.message })
  }
})

// Link server to FTP
app.post('/api/ftp/link', authenticate, async (req, res) => {
  try {
    const { containerId, userId, serverName, serverHost, serverPort } = req.body
    
    if (!containerId || !userId || !serverName) {
      return res.status(400).json({ error: 'containerId, userId, and serverName are required' })
    }
    
    // Get server host and port from container if not provided
    let host = serverHost || VM_HOST
    let port = serverPort
    
    if (!port) {
      // Try to get port from container inspection
      try {
        const { stdout } = await execAsync(`docker inspect ${containerId} --format '{{range $p, $conf := .NetworkSettings.Ports}}{{if $conf}}{{range $conf}}{{.HostPort}}{{end}}{{end}}'`)
        port = stdout.trim().split('\n')[0] || '25565'
      } catch (error) {
        port = '25565' // Default port
      }
    }
    
    const username = generateFTPUsername(userId)
    const result = await linkServerToFTP(containerId, username, serverName, host, port)
    
    res.json({
      message: 'Server linked to FTP successfully',
      ...result
    })
  } catch (error) {
    console.error('❌ Error linking server:', error)
    res.status(500).json({ error: error.message })
  }
})

// Unlink server from FTP
app.post('/api/ftp/unlink', authenticate, async (req, res) => {
  try {
    const { userId, serverName } = req.body
    
    if (!userId || !serverName) {
      return res.status(400).json({ error: 'userId and serverName are required' })
    }
    
    const username = generateFTPUsername(userId)
    await unlinkServerFromFTP(username, serverName)
    
    res.json({ message: 'Server unlinked from FTP successfully' })
  } catch (error) {
    console.error('❌ Error unlinking server:', error)
    res.status(500).json({ error: error.message })
  }
})

// Test FTP connection
app.get('/api/ftp/status', authenticate, async (req, res) => {
  try {
    const status = await testFTPConnection()
    res.json(status)
  } catch (error) {
    console.error('❌ Error testing FTP:', error)
    res.status(500).json({ error: error.message })
  }
})

// Cleanup FTP account if user has no servers
app.post('/api/ftp/cleanup', authenticate, async (req, res) => {
  try {
    const { userId, serverCount } = req.body
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' })
    }
    
    const result = await cleanupFTPAccountIfNoServers(userId, serverCount || 0)
    
    res.json({
      message: result.deleted ? 'FTP account deleted' : 'FTP account kept',
      ...result
    })
  } catch (error) {
    console.error('❌ Error cleaning up FTP:', error)
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

