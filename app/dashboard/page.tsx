'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import useSWR from 'swr'
import ServerCard from '@/components/ServerCard'
import ServerModal from '@/components/ServerModal'
import { Server } from '@prisma/client'
import { Plus, AlertTriangle } from 'lucide-react'
import FTPCredentials from '@/components/FTPCredentials'

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
      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Link href="/" className="text-3xl font-bold text-white hover:text-blue-300 transition-colors">
                Gamecontrol
              </Link>
              <p className="text-gray-400 mt-1">Welcome back, {session?.user?.name || session?.user?.email}</p>
            </div>
            <Link
              href="/billing"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Billing
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-900/60 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-700/50 mb-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Servers</h2>
            <div className="flex gap-3">
            <button
              onClick={handleCreateServer}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Server
            </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Failed to load servers. Please try again.
          </div>
        )}

        {!servers && !error && (
          <div className="bg-gray-900/60 backdrop-blur-sm p-12 rounded-lg shadow-lg border border-gray-700/50 text-center">
            <div className="text-gray-400">Loading servers...</div>
          </div>
        )}

        {servers && servers.length === 0 && (
          <div className="bg-gray-900/60 backdrop-blur-sm p-12 rounded-lg shadow-lg border border-gray-700/50 text-center">
            <div className="text-gray-400 text-lg mb-4">No servers yet</div>
            <p className="text-gray-500 mb-6">Get started by creating your first game server</p>
            <button
              onClick={handleCreateServer}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
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

        {/* FTP Credentials Section */}
        <div className="mt-8">
          <FTPCredentials />
        </div>
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

