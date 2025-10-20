import { NextResponse } from 'next/server'
import { taskScheduler } from '@/lib/task-scheduler'

export async function POST() {
  try {
    taskScheduler.start()
    return NextResponse.json({ success: true, message: 'Task scheduler started' })
  } catch (error) {
    console.error('Error starting task scheduler:', error)
    return NextResponse.json({ error: 'Failed to start scheduler' }, { status: 500 })
  }
}
