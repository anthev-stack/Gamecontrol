import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const VM_API_URL = process.env.VM_API_URL
const VM_API_KEY = process.env.VM_API_KEY

/**
 * Link existing server to FTP
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serverId = params.id

    // Get server details
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
      return NextResponse.json({ error: 'Server not deployed on VM yet' }, { status: 400 })
    }

    // Link server to FTP
    if (!VM_API_URL || !VM_API_KEY) {
      return NextResponse.json({ error: 'VM not configured' }, { status: 503 })
    }

    try {
      const ftpResponse = await fetch(`${VM_API_URL}/api/ftp/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': VM_API_KEY
        },
        body: JSON.stringify({
          containerId: server.containerId,
          userId: session.user.id,
          serverName: server.name.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase()
        })
      })
      
      if (ftpResponse.ok) {
        const ftpData = await ftpResponse.json()
        
        // Update server with FTP path
        await prisma.server.update({
          where: { id: serverId },
          data: { ftpPath: ftpData.ftpPath }
        })

        return NextResponse.json({
          message: 'Server linked to FTP successfully',
          ftpPath: ftpData.ftpPath
        })
      } else {
        const error = await ftpResponse.json()
        return NextResponse.json({ error: error.error || 'Failed to link server to FTP' }, { status: 500 })
      }
    } catch (error) {
      console.error('Error linking server to FTP:', error)
      return NextResponse.json({ error: 'Failed to link server to FTP' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in link FTP:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
