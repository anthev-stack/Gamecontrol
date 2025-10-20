import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const VM_API_URL = process.env.VM_API_URL
const VM_API_KEY = process.env.VM_API_KEY

/**
 * Link all user's servers to FTP
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all user's servers that have containerId
    const servers = await prisma.server.findMany({
      where: {
        userId: session.user.id,
        containerId: { not: null }
      }
    })

    if (servers.length === 0) {
      return NextResponse.json({ 
        message: 'No servers need FTP linking',
        linked: 0,
        total: 0
      })
    }

    if (!VM_API_URL || !VM_API_KEY) {
      return NextResponse.json({ error: 'VM not configured' }, { status: 503 })
    }

    let linkedCount = 0
    const results = []

    for (const server of servers) {
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
            serverName: server.name.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase(),
            serverHost: server.host,
            serverPort: server.port
          })
        })
        
        if (ftpResponse.ok) {
          const ftpData = await ftpResponse.json()
          
          // Update server with FTP path
          await prisma.server.update({
            where: { id: server.id },
            data: { ftpPath: ftpData.ftpPath }
          })

          linkedCount++
          results.push({
            serverId: server.id,
            serverName: server.name,
            status: 'success',
            ftpPath: ftpData.ftpPath
          })
        } else {
          const error = await ftpResponse.json()
          results.push({
            serverId: server.id,
            serverName: server.name,
            status: 'error',
            error: error.error || 'Failed to link'
          })
        }
      } catch (error) {
        results.push({
          serverId: server.id,
          serverName: server.name,
          status: 'error',
          error: (error as Error).message
        })
      }
    }

    return NextResponse.json({
      message: `Linked ${linkedCount} out of ${servers.length} servers to FTP`,
      linked: linkedCount,
      total: servers.length,
      results
    })
  } catch (error) {
    console.error('Error linking all servers to FTP:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
