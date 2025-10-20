import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerStatsFromVM } from '@/lib/vm-client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serverId = params.id

    // Get server from database
    const server = await prisma.server.findFirst({
      where: {
        id: serverId,
        userId: session.user.id
      }
    })

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }

    // If no container ID, server is not deployed
    if (!server.containerId) {
      return NextResponse.json({
        status: 'offline',
        playerCount: 0,
        maxPlayers: server.maxPlayers,
        cpuUsage: 0,
        memoryUsed: 0,
        memoryTotal: server.allocatedRam * 1024 * 1024,
        bandwidthIn: 0,
        bandwidthOut: 0,
        uptime: 'Not running'
      })
    }

    // Get stats from VM
    const vmStats = await getServerStatsFromVM(server.containerId)
    
    return NextResponse.json(vmStats)
  } catch (error) {
    console.error('Error fetching server stats:', error)
    return NextResponse.json({ error: 'Failed to fetch server stats' }, { status: 500 })
  }
}
