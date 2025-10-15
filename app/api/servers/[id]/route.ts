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
    const { name, game, host, port, rconPort, rconPassword, maxPlayers, map, gameMode, customArgs } = body

    const server = await prisma.server.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }

    const updatedServer = await prisma.server.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(game && { game: game as GameType }),
        ...(host && { host }),
        ...(port && { port: parseInt(port) }),
        ...(rconPort !== undefined && { rconPort: rconPort ? parseInt(rconPort) : null }),
        ...(rconPassword !== undefined && { rconPassword }),
        ...(maxPlayers && { maxPlayers: parseInt(maxPlayers) }),
        ...(map !== undefined && { map }),
        ...(gameMode !== undefined && { gameMode }),
        ...(customArgs !== undefined && { customArgs }),
      }
    })

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

    await prisma.server.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Server deleted successfully' })
  } catch (error) {
    console.error('Error deleting server:', error)
    return NextResponse.json({ error: 'Failed to delete server' }, { status: 500 })
  }
}

