// RAM calculation and recommendations for game servers

export type GameType = 'CS2' | 'MINECRAFT' | 'RUST'

export interface RamRecommendation {
  min: number
  recommended: number
  max: number
  description: string
  note?: string
}

/**
 * Calculate recommended RAM based on game type and player count
 */
export function calculateRecommendedRam(
  game: GameType,
  maxPlayers: number
): RamRecommendation {
  switch (game) {
    case 'CS2':
      return getCS2RamRecommendation(maxPlayers)
    case 'MINECRAFT':
      return getMinecraftRamRecommendation(maxPlayers)
    case 'RUST':
      return getRustRamRecommendation(maxPlayers)
    default:
      return {
        min: 1024,
        recommended: 2048,
        max: 8192,
        description: 'General server'
      }
  }
}

/**
 * Counter-Strike 2 RAM recommendations
 */
function getCS2RamRecommendation(maxPlayers: number): RamRecommendation {
  // CS2 base: ~1.5GB for server
  // Per player: ~50-100MB additional
  
  if (maxPlayers <= 10) {
    return {
      min: 1536,
      recommended: 2048,
      max: 4096,
      description: '2GB - Standard 5v5 competitive',
      note: '128 tick servers may need 3-4GB'
    }
  } else if (maxPlayers <= 20) {
    return {
      min: 2048,
      recommended: 3072,
      max: 6144,
      description: '3GB - Casual/Deathmatch server'
    }
  } else {
    return {
      min: 3072,
      recommended: 4096,
      max: 8192,
      description: '4GB - Large community server',
      note: 'Add 1GB per 10 additional players'
    }
  }
}

/**
 * Minecraft RAM recommendations
 */
function getMinecraftRamRecommendation(maxPlayers: number): RamRecommendation {
  // Minecraft: Very RAM-intensive
  // Vanilla: 2GB base + 100-200MB per player
  // Modded: 4GB base + 200-300MB per player
  
  if (maxPlayers <= 10) {
    return {
      min: 2048,
      recommended: 4096,
      max: 8192,
      description: '4GB - Small vanilla server (1-10 players)',
      note: 'Modded servers need 6-8GB minimum'
    }
  } else if (maxPlayers <= 25) {
    return {
      min: 4096,
      recommended: 6144,
      max: 12288,
      description: '6GB - Medium vanilla server (10-25 players)',
      note: 'Modded servers need 8-12GB'
    }
  } else if (maxPlayers <= 50) {
    return {
      min: 6144,
      recommended: 8192,
      max: 16384,
      description: '8GB - Large vanilla server (25-50 players)',
      note: 'Modded servers need 12-16GB'
    }
  } else {
    return {
      min: 8192,
      recommended: 12288,
      max: 32768,
      description: '12GB - Very large server (50+ players)',
      note: 'Network/minigame servers may need 16-32GB'
    }
  }
}

/**
 * Rust RAM recommendations
 */
function getRustRamRecommendation(maxPlayers: number): RamRecommendation {
  // Rust: Extremely RAM-intensive
  // Base: 4GB minimum
  // Per player: ~30-50MB
  // World size matters: 4000 size = ~4GB, 6000 = ~6GB+
  
  if (maxPlayers <= 50) {
    return {
      min: 4096,
      recommended: 6144,
      max: 10240,
      description: '6GB - Small server (up to 50 players)',
      note: 'Minimum 4GB, 8GB for smoother performance'
    }
  } else if (maxPlayers <= 100) {
    return {
      min: 6144,
      recommended: 8192,
      max: 16384,
      description: '8GB - Medium server (50-100 players)',
      note: 'Large world sizes need 10-12GB'
    }
  } else if (maxPlayers <= 200) {
    return {
      min: 8192,
      recommended: 12288,
      max: 24576,
      description: '12GB - Large server (100-200 players)',
      note: 'High-population servers recommended 16GB+'
    }
  } else {
    return {
      min: 12288,
      recommended: 16384,
      max: 32768,
      description: '16GB - Very large server (200+ players)',
      note: 'May need 24-32GB for stable performance'
    }
  }
}

/**
 * Get available RAM options for dropdown
 */
export function getAvailableRamOptions(): Array<{ value: number; label: string }> {
  return [
    { value: 1024, label: '1GB' },
    { value: 1536, label: '1.5GB' },
    { value: 2048, label: '2GB' },
    { value: 3072, label: '3GB' },
    { value: 4096, label: '4GB' },
    { value: 6144, label: '6GB' },
    { value: 8192, label: '8GB' },
    { value: 10240, label: '10GB' },
    { value: 12288, label: '12GB' },
    { value: 16384, label: '16GB' },
    { value: 20480, label: '20GB' },
    { value: 24576, label: '24GB' },
    { value: 32768, label: '32GB' },
  ]
}

/**
 * Format MB to human-readable string
 */
export function formatRam(mb: number): string {
  if (mb >= 1024) {
    const gb = mb / 1024
    return gb % 1 === 0 ? `${gb}GB` : `${gb.toFixed(1)}GB`
  }
  return `${mb}MB`
}

