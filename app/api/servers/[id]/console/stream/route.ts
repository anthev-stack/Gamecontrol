import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    if (!server.containerId) {
      return NextResponse.json({ error: 'Server not deployed to VM' }, { status: 400 })
    }

    // Create a readable stream for Server-Sent Events
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        controller.enqueue(`data: ${JSON.stringify({ type: 'connected', message: 'Console connected' })}\n\n`)

        // Set up connection to VM console stream
        const vmUrl = `${process.env.VM_API_URL}/api/servers/${server.containerId}/console`
        const vmRequest = new Request(vmUrl, {
          headers: {
            'x-api-key': process.env.VM_API_KEY || ''
          }
        })

        fetch(vmRequest)
          .then(response => {
            if (!response.ok) {
              throw new Error('Failed to connect to VM console')
            }

            const reader = response.body?.getReader()
            if (!reader) {
              throw new Error('No response body reader available')
            }

            const pump = () => {
              reader.read().then(({ done, value }) => {
                if (done) {
                  controller.close()
                  return
                }

                // Forward the data from VM to client
                const chunk = new TextDecoder().decode(value)
                controller.enqueue(chunk)
                pump()
              }).catch(error => {
                console.error('Error reading VM console stream:', error)
                controller.enqueue(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`)
                controller.close()
              })
            }

            pump()
          })
          .catch(error => {
            console.error('Error connecting to VM console:', error)
            controller.enqueue(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`)
            controller.close()
          })
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    })
  } catch (error) {
    console.error('Error setting up console stream:', error)
    return NextResponse.json({ error: 'Failed to setup console stream' }, { status: 500 })
  }
}
