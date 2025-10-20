import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const VM_API_URL = process.env.VM_API_URL
const VM_API_KEY = process.env.VM_API_KEY

/**
 * Get FTP credentials for current user
 */
export async function GET() {
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

    // If FTP not set up yet, create it
    if (!user.ftpUsername || !user.ftpPassword) {
      return NextResponse.json({ 
        enabled: false,
        message: 'FTP not set up yet. Click "Setup FTP" to create your account.'
      })
    }

    // Get FTP info from VM
    let ftpInfo = null
    if (VM_API_URL && VM_API_KEY) {
      try {
        const response = await fetch(`${VM_API_URL}/api/ftp/users/${user.id}`, {
          headers: { 'x-api-key': VM_API_KEY }
        })
        if (response.ok) {
          ftpInfo = await response.json()
        }
      } catch (error) {
        console.error('Error fetching FTP info from VM:', error)
      }
    }

    return NextResponse.json({
      enabled: user.ftpEnabled,
      username: user.ftpUsername,
      host: ftpInfo?.host || process.env.VM_HOST || 'Not configured',
      port: ftpInfo?.port || 21,
      servers: ftpInfo?.servers || [],
      hasPassword: !!user.ftpPassword
    })
  } catch (error) {
    console.error('Error fetching FTP credentials:', error)
    return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 })
  }
}

/**
 * Setup FTP account for user
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

    // Check if FTP already set up in database
    if (user.ftpUsername && user.ftpPassword) {
      return NextResponse.json({ error: 'FTP already set up' }, { status: 400 })
    }

    if (!VM_API_URL || !VM_API_KEY) {
      return NextResponse.json({ error: 'VM not configured' }, { status: 503 })
    }

    let ftpData
    let response

    try {
      // Try to create FTP user on VM
      response = await fetch(`${VM_API_URL}/api/ftp/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': VM_API_KEY
        },
        body: JSON.stringify({ userId: user.id })
      })

      if (response.ok) {
        ftpData = await response.json()
      } else {
        const error = await response.json()
        
        // If user already exists, reset the user to get new credentials
        if (error.error && error.error.includes('already exists')) {
          console.log('FTP user already exists, resetting to get new credentials...')
          
          const resetResponse = await fetch(`${VM_API_URL}/api/ftp/users/${user.id}/reset`, {
            method: 'POST',
            headers: { 'x-api-key': VM_API_KEY }
          })
          
          if (resetResponse.ok) {
            ftpData = await resetResponse.json()
          } else {
            throw new Error('Failed to reset existing FTP user')
          }
        } else {
          throw new Error(error.error || 'Failed to create FTP user on VM')
        }
      }
    } catch (error) {
      console.error('Error in FTP user creation process:', error)
      throw new Error('Failed to create FTP user: ' + (error as Error).message)
    }

    // Hash FTP password before storing
    const hashedPassword = await bcrypt.hash(ftpData.password, 10)

    // Update user in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ftpUsername: ftpData.username,
        ftpPassword: hashedPassword,
        ftpEnabled: true
      }
    })

    return NextResponse.json({
      message: 'FTP account created successfully',
      username: ftpData.username,
      password: ftpData.password, // Send plaintext password once
      host: ftpData.host,
      port: ftpData.port
    })
  } catch (error) {
    console.error('Error setting up FTP:', error)
    return NextResponse.json({ error: 'Failed to set up FTP' }, { status: 500 })
  }
}

