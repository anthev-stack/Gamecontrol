import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const { command } = await request.json()

    if (!command) {
      return NextResponse.json({ error: 'Command is required' }, { status: 400 })
    }

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

    // Send command to VM
    const response = await fetch(`${process.env.VM_API_URL}/api/servers/${server.containerId}/command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.VM_API_KEY || ''
      },
      body: JSON.stringify({ command })
    })

    if (!response.ok) {
      throw new Error('Failed to execute command on VM')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error executing server command:', error)
    return NextResponse.json({ error: 'Failed to execute command' }, { status: 500 })
  }
}
