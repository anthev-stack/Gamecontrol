import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { restartServerOnVM } from '@/lib/vm-client'

export async function POST(
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

    if (!server.containerId) {
      return NextResponse.json({ error: 'Server not deployed to VM' }, { status: 400 })
    }

    // Restart server on VM
    const result = await restartServerOnVM(server.containerId)
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ message: 'Server restarted successfully', status: 'running' })
  } catch (error) {
    console.error('Error restarting server:', error)
    return NextResponse.json({ error: 'Failed to restart server' }, { status: 500 })
  }
}
