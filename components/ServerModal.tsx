'use client'

import { useState, useEffect, useMemo } from 'react'
import { Server, GameType } from '@prisma/client'
import { calculateRecommendedRam, getAvailableRamOptions, formatRam } from '@/lib/ram-calculator'

interface ServerModalProps {
  server: Server | null
  onClose: () => void
}

export default function ServerModal({ server, onClose }: ServerModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    game: 'CS2' as GameType,
    maxPlayers: '10',
    allocatedRam: '2048',
    customArgs: '',
    
    // CS2 specific
    tickrate: '128',
    map: 'de_dust2',
    gameMode: 'competitive',
    workshopMapId: '',
    steamAccount: '',
    
    // Minecraft specific
    difficulty: 'normal',
    worldType: 'default',
    pvp: true,
    hardcore: false,
    spawnProtection: '16',
    allowNether: true,
    allowFlight: false,
    
    // Rust specific
    worldSize: '4000',
    worldSeed: '',
    saveInterval: '600',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Calculate RAM recommendation based on game and player count
  const ramRecommendation = useMemo(() => {
    return calculateRecommendedRam(
      formData.game,
      parseInt(formData.maxPlayers) || 10
    )
  }, [formData.game, formData.maxPlayers])

  const ramOptions = getAvailableRamOptions()

  useEffect(() => {
    if (server) {
      setFormData({
        name: server.name,
        game: server.game,
        maxPlayers: server.maxPlayers.toString(),
        allocatedRam: server.allocatedRam?.toString() || '2048',
        customArgs: server.customArgs || '',
        
        // CS2
        tickrate: server.tickrate?.toString() || '128',
        map: server.map || 'de_dust2',
        gameMode: server.gameMode || 'competitive',
        workshopMapId: server.workshopMapId || '',
        steamAccount: server.steamAccount || '',
        
        // Minecraft
        difficulty: server.difficulty || 'normal',
        worldType: server.worldType || 'default',
        pvp: server.pvp ?? true,
        hardcore: server.hardcore ?? false,
        spawnProtection: server.spawnProtection?.toString() || '16',
        allowNether: server.allowNether ?? true,
        allowFlight: server.allowFlight ?? false,
        
        // Rust
        worldSize: server.worldSize?.toString() || '4000',
        worldSeed: server.worldSeed || '',
        saveInterval: server.saveInterval?.toString() || '600',
      })
    }
  }, [server])

  // Auto-update RAM when game type or player count changes
  useEffect(() => {
    if (!server) { // Only auto-update for new servers
      setFormData(prev => ({
        ...prev,
        allocatedRam: ramRecommendation.recommended.toString()
      }))
    }
  }, [formData.game, formData.maxPlayers, server])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const url = server ? `/api/servers/${server.id}` : '/api/servers'
      const method = server ? 'PATCH' : 'POST'

      // Build payload based on game type
      const payload: any = {
        name: formData.name,
        game: formData.game,
        maxPlayers: parseInt(formData.maxPlayers),
        allocatedRam: parseInt(formData.allocatedRam),
        customArgs: formData.customArgs,
      }

      // Add game-specific fields
      if (formData.game === 'CS2') {
        payload.tickrate = parseInt(formData.tickrate)
        payload.map = formData.map
        payload.gameMode = formData.gameMode
        payload.workshopMapId = formData.workshopMapId
        payload.steamAccount = formData.steamAccount
      } else if (formData.game === 'MINECRAFT') {
        payload.difficulty = formData.difficulty
        payload.worldType = formData.worldType
        payload.pvp = formData.pvp
        payload.hardcore = formData.hardcore
        payload.spawnProtection = parseInt(formData.spawnProtection)
        payload.allowNether = formData.allowNether
        payload.allowFlight = formData.allowFlight
      } else if (formData.game === 'RUST') {
        payload.worldSize = parseInt(formData.worldSize)
        payload.worldSeed = formData.worldSeed
        payload.saveInterval = parseInt(formData.saveInterval)
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        onClose()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to save server')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const gameOptions = [
    { value: 'CS2', label: 'Counter-Strike 2' },
    { value: 'MINECRAFT', label: 'Minecraft' },
    { value: 'RUST', label: 'Rust' },
  ]

  // Check if current RAM is below minimum
  const currentRam = parseInt(formData.allocatedRam)
  const isRamBelowMin = currentRam < ramRecommendation.min
  const isRamAboveMax = currentRam > ramRecommendation.max

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">
              {server ? 'Edit Server' : 'Create New Server'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Common Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Server Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="My Awesome Server"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Game Type *
                </label>
                <select
                  required
                  value={formData.game}
                  onChange={(e) => setFormData({ ...formData, game: e.target.value as GameType })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {gameOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Players
                </label>
                <input
                  type="number"
                  value={formData.maxPlayers}
                  onChange={(e) => setFormData({ ...formData, maxPlayers: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="10"
                  min="1"
                  max="500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Allocated RAM
                </label>
                <select
                  value={formData.allocatedRam}
                  onChange={(e) => setFormData({ ...formData, allocatedRam: e.target.value })}
                  className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isRamBelowMin ? 'border-red-500' : isRamAboveMax ? 'border-yellow-500' : 'border-gray-600'
                  }`}
                >
                  {ramOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* RAM Recommendation Box */}
            <div className={`p-4 rounded-lg border ${
              isRamBelowMin 
                ? 'bg-red-500/10 border-red-500' 
                : currentRam === ramRecommendation.recommended 
                  ? 'bg-green-500/10 border-green-500'
                  : isRamAboveMax
                    ? 'bg-yellow-500/10 border-yellow-500'
                    : 'bg-blue-500/10 border-blue-500'
            }`}>
              <div className="flex items-start gap-3">
                <div className="text-2xl">
                  {isRamBelowMin ? '⚠️' : currentRam === ramRecommendation.recommended ? '✅' : isRamAboveMax ? '💰' : 'ℹ️'}
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold mb-1 ${
                    isRamBelowMin ? 'text-red-300' : isRamAboveMax ? 'text-yellow-300' : 'text-blue-300'
                  }`}>
                    {isRamBelowMin 
                      ? 'RAM Too Low' 
                      : currentRam === ramRecommendation.recommended 
                        ? 'Perfect RAM Allocation'
                        : isRamAboveMax
                          ? 'Higher Than Recommended'
                          : 'RAM Recommendation'}
                  </h4>
                  <p className="text-sm text-gray-300 mb-2">
                    {ramRecommendation.description}
                  </p>
                  <div className="text-xs text-gray-400 space-y-1">
                    <div>
                      <span className="font-medium">Minimum:</span> {formatRam(ramRecommendation.min)} • 
                      <span className="font-medium"> Recommended:</span> {formatRam(ramRecommendation.recommended)} • 
                      <span className="font-medium"> Maximum:</span> {formatRam(ramRecommendation.max)}
                    </div>
                    {ramRecommendation.note && (
                      <div className="italic">💡 {ramRecommendation.note}</div>
                    )}
                    {isRamBelowMin && (
                      <div className="text-red-400 font-medium mt-2">
                        ⚠️ Server may crash or perform poorly with insufficient RAM
                      </div>
                    )}
                    {isRamAboveMax && (
                      <div className="text-yellow-400 font-medium mt-2">
                        💸 You're allocating more RAM than typically needed
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* CS2 Specific Fields */}
            {formData.game === 'CS2' && (
              <>
                <div className="border-t border-gray-700 pt-4 mt-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Counter-Strike 2 Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Map
                      </label>
                      <select
                        value={formData.map}
                        onChange={(e) => setFormData({ ...formData, map: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="de_dust2">Dust 2</option>
                        <option value="de_mirage">Mirage</option>
                        <option value="de_inferno">Inferno</option>
                        <option value="de_nuke">Nuke</option>
                        <option value="de_overpass">Overpass</option>
                        <option value="de_vertigo">Vertigo</option>
                        <option value="de_ancient">Ancient</option>
                        <option value="de_anubis">Anubis</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Game Mode
                      </label>
                      <select
                        value={formData.gameMode}
                        onChange={(e) => setFormData({ ...formData, gameMode: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="competitive">Competitive</option>
                        <option value="casual">Casual</option>
                        <option value="wingman">Wingman</option>
                        <option value="weapons_expert">Weapons Expert</option>
                        <option value="arms_race">Arms Race</option>
                        <option value="demolition">Demolition</option>
                        <option value="deathmatch">Deathmatch</option>
                        <option value="custom">Custom</option>
                        <option value="guardian">Guardian</option>
                        <option value="coop">Co-op Strike</option>
                        <option value="wargames">Wargames</option>
                        <option value="dangerzone">Danger Zone</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Tickrate
                      </label>
                      <select
                        value={formData.tickrate}
                        onChange={(e) => setFormData({ ...formData, tickrate: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="64">64 tick</option>
                        <option value="128">128 tick</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Workshop Map ID (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Enter Workshop Collection ID"
                        value={formData.workshopMapId}
                        onChange={(e) => setFormData({ ...formData, workshopMapId: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Get the ID from the Steam Workshop collection URL
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Steam Account Token (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="For server authentication"
                        value={formData.steamAccount}
                        onChange={(e) => setFormData({ ...formData, steamAccount: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Required for players to connect. Get from Steam Game Server account.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Minecraft Specific Fields */}
            {formData.game === 'MINECRAFT' && (
              <>
                <div className="border-t border-gray-700 pt-4 mt-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Minecraft Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Difficulty
                      </label>
                      <select
                        value={formData.difficulty}
                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="peaceful">Peaceful</option>
                        <option value="easy">Easy</option>
                        <option value="normal">Normal</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        World Type
                      </label>
                      <select
                        value={formData.worldType}
                        onChange={(e) => setFormData({ ...formData, worldType: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="default">Default</option>
                        <option value="flat">Flat</option>
                        <option value="largeBiomes">Large Biomes</option>
                        <option value="amplified">Amplified</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Spawn Protection (blocks)
                      </label>
                      <input
                        type="number"
                        value={formData.spawnProtection}
                        onChange={(e) => setFormData({ ...formData, spawnProtection: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.pvp}
                          onChange={(e) => setFormData({ ...formData, pvp: e.target.checked })}
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-300">Enable PvP</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.hardcore}
                          onChange={(e) => setFormData({ ...formData, hardcore: e.target.checked })}
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-300">Hardcore Mode</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.allowNether}
                          onChange={(e) => setFormData({ ...formData, allowNether: e.target.checked })}
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-300">Allow Nether</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.allowFlight}
                          onChange={(e) => setFormData({ ...formData, allowFlight: e.target.checked })}
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-300">Allow Flight</span>
                      </label>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Rust Specific Fields */}
            {formData.game === 'RUST' && (
              <>
                <div className="border-t border-gray-700 pt-4 mt-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Rust Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        World Size
                      </label>
                      <select
                        value={formData.worldSize}
                        onChange={(e) => setFormData({ ...formData, worldSize: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="2000">Small (2000)</option>
                        <option value="3000">Medium (3000)</option>
                        <option value="4000">Default (4000)</option>
                        <option value="5000">Large (5000)</option>
                        <option value="6000">Extra Large (6000)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        World Seed (optional)
                      </label>
                      <input
                        type="text"
                        value={formData.worldSeed}
                        onChange={(e) => setFormData({ ...formData, worldSeed: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Random if empty"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Save Interval (seconds)
                      </label>
                      <input
                        type="number"
                        value={formData.saveInterval}
                        onChange={(e) => setFormData({ ...formData, saveInterval: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="60"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Custom Arguments - All Games */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Custom Launch Arguments (Advanced)
              </label>
              <textarea
                value={formData.customArgs}
                onChange={(e) => setFormData({ ...formData, customArgs: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Additional server launch parameters"
              />
            </div>

            <div className="bg-blue-500/10 border border-blue-500 text-blue-300 px-4 py-3 rounded text-sm">
              ℹ️ IP address and port will be automatically assigned by the VM when the server is created.
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : server ? 'Update Server' : 'Create Server'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
