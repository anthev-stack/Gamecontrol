'use client'

import { Server, GameType, ServerStatus } from '@prisma/client'
import { useState } from 'react'

interface ServerCardProps {
  server: Server
  onEdit: (server: Server) => void
  onDelete: (serverId: string) => void
  onRefresh: () => void
}

export default function ServerCard({ server, onEdit, onDelete, onRefresh }: ServerCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const gameIcons: Record<GameType, string> = {
    CS2: '🎯',
    MINECRAFT: '⛏️',
    RUST: '🔧',
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

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{gameIcons[server.game]}</span>
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
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Host:</span>
            <span className="text-gray-200">{server.host}:{server.port}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Max Players:</span>
            <span className="text-gray-200">{server.maxPlayers}</span>
          </div>
          {server.map && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Map:</span>
              <span className="text-gray-200">{server.map}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-3">
          {server.status === 'STOPPED' && (
            <button
              onClick={() => handleStatusChange('start')}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

        <div className="flex gap-2 pt-3 border-t border-gray-700">
          <button
            onClick={() => onEdit(server)}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Edit
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

