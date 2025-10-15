import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GameType } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const server = await prisma.server.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }

    return NextResponse.json(server)
  } catch (error) {
    console.error('Error fetching server:', error)
    return NextResponse.json({ error: 'Failed to fetch server' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const server = await prisma.server.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }

    // Build update data
    const updateData: any = {}

    // Common fields
    if (body.name) updateData.name = body.name
    if (body.game) updateData.game = body.game as GameType
    if (body.maxPlayers) updateData.maxPlayers = parseInt(body.maxPlayers)
    if (body.allocatedRam) updateData.allocatedRam = parseInt(body.allocatedRam)
    if (body.customArgs !== undefined) updateData.customArgs = body.customArgs

    // CS2 specific
    if (body.tickrate !== undefined) updateData.tickrate = parseInt(body.tickrate)
    if (body.map !== undefined) updateData.map = body.map
    if (body.gameMode !== undefined) updateData.gameMode = body.gameMode

    // Minecraft specific
    if (body.difficulty !== undefined) updateData.difficulty = body.difficulty
    if (body.worldType !== undefined) updateData.worldType = body.worldType
    if (body.pvp !== undefined) updateData.pvp = body.pvp
    if (body.hardcore !== undefined) updateData.hardcore = body.hardcore
    if (body.spawnProtection !== undefined) updateData.spawnProtection = parseInt(body.spawnProtection)
    if (body.allowNether !== undefined) updateData.allowNether = body.allowNether
    if (body.allowFlight !== undefined) updateData.allowFlight = body.allowFlight

    // Rust specific
    if (body.worldSize !== undefined) updateData.worldSize = parseInt(body.worldSize)
    if (body.worldSeed !== undefined) updateData.worldSeed = body.worldSeed
    if (body.saveInterval !== undefined) updateData.saveInterval = parseInt(body.saveInterval)

    const updatedServer = await prisma.server.update({
      where: { id: params.id },
      data: updateData
    })

    // TODO: In production, update the running server configuration
    // This might involve restarting the container with new settings

    return NextResponse.json(updatedServer)
  } catch (error) {
    console.error('Error updating server:', error)
    return NextResponse.json({ error: 'Failed to update server' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const server = await prisma.server.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }

    // TODO: In production, destroy the server container on VM before deleting
    // This would involve:
    // 1. Stop container
    // 2. Remove container
    // 3. Clean up resources
    // 4. Release port allocation

    await prisma.server.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Server deleted successfully' })
  } catch (error) {
    console.error('Error deleting server:', error)
    return NextResponse.json({ error: 'Failed to delete server' }, { status: 500 })
  }
}
