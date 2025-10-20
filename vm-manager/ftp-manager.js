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
export async function linkServerToFTP(containerId, username, serverName, serverHost, serverPort) {
  try {
    console.log(`🔗 Linking server ${serverName} to FTP for ${username}`)
    
    // Create folder name using IP_PORT format
    const folderName = `${serverHost}_${serverPort}`
    const userServerDir = path.join(FTP_BASE_DIR, username, 'servers', folderName)
    
    // Get container volume path
    const { stdout } = await execAsync(`docker inspect ${containerId} --format '{{range .Mounts}}{{.Source}}:{{end}}'`)
    const volumePath = stdout.split(':')[0].trim()
    
    if (!volumePath) {
      throw new Error('Could not find container volume path')
    }
    
    // Create directory if it doesn't exist
    await execAsync(`sudo mkdir -p ${userServerDir}`)
    
    // Try multiple approaches to get the server files
    let sourcePath = volumePath
    
    // First, try to get the container's working directory
    try {
      const { stdout: workDir } = await execAsync(`docker inspect ${containerId} --format '{{.Config.WorkingDir}}'`)
      if (workDir && workDir.trim() && workDir.trim() !== '/') {
        sourcePath = workDir.trim()
      }
    } catch (error) {
      console.log('Could not get working directory, using volume path')
    }
    
    // If volume path doesn't exist or is empty, try to find files in the container
    try {
      const { stdout: fileCheck } = await execAsync(`ls -la ${sourcePath} 2>/dev/null | wc -l`)
      if (parseInt(fileCheck.trim()) <= 2) {
        // Volume path is empty, try to find files in container
        const { stdout: containerFiles } = await execAsync(`docker exec ${containerId} find / -name "*.jar" -o -name "server.properties" -o -name "eula.txt" 2>/dev/null | head -5`)
        if (containerFiles.trim()) {
          // Found files in container, get the directory
          const filePath = containerFiles.trim().split('\n')[0]
          sourcePath = filePath.substring(0, filePath.lastIndexOf('/'))
        }
      }
    } catch (error) {
      console.log('Could not check container files')
    }
    
    // Copy files from the source
    await execAsync(`sudo cp -r ${sourcePath}/* ${userServerDir}/ 2>/dev/null || true`)
    
    // Also try to copy from container directly if volume copy failed
    try {
      const { stdout: fileCount } = await execAsync(`ls -la ${userServerDir} | wc -l`)
      if (parseInt(fileCount.trim()) <= 2) {
        console.log('Volume copy failed, trying direct container copy...')
        await execAsync(`docker cp ${containerId}:/ ${userServerDir}/`)
      }
    } catch (error) {
      console.log('Container copy also failed')
    }
    
    // Set permissions
    await execAsync(`sudo chown -R ${username}:${username} ${userServerDir}`)
    await execAsync(`sudo chmod -R 755 ${userServerDir}`)
    
    console.log(`✅ Server linked: ${serverName} -> ${userServerDir}`)
    
    return {
      ftpPath: `servers/${folderName}`,
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

