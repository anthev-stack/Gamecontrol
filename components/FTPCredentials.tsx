'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, AlertTriangle, RotateCcw, Lightbulb, Folder, FolderOpen } from 'lucide-react'

interface FTPInfo {
  enabled: boolean
  username?: string
  host?: string
  port?: number
  servers?: string[]
  hasPassword?: boolean
  message?: string
}

export default function FTPCredentials() {
  const [ftpInfo, setFtpInfo] = useState<FTPInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [setupLoading, setSetupLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  useEffect(() => {
    fetchFTPInfo()
  }, [])

  const fetchFTPInfo = async () => {
    try {
      const response = await fetch('/api/ftp/credentials')
      const data = await response.json()
      setFtpInfo(data)
    } catch (error) {
      console.error('Error fetching FTP info:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSetupFTP = async () => {
    setSetupLoading(true)
    try {
      const response = await fetch('/api/ftp/credentials', {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        setNewPassword(data.password)
        setShowPassword(true)
        await fetchFTPInfo()
      } else {
        alert(data.error || 'Failed to setup FTP')
      }
    } catch (error) {
      alert('Error setting up FTP')
    } finally {
      setSetupLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!confirm('Are you sure you want to reset your FTP password? This will disconnect any active FTP sessions.')) {
      return
    }

    setResetLoading(true)
    try {
      const response = await fetch('/api/ftp/reset-password', {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        setNewPassword(data.newPassword)
        setShowPassword(true)
        alert('Password reset successfully! Make sure to save your new password.')
      } else {
        alert(data.error || 'Failed to reset password')
      }
    } catch (error) {
      alert('Error resetting password')
    } finally {
      setResetLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    alert(`${label} copied to clipboard!`)
  }

  const downloadFileZillaConfig = () => {
    if (!ftpInfo?.username || !ftpInfo?.host) return

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<FileZilla3 version="3.60.0" platform="windows">
  <Servers>
    <Server>
      <Host>${ftpInfo.host}</Host>
      <Port>${ftpInfo.port || 21}</Port>
      <Protocol>0</Protocol>
      <Type>0</Type>
      <User>${ftpInfo.username}</User>
      <Pass encoding="base64"></Pass>
      <Logontype>1</Logontype>
      <Name>GameControl - ${ftpInfo.username}</Name>
      <Comments>GameControl FTP Server</Comments>
      <LocalDir></LocalDir>
      <RemoteDir></RemoteDir>
      <SyncBrowsing>0</SyncBrowsing>
      <DirectoryComparison>0</DirectoryComparison>
    </Server>
  </Servers>
</FileZilla3>`

    const blob = new Blob([xml], { type: 'text/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'gamecontrol-ftp.xml'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-gray-700/50">
        <p className="text-gray-400">Loading FTP information...</p>
      </div>
    )
  }

  if (!ftpInfo?.enabled || !ftpInfo?.username) {
    return (
      <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-gray-700/50">
        <div className="flex items-start gap-4">
          <div className="text-blue-400">
            <Folder className="w-10 h-10" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">FTP File Access</h3>
            <p className="text-gray-400 mb-4">
              Get FTP access to manage your server files with FileZilla or any FTP client.
            </p>
            <button
              onClick={handleSetupFTP}
              disabled={setupLoading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {setupLoading ? 'Setting up...' : 'Setup FTP Access'}
            </button>
          </div>
        </div>

        {showPassword && newPassword && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500 rounded-lg">
            <h4 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              FTP Account Created!
            </h4>
            <p className="text-sm text-gray-300 mb-3">
              <strong>Save your password now!</strong> It won't be shown again.
            </p>
            <div className="bg-gray-800/80 p-3 rounded font-mono text-sm text-green-400 border border-gray-600/50">
              Password: {newPassword}
            </div>
            <button
              onClick={() => copyToClipboard(newPassword, 'Password')}
              className="mt-2 text-sm text-blue-400 hover:text-blue-300"
            >
              📋 Copy Password
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-gray-700/50">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="text-blue-400">
            <Folder className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">FTP File Access</h3>
            <p className="text-sm text-gray-400">Manage your server files</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
          Active
        </span>
      </div>

      {showPassword && newPassword && (
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500 rounded-lg">
          <h4 className="text-yellow-400 font-semibold mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            New Password Generated!
          </h4>
          <p className="text-sm text-gray-300 mb-3">
            Your FTP password has been reset. <strong>Save it now!</strong>
          </p>
          <div className="bg-gray-800/80 p-3 rounded font-mono text-sm text-yellow-400 border border-gray-600/50">
            Password: {newPassword}
          </div>
          <button
            onClick={() => copyToClipboard(newPassword, 'Password')}
            className="mt-2 text-sm text-blue-400 hover:text-blue-300"
          >
            📋 Copy Password
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs text-gray-400 mb-1">FTP Host</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-800/80 px-4 py-2 rounded font-mono text-sm text-gray-200 border border-gray-600/50">
              {ftpInfo.host}
            </div>
            <button
              onClick={() => copyToClipboard(ftpInfo.host!, 'Host')}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
              title="Copy to clipboard"
            >
              📋
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Port</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-800/80 px-4 py-2 rounded font-mono text-sm text-gray-200 border border-gray-600/50">
              {ftpInfo.port}
            </div>
            <button
              onClick={() => copyToClipboard(ftpInfo.port!.toString(), 'Port')}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
              title="Copy to clipboard"
            >
              📋
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Username</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-800/80 px-4 py-2 rounded font-mono text-sm text-gray-200 border border-gray-600/50">
              {ftpInfo.username}
            </div>
            <button
              onClick={() => copyToClipboard(ftpInfo.username!, 'Username')}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
              title="Copy to clipboard"
            >
              📋
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Password</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-800/80 px-4 py-2 rounded font-mono text-sm text-gray-200 border border-gray-600/50">
              ••••••••••••••••
            </div>
            <button
              onClick={handleResetPassword}
              disabled={resetLoading}
              className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-sm disabled:opacity-50"
              title="Reset password"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4 mb-4">
        <h4 className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
          <FolderOpen className="w-5 h-5" />
          Your Servers
        </h4>
        <p className="text-sm text-gray-300 mb-2">
          Access your server files at: <code className="bg-gray-800/80 px-2 py-1 rounded text-blue-400 border border-gray-600/50">/servers/</code>
        </p>
        {ftpInfo.servers && ftpInfo.servers.length > 0 ? (
          <div className="text-sm text-gray-400">
            <p>Available directories:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {ftpInfo.servers.map((server) => (
                <li key={server} className="font-mono text-blue-400">/servers/{server}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            Create servers to access their files via FTP
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          onClick={downloadFileZillaConfig}
          className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          Download FileZilla Config
        </button>

        <a
          href={`ftp://${ftpInfo.username}@${ftpInfo.host}:${ftpInfo.port}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-center"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Open in FTP Client
        </a>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-4 h-4" />
          <strong>Recommended FTP Clients:</strong>
        </div>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li><a href="https://filezilla-project.org/" target="_blank" className="text-blue-400 hover:text-blue-300">FileZilla</a> (Windows, Mac, Linux)</li>
          <li><a href="https://cyberduck.io/" target="_blank" className="text-blue-400 hover:text-blue-300">Cyberduck</a> (Mac, Windows)</li>
          <li><a href="https://winscp.net/" target="_blank" className="text-blue-400 hover:text-blue-300">WinSCP</a> (Windows)</li>
        </ul>
      </div>
    </div>
  )
}

