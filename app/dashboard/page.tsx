'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import ServerCard from '@/components/ServerCard'
import ServerModal from '@/components/ServerModal'
import FTPCredentials from '@/components/FTPCredentials'
import { Server } from '@prisma/client'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingServer, setEditingServer] = useState<Server | null>(null)
  
  const { data: servers, error, mutate } = useSWR<Server[]>('/api/servers', fetcher)

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  const handleCreateServer = () => {
    setEditingServer(null)
    setIsModalOpen(true)
  }

  const handleEditServer = (server: Server) => {
    setEditingServer(server)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingServer(null)
    mutate()
  }

  const handleLinkAllFTP = async () => {
    try {
      const response = await fetch('/api/servers/link-all-ftp', {
        method: 'POST'
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(`Successfully linked ${result.linked} out of ${result.total} servers to FTP!`)
        mutate() // Refresh server data
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert(`Error: ${(error as Error).message}`)
    }
  }

  const handleDeleteServer = async (serverId: string) => {
    if (!confirm('Are you sure you want to delete this server?')) return

    try {
      const response = await fetch(`/api/servers/${serverId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        mutate()
      }
    } catch (error) {
      console.error('Error deleting server:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">GameControl</h1>
              <p className="text-gray-400 mt-1">Welcome back, {session?.user?.name || session?.user?.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* FTP Credentials Section */}
        <div className="mb-8">
          <FTPCredentials />
        </div>

        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-white">Your Servers</h2>
          <div className="flex gap-3">
            <button
              onClick={handleLinkAllFTP}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Link to FTP
            </button>
            <button
              onClick={handleCreateServer}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Server
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">
            Failed to load servers. Please try again.
          </div>
        )}

        {!servers && !error && (
          <div className="text-center text-gray-400 py-12">
            Loading servers...
          </div>
        )}

        {servers && servers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">No servers yet</div>
            <p className="text-gray-500 mb-6">Get started by creating your first game server</p>
            <button
              onClick={handleCreateServer}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-colors"
            >
              Create Your First Server
            </button>
          </div>
        )}

        {servers && servers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servers.map((server) => (
              <ServerCard
                key={server.id}
                server={server}
                onEdit={handleEditServer}
                onDelete={handleDeleteServer}
                onRefresh={mutate}
              />
            ))}
          </div>
        )}
      </main>

      {/* Server Modal */}
      {isModalOpen && (
        <ServerModal
          server={editingServer}
          onClose={handleModalClose}
        />
      )}
    </div>
  )
}

