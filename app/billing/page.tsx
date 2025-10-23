'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  CreditCard, 
  Users, 
  Share2, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Trash2,
  Copy,
  Mail
} from 'lucide-react'

interface BillingItem {
  id: string
  name: string
  amount: number
  status: 'paid' | 'pending' | 'overdue'
  dueDate: string
  sharedWith?: string[]
  isShared: boolean
}

export default function BillingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedServer, setSelectedServer] = useState<string | null>(null)
  const [shareEmail, setShareEmail] = useState('')

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

  // Mock billing data
  const billingItems: BillingItem[] = [
    {
      id: '1',
      name: 'CS2 Server - Premium',
      amount: 24.99,
      status: 'paid',
      dueDate: '2024-11-15',
      sharedWith: ['friend@example.com'],
      isShared: true
    },
    {
      id: '2',
      name: 'Minecraft Server - Standard',
      amount: 12.99,
      status: 'pending',
      dueDate: '2024-11-20',
      isShared: false
    },
    {
      id: '3',
      name: 'Rust Server - Premium',
      amount: 19.99,
      status: 'paid',
      dueDate: '2024-11-10',
      sharedWith: ['gamer@example.com', 'teammate@example.com'],
      isShared: true
    }
  ]

  const totalAmount = billingItems.reduce((sum, item) => sum + item.amount, 0)
  const sharedAmount = billingItems
    .filter(item => item.isShared)
    .reduce((sum, item) => sum + (item.amount / (item.sharedWith?.length || 1) + 1), 0)
  const yourAmount = totalAmount - sharedAmount

  const handleShareServer = () => {
    if (selectedServer && shareEmail) {
      // Mock share functionality
      console.log(`Sharing server ${selectedServer} with ${shareEmail}`)
      setShowShareModal(false)
      setShareEmail('')
      setSelectedServer(null)
    }
  }

  const copyShareLink = (serverId: string) => {
    const shareLink = `${window.location.origin}/billing/share/${serverId}`
    navigator.clipboard.writeText(shareLink)
    // You could add a toast notification here
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
              <p className="text-gray-400 mt-1">Billing & Cost Sharing</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Billing Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total This Month</p>
                <p className="text-2xl font-bold text-white">${totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Shared Costs</p>
                <p className="text-2xl font-bold text-white">${sharedAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-purple-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Your Portion</p>
                <p className="text-2xl font-bold text-white">${yourAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Sharing Feature */}
        <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50 mb-8">
          <div className="flex items-center mb-4">
            <Share2 className="h-6 w-6 text-blue-400 mr-2" />
            <h2 className="text-xl font-bold text-white">Cost Sharing</h2>
            <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">New Feature</span>
          </div>
          <p className="text-gray-300 mb-4">
            Share server costs with friends! Create an invite link and split the bill 50/50. 
            Both users get full access to the server and pay their share.
          </p>
          <button
            onClick={() => setShowShareModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Share Server Cost
          </button>
        </div>

        {/* Billing Items */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50">
          <div className="px-6 py-4 border-b border-gray-700/50">
            <h2 className="text-xl font-bold text-white">Billing History</h2>
          </div>
          <div className="divide-y divide-gray-700/50">
            {billingItems.map((item) => (
              <div key={item.id} className="p-6 hover:bg-gray-700/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                      {item.isShared && (
                        <div className="ml-3 flex items-center">
                          <Users className="h-4 w-4 text-blue-400 mr-1" />
                          <span className="text-sm text-blue-400">Shared</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center mt-2 space-x-4">
                      <div className="flex items-center text-gray-400">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span className="text-sm">Due: {item.dueDate}</span>
                      </div>
                      <div className="flex items-center">
                        {item.status === 'paid' && (
                          <CheckCircle className="h-4 w-4 text-green-400 mr-1" />
                        )}
                        {item.status === 'pending' && (
                          <AlertCircle className="h-4 w-4 text-yellow-400 mr-1" />
                        )}
                        {item.status === 'overdue' && (
                          <AlertCircle className="h-4 w-4 text-red-400 mr-1" />
                        )}
                        <span className={`text-sm capitalize ${
                          item.status === 'paid' ? 'text-green-400' :
                          item.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                    {item.sharedWith && item.sharedWith.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-400">Shared with:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {item.sharedWith.map((email, index) => (
                            <span key={index} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                              {email}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">${item.amount.toFixed(2)}</p>
                      {item.isShared && (
                        <p className="text-sm text-gray-400">
                          Your share: ${(item.amount / (item.sharedWith?.length || 1) + 1).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {item.isShared && (
                        <button
                          onClick={() => copyShareLink(item.id)}
                          className="p-2 text-gray-400 hover:text-white transition-colors"
                          title="Copy share link"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        title="Remove sharing"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mt-8 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50">
          <div className="px-6 py-4 border-b border-gray-700/50">
            <h2 className="text-xl font-bold text-white">Payment Methods</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CreditCard className="h-6 w-6 text-gray-400 mr-3" />
                <div>
                  <p className="text-white font-medium">•••• •••• •••• 4242</p>
                  <p className="text-gray-400 text-sm">Expires 12/25</p>
                </div>
              </div>
              <button className="text-blue-400 hover:text-blue-300 transition-colors">
                Update
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Share Server Cost</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Server
                </label>
                <select
                  value={selectedServer || ''}
                  onChange={(e) => setSelectedServer(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="">Choose a server...</option>
                  <option value="cs2-1">CS2 Server - Premium</option>
                  <option value="minecraft-1">Minecraft Server - Standard</option>
                  <option value="rust-1">Rust Server - Premium</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Friend's Email
                </label>
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="friend@example.com"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3">
                <p className="text-sm text-blue-300">
                  <strong>How it works:</strong> Your friend will receive an invite link. 
                  Once they accept, you'll both pay 50% of the server cost and get full access.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleShareServer}
                disabled={!selectedServer || !shareEmail}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
