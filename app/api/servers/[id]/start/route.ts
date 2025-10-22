import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { startServerOnVM } from '@/lib/vm-client'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔄 Start route called with serverId:', params.id)
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      console.log('❌ No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serverId = params.id
    console.log('🔄 Looking up server in database...')

    // Dynamic import of Prisma to avoid initialization issues
    const { prisma } = await import('@/lib/prisma')
    
    if (!prisma) {
      console.error('❌ Prisma client is not available')
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 })
    }

    console.log('✅ Prisma client is available')

    // Get server from database
    console.log('🔄 Querying database for server...')
    const server = await prisma.server.findFirst({
      where: {
        id: serverId,
        userId: session.user.id
      }
    })

    console.log('📊 Server found:', server ? 'Yes' : 'No')
    if (server) {
      console.log('📊 Server containerId:', server.containerId)
    }

    if (!server) {
      console.log('❌ Server not found in database')
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }

    if (!server.containerId) {
      return NextResponse.json({ error: 'Server not deployed to VM' }, { status: 400 })
    }

    console.log(`🔄 Starting server ${serverId} with container ${server.containerId}`)

    // Start server on VM
    const result = await startServerOnVM(server.containerId)
    
    if (result.error) {
      console.error('❌ VM start error:', result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    console.log('✅ Server started successfully')
    return NextResponse.json({ message: 'Server started successfully', status: 'running' })
  } catch (error) {
    console.error('❌ Error starting server:', error)
    
    // Provide more specific error information
    if (error instanceof Error) {
      if (error.message.includes('prisma')) {
        return NextResponse.json({ error: 'Database connection error' }, { status: 500 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ error: 'Failed to start server' }, { status: 500 })
  }
}
