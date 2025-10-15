# Game-Specific Configuration Guide

This guide explains the settings available for each game type in GameControl.

## Overview

GameControl now has game-specific configuration forms that adapt based on the game type you select. When creating a server, the form will show relevant settings for Counter-Strike 2, Minecraft, or Rust.

---

## Counter-Strike 2 Settings

### Map Selection
Choose from popular competitive maps:
- **de_dust2** - Classic map, most popular
- **de_mirage** - Balanced 3-lane map
- **de_inferno** - Close-quarters combat
- **de_nuke** - Vertical map with multiple levels
- **de_overpass** - Complex map with canals
- **de_vertigo** - High-altitude construction site
- **de_ancient** - Mayan temple themed
- **de_anubis** - Egyptian themed

### Game Modes
- **Competitive** - 5v5, round-based, bomb defusal (MR12)
- **Casual** - Relaxed rules, larger teams
- **Deathmatch** - Free-for-all, instant respawn
- **Wingman** - 2v2 on smaller maps

### Tickrate
- **64 tick** - Standard, less demanding
- **128 tick** - Pro/competitive, smoother gameplay, higher server requirements

### Default Settings
- Max Players: 10 (competitive 5v5)
- Tickrate: 128
- Map: de_dust2
- Mode: Competitive

---

## Minecraft Settings

### Difficulty
- **Peaceful** - No hostile mobs, health regenerates
- **Easy** - Few hostile mobs, low damage
- **Normal** - Standard difficulty
- **Hard** - Many hostile mobs, high damage

### World Type
- **Default** - Standard Minecraft world generation
- **Flat** - Superflat world (great for creative builds)
- **Large Biomes** - Biomes are 16x larger
- **Amplified** - Extreme terrain generation (mountains, valleys)

### Game Modes
These are set per-player, but you can choose the default:
- **Survival** - Standard gameplay, gather resources
- **Creative** - Unlimited resources, flying
- **Adventure** - For custom maps, limited block interaction
- **Spectator** - Fly through blocks, observe

### Additional Settings

#### PvP (Player vs Player)
- **Enabled** - Players can damage each other
- **Disabled** - Players cannot attack each other

#### Hardcore Mode
- **Enabled** - Permanent death, banned on death, world deleted
- **Disabled** - Normal respawn mechanics

#### Spawn Protection
- Radius (in blocks) around spawn where only ops can build
- Default: 16 blocks
- Set to 0 to disable

#### Allow Nether
- **Enabled** - Players can travel to the Nether dimension
- **Disabled** - Nether portals won't work

#### Allow Flight
- **Enabled** - Non-creative players can use fly mods
- **Disabled** - Kicks players using flight (anti-cheat)

### Default Settings
- Max Players: 20
- Difficulty: Normal
- World Type: Default
- PvP: Enabled
- Hardcore: Disabled
- Spawn Protection: 16 blocks
- Allow Nether: Enabled
- Allow Flight: Disabled

---

## Rust Settings

### World Size
Map generation size:
- **2000** - Small (good for 10-50 players)
- **3000** - Medium (good for 50-100 players)
- **4000** - Default (good for 100-150 players)
- **5000** - Large (good for 150-200 players)
- **6000** - Extra Large (200+ players)

**Note**: Larger maps require more RAM and CPU

### World Seed
- Optional parameter for map generation
- Same seed = same map layout
- Leave empty for random generation
- Use specific seed to recreate maps

Example seeds:
- `12345678` - Community favorite
- `wipe2024` - Easy to remember
- Leave blank for random

### Save Interval
How often (in seconds) the server saves player data:
- **300** (5 min) - Frequent saves, less progress loss
- **600** (10 min) - Default, balanced
- **900** (15 min) - Less frequent, better performance

**Note**: Lower intervals use more disk I/O

### Default Settings
- Max Players: 100
- World Size: 4000
- World Seed: Random
- Save Interval: 600 seconds (10 minutes)

---

## Common Settings (All Games)

### Server Name
- Friendly name displayed in the dashboard
- Examples: "My CS2 Server", "Survival SMP", "Rust Monthly"

### Max Players
- Maximum simultaneous players
- CS2: Typically 10 (5v5)
- Minecraft: 10-50 typical, up to 1000+ with optimization
- Rust: 50-200 typical, up to 500+ on powerful servers

### Custom Arguments
Advanced launch parameters for experienced users:
- CS2: `-tickrate 128 +sv_cheats 0`
- Minecraft: `-Xmx4G -Xms4G` (JVM memory)
- Rust: `+server.description "Welcome"`

**Note**: Incorrect arguments can prevent server from starting

---

## IP Address & Port Assignment

**Important**: You don't manually set IP/port anymore!

- **IP Address** - Automatically set to your VM's IP
- **Port** - Auto-allocated from available port pool
- **RCON Port** - Auto-assigned (main port + 100)

### Port Ranges
- **CS2**: 27015-27115
- **Minecraft**: 25565-25665
- **Rust**: 28015-28115

---

## Recommended Configurations

### Competitive CS2 Server
```
Game: Counter-Strike 2
Max Players: 10
Tickrate: 128
Map: de_dust2
Mode: Competitive
```

### Casual Minecraft SMP
```
Game: Minecraft
Max Players: 20
Difficulty: Normal
World Type: Default
PvP: Enabled
Hardcore: Disabled
```

### Large Rust Server
```
Game: Rust
Max Players: 150
World Size: 5000
Save Interval: 600
```

---

## Resource Requirements

### Counter-Strike 2
- **RAM**: 2-4GB
- **CPU**: 2-4 cores
- **Disk**: 20GB
- **Network**: 1Mbps per player

### Minecraft
- **RAM**: 2-8GB (depends on plugins/mods)
- **CPU**: 2-4 cores (single-threaded performance matters)
- **Disk**: 5-50GB (depends on world size)
- **Network**: 0.5Mbps per player

### Rust
- **RAM**: 4-16GB (depends on world size)
- **CPU**: 4-8 cores
- **Disk**: 15-30GB
- **Network**: 1-2Mbps per player

---

## Tips & Best Practices

### CS2
- Use 128 tick for competitive play
- 64 tick is fine for casual servers
- Popular maps: dust2, mirage, inferno

### Minecraft
- Start with Normal difficulty
- Enable PvP for survival servers
- Use Flat world type for creative building
- Disable flight to prevent exploits (unless modded)

### Rust
- Larger world size = more exploration but higher requirements
- Use consistent seed for regular wipe schedules
- Default save interval (600s) is good balance

---

## Next Steps

1. **Create a server** with your desired settings
2. **Wait for VM deployment** (IP/port assignment)
3. **Start the server** from dashboard
4. **Share connection details** with players

For VM setup and deployment, see `VM_INTEGRATION.md`.

---

Questions? Check the main README or open an issue on GitHub!

