import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GameType } from '@prisma/client'
import { createServerOnVM } from '@/lib/vm-client'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const servers = await prisma.server.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(servers)
  } catch (error) {
    console.error('Error fetching servers:', error)
    return NextResponse.json({ error: 'Failed to fetch servers' }, { status: 500 })
  }
}

// Helper function to allocate port (will be replaced with actual VM allocation)
function allocatePort(game: GameType): number {
  const basePorts: Record<GameType, number> = {
    CS2: 27015,
    MINECRAFT: 25565,
    RUST: 28015
  }
  // In production, this would query the VM to find an available port
  // For now, return base port (will be properly implemented with VM integration)
  return basePorts[game] + Math.floor(Math.random() * 100)
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, game, maxPlayers, allocatedRam, customArgs, ...gameSpecificFields } = body

    if (!name || !game) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Auto-assign port based on game type (will be replaced with VM allocation)
    const port = allocatePort(game as GameType)
    const rconPort = port + 100

    // Build server data
    const serverData: any = {
      name,
      game: game as GameType,
      maxPlayers: maxPlayers ? parseInt(maxPlayers) : 10,
      allocatedRam: allocatedRam ? parseInt(allocatedRam) : 2048,
      customArgs,
      host: null, // Will be set by VM
      port: port,
      rconPort: rconPort,
      userId: session.user.id
    }

    // Add game-specific fields
    if (game === 'CS2') {
      serverData.tickrate = gameSpecificFields.tickrate ? parseInt(gameSpecificFields.tickrate) : 128
      serverData.map = gameSpecificFields.map || 'de_dust2'
      serverData.gameMode = gameSpecificFields.gameMode || 'competitive'
    } else if (game === 'MINECRAFT') {
      serverData.difficulty = gameSpecificFields.difficulty || 'normal'
      serverData.worldType = gameSpecificFields.worldType || 'default'
      serverData.pvp = gameSpecificFields.pvp ?? true
      serverData.hardcore = gameSpecificFields.hardcore ?? false
      serverData.spawnProtection = gameSpecificFields.spawnProtection ? parseInt(gameSpecificFields.spawnProtection) : 16
      serverData.allowNether = gameSpecificFields.allowNether ?? true
      serverData.allowFlight = gameSpecificFields.allowFlight ?? false
    } else if (game === 'RUST') {
      serverData.worldSize = gameSpecificFields.worldSize ? parseInt(gameSpecificFields.worldSize) : 4000
      serverData.worldSeed = gameSpecificFields.worldSeed || null
      serverData.saveInterval = gameSpecificFields.saveInterval ? parseInt(gameSpecificFields.saveInterval) : 600
    }

    const server = await prisma.server.create({
      data: serverData
    })

    // Create server on VM
    const vmResult = await createServerOnVM(
      game as string,
      name,
      {
        ...gameSpecificFields,
        maxPlayers: server.maxPlayers,
        allocatedRam: server.allocatedRam,
        rconPassword: server.rconPassword || 'changeme'
      },
      server.id
    )

    // Update server with VM details
    if (vmResult.containerId && vmResult.host) {
      await prisma.server.update({
        where: { id: server.id },
        data: {
          host: vmResult.host,
          port: vmResult.port || server.port,
          rconPort: vmResult.rconPort || server.rconPort,
          containerId: vmResult.containerId
        }
      })
      
      // Fetch updated server
      const updatedServer = await prisma.server.findUnique({
        where: { id: server.id }
      })
      
      return NextResponse.json(updatedServer, { status: 201 })
    }

    return NextResponse.json(server, { status: 201 })
  } catch (error) {
    console.error('Error creating server:', error)
    return NextResponse.json({ error: 'Failed to create server' }, { status: 500 })
  }
}
