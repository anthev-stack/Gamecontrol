import { exec } from 'child_process'
import { promisify } from 'util'
import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

const FTP_BASE_DIR = '/home/gamecontrol-ftp'
const VSFTPD_USER_LIST = '/etc/vsftpd.userlist'

/**
 * Generate secure random password
 */
export function generateFTPPassword() {
  return crypto.randomBytes(16).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 20)
}

/**
 * Generate FTP username from user ID
 */
export function generateFTPUsername(userId) {
  return `gc_${userId.substring(0, 12)}`
}

/**
 * Create FTP user with chroot jail
 */
export async function createFTPUser(userId, password) {
  const username = generateFTPUsername(userId)
  const userHomeDir = path.join(FTP_BASE_DIR, username)
  
  try {
    console.log(`📁 Creating FTP user: ${username}`)
    
    // Create user home directory
    await fs.mkdir(userHomeDir, { recursive: true, mode: 0o755 })
    
    // Create subdirectories
    await fs.mkdir(path.join(userHomeDir, 'servers'), { recursive: true })
    await fs.mkdir(path.join(userHomeDir, 'backups'), { recursive: true })
    await fs.mkdir(path.join(userHomeDir, 'shared'), { recursive: true })
    
    // Create system user
    await execAsync(`sudo useradd -d ${userHomeDir} -s /bin/bash ${username}`)
    
    // Set password
    await execAsync(`echo '${username}:${password}' | sudo chpasswd`)
    
    // Set ownership
    await execAsync(`sudo chown -R ${username}:${username} ${userHomeDir}`)
    
    // Add to vsftpd user list
    await execAsync(`echo '${username}' | sudo tee -a ${VSFTPD_USER_LIST}`)
    
    // Restart vsftpd
    await execAsync('sudo systemctl restart vsftpd')
    
    console.log(`✅ FTP user created: ${username}`)
    
    return {
      username,
      password,
      homeDir: userHomeDir,
      host: process.env.VM_HOST || 'localhost',
      port: 21
    }
  } catch (error) {
    console.error(`❌ Error creating FTP user:`, error)
    throw new Error(`Failed to create FTP user: ${error.message}`)
  }
}

/**
 * Delete FTP user
 */
export async function deleteFTPUser(username) {
  try {
    console.log(`🗑️  Deleting FTP user: ${username}`)
    
    // Remove from vsftpd user list
    await execAsync(`sudo sed -i '/^${username}$/d' ${VSFTPD_USER_LIST}`)
    
    // Delete user
    await execAsync(`sudo userdel -r ${username}`)
    
    // Restart vsftpd
    await execAsync('sudo systemctl restart vsftpd')
    
    console.log(`✅ FTP user deleted: ${username}`)
    return { success: true }
  } catch (error) {
    console.error(`❌ Error deleting FTP user:`, error)
    throw new Error(`Failed to delete FTP user: ${error.message}`)
  }
}

/**
 * Change FTP user password
 */
export async function changeFTPPassword(username, newPassword) {
  try {
    console.log(`🔑 Changing password for: ${username}`)
    
    await execAsync(`echo '${username}:${newPassword}' | sudo chpasswd`)
    
    console.log(`✅ Password changed for: ${username}`)
    return { success: true }
  } catch (error) {
    console.error(`❌ Error changing password:`, error)
    throw new Error(`Failed to change password: ${error.message}`)
  }
}

/**
 * Link server files to FTP directory
 */
export async function linkServerToFTP(containerId, username, serverName) {
  try {
    console.log(`🔗 Linking server ${serverName} to FTP for ${username}`)
    
    const userServerDir = path.join(FTP_BASE_DIR, username, 'servers', serverName)
    
    // Get container volume path
    const { stdout } = await execAsync(`docker inspect ${containerId} --format '{{range .Mounts}}{{.Source}}:{{end}}'`)
    const volumePath = stdout.split(':')[0].trim()
    
    if (!volumePath) {
      throw new Error('Could not find container volume path')
    }
    
    // Create symlink
    await execAsync(`sudo ln -sf ${volumePath} ${userServerDir}`)
    
    // Set permissions
    await execAsync(`sudo chown -R ${username}:${username} ${userServerDir}`)
    
    console.log(`✅ Server linked: ${serverName} -> ${userServerDir}`)
    
    return {
      ftpPath: `servers/${serverName}`,
      fullPath: userServerDir
    }
  } catch (error) {
    console.error(`❌ Error linking server:`, error)
    throw new Error(`Failed to link server: ${error.message}`)
  }
}

/**
 * Unlink server from FTP directory
 */
export async function unlinkServerFromFTP(username, serverName) {
  try {
    console.log(`🔓 Unlinking server ${serverName} from FTP`)
    
    const userServerDir = path.join(FTP_BASE_DIR, username, 'servers', serverName)
    
    // Remove symlink
    await execAsync(`sudo rm -f ${userServerDir}`)
    
    console.log(`✅ Server unlinked: ${serverName}`)
    return { success: true }
  } catch (error) {
    console.error(`❌ Error unlinking server:`, error)
    // Don't throw - unlinking is best effort
    return { success: false, error: error.message }
  }
}

/**
 * Get FTP user info
 */
export async function getFTPUserInfo(username) {
  try {
    const userHomeDir = path.join(FTP_BASE_DIR, username)
    
    // Check if user exists
    await execAsync(`id ${username}`)
    
    // List servers
    const serversDir = path.join(userHomeDir, 'servers')
    const servers = await fs.readdir(serversDir).catch(() => [])
    
    return {
      username,
      homeDir: userHomeDir,
      servers: servers.filter(s => !s.startsWith('.')),
      host: process.env.VM_HOST || 'localhost',
      port: 21
    }
  } catch (error) {
    console.error(`❌ Error getting FTP user info:`, error)
    return null
  }
}

/**
 * Test FTP connection
 */
export async function testFTPConnection() {
  try {
    await execAsync('sudo systemctl status vsftpd')
    return { status: 'online', message: 'FTP server is running' }
  } catch (error) {
    return { status: 'offline', message: 'FTP server is not running' }
  }
}

