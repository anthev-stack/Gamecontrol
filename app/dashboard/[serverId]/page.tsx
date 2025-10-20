'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Server } from '@prisma/client'

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

export default function ServerDetailPage({ params }: ServerDetailPageProps) {
  const [server, setServer] = useState<Server | null>(null)
  const [stats, setStats] = useState<ServerStats | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const serverId = params.serverId

  useEffect(() => {
    fetchServerDetails()
    fetchServerStats()
    
    // Poll for stats every 30 seconds
    const interval = setInterval(fetchServerStats, 30000)
    return () => clearInterval(interval)
  }, [serverId])

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
      }
    } catch (err) {
      console.error('Failed to fetch server stats:', err)
    }
  }

  const handleServerAction = async (action: 'start' | 'stop' | 'restart') => {
    try {
      const response = await fetch(`/api/servers/${serverId}/${action}`, {
        method: 'POST'
      })
      
      if (!response.ok) throw new Error(`Failed to ${action} server`)
      
      // Refresh stats after action
      setTimeout(fetchServerStats, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading server details...</p>
        </div>
      </div>
    )
  }

  if (error || !server) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600 mb-4">{error || 'Server not found'}</p>
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

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'console', name: 'Web Console', icon: '💻' },
    { id: 'updates', name: 'Steam Updates', icon: '🔄' },
    { id: 'tasks', name: 'Scheduled Tasks', icon: '⏰' },
    { id: 'settings', name: 'Settings', icon: '⚙️' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="mr-4 text-gray-500 hover:text-gray-700"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900">{server.name}</h1>
              <div className="ml-4 flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  stats?.status === 'online' ? 'bg-green-500' : 
                  stats?.status === 'offline' ? 'bg-gray-400' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-600 capitalize">
                  {stats?.status || 'Unknown'}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleServerAction('start')}
                disabled={stats?.status === 'online'}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start
              </button>
              <button
                onClick={() => handleServerAction('stop')}
                disabled={stats?.status === 'offline'}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Stop
              </button>
              <button
                onClick={() => handleServerAction('restart')}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
              >
                Restart
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Server Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Players</h3>
                <div className="text-3xl font-bold text-blue-600">
                  {stats?.playerCount || 0} / {stats?.maxPlayers || server.maxPlayers}
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">CPU Usage</h3>
                <div className="text-3xl font-bold text-green-600">
                  {stats?.cpuUsage || 0}%
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Memory</h3>
                <div className="text-3xl font-bold text-purple-600">
                  {stats?.memoryUsed ? `${Math.round(stats.memoryUsed / 1024 / 1024)}MB` : '0MB'}
                </div>
                <div className="text-sm text-gray-500">
                  of {Math.round(server.allocatedRam / 1024)}MB
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Uptime</h3>
                <div className="text-3xl font-bold text-indigo-600">
                  {stats?.uptime || 'Unknown'}
                </div>
              </div>
            </div>

            {/* Connection Info */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Connection Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Server Address</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg font-mono text-sm">
                    {server.host || 'localhost'}:{server.port}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">RCON Port</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg font-mono text-sm">
                    {server.host || 'localhost'}:{server.rconPort}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">RCON Password</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg font-mono text-sm">
                    {server.rconPassword || 'changeme'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">FTP Path</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg font-mono text-sm">
                    {server.ftpPath || 'Not configured'}
                  </div>
                </div>
              </div>
            </div>

            {/* Server Configuration */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Server Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Game Type</label>
                  <div className="mt-1 text-sm text-gray-900">{server.game}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Players</label>
                  <div className="mt-1 text-sm text-gray-900">{server.maxPlayers}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Allocated RAM</label>
                  <div className="mt-1 text-sm text-gray-900">{server.allocatedRam}MB</div>
                </div>
                {server.game === 'CS2' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tickrate</label>
                      <div className="mt-1 text-sm text-gray-900">{server.tickrate || 128}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Map</label>
                      <div className="mt-1 text-sm text-gray-900">{server.map || 'de_dust2'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Game Mode</label>
                      <div className="mt-1 text-sm text-gray-900">{server.gameMode || 'competitive'}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'console' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Web Console</h3>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
              <div className="text-gray-500">Console output will appear here...</div>
              <div className="text-gray-500">Feature coming soon!</div>
            </div>
          </div>
        )}

        {activeTab === 'updates' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Steam Updates</h3>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900">Manual Update</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Force update the server to the latest version. This will restart the server.
                </p>
                <button
                  onClick={handleSteamUpdate}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Update Now
                </button>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">Auto-Update Settings</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Configure automatic updates for this server.
                </p>
                <div className="text-sm text-gray-500">Feature coming soon!</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Scheduled Tasks</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">Steam Updates</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Schedule automatic Steam updates for your server.
                </p>
                <div className="text-sm text-gray-500">Feature coming soon!</div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">Map Rotation</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Schedule map changes for supported games.
                </p>
                <div className="text-sm text-gray-500">Feature coming soon!</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Server Settings</h3>
            <div className="space-y-6">
              <div className="p-4 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-900">Danger Zone</h4>
                <p className="text-sm text-red-700 mb-4">
                  These actions are irreversible and will affect your server.
                </p>
                <div className="space-x-4">
                  <button
                    onClick={handleReinstall}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
                  >
                    Reinstall Server
                  </button>
                  <button
                    onClick={handleDelete}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Delete Server
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg">
          <div className="flex items-center">
            <span className="mr-2">⚠️</span>
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
