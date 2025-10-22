'use client'

import { Server, GameType, ServerStatus } from '@prisma/client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatRam } from '@/lib/ram-calculator'
import { Target, Axe, Wrench, Folder } from 'lucide-react'

interface ServerCardProps {
  server: Server
  onEdit: (server: Server) => void
  onDelete: (serverId: string) => void
  onRefresh: () => void
}

export default function ServerCard({ server, onEdit, onDelete, onRefresh }: ServerCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isCS2Ready, setIsCS2Ready] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const router = useRouter()

  const gameIcons: Record<GameType, React.ComponentType<{ className?: string }>> = {
    CS2: Target,
    MINECRAFT: Axe,
    RUST: Wrench,
  }

  // Check if CS2 server is ready (download complete)
  useEffect(() => {
    if (server.game === 'CS2') {
      checkCS2Ready()
      trackDownloadProgress()
      
      // Poll for progress every 2 seconds
      const interval = setInterval(() => {
        if (!isCS2Ready) {
          trackDownloadProgress()
        }
      }, 2000)
      
      return () => clearInterval(interval)
    }
  }, [server.game, server.id, isCS2Ready])

  // Track download progress for CS2 servers
  const trackDownloadProgress = async () => {
    if (server.game !== 'CS2' || isCS2Ready) return

    console.log('📊 Dashboard: Tracking download progress for CS2 server', server.id) // Debug log

    try {
      // First, check if the container is still running or has exited
      const containerResponse = await fetch(`/api/servers/${server.containerId}`)
      console.log('📊 Dashboard: Container status response:', containerResponse.status) // Debug log
      
      if (containerResponse.ok) {
        const containerData = await containerResponse.json()
        console.log('📊 Dashboard: Container status:', containerData) // Debug log
        
        // If container has exited, mark download as complete
        if (containerData.State && containerData.State.Status === 'exited') {
          console.log('📊 Dashboard: Container has exited, marking download complete') // Debug log
          setDownloadProgress(100)
          return
        }
      } else if (containerResponse.status === 404) {
        // Container no longer exists - check logs to see if download actually completed
        console.log('📊 Dashboard: Container no longer exists (404), checking logs for completion') // Debug log
        
        // Try to get logs to see if download completed properly
        const logsResponse = await fetch(`/api/servers/${server.id}/console/logs?tail=100`)
        if (logsResponse.ok) {
          const logsData = await logsResponse.json()
          const logsString = logsData.logs || ''
          const logs = logsString.split('\n').filter((log: string) => log.trim() !== '')
          
          // Check if we see completion messages
          const hasCompletionMessage = logs.some((log: string) => 
            log.includes('Success! App') || 
            log.includes('fully installed') || 
            log.includes('CS2 download complete')
          )
          
          if (hasCompletionMessage) {
            console.log('📊 Dashboard: Found completion message in logs, marking download complete') // Debug log
            setDownloadProgress(100)
            return
          } else {
            console.log('📊 Dashboard: No completion message found, download may still be in progress') // Debug log
            // Don't mark as complete yet, continue with normal progress tracking
          }
        }
      }
      
      const response = await fetch(`/api/servers/${server.id}/console/logs?tail=50`)
      console.log('📊 Dashboard: API response status:', response.status) // Debug log
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Dashboard: API response data:', data) // Debug log
        
        const logsString = data.logs || ''
        console.log('📊 Dashboard: Raw logs string:', logsString) // Debug log
        
        const logs = logsString.split('\n').filter((log: string) => log.trim() !== '')
        console.log('📊 Dashboard: Parsed logs array:', logs) // Debug log
        
        // Look for Steam update progress in logs - both old and new formats
        const progressLogs = logs.filter((log: string) => 
          log.includes('[ 0%]') || 
          log.includes('[10%]') || 
          log.includes('[20%]') || 
          log.includes('[30%]') || 
          log.includes('[40%]') || 
          log.includes('[50%]') || 
          log.includes('[60%]') || 
          log.includes('[70%]') || 
          log.includes('[80%]') || 
          log.includes('[90%]') || 
          log.includes('[100%]') ||
          log.includes('progress:') ||
          log.includes('Update state') ||
          log.includes('downloading') ||
          log.includes('verifying') ||
          log.includes('committing') ||
          log.includes('Success! App') ||
          log.includes('fully installed') ||
          log.includes('Download complete') ||
          log.includes('Update complete') ||
          log.includes('CS2 download complete')
        )
        console.log('📊 Dashboard: Found progress logs:', progressLogs.length, progressLogs) // Debug log

        if (progressLogs.length > 0) {
          const latestLog = progressLogs[progressLogs.length - 1]
          console.log('📊 Dashboard progress log:', latestLog) // Debug log
          
          // Check for completion messages first
          if (latestLog.includes('Success! App') || 
              latestLog.includes('fully installed') || 
              latestLog.includes('CS2 download complete')) {
            console.log('📊 Dashboard progress complete: 100%') // Debug log
            setDownloadProgress(100)
          } else {
            // Try new steamcmd progress format first: "progress: 0.59 (331282603 / 56099402942)"
            const newProgressMatch = latestLog.match(/progress: (\d+\.?\d*) \((\d+) \/ (\d+)\)/)
            if (newProgressMatch) {
              const progress = parseFloat(newProgressMatch[1])
              const roundedProgress = Math.round(progress)
              console.log('📊 Dashboard progress update:', roundedProgress + '%') // Debug log
              setDownloadProgress(roundedProgress)
            } else {
              // Fallback to old format: "[59%]"
              const percentMatch = latestLog.match(/\[(\d+)%\]/)
              if (percentMatch) {
                const progress = parseInt(percentMatch[1])
                console.log('📊 Dashboard progress update (old format):', progress + '%') // Debug log
                setDownloadProgress(progress)
              } else if (latestLog.includes('Download complete') || latestLog.includes('Update complete')) {
                console.log('📊 Dashboard progress complete: 100%') // Debug log
                setDownloadProgress(100)
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('📊 Dashboard: Error tracking download progress:', err)
    }
  }

  const checkCS2Ready = async () => {
    try {
      const response = await fetch(`/api/servers/${server.id}`)
      if (response.ok) {
        const data = await response.json()
        // If container is stopped/exited, CS2 download is complete
        setIsCS2Ready(data.status === 'stopped' || data.status === 'exited')
      }
    } catch (err) {
      console.error('Error checking CS2 ready status:', err)
    }
  }

  const statusColors: Record<ServerStatus, string> = {
    RUNNING: 'bg-green-500',
    STOPPED: 'bg-gray-500',
    STARTING: 'bg-yellow-500',
    STOPPING: 'bg-orange-500',
    ERROR: 'bg-red-500',
  }

  const handleStatusChange = async (action: 'start' | 'stop' | 'restart') => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/servers/${server.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error changing server status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Render game-specific details
  const renderGameDetails = () => {
    if (server.game === 'CS2') {
      return (
        <>
          {server.map && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Map:</span>
              <span className="text-gray-200">{server.map}</span>
            </div>
          )}
          {server.gameMode && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Mode:</span>
              <span className="text-gray-200 capitalize">{server.gameMode}</span>
            </div>
          )}
          {server.tickrate && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Tickrate:</span>
              <span className="text-gray-200">{server.tickrate} tick</span>
            </div>
          )}
        </>
      )
    } else if (server.game === 'MINECRAFT') {
      return (
        <>
          {server.difficulty && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Difficulty:</span>
              <span className="text-gray-200 capitalize">{server.difficulty}</span>
            </div>
          )}
          {server.worldType && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">World Type:</span>
              <span className="text-gray-200 capitalize">{server.worldType}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">PvP:</span>
            <span className="text-gray-200">{server.pvp ? 'Enabled' : 'Disabled'}</span>
          </div>
          {server.hardcore && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Mode:</span>
              <span className="text-red-400">Hardcore</span>
            </div>
          )}
        </>
      )
    } else if (server.game === 'RUST') {
      return (
        <>
          {server.worldSize && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">World Size:</span>
              <span className="text-gray-200">{server.worldSize}</span>
            </div>
          )}
          {server.worldSeed && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Seed:</span>
              <span className="text-gray-200 font-mono text-xs">{server.worldSeed}</span>
            </div>
          )}
        </>
      )
    }
  }

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden border border-gray-700/50 hover:border-gray-600/70 transition-colors">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="text-blue-400">
              {(() => {
                const IconComponent = gameIcons[server.game]
                return <IconComponent className="w-8 h-8" />
              })()}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{server.name}</h3>
              <span className="text-sm text-gray-400">{server.game}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${
              server.game === 'CS2' && !isCS2Ready ? 'bg-yellow-500' : 
              statusColors[server.status]
            } animate-pulse`}></span>
            <span className="text-sm text-gray-300">
              {server.game === 'CS2' && !isCS2Ready ? 'Downloading CS2...' : server.status}
            </span>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {server.host && server.port ? (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Server:</span>
              <span className="text-gray-200 font-mono">{server.host}:{server.port}</span>
            </div>
          ) : (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Server:</span>
              <span className="text-yellow-400 text-xs">Pending VM allocation</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Max Players:</span>
            <span className="text-gray-200">{server.maxPlayers}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">RAM:</span>
            <span className="text-gray-200">{formatRam(server.allocatedRam || 2048)}</span>
          </div>
          {renderGameDetails()}
        </div>

        <div className="flex gap-2 mb-3">
          {server.status === 'STOPPED' && (
            <div className="flex-1">
              <button
                onClick={() => handleStatusChange('start')}
                disabled={isLoading || !server.host || (server.game === 'CS2' && !isCS2Ready)}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={
                  !server.host ? 'Server must be deployed to VM first' :
                  server.game === 'CS2' && !isCS2Ready ? 'CS2 download in progress...' : ''
                }
              >
                {server.game === 'CS2' && !isCS2Ready ? 'Downloading...' : 'Start'}
              </button>
              
              {/* CS2 Download Progress Bar */}
              {server.game === 'CS2' && !isCS2Ready && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Downloading CS2...</span>
                    <span>{downloadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${downloadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}
          {server.status === 'RUNNING' && (
            <>
              <button
                onClick={() => handleStatusChange('restart')}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Restart
              </button>
              <button
                onClick={() => handleStatusChange('stop')}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Stop
              </button>
            </>
          )}
          {(server.status === 'STARTING' || server.status === 'STOPPING') && (
            <button
              disabled
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg cursor-not-allowed"
            >
              {server.status}...
            </button>
          )}
        </div>

        {server.ftpPath && (
          <div className="mb-3 pt-3 border-t border-gray-700">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-gray-400">
                <Folder className="w-3 h-3" />
                FTP Path:
              </div>
              <code className="text-blue-400 bg-gray-800/80 px-2 py-1 rounded border border-gray-600/50">
                /{server.ftpPath}
              </code>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-3 border-t border-gray-700">
          <button
            onClick={() => router.push(`/dashboard/${server.id}`)}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Configuration
          </button>
          <button
            onClick={() => onDelete(server.id)}
            className="px-4 py-2 bg-gray-700 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
