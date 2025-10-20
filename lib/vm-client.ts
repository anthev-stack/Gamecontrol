// VM Manager API Client

const VM_API_URL = process.env.VM_API_URL
const VM_API_KEY = process.env.VM_API_KEY

// Validate VM configuration
function validateVMConfig() {
  if (!VM_API_URL || !VM_API_KEY) {
    return { valid: false, error: 'VM not configured' }
  }
  
  // Check if VM_API_URL uses correct protocol
  if (VM_API_URL.startsWith('https://')) {
    console.warn('⚠️ VM_API_URL uses HTTPS but VM Manager runs on HTTP')
    console.warn('   Consider using: http://YOUR-VPS-IP:3001')
  }
  
  if (!VM_API_URL.startsWith('http://') && !VM_API_URL.startsWith('https://')) {
    return { valid: false, error: 'VM_API_URL must start with http:// or https://' }
  }
  
  return { valid: true }
}

interface VMResponse {
  containerId?: string
  containerName?: string
  port?: number
  rconPort?: number
  host?: string
  status?: string
  error?: string
  message?: string
}

/**
 * Create a game server on the VM
 */
export async function createServerOnVM(
  gameType: string,
  name: string,
  config: any,
  serverId: string
): Promise<VMResponse> {
  const validation = validateVMConfig()
  if (!validation.valid) {
    console.warn(`⚠️ ${validation.error} - server created in database only`)
    return {
      error: validation.error,
      status: 'pending'
    }
  }

  try {
    console.log(`🚀 Creating ${gameType} server on VM...`)
    
    const response = await fetch(`${VM_API_URL}/api/servers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': VM_API_KEY
      },
      body: JSON.stringify({
        gameType,
        name,
        config,
        serverId
      }),
      // Add timeout and handle SSL issues
      signal: AbortSignal.timeout(30000) // 30 second timeout
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'VM API error')
    }

    const data = await response.json()
    console.log('✅ Server created on VM:', data)
    return data
  } catch (error: any) {
    console.error('❌ Error creating server on VM:', error)
    
    // Handle specific SSL/TLS errors
    if (error.message?.includes('SSL') || error.message?.includes('TLS') || error.cause?.code === 'ERR_SSL_PACKET_LENGTH_TOO_LONG') {
      console.error('🔒 SSL/TLS Error detected. Check VM_API_URL protocol:')
      console.error(`   Current VM_API_URL: ${VM_API_URL}`)
      console.error('   Expected: http://YOUR-VPS-IP:3001 (not https://)')
      return {
        error: 'SSL/TLS connection error. Check VM_API_URL uses http:// not https://',
        status: 'error'
      }
    }
    
    return {
      error: error.message,
      status: 'error'
    }
  }
}

/**
 * Start a server on the VM
 */
export async function startServerOnVM(containerId: string): Promise<VMResponse> {
  if (!VM_API_URL || !VM_API_KEY) {
    return { error: 'VM not configured' }
  }

  try {
    console.log(`▶️ Starting container ${containerId}...`)
    
    const response = await fetch(`${VM_API_URL}/api/servers/${containerId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': VM_API_KEY
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to start server')
    }

    const data = await response.json()
    console.log('✅ Server started')
    return data
  } catch (error: any) {
    console.error('❌ Error starting server:', error)
    return { error: error.message }
  }
}

/**
 * Stop a server on the VM
 */
export async function stopServerOnVM(containerId: string): Promise<VMResponse> {
  if (!VM_API_URL || !VM_API_KEY) {
    return { error: 'VM not configured' }
  }

  try {
    console.log(`⏸️ Stopping container ${containerId}...`)
    
    const response = await fetch(`${VM_API_URL}/api/servers/${containerId}/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': VM_API_KEY
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to stop server')
    }

    const data = await response.json()
    console.log('✅ Server stopped')
    return data
  } catch (error: any) {
    console.error('❌ Error stopping server:', error)
    return { error: error.message }
  }
}

/**
 * Restart a server on the VM
 */
export async function restartServerOnVM(containerId: string): Promise<VMResponse> {
  if (!VM_API_URL || !VM_API_KEY) {
    return { error: 'VM not configured' }
  }

  try {
    console.log(`🔄 Restarting container ${containerId}...`)
    
    const response = await fetch(`${VM_API_URL}/api/servers/${containerId}/restart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': VM_API_KEY
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to restart server')
    }

    const data = await response.json()
    console.log('✅ Server restarted')
    return data
  } catch (error: any) {
    console.error('❌ Error restarting server:', error)
    return { error: error.message }
  }
}

/**
 * Delete a server from the VM
 */
export async function deleteServerFromVM(containerId: string): Promise<VMResponse> {
  if (!VM_API_URL || !VM_API_KEY) {
    return { error: 'VM not configured' }
  }

  try {
    console.log(`🗑️ Deleting container ${containerId}...`)
    
    const response = await fetch(`${VM_API_URL}/api/servers/${containerId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': VM_API_KEY
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete server')
    }

    const data = await response.json()
    console.log('✅ Server deleted from VM')
    return data
  } catch (error: any) {
    console.error('❌ Error deleting server:', error)
    return { error: error.message }
  }
}

/**
 * Get VM status
 */
export async function getVMStatus(): Promise<VMResponse> {
  if (!VM_API_URL || !VM_API_KEY) {
    return { error: 'VM not configured', status: 'offline' }
  }

  try {
    const response = await fetch(`${VM_API_URL}/api/status`, {
      headers: {
        'x-api-key': VM_API_KEY
      }
    })

    if (!response.ok) {
      return { status: 'offline' }
    }

    return await response.json()
  } catch (error) {
    return { status: 'offline' }
  }
}

