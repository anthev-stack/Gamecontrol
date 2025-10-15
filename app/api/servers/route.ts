import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GameType } from '@prisma/client'

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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, game, host, port, rconPort, rconPassword, maxPlayers, map, gameMode, customArgs } = body

    if (!name || !game || !host || !port) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const server = await prisma.server.create({
      data: {
        name,
        game: game as GameType,
        host,
        port: parseInt(port),
        rconPort: rconPort ? parseInt(rconPort) : null,
        rconPassword,
        maxPlayers: maxPlayers ? parseInt(maxPlayers) : 10,
        map,
        gameMode,
        customArgs,
        userId: session.user.id
      }
    })

    return NextResponse.json(server, { status: 201 })
  } catch (error) {
    console.error('Error creating server:', error)
    return NextResponse.json({ error: 'Failed to create server' }, { status: 500 })
  }
}

