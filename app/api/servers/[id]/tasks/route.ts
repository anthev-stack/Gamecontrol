import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serverId = params.id

    // Verify server belongs to user
    const server = await prisma.server.findFirst({
      where: {
        id: serverId,
        userId: session.user.id
      }
    })

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }

    // Get scheduled tasks for this server
    const tasks = await prisma.scheduledTask.findMany({
      where: { serverId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching scheduled tasks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const body = await request.json()
    const { name, type, schedule, enabled, config } = body

    // Verify server belongs to user
    const server = await prisma.server.findFirst({
      where: {
        id: serverId,
        userId: session.user.id
      }
    })

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }

    // Validate required fields
    if (!name || !type || !schedule) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Calculate next run time based on cron schedule
    const nextRun = calculateNextRun(schedule)

    // Create scheduled task
    const task = await prisma.scheduledTask.create({
      data: {
        name,
        type,
        schedule,
        enabled: enabled ?? true,
        config: config ?? {},
        nextRun,
        serverId
      }
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error creating scheduled task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateNextRun(cronExpression: string): Date {
  // Simple cron parser - in production, use a proper cron library
  const now = new Date()
  const [minute, hour, day, month, dayOfWeek] = cronExpression.split(' ')
  
  // For now, just add 1 hour to current time as a placeholder
  // In production, implement proper cron parsing
  const nextRun = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now
  
  return nextRun
}
