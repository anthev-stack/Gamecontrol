import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const VM_API_URL = process.env.VM_API_URL
const VM_API_KEY = process.env.VM_API_KEY

/**
 * Reset FTP password
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || !user.ftpUsername) {
      return NextResponse.json({ error: 'FTP not set up' }, { status: 400 })
    }

    // Reset password on VM
    if (!VM_API_URL || !VM_API_KEY) {
      return NextResponse.json({ error: 'VM not configured' }, { status: 503 })
    }

    const response = await fetch(`${VM_API_URL}/api/ftp/users/${user.id}/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': VM_API_KEY
      },
      body: JSON.stringify({})
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to reset password on VM')
    }

    const data = await response.json()
    const newPassword = data.newPassword

    // Hash and update password in database
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ftpPassword: hashedPassword
      }
    })

    return NextResponse.json({
      message: 'FTP password reset successfully',
      newPassword: newPassword,
      username: user.ftpUsername
    })
  } catch (error) {
    console.error('Error resetting FTP password:', error)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}

