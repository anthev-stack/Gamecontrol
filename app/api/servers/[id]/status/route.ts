import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ServerStatus } from '@prisma/client'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (!['start', 'stop', 'restart'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
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

    let newStatus: ServerStatus
    
    switch (action) {
      case 'start':
        newStatus = ServerStatus.STARTING
        break
      case 'stop':
        newStatus = ServerStatus.STOPPING
        break
      case 'restart':
        newStatus = ServerStatus.STARTING
        break
      default:
        newStatus = server.status
    }

    const updatedServer = await prisma.server.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        ...(action === 'start' && { lastStarted: new Date() })
      }
    })

    // In a real implementation, you would trigger actual server start/stop commands here
    // This could involve SSH connections to your VPS, Docker commands, etc.
    // For now, we'll simulate it by updating the status after a delay
    setTimeout(async () => {
      const finalStatus = action === 'stop' ? ServerStatus.STOPPED : ServerStatus.RUNNING
      await prisma.server.update({
        where: { id: params.id },
        data: { status: finalStatus }
      })
    }, 3000)

    return NextResponse.json(updatedServer)
  } catch (error) {
    console.error('Error updating server status:', error)
    return NextResponse.json({ error: 'Failed to update server status' }, { status: 500 })
  }
}

