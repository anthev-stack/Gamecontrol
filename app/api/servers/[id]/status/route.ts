import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ServerStatus } from '@prisma/client'
import { startServerOnVM, stopServerOnVM, restartServerOnVM } from '@/lib/vm-client'

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

    // Update status to transitioning state
    const updatedServer = await prisma.server.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        ...(action === 'start' && { lastStarted: new Date() })
      }
    })

    // If server has containerI'd, actually control it on VM
    if (server.containerId) {
      let vmResult
      
      if (action === 'start') {
        vmResult = await startServerOnVM(server.containerId)
      } else if (action === 'stop') {
        vmResult = await stopServerOnVM(server.containerId)
      } else if (action === 'restart') {
        vmResult = await restartServerOnVM(server.containerId)
      }

      // Update final status based on VM result
      const finalStatus = vmResult?.error 
        ? ServerStatus.ERROR 
        : action === 'stop' 
          ? ServerStatus.STOPPED 
          : ServerStatus.RUNNING

      await prisma.server.update({
        where: { id: params.id },
        data: { status: finalStatus }
      })
    } else {
      // No container ID - simulate for demo (VM not connected yet)
      setTimeout(async () => {
        const finalStatus = action === 'stop' ? ServerStatus.STOPPED : ServerStatus.RUNNING
        await prisma.server.update({
          where: { id: params.id },
          data: { status: finalStatus }
        })
      }, 3000)
    }

    return NextResponse.json(updatedServer)
  } catch (error) {
    console.error('Error updating server status:', error)
    return NextResponse.json({ error: 'Failed to update server status' }, { status: 500 })
  }
}

