import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const VM_API_URL = process.env.VM_API_URL
const VM_API_KEY = process.env.VM_API_KEY

/**
 * Reset FTP credentials for current user
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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete FTP user from VM if it exists
    if (VM_API_URL && VM_API_KEY && user.ftpUsername) {
      try {
        await fetch(`${VM_API_URL}/api/ftp/users/${user.id}`, {
          method: 'DELETE',
          headers: { 'x-api-key': VM_API_KEY }
        })
        console.log('FTP user deleted from VM')
      } catch (error) {
        console.error('Error deleting FTP user from VM:', error)
        // Continue with database cleanup even if VM deletion fails
      }
    }

    // Clear FTP credentials from database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ftpUsername: null,
        ftpPassword: null,
        ftpEnabled: false
      }
    })

    return NextResponse.json({
      message: 'FTP credentials reset successfully. You can now set up FTP again.'
    })
  } catch (error) {
    console.error('Error resetting FTP credentials:', error)
    return NextResponse.json({ error: 'Failed to reset FTP credentials' }, { status: 500 })
  }
}
