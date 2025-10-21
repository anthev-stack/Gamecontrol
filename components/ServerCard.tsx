'use client'

import { Server, GameType, ServerStatus } from '@prisma/client'
import { useState } from 'react'
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
  const router = useRouter()

  const gameIcons: Record<GameType, React.ComponentType<{ className?: string }>> = {
    CS2: Target,
    MINECRAFT: Axe,
    RUST: Wrench,
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
            <span className={`w-3 h-3 rounded-full ${statusColors[server.status]} animate-pulse`}></span>
            <span className="text-sm text-gray-300">{server.status}</span>
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
            <button
              onClick={() => handleStatusChange('start')}
              disabled={isLoading || !server.host}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={!server.host ? 'Server must be deployed to VM first' : ''}
            >
              Start
            </button>
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
