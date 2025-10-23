'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Server } from '@prisma/client'
import { BarChart3, Terminal, RotateCcw, Clock, Settings, Copy, AlertTriangle, CheckCircle, XCircle, Lightbulb } from 'lucide-react'

interface ServerStats {
  status: 'online' | 'offline' | 'error'
  playerCount: number
  maxPlayers: number
  cpuUsage: number
  memoryUsed: number
  memoryTotal: number
  bandwidthIn: number
  bandwidthOut: number
  uptime: string
}

interface ServerDetailPageProps {
  params: {
    serverId: string
  }
}

// Console Tab Component
function ConsoleTab({ server, refreshTrigger }: { server: Server, refreshTrigger?: number }) {
  const [logs, setLogs] = useState<string[]>([])
  const [command, setCommand] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [connectionMethod, setConnectionMethod] = useState<'sse' | 'polling'>('sse')
  const logsEndRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [logs])

  useEffect(() => {
    if (!server.containerId) return

    // Load initial logs
    loadLogs()

    // Start polling immediately for reliable updates
    setupPolling()

    // Also try Server-Sent Events (will override polling if successful)
    setupSSE()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [server.containerId, server.id])

  // Listen for refresh trigger (e.g., after server restart)
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      console.log('🔄 Refreshing console logs after server action...')
      setLogs([]) // Clear existing logs
      loadLogs() // Reload fresh logs
    }
  }, [refreshTrigger])

  const setupSSE = () => {
    try {
      const eventSource = new EventSource(`/api/servers/${server.id}/console/stream`)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log('✅ SSE connected')
        setIsConnected(true)
        setConnectionMethod('sse')
        // Clear any existing polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'log') {
            setLogs(prev => [...prev, data.message])
          } else if (data.type === 'connected') {
            console.log('Console connected via SSE')
          } else if (data.type === 'error') {
            console.error('Console error:', data.message)
          }
        } catch (error) {
          console.error('Error parsing console data:', error)
          // If we get JSON parsing errors, disable SSE and force polling
          console.log('🔄 JSON parsing errors detected, switching to polling...')
          eventSource.close()
          eventSourceRef.current = null
          setupPolling()
        }
      }

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error)
        setIsConnected(false)
        // Immediately fallback to polling after SSE fails
        console.log('🔄 SSE failed, falling back to polling...')
        setupPolling()
      }
    } catch (error) {
      console.error('Error setting up SSE:', error)
      setupPolling()
    }
  }

  const setupPolling = () => {
    console.log('🔄 Setting up polling fallback...')
    setConnectionMethod('polling')
    
    // Poll every 1 second for more responsive updates
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/servers/${server.id}/console/logs?tail=100`)
        if (response.ok) {
          const data = await response.json()
          const newLogs = data.logs.split('\n').filter((line: string) => line.trim())
          
          // Always update logs to ensure we get the latest
          setLogs(prev => {
            // If we have no previous logs, just set the new ones
            if (prev.length === 0) {
              return newLogs
            }
            
            // Find the last log we have and get new ones from there
            const lastLog = prev[prev.length - 1]
            const lastLogIndex = newLogs.findIndex((log: string) => log === lastLog)
            
            if (lastLogIndex === -1) {
              // Last log not found, might be a complete refresh needed
              return newLogs
            } else if (lastLogIndex < newLogs.length - 1) {
              // We have new logs after our last one
              const newLogsToAdd = newLogs.slice(lastLogIndex + 1)
              return [...prev, ...newLogsToAdd]
            }
            
            // No new logs, keep existing
            return prev
          })
          
          setIsConnected(true)
        } else {
          console.error('Polling response not ok:', response.status)
          setIsConnected(false)
        }
      } catch (error) {
        console.error('Polling error:', error)
        setIsConnected(false)
      }
    }, 1000) // Poll every 1 second
  }

  const loadLogs = async () => {
    try {
      const response = await fetch(`/api/servers/${server.id}/console/logs?tail=100`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs.split('\n').filter((line: string) => line.trim()))
      }
    } catch (error) {
      console.error('Error loading logs:', error)
    }
  }

  const sendCommand = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!command.trim() || !server.containerId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/servers/${server.id}/console/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: command.trim() })
      })

      if (response.ok) {
        const data = await response.json()
        setLogs(prev => [...prev, `$ ${command}`, data.output])
        setCommand('')
      } else {
        const error = await response.json()
        setLogs(prev => [...prev, `$ ${command}`, `Error: ${error.error}`])
      }
    } catch (error) {
      setLogs(prev => [...prev, `$ ${command}`, `Error: ${error}`])
    } finally {
      setIsLoading(false)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-700/50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white">Web Console</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-300">
              {isConnected ? `Connected (${connectionMethod.toUpperCase()})` : 'Disconnected'}
            </span>
          </div>
          <button
            onClick={clearLogs}
            className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto mb-4 border border-gray-600/50">
        {logs.length === 0 ? (
          <div className="text-gray-400">Loading console output...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1">
              {log}
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      <form onSubmit={sendCommand} className="flex gap-2">
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Enter command..."
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={!server.containerId || isLoading}
        />
        <button
          type="submit"
          disabled={!command.trim() || !server.containerId || isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>

      <div className="mt-2 text-xs text-gray-400">
        <div className="flex items-center gap-1 mb-2">
          <Lightbulb className="w-3 h-3" />
          <strong>Tips:</strong>
        </div>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>Console updates automatically every 1 second - no manual refresh needed!</li>
          <li>For Minecraft: Use <code className="bg-gray-700 px-1 rounded text-gray-300">say hello</code>, <code className="bg-gray-700 px-1 rounded text-gray-300">op player</code>, <code className="bg-gray-700 px-1 rounded text-gray-300">time set 1200</code></li>
          <li>For CS2: Use <code className="bg-gray-700 px-1 rounded text-gray-300">sv_cheats 1</code>, <code className="bg-gray-700 px-1 rounded text-gray-300">mp_restartgame 1</code></li>
          <li>Use <code className="bg-gray-700 px-1 rounded text-gray-300">status</code> to check server status</li>
          <li>Use <code className="bg-gray-700 px-1 rounded text-gray-300">ls -la</code> to list files</li>
        </ul>
      </div>
    </div>
  )
}

export default function ServerDetailPage({ params }: ServerDetailPageProps) {
  const [server, setServer] = useState<Server | null>(null)
  const [stats, setStats] = useState<ServerStats | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [consoleRefreshTrigger, setConsoleRefreshTrigger] = useState(0)
  const [isCS2Ready, setIsCS2Ready] = useState(false)
  const [hasCS2BeenStarted, setHasCS2BeenStarted] = useState(false)
  const router = useRouter()

  const serverId = params.serverId

  useEffect(() => {
    fetchServerDetails()
    fetchServerStats()
    
    // Poll for stats every 30 seconds
    const interval = setInterval(fetchServerStats, 30000)
    
    // For CS2 servers, also check ready status every 2 seconds
    let cs2Interval: NodeJS.Timeout | null = null
    if (server?.game === 'CS2') {
      cs2Interval = setInterval(() => {
        if (!isCS2Ready) {
          checkCS2Ready()
        } else {
          console.log('📊 Server Detail: Stopping CS2 ready check - already ready') // Debug log
        }
      }, 2000)
    }
    
    return () => {
      clearInterval(interval)
      if (cs2Interval) clearInterval(cs2Interval)
    }
  }, [serverId, server?.game, isCS2Ready])

  // Check if CS2 has been started before when server details are loaded
  useEffect(() => {
    if (server?.game === 'CS2' && server.status === 'RUNNING') {
      setHasCS2BeenStarted(true)
      setIsCS2Ready(true)
      console.log('📊 Server Detail: CS2 server was running, marking as ready')
    }
  }, [server])

  const fetchServerDetails = async () => {
    try {
      const response = await fetch(`/api/servers/${serverId}`)
      if (!response.ok) throw new Error('Failed to fetch server details')
      const data = await response.json()
      setServer(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const fetchServerStats = async () => {
    try {
      const response = await fetch(`/api/servers/${serverId}/stats`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
        
        // For CS2 servers, check if download is complete
        if (server?.game === 'CS2') {
          checkCS2Ready()
        }
      }
    } catch (err) {
      console.error('Failed to fetch server stats:', err)
    }
  }

  const checkCS2Ready = async () => {
    if (server?.game !== 'CS2' || isCS2Ready) {
      console.log('📊 Server Detail: Skipping CS2 ready check - not CS2 or already ready') // Debug log
      return
    }

    // If CS2 has been started before, consider it ready
    if (hasCS2BeenStarted && !isCS2Ready) {
      console.log('📊 Server Detail: CS2 has been started before, marking as ready') // Debug log
      setIsCS2Ready(true)
      return
    }

    try {
      // Use the new VM status endpoint for accurate progress tracking
      const response = await fetch(`/api/servers/${serverId}/status`)
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Server Detail: Status data:', data) // Debug log
        
        // Check if download is ready
        if (data.ready && !isCS2Ready) {
          console.log('📊 Server Detail: CS2 download is ready!') // Debug log
          setIsCS2Ready(true)
        }
      } else if (response.status === 500) {
        // VM doesn't have the new status endpoint yet, fall back to old method
        console.log('📊 Server Detail: Status endpoint not available (500), falling back to old method') // Debug log
        const fallbackResponse = await fetch(`/api/servers/${serverId}`)
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          const isReady = fallbackData.status === 'stopped' || fallbackData.status === 'exited'
          if (isReady && !isCS2Ready) {
            console.log('📊 Server Detail: CS2 ready detected from fallback method') // Debug log
            setIsCS2Ready(true)
          }
        }
      }
    } catch (err) {
      console.error('Error checking CS2 ready status:', err)
    }
  }

  const handleServerAction = async (action: 'start' | 'stop' | 'restart') => {
    setIsActionLoading(true)
    setError('')
    
    try {
      console.log(`🔄 Attempting to ${action} server ${serverId}...`)
      
      const response = await fetch(`/api/servers/${serverId}/${action}`, {
        method: 'POST'
      })
      
      console.log(`📡 Response status: ${response.status}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error(`❌ API Error:`, errorData)
        throw new Error(errorData.error || `Failed to ${action} server`)
      }
      
      const result = await response.json()
      console.log(`✅ Server ${action} successful:`, result)
      
      // For CS2 servers, mark as started when successfully started
      if (server?.game === 'CS2' && action === 'start') {
        setHasCS2BeenStarted(true)
        setIsCS2Ready(true)
        console.log('📊 Server Detail: CS2 server started, marking as ready for future starts')
      }
      
      // Refresh stats after action
      setTimeout(fetchServerStats, 2000)
      
      // If restarting, refresh console logs to show restart process
      if (action === 'restart') {
        setTimeout(() => {
          console.log('🔄 Triggering console refresh after restart...')
          setConsoleRefreshTrigger(prev => prev + 1)
        }, 2000)
      }
    } catch (err) {
      console.error(`❌ Error ${action}ing server:`, err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleSteamUpdate = async () => {
    try {
      const response = await fetch(`/api/servers/${serverId}/update`, {
        method: 'POST'
      })
      
      if (!response.ok) throw new Error('Failed to update server')
      
      setError('Server update initiated. This may take a few minutes.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const handleReinstall = async () => {
    if (!confirm('Are you sure you want to reinstall this server? This will delete all data and create a fresh server.')) {
      return
    }

    try {
      const response = await fetch(`/api/servers/${serverId}/reinstall`, {
        method: 'POST'
      })
      
      if (!response.ok) throw new Error('Failed to reinstall server')
      
      setError('Server reinstall initiated. This may take several minutes.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this server? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/servers/${serverId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete server')
      
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-4 text-white">Loading server details...</p>
        </div>
      </div>
    )
  }

  if (error || !server) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-red-400 text-xl mb-4">
            <AlertTriangle className="w-5 h-5" />
            Error
          </div>
          <p className="text-white mb-4">{error || 'Server not found'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  function SteamUpdatesTab({ server }: { server: Server }) {
    const [isUpdating, setIsUpdating] = useState(false)
    const [updateLogs, setUpdateLogs] = useState<string[]>([])
    const [scheduledTasks, setScheduledTasks] = useState<any[]>([])
    const [showCreateTask, setShowCreateTask] = useState(false)
    const [newTask, setNewTask] = useState({
      name: '',
      type: 'STEAM_UPDATE',
      schedule: '',
      enabled: true,
      config: {} as any
    })

    // Load scheduled tasks
    useEffect(() => {
      loadScheduledTasks()
    }, [])

    const loadScheduledTasks = async () => {
      try {
        const response = await fetch(`/api/servers/${server.id}/tasks`)
        if (response.ok) {
          const tasks = await response.json()
          setScheduledTasks(tasks)
        }
      } catch (error) {
        console.error('Failed to load scheduled tasks:', error)
      }
    }

    const handleSteamUpdate = async () => {
      setIsUpdating(true)
      try {
        const response = await fetch(`/api/servers/${server.id}/update`, {
          method: 'POST'
        })
        
        if (response.ok) {
          setUpdateLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: Steam update initiated...`])
        } else {
          setUpdateLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: Failed to start Steam update`])
        }
      } catch (error) {
        setUpdateLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: Error: ${(error as Error).message}`])
      } finally {
        setIsUpdating(false)
      }
    }

    const handleCreateTask = async () => {
      try {
        const response = await fetch(`/api/servers/${server.id}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTask)
        })
        
        if (response.ok) {
          setShowCreateTask(false)
          setNewTask({ name: '', type: 'STEAM_UPDATE', schedule: '', enabled: true, config: {} })
          loadScheduledTasks()
        }
      } catch (error) {
        console.error('Failed to create task:', error)
      }
    }

    const handleDeleteTask = async (taskId: string) => {
      try {
        const response = await fetch(`/api/servers/${server.id}/tasks/${taskId}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          loadScheduledTasks()
        }
      } catch (error) {
        console.error('Failed to delete task:', error)
      }
    }

    const handleToggleTask = async (taskId: string, enabled: boolean) => {
      try {
        const response = await fetch(`/api/servers/${server.id}/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled })
        })
        
        if (response.ok) {
          loadScheduledTasks()
        }
      } catch (error) {
        console.error('Failed to toggle task:', error)
      }
    }

    return (
      <div className="space-y-6">
        {/* Manual Update */}
        <div className="bg-gray-900/60 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-700/50">
          <h3 className="text-lg font-semibold mb-4 text-white">Manual Steam Update</h3>
          
          <div className="flex items-center justify-between p-4 bg-blue-900/30 rounded-lg border border-blue-700/50">
            <div>
              <h4 className="font-medium text-white">Update Game Server</h4>
              <p className="text-sm text-gray-300">Download and install the latest game updates immediately</p>
            </div>
            <button
              onClick={handleSteamUpdate}
              disabled={isUpdating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              {isUpdating ? 'Updating...' : 'Update Now'}
            </button>
          </div>

          {updateLogs.length > 0 && (
            <div className="mt-4 bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto border border-gray-600/50">
              {updateLogs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
          )}
        </div>

        {/* Scheduled Tasks */}
        <div className="bg-gray-900/60 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Scheduled Tasks</h3>
            <button
              onClick={() => setShowCreateTask(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              + Add Task
            </button>
          </div>

          {scheduledTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No scheduled tasks configured</p>
              <p className="text-sm">Create a task to automate server updates</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{task.name}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        task.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {task.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">
                      {task.type.replace('_', ' ')} • {task.schedule}
                    </p>
                    {task.nextRun && (
                      <p className="text-xs text-gray-400">
                        Next run: {new Date(task.nextRun).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleTask(task.id, !task.enabled)}
                      className={`px-3 py-1 text-sm rounded ${
                        task.enabled 
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {task.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-800 hover:bg-red-200 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Task Modal */}
        {showCreateTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700-lg w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Create Scheduled Task</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task Name</label>
                  <input
                    type="text"
                    value={newTask.name}
                    onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Daily Steam Update"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
                  <select
                    value={newTask.type}
                    onChange={(e) => setNewTask({ ...newTask, type: e.target.value, config: {} })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="STEAM_UPDATE">Steam Update</option>
                    <option value="MAP_CHANGE">Map Change</option>
                    <option value="SERVER_RESTART">Server Restart</option>
                    <option value="CUSTOM_COMMAND">Custom Command</option>
                  </select>
                </div>

                {/* Game-specific configuration */}
                {newTask.type === 'MAP_CHANGE' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {server.game === 'CS2' ? 'Map' : server.game === 'RUST' ? 'World Settings' : 'Configuration'}
                      </label>
                      {server.game === 'CS2' && (
                        <select
                          value={newTask.config.map || ''}
                          onChange={(e) => setNewTask({ 
                            ...newTask, 
                            config: { ...newTask.config, map: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="de_dust2">de_dust2</option>
                          <option value="de_mirage">de_mirage</option>
                          <option value="de_inferno">de_inferno</option>
                          <option value="de_overpass">de_overpass</option>
                          <option value="de_vertigo">de_vertigo</option>
                          <option value="de_ancient">de_ancient</option>
                          <option value="de_nuke">de_nuke</option>
                        </select>
                      )}
                      {server.game === 'RUST' && (
                        <div className="space-y-2">
                          <input
                            type="number"
                            placeholder="World Size (default: 4000)"
                            value={newTask.config.worldSize || ''}
                            onChange={(e) => setNewTask({ 
                              ...newTask, 
                              config: { ...newTask.config, worldSize: parseInt(e.target.value) || 4000 }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            placeholder="World Seed (optional)"
                            value={newTask.config.seed || ''}
                            onChange={(e) => setNewTask({ 
                              ...newTask, 
                              config: { ...newTask.config, seed: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {newTask.type === 'CUSTOM_COMMAND' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Command</label>
                    <input
                      type="text"
                      placeholder="Enter server command (e.g., say Hello World)"
                      value={newTask.config.command || ''}
                      onChange={(e) => setNewTask({ 
                        ...newTask, 
                        config: { ...newTask.config, command: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Examples: say Hello World, kick player_name, changelevel de_dust2
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Schedule (Cron)</label>
                  <input
                    type="text"
                    value={newTask.schedule}
                    onChange={(e) => setNewTask({ ...newTask, schedule: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0 2 * * * (daily at 2 AM)"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Examples: 0 2 * * * (daily at 2 AM), 0 0 * * 0 (weekly on Sunday), 0 0 1 * * (monthly on 1st)
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={newTask.enabled}
                    onChange={(e) => setNewTask({ ...newTask, enabled: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="enabled" className="ml-2 block text-sm text-gray-700">
                    Enable task immediately
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCreateTask(false)}
                  className="px-4 py-2 text-gray-300 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTask}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Create Task
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Server Settings Tab Component
  function ServerSettingsTab({ server, onServerUpdate }: { server: Server, onServerUpdate: () => void }) {
    const [settings, setSettings] = useState({
      name: server.name,
      maxPlayers: server.maxPlayers,
      allocatedRam: server.allocatedRam,
      tickrate: server.tickrate || 128,
      map: server.map || 'de_dust2',
      gameMode: server.gameMode || 'competitive',
      workshopMapId: server.workshopMapId || '',
      steamAccount: server.steamAccount || '',
      customArgs: server.customArgs || ''
    })
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

    // CS2 Game Mode configurations with their command lines
    const cs2GameModes = [
      {
        id: 'competitive',
        name: 'Competitive',
        description: '5v5 competitive matches',
        commandLine: '+fox_competition_mode 1 +fox_competition_file "competition/match.json"'
      },
      {
        id: 'casual',
        name: 'Casual',
        description: '10v10 casual matches',
        commandLine: '+game_type 0 +game_mode 0'
      },
      {
        id: 'wingman',
        name: 'Wingman',
        description: '2v2 competitive matches',
        commandLine: '+game_type 0 +game_mode 2'
      },
      {
        id: 'weapons_expert',
        name: 'Weapons Expert',
        description: 'No armor, only rifles and pistols',
        commandLine: '+game_type 0 +game_mode 1 +sv_cheats 0'
      },
      {
        id: 'arms_race',
        name: 'Arms Race',
        description: 'Progressive weapon elimination',
        commandLine: '+game_type 1 +game_mode 0'
      },
      {
        id: 'demolition',
        name: 'Demolition',
        description: 'Bomb defusal with progressive weapons',
        commandLine: '+game_type 1 +game_mode 1'
      },
      {
        id: 'deathmatch',
        name: 'Deathmatch',
        description: 'Free-for-all deathmatch',
        commandLine: '+game_type 1 +game_mode 2'
      },
      {
        id: 'custom',
        name: 'Custom',
        description: 'Custom game mode',
        commandLine: '+game_type 0 +game_mode 0'
      },
      {
        id: 'guardian',
        name: 'Guardian',
        description: 'Cooperative mission mode',
        commandLine: '+game_type 1 +game_mode 3'
      },
      {
        id: 'coop',
        name: 'Co-op Strike',
        description: 'Cooperative mission mode',
        commandLine: '+game_type 1 +game_mode 4'
      },
      {
        id: 'wargames',
        name: 'Wargames',
        description: 'Various mini-games',
        commandLine: '+game_type 1 +game_mode 5'
      },
      {
        id: 'dangerzone',
        name: 'Danger Zone',
        description: 'Battle royale mode',
        commandLine: '+game_type 6 +game_mode 0'
      }
    ]

    // Popular CS2 maps
    const cs2Maps = [
      'de_dust2', 'de_mirage', 'de_inferno', 'de_overpass', 'de_vertigo', 
      'de_ancient', 'de_nuke', 'de_cache', 'de_cobblestone', 'de_train'
    ]

    const handleSave = async () => {
      setIsSaving(true)
      setSaveMessage('')
      
      try {
        const response = await fetch(`/api/servers/${server.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(settings)
        })

        if (response.ok) {
          setSaveMessage('Settings saved successfully!')
          onServerUpdate()
          setTimeout(() => setSaveMessage(''), 3000)
        } else {
          const error = await response.json()
          setSaveMessage(`Error: ${error.error}`)
        }
      } catch (error) {
        setSaveMessage(`Error: ${(error as Error).message}`)
      } finally {
        setIsSaving(false)
      }
    }

    const generateStartupCommand = () => {
      const selectedGameMode = cs2GameModes.find(mode => mode.id === settings.gameMode)
      const baseCommand = `-dedicated -console -usercon`
      
      const gameModeCommand = selectedGameMode ? selectedGameMode.commandLine : ''
      const tickrateCommand = `+sv_tickrate ${settings.tickrate}`
      const maxPlayersCommand = `+maxplayers ${settings.maxPlayers}`
      const portCommand = `+port ${server.port}`
      const rconCommand = `+rcon_port ${server.rconPort} +rcon_password ${server.rconPassword}`
      
      // Map selection - prioritize workshop map if specified
      const mapCommand = settings.workshopMapId 
        ? `+host_workshop_collection ${settings.workshopMapId}` 
        : `+map ${settings.map}`
      
      // Steam account command
      const steamAccountCommand = settings.steamAccount ? `+sv_setsteamaccount ${settings.steamAccount}` : ''
      
      // Custom arguments
      const customArgsCommand = settings.customArgs || ''
      
      return [
        baseCommand,
        gameModeCommand,
        tickrateCommand,
        maxPlayersCommand,
        portCommand,
        rconCommand,
        mapCommand,
        steamAccountCommand,
        customArgsCommand
      ].filter(Boolean).join(' ')
    }

    if (server.game !== 'CS2') {
      return (
        <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
          <h3 className="text-lg font-medium text-white mb-4">Server Settings</h3>
          <div className="text-center py-8 text-gray-400">
            <p>Advanced startup settings are currently only available for CS2 servers.</p>
            <p className="text-sm mt-2">Basic settings for {server.game} servers coming soon!</p>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Startup Configuration */}
        <div className="bg-gray-900/60 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-700/50">
          <h3 className="text-lg font-medium text-white mb-4">Startup Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Settings */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-300">Basic Settings</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Server Name</label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Max Players</label>
                <input
                  type="number"
                  min="2"
                  max="64"
                  value={settings.maxPlayers}
                  onChange={(e) => setSettings({ ...settings, maxPlayers: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Allocated RAM (MB)</label>
                <input
                  type="number"
                  min="1024"
                  max="16384"
                  step="512"
                  value={settings.allocatedRam}
                  onChange={(e) => setSettings({ ...settings, allocatedRam: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tickrate</label>
                <select
                  value={settings.tickrate}
                  onChange={(e) => setSettings({ ...settings, tickrate: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={64}>64 tick</option>
                  <option value={128}>128 tick</option>
                </select>
              </div>
            </div>

            {/* Map & Game Mode Settings */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-300">Map & Game Mode</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Map Selection</label>
                <div className="space-y-3">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="mapType"
                        checked={!settings.workshopMapId}
                        onChange={() => setSettings({ ...settings, workshopMapId: '' })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-300">Official Map</span>
                    </label>
                    <select
                      value={settings.map}
                      onChange={(e) => setSettings({ ...settings, map: e.target.value })}
                      disabled={!!settings.workshopMapId}
                      className="w-full mt-2 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    >
                      {cs2Maps.map(map => (
                        <option key={map} value={map}>{map}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="mapType"
                        checked={!!settings.workshopMapId}
                        onChange={() => setSettings({ ...settings, workshopMapId: settings.workshopMapId || '123456789' })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-300">Workshop Map</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Workshop Collection ID"
                      value={settings.workshopMapId}
                      onChange={(e) => setSettings({ ...settings, workshopMapId: e.target.value })}
                      disabled={!settings.workshopMapId}
                      className="w-full mt-2 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Get the ID from the Steam Workshop collection URL
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Game Mode</label>
                <select
                  value={settings.gameMode}
                  onChange={(e) => setSettings({ ...settings, gameMode: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {cs2GameModes.map(mode => (
                    <option key={mode.id} value={mode.id}>{mode.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {cs2GameModes.find(mode => mode.id === settings.gameMode)?.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Steam Account Token</label>
                <input
                  type="text"
                  placeholder="Optional - for server authentication"
                  value={settings.steamAccount}
                  onChange={(e) => setSettings({ ...settings, steamAccount: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Required for players to connect to your server. Get from Steam Game Server account.
                </p>
              </div>
            </div>
          </div>

          {/* Custom Arguments */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Custom Startup Arguments</label>
            <textarea
              value={settings.customArgs}
              onChange={(e) => setSettings({ ...settings, customArgs: e.target.value })}
              placeholder="Additional command line arguments..."
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">
              Advanced users only. Incorrect arguments may prevent server from starting.
            </p>
          </div>

          {/* Generated Command Preview */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Generated Startup Command</label>
            <div className="bg-gray-900 p-4 rounded-lg font-mono text-sm text-green-400 overflow-x-auto">
              {generateStartupCommand()}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              This command will be used when starting your server
            </p>
          </div>

          {/* Save Button */}
          <div className="mt-6 flex justify-between items-center">
            <div>
              {saveMessage && (
                <p className={`text-sm ${saveMessage.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                  {saveMessage}
                </p>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-gray-900/60 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-700/50">
          <h3 className="text-lg font-medium text-white mb-4">Danger Zone</h3>
          <div className="p-4 bg-red-900/30 rounded-lg border border-red-700/50">
            <h4 className="font-medium text-red-400">Dangerous Actions</h4>
            <p className="text-sm text-red-300 mb-4">
              These actions are irreversible and will affect your server.
            </p>
            <div className="space-x-4">
              <button
                onClick={handleReinstall}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Reinstall Server
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Server
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Only show Steam Updates tab for Steam-based games
  const isSteamGame = server?.game === 'CS2' || server?.game === 'RUST'
  
  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'console', name: 'Web Console', icon: Terminal },
    ...(isSteamGame ? [{ id: 'updates', name: 'Steam Updates', icon: RotateCcw }] : []),
    { id: 'tasks', name: 'Scheduled Tasks', icon: Clock },
    { id: 'settings', name: 'Settings', icon: Settings }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-sm shadow-sm border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="mr-4 text-gray-300 hover:text-white transition-colors"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-white">{server.name}</h1>
              <div className="ml-4 flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  stats?.status === 'online' ? 'bg-green-500' : 
                  stats?.status === 'offline' ? 'bg-gray-400' : 
                  server?.game === 'CS2' && !isCS2Ready ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-300 capitalize">
                  {server?.game === 'CS2' && !isCS2Ready ? 'Downloading CS2...' : 
                   stats?.status || 'Unknown'}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleServerAction('start')}
                disabled={
                  stats?.status === 'online' || 
                  isActionLoading || 
                  (server?.game === 'CS2' && !isCS2Ready)
                }
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isActionLoading ? 'Starting...' : 'Start'}
              </button>
              <button
                onClick={() => handleServerAction('stop')}
                disabled={stats?.status === 'offline' || isActionLoading}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isActionLoading ? 'Stopping...' : 'Stop'}
              </button>
              <button
                onClick={() => handleServerAction('restart')}
                disabled={isActionLoading}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isActionLoading ? 'Restarting...' : 'Restart'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-400 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                  }`}
                >
                  <IconComponent className="w-4 h-4 mr-2 inline" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Server Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-900/60 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-700/50">
                <h3 className="text-lg font-medium text-white mb-2">Players</h3>
                <div className="text-3xl font-bold text-blue-400">
                  {stats?.playerCount || 0} / {stats?.maxPlayers || server.maxPlayers}
                </div>
              </div>
              
              <div className="bg-gray-900/60 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-700/50">
                <h3 className="text-lg font-medium text-white mb-2">CPU Usage</h3>
                <div className="text-3xl font-bold text-green-400">
                  {stats?.cpuUsage || 0}%
                </div>
              </div>
              
              <div className="bg-gray-900/60 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-700/50">
                <h3 className="text-lg font-medium text-white mb-2">Memory</h3>
                <div className="text-3xl font-bold text-purple-400">
                  {stats?.memoryUsed ? `${Math.round(stats.memoryUsed / 1024 / 1024)}MB` : '0MB'}
                </div>
                <div className="text-sm text-gray-300">
                  of {Math.round(server.allocatedRam / 1024)}MB
                </div>
              </div>
              
              <div className="bg-gray-900/60 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-700/50">
                <h3 className="text-lg font-medium text-white mb-2">Uptime</h3>
                <div className="text-3xl font-bold text-indigo-400">
                  {stats?.uptime || 'Unknown'}
                </div>
              </div>
            </div>

            {/* Connection Info */}
            <div className="bg-gray-900/60 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-700/50">
              <h3 className="text-lg font-medium text-white mb-4">Connection Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Server Address</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-gray-800/80 rounded-lg font-mono text-sm text-gray-100 border border-gray-600/50">
                      {server.host || 'localhost'}:{server.port}
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(`${server.host || 'localhost'}:${server.port}`)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">RCON Port</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-gray-800/80 rounded-lg font-mono text-sm text-gray-100 border border-gray-600/50">
                      {server.host || 'localhost'}:{server.rconPort}
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(`${server.host || 'localhost'}:${server.rconPort}`)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">RCON Password</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-gray-800/80 rounded-lg font-mono text-sm text-gray-100 border border-gray-600/50">
                      {server.rconPassword || 'changeme'}
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(server.rconPassword || 'changeme')}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">FTP Path</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-gray-800/80 rounded-lg font-mono text-sm text-gray-100 border border-gray-600/50">
                      {server.ftpPath || 'Not configured'}
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(server.ftpPath || 'Not configured')}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Server Configuration */}
            <div className="bg-gray-900/60 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-700/50">
              <h3 className="text-lg font-medium text-white mb-4">Server Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Game Type</label>
                  <div className="text-sm text-white">{server.game}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Max Players</label>
                  <div className="text-sm text-white">{server.maxPlayers}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Allocated RAM</label>
                  <div className="text-sm text-white">{server.allocatedRam}MB</div>
                </div>
                {server.game === 'CS2' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Tickrate</label>
                      <div className="text-sm text-white">{server.tickrate || 128}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Map</label>
                      <div className="text-sm text-white">{server.map || 'de_dust2'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Game Mode</label>
                      <div className="text-sm text-white">{server.gameMode || 'competitive'}</div>
                    </div>
                  </>
                )}
              </div>
              
              {/* Generated Startup Command for CS2 */}
              {server.game === 'CS2' && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Generated Startup Command</label>
                  <div className="flex items-start gap-2">
                    <div className="flex-1 bg-gray-800/80 p-3 rounded-lg font-mono text-sm text-green-400 border border-gray-600/50 overflow-x-auto">
                      {(() => {
                        // CS2 Game Mode configurations with their command lines
                        const cs2GameModes = [
                          {
                            id: 'competitive',
                            name: 'Competitive',
                            commandLine: '+fox_competition_mode 1 +fox_competition_file "competition/match.json"'
                          },
                          {
                            id: 'casual',
                            name: 'Casual',
                            commandLine: '+game_type 0 +game_mode 0'
                          },
                          {
                            id: 'wingman',
                            name: 'Wingman',
                            commandLine: '+game_type 0 +game_mode 2'
                          },
                          {
                            id: 'weapons_expert',
                            name: 'Weapons Expert',
                            commandLine: '+game_type 0 +game_mode 1 +sv_cheats 0'
                          },
                          {
                            id: 'arms_race',
                            name: 'Arms Race',
                            commandLine: '+game_type 1 +game_mode 0'
                          },
                          {
                            id: 'demolition',
                            name: 'Demolition',
                            commandLine: '+game_type 1 +game_mode 1'
                          },
                          {
                            id: 'deathmatch',
                            name: 'Deathmatch',
                            commandLine: '+game_type 1 +game_mode 2'
                          },
                          {
                            id: 'custom',
                            name: 'Custom',
                            commandLine: '+game_type 0 +game_mode 0'
                          },
                          {
                            id: 'guardian',
                            name: 'Guardian',
                            commandLine: '+game_type 1 +game_mode 3'
                          },
                          {
                            id: 'coop',
                            name: 'Co-op Strike',
                            commandLine: '+game_type 1 +game_mode 4'
                          },
                          {
                            id: 'wargames',
                            name: 'Wargames',
                            commandLine: '+game_type 1 +game_mode 5'
                          },
                          {
                            id: 'dangerzone',
                            name: 'Danger Zone',
                            commandLine: '+game_type 6 +game_mode 0'
                          }
                        ]

                        const selectedGameMode = cs2GameModes.find(mode => mode.id === (server.gameMode || 'competitive'))
                        const baseCommand = `-dedicated -console -usercon`
                        
                        const gameModeCommand = selectedGameMode ? selectedGameMode.commandLine : ''
                        const tickrateCommand = `+sv_tickrate ${server.tickrate || 128}`
                        const maxPlayersCommand = `+maxplayers ${server.maxPlayers || 10}`
                        const portCommand = `+port ${server.port}`
                        const rconCommand = `+rcon_port ${server.rconPort} +rcon_password ${server.rconPassword || 'changeme'}`
                        
                        // Map selection - prioritize workshop map if specified
                        const mapCommand = server.workshopMapId 
                          ? `+host_workshop_collection ${server.workshopMapId}` 
                          : `+map ${server.map || 'de_dust2'}`
                        
                        // Steam account command
                        const steamAccountCommand = server.steamAccount ? `+sv_setsteamaccount ${server.steamAccount}` : ''
                        
                        // Custom arguments
                        const customArgsCommand = server.customArgs || ''
                        
                        return [
                          baseCommand,
                          gameModeCommand,
                          tickrateCommand,
                          maxPlayersCommand,
                          portCommand,
                          rconCommand,
                          mapCommand,
                          steamAccountCommand,
                          customArgsCommand
                        ].filter(Boolean).join(' ')
                      })()}
                    </div>
                    <button
                      onClick={() => {
                        const command = (() => {
                          const cs2GameModes = [
                            { id: 'competitive', commandLine: '+fox_competition_mode 1 +fox_competition_file "competition/match.json"' },
                            { id: 'casual', commandLine: '+game_type 0 +game_mode 0' },
                            { id: 'wingman', commandLine: '+game_type 0 +game_mode 2' },
                            { id: 'weapons_expert', commandLine: '+game_type 0 +game_mode 1 +sv_cheats 0' },
                            { id: 'arms_race', commandLine: '+game_type 1 +game_mode 0' },
                            { id: 'demolition', commandLine: '+game_type 1 +game_mode 1' },
                            { id: 'deathmatch', commandLine: '+game_type 1 +game_mode 2' },
                            { id: 'custom', commandLine: '+game_type 0 +game_mode 0' },
                            { id: 'guardian', commandLine: '+game_type 1 +game_mode 3' },
                            { id: 'coop', commandLine: '+game_type 1 +game_mode 4' },
                            { id: 'wargames', commandLine: '+game_type 1 +game_mode 5' },
                            { id: 'dangerzone', commandLine: '+game_type 6 +game_mode 0' }
                          ]
                          const selectedGameMode = cs2GameModes.find(mode => mode.id === (server.gameMode || 'competitive'))
                          const baseCommand = `-dedicated -console -usercon`
                          const gameModeCommand = selectedGameMode ? selectedGameMode.commandLine : ''
                          const tickrateCommand = `+sv_tickrate ${server.tickrate || 128}`
                          const maxPlayersCommand = `+maxplayers ${server.maxPlayers || 10}`
                          const portCommand = `+port ${server.port}`
                          const rconCommand = `+rcon_port ${server.rconPort} +rcon_password ${server.rconPassword || 'changeme'}`
                          const mapCommand = server.workshopMapId 
                            ? `+host_workshop_collection ${server.workshopMapId}` 
                            : `+map ${server.map || 'de_dust2'}`
                          const steamAccountCommand = server.steamAccount ? `+sv_setsteamaccount ${server.steamAccount}` : ''
                          const customArgsCommand = server.customArgs || ''
                          return [
                            baseCommand,
                            gameModeCommand,
                            tickrateCommand,
                            maxPlayersCommand,
                            portCommand,
                            rconCommand,
                            mapCommand,
                            steamAccountCommand,
                            customArgsCommand
                          ].filter(Boolean).join(' ')
                        })()
                        navigator.clipboard.writeText(command)
                      }}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      title="Copy startup command to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    This command is used when starting your CS2 server
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'console' && (
          <ConsoleTab server={server} refreshTrigger={consoleRefreshTrigger} />
        )}

        {activeTab === 'updates' && (
          <SteamUpdatesTab server={server} />
        )}

        {activeTab === 'tasks' && (
          <div className="bg-gray-900/60 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-700/50">
            <h3 className="text-lg font-medium text-white mb-4">Scheduled Tasks</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600/50">
                <h4 className="font-medium text-white">Steam Updates</h4>
                <p className="text-sm text-gray-300 mb-3">
                  Schedule automatic Steam updates for your server.
                </p>
                <div className="text-sm text-gray-400">Feature coming soon!</div>
              </div>
              
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600/50">
                <h4 className="font-medium text-white">Map Rotation</h4>
                <p className="text-sm text-gray-300 mb-3">
                  Schedule map changes for supported games.
                </p>
                <div className="text-sm text-gray-400">Feature coming soon!</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <ServerSettingsTab server={server} onServerUpdate={fetchServerDetails} />
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow border border-gray-700-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-200 hover:text-white"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
