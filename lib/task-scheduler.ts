import { prisma } from './prisma'
import { updateServerOnVM } from './vm-client'

export class TaskScheduler {
  private intervalId: NodeJS.Timeout | null = null
  private isRunning = false

  start() {
    if (this.isRunning) return
    
    this.isRunning = true
    console.log('🕐 Task Scheduler started')
    
    // Check for tasks every minute
    this.intervalId = setInterval(() => {
      this.checkAndExecuteTasks()
    }, 60000) // 60 seconds
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('🕐 Task Scheduler stopped')
  }

  private async checkAndExecuteTasks() {
    try {
      const now = new Date()
      
      // Find tasks that should run now
      const tasks = await prisma.scheduledTask.findMany({
        where: {
          enabled: true,
          nextRun: {
            lte: now
          }
        },
        include: {
          server: true
        }
      })

      for (const task of tasks) {
        await this.executeTask(task)
      }
    } catch (error) {
      console.error('❌ Error in task scheduler:', error)
    }
  }

  private async executeTask(task: any) {
    try {
      console.log(`🔄 Executing task: ${task.name} (${task.type})`)
      
      // Update last run time
      await prisma.scheduledTask.update({
        where: { id: task.id },
        data: { 
          lastRun: new Date(),
          nextRun: this.calculateNextRun(task.schedule)
        }
      })

      // Execute task based on type
      switch (task.type) {
        case 'STEAM_UPDATE':
          await this.executeSteamUpdate(task)
          break
        case 'MAP_CHANGE':
          await this.executeMapChange(task)
          break
        case 'SERVER_RESTART':
          await this.executeServerRestart(task)
          break
        case 'CUSTOM_COMMAND':
          await this.executeCustomCommand(task)
          break
        default:
          console.warn(`Unknown task type: ${task.type}`)
      }
    } catch (error) {
      console.error(`❌ Error executing task ${task.name}:`, error)
    }
  }

  private async executeSteamUpdate(task: any) {
    try {
      const result = await updateServerOnVM(task.server.containerId)
      console.log(`✅ Steam update completed for server ${task.server.name}:`, result)
    } catch (error) {
      console.error(`❌ Steam update failed for server ${task.server.name}:`, error)
    }
  }

  private async executeMapChange(task: any) {
    try {
      const config = task.config as any
      const map = config.map || 'de_dust2'
      
      // Get game-specific command based on server type
      let command = ''
      switch (task.server.game) {
        case 'CS2':
          command = `changelevel ${map}`
          break
        case 'RUST':
          command = `server.worldsize ${config.worldSize || 4000} && server.seed ${config.seed || ''} && server.save`
          break
        case 'MINECRAFT':
          command = `tp @a 0 100 0` // Teleport to spawn as map change alternative
          break
        default:
          console.warn(`Map change not supported for game type: ${task.server.game}`)
          return
      }
      
      // Send map change command to server
      const response = await fetch(`${process.env.VM_API_URL}/api/servers/${task.server.containerId}/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.VM_API_KEY || ''
        },
        body: JSON.stringify({
          command: command
        })
      })

      if (response.ok) {
        console.log(`✅ Map changed to ${map} for server ${task.server.name}`)
      } else {
        console.error(`❌ Map change failed for server ${task.server.name}`)
      }
    } catch (error) {
      console.error(`❌ Map change error for server ${task.server.name}:`, error)
    }
  }

  private async executeServerRestart(task: any) {
    try {
      // Stop server
      await fetch(`${process.env.VM_API_URL}/api/servers/${task.server.containerId}/stop`, {
        method: 'POST',
        headers: {
          'x-api-key': process.env.VM_API_KEY || ''
        }
      })

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 5000))

      // Start server
      await fetch(`${process.env.VM_API_URL}/api/servers/${task.server.containerId}/start`, {
        method: 'POST',
        headers: {
          'x-api-key': process.env.VM_API_KEY || ''
        }
      })

      console.log(`✅ Server restarted: ${task.server.name}`)
    } catch (error) {
      console.error(`❌ Server restart failed for ${task.server.name}:`, error)
    }
  }

  private async executeCustomCommand(task: any) {
    try {
      const config = task.config as any
      const command = config.command
      
      if (!command) {
        console.warn(`No command specified for custom task: ${task.name}`)
        return
      }

      const response = await fetch(`${process.env.VM_API_URL}/api/servers/${task.server.containerId}/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.VM_API_KEY || ''
        },
        body: JSON.stringify({ command })
      })

      if (response.ok) {
        console.log(`✅ Custom command executed for server ${task.server.name}: ${command}`)
      } else {
        console.error(`❌ Custom command failed for server ${task.server.name}`)
      }
    } catch (error) {
      console.error(`❌ Custom command error for server ${task.server.name}:`, error)
    }
  }

  private calculateNextRun(cronExpression: string): Date {
    // Simple cron parser - in production, use a proper cron library like 'node-cron'
    const now = new Date()
    const [minute, hour, day, month, dayOfWeek] = cronExpression.split(' ')
    
    // For now, just add 1 hour to current time as a placeholder
    // In production, implement proper cron parsing
    const nextRun = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now
    
    return nextRun
  }
}

// Global task scheduler instance
export const taskScheduler = new TaskScheduler()
