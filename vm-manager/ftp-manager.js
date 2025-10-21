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
    
    // Create system user with restricted shell
    await execAsync(`sudo useradd -d ${userHomeDir} -s /bin/false -M ${username}`)
    
    // Set password
    await execAsync(`echo '${username}:${password}' | sudo chpasswd`)
    
    // Set ownership
    await execAsync(`sudo chown -R ${username}:${username} ${userHomeDir}`)
    
    // Set up chroot jail - user can only access their home directory
    await execAsync(`sudo chmod 755 ${userHomeDir}`)
    await execAsync(`sudo chmod 755 ${path.join(userHomeDir, 'servers')}`)
    await execAsync(`sudo chmod 755 ${path.join(userHomeDir, 'backups')}`)
    await execAsync(`sudo chmod 755 ${path.join(userHomeDir, 'shared')}`)
    
    // Add to vsftpd user list
    await execAsync(`echo '${username}' | sudo tee -a ${VSFTPD_USER_LIST}`)
    
    // Configure vsftpd for chroot jail
    await execAsync(`echo "local_root=${userHomeDir}" | sudo tee -a /etc/vsftpd.conf`)
    await execAsync(`echo "chroot_local_user=YES" | sudo tee -a /etc/vsftpd.conf`)
    await execAsync(`echo "allow_writeable_chroot=YES" | sudo tee -a /etc/vsftpd.conf`)
    
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
    
    // Try to copy files directly from the running container
    try {
      console.log(`📁 Copying files from container ${containerId}...`)
      
      // Create a temporary directory for copying
      const tempDir = `/tmp/container_${containerId}_${Date.now()}`
      await execAsync(`sudo mkdir -p ${tempDir}`)
      
      // Copy entire container filesystem to temp directory
      await execAsync(`docker cp ${containerId}:/ ${tempDir}/`)
      
      // Determine game type and copy only relevant files
      if (serverName.toLowerCase().includes('minecraft')) {
        // For Minecraft, copy only the data directory and essential files
        await execAsync(`sudo mkdir -p ${userServerDir}/data`)
        
        // Copy essential Minecraft files
        await execAsync(`sudo cp ${tempDir}/eula.txt ${userServerDir}/ 2>/dev/null || true`)
        await execAsync(`sudo cp ${tempDir}/server.properties ${userServerDir}/ 2>/dev/null || true`)
        await execAsync(`sudo cp ${tempDir}/server.jar ${userServerDir}/ 2>/dev/null || true`)
        await execAsync(`sudo cp ${tempDir}/start.sh ${userServerDir}/ 2>/dev/null || true`)
        
        // Copy data directory if it exists
        await execAsync(`sudo cp -r ${tempDir}/data/* ${userServerDir}/data/ 2>/dev/null || true`)
        
        // Create essential files if they don't exist
        await execAsync(`echo "eula=true" | sudo tee ${userServerDir}/eula.txt`)
        await execAsync(`echo "server-port=${serverPort}" | sudo tee ${userServerDir}/server.properties`)
        
      } else if (serverName.toLowerCase().includes('cs2')) {
        // For CS2, copy only the game directory and config files
        await execAsync(`sudo mkdir -p ${userServerDir}/game`)
        await execAsync(`sudo mkdir -p ${userServerDir}/config`)
        
        // Copy CS2 game files
        await execAsync(`sudo cp -r ${tempDir}/home/steam/steamcmd/steamapps/common/Counter-Strike* ${userServerDir}/game/ 2>/dev/null || true`)
        await execAsync(`sudo cp -r ${tempDir}/cs2* ${userServerDir}/ 2>/dev/null || true`)
        await execAsync(`sudo cp -r ${tempDir}/*.cfg ${userServerDir}/ 2>/dev/null || true`)
        
        // Create essential CS2 files if they don't exist
        await execAsync(`echo "// CS2 Server Configuration" | sudo tee ${userServerDir}/server.cfg`)
        await execAsync(`echo "hostname \"${serverName}\"" | sudo tee -a ${userServerDir}/server.cfg`)
        await execAsync(`echo "rcon_password \"changeme\"" | sudo tee -a ${userServerDir}/server.cfg`)
        
      } else if (serverName.toLowerCase().includes('rust')) {
        // For Rust, copy only the server files
        await execAsync(`sudo mkdir -p ${userServerDir}/server`)
        await execAsync(`sudo cp -r ${tempDir}/server/* ${userServerDir}/server/ 2>/dev/null || true`)
        await execAsync(`sudo cp ${tempDir}/*.cfg ${userServerDir}/ 2>/dev/null || true`)
        
        // Create essential Rust files if they don't exist
        await execAsync(`echo "// Rust Server Configuration" | sudo tee ${userServerDir}/server.cfg`)
      }
      
      // Clean up temp directory
      await execAsync(`sudo rm -rf ${tempDir}`)
      
      // Check if we got any files
      const { stdout: finalFileCount } = await execAsync(`ls -la ${userServerDir} | wc -l`)
      if (parseInt(finalFileCount.trim()) <= 2) {
        console.log('No files found, creating a placeholder directory...')
        
        // Create some basic files for the server type
        if (serverName.toLowerCase().includes('minecraft')) {
          await execAsync(`echo "eula=true" | sudo tee ${userServerDir}/eula.txt`)
          await execAsync(`echo "server-port=${serverPort}" | sudo tee ${userServerDir}/server.properties`)
        } else if (serverName.toLowerCase().includes('cs2')) {
          await execAsync(`echo "// CS2 Server Config" | sudo tee ${userServerDir}/server.cfg`)
        }
      }
      
    } catch (error) {
      console.error('Error copying container files:', error)
      
      // Create a basic directory structure
      await execAsync(`sudo mkdir -p ${userServerDir}`)
      await execAsync(`echo "Server files will appear here when the server starts" | sudo tee ${userServerDir}/README.txt`)
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

/**
 * Check if user has any servers and delete FTP account if none
 */
export async function cleanupFTPAccountIfNoServers(userId, serverCount) {
  try {
    const username = generateFTPUsername(userId)
    
    if (serverCount === 0) {
      console.log(`🗑️  No servers found for user ${userId}, deleting FTP account: ${username}`)
      await deleteFTPUser(username)
      return { deleted: true, reason: 'No servers' }
    } else {
      console.log(`✅ User ${userId} has ${serverCount} servers, keeping FTP account: ${username}`)
      return { deleted: false, reason: 'Has servers' }
    }
  } catch (error) {
    console.error(`❌ Error cleaning up FTP account for user ${userId}:`, error)
    throw new Error(`Failed to cleanup FTP account: ${error.message}`)
  }
}

