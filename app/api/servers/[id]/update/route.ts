import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateServerOnVM } from '@/lib/vm-client'

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

    // Only allow updates for Steam-based games
    if (!['CS2', 'RUST'].includes(server.game)) {
      return NextResponse.json({ error: 'Steam updates only available for CS2 and Rust servers' }, { status: 400 })
    }

    // Update server on VM
    const result = await updateServerOnVM(server.containerId)
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ message: 'Server update initiated successfully', status: 'updating' })
  } catch (error) {
    console.error('Error updating server:', error)
    return NextResponse.json({ error: 'Failed to update server' }, { status: 500 })
  }
}
