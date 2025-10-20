import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: serverId, taskId } = params
    const body = await request.json()
    const { enabled, name, schedule, config } = body

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

    // Verify task belongs to server
    const task = await prisma.scheduledTask.findFirst({
      where: {
        id: taskId,
        serverId
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Update task
    const updateData: any = {}
    if (enabled !== undefined) updateData.enabled = enabled
    if (name !== undefined) updateData.name = name
    if (schedule !== undefined) {
      updateData.schedule = schedule
      updateData.nextRun = calculateNextRun(schedule)
    }
    if (config !== undefined) updateData.config = config

    const updatedTask = await prisma.scheduledTask.update({
      where: { id: taskId },
      data: updateData
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Error updating scheduled task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: serverId, taskId } = params

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

    // Verify task belongs to server
    const task = await prisma.scheduledTask.findFirst({
      where: {
        id: taskId,
        serverId
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Delete task
    await prisma.scheduledTask.delete({
      where: { id: taskId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting scheduled task:', error)
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
