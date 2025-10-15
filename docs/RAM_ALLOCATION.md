# RAM Allocation Guide

GameControl now includes intelligent RAM allocation with dynamic recommendations based on your game type and player count.

## How It Works

When creating or editing a server, GameControl automatically calculates the optimal RAM allocation based on:
1. **Game Type** (CS2, Minecraft, or Rust)
2. **Max Players** 
3. **Game-Specific Settings** (world size for Rust, mods for Minecraft, etc.)

---

## Visual Indicators

The RAM recommendation box changes color based on your selection:

### ✅ Green - Perfect Allocation
Your selected RAM matches the recommended amount for optimal performance.

### ℹ️ Blue - Within Range
Your RAM is between minimum and maximum, but not the exact recommendation.

### ⚠️ Red - Too Low
**Warning!** Your server may crash or perform poorly with insufficient RAM. Increase allocation.

### 💰 Yellow - Higher Than Needed
You're allocating more RAM than typically necessary. This is safe but may waste resources.

---

## Counter-Strike 2 RAM Requirements

### Small (1-10 players)
- **Minimum**: 1.5GB
- **Recommended**: 2GB
- **Maximum**: 4GB
- **Note**: 128 tick servers may need 3-4GB

### Medium (10-20 players)
- **Minimum**: 2GB
- **Recommended**: 3GB
- **Maximum**: 6GB

### Large (20+ players)
- **Minimum**: 3GB
- **Recommended**: 4GB
- **Maximum**: 8GB
- **Note**: Add 1GB per 10 additional players

**Factors Affecting RAM:**
- **Tickrate**: 128 tick uses ~30% more RAM than 64 tick
- **Plugins**: Each plugin adds 50-200MB
- **Map Size**: Larger community maps need more RAM

---

## Minecraft RAM Requirements

**Minecraft is RAM-intensive!** It's the hungriest of the three games.

### Small Vanilla (1-10 players)
- **Minimum**: 2GB
- **Recommended**: 4GB
- **Maximum**: 8GB
- **Modded**: 6-8GB minimum

### Medium Vanilla (10-25 players)
- **Minimum**: 4GB
- **Recommended**: 6GB
- **Maximum**: 12GB
- **Modded**: 8-12GB

### Large Vanilla (25-50 players)
- **Minimum**: 6GB
- **Recommended**: 8GB
- **Maximum**: 16GB
- **Modded**: 12-16GB

### Very Large (50+ players)
- **Minimum**: 8GB
- **Recommended**: 12GB
- **Maximum**: 32GB
- **Network Servers**: May need 16-32GB

**Factors Affecting RAM:**
- **Mods/Plugins**: Each mod adds 100-500MB
- **World Size**: Larger explored worlds need more RAM
- **Render Distance**: Higher view distance = more RAM
- **Entities**: Many animals/mobs increase RAM usage
- **Redstone**: Complex redstone contraptions are memory-intensive

**Popular Modpacks:**
- **Vanilla**: 4-8GB
- **Forge (light)**: 6-10GB
- **Forge (heavy)**: 10-16GB
- **Feed The Beast**: 12-20GB
- **All The Mods**: 16-32GB

---

## Rust RAM Requirements

**Rust is extremely RAM-intensive**, especially with large worlds.

### Small (Up to 50 players)
- **Minimum**: 4GB (absolute minimum)
- **Recommended**: 6GB
- **Maximum**: 10GB
- **Note**: 8GB for smoother performance

### Medium (50-100 players)
- **Minimum**: 6GB
- **Recommended**: 8GB
- **Maximum**: 16GB
- **Note**: Large world sizes need 10-12GB

### Large (100-200 players)
- **Minimum**: 8GB
- **Recommended**: 12GB
- **Maximum**: 24GB
- **Note**: High-population servers recommended 16GB+

### Very Large (200+ players)
- **Minimum**: 12GB
- **Recommended**: 16GB
- **Maximum**: 32GB
- **Note**: May need 24-32GB for stable performance

**Factors Affecting RAM:**
- **World Size**: Each 1000 units adds ~1-1.5GB
  - 2000 = ~3-4GB
  - 4000 = ~5-6GB
  - 6000 = ~8-10GB
- **Player Count**: ~30-50MB per concurrent player
- **Entity Count**: Buildings, loot, NPCs all use RAM
- **Plugins**: Oxide/uMod plugins add 200MB-1GB each
- **Wiped vs. Old World**: Old worlds with many buildings use more RAM

---

## RAM Selection Options

Available RAM allocations:
- 1GB
- 1.5GB
- 2GB
- 3GB
- 4GB
- 6GB
- 8GB
- 10GB
- 12GB
- 16GB
- 20GB
- 24GB
- 32GB

---

## Best Practices

### 1. Start with Recommended
Always start with the recommended RAM. You can always adjust later.

### 2. Monitor Performance
After launching your server:
- Check RAM usage in your VPS dashboard
- Monitor for out-of-memory errors
- Watch for lag spikes

### 3. Adjust Based on Usage
- **Using 90%+ RAM?** → Increase allocation
- **Using <50% RAM?** → You can safely decrease
- **Getting OOM errors?** → Increase by 2-4GB

### 4. Plan for Growth
If you expect your server to grow:
- Start with recommended or higher
- Leave headroom for plugins/mods
- Better to have extra than run out

### 5. Game-Specific Tips

**CS2:**
- Competitive 5v5 = 2GB is plenty
- Community servers = 4GB recommended
- Surfing/minigames = 3-4GB

**Minecraft:**
- Vanilla survival = 4-6GB
- Modded = Start at 8GB minimum
- Network (Bungeecord) = 12GB+ for hub

**Rust:**
- Weekly wipe server = 8GB
- Monthly server = 12GB+ (more buildings)
- Modded/High pop = 16GB+

---

## Cost Considerations

More RAM = Higher VPS costs:
- **4GB VPS**: $10-20/month
- **8GB VPS**: $20-40/month
- **16GB VPS**: $40-80/month
- **32GB VPS**: $80-160/month

**Money-Saving Tips:**
- Don't over-allocate unnecessarily
- Run multiple small servers on one VPS
- Use the recommended amount, not maximum
- Start small, scale up as needed

---

## Troubleshooting

### "Server keeps crashing"
- Increase RAM by 2-4GB
- Check if you're hitting the limit
- Remove heavy plugins/mods

### "Server is laggy"
- May need more RAM
- OR may be CPU-limited (check CPU usage)
- Reduce view distance (Minecraft)
- Reduce world size (Rust)

### "Not using allocated RAM"
- This is normal! Servers don't always use all available RAM
- Java (Minecraft) may need JVM flags to use more
- Having extra headroom is good

### "Out of Memory error"
- Increase RAM immediately
- This means you hit the limit
- Add 50% more RAM than current

---

## Technical Details

### RAM Calculation Formula

**CS2:**
```
RAM = 1.5GB + (players * 0.05GB) + (tickrate == 128 ? 0.5GB : 0GB)
```

**Minecraft:**
```
RAM = 2GB + (players * 0.15GB) + (modded ? 4GB : 0GB)
```

**Rust:**
```
RAM = 4GB + (worldSize / 1000 * 1GB) + (players * 0.04GB)
```

### Why These Games Need Different RAM

- **CS2**: Compiled C++ binary, very efficient
- **Minecraft**: Java-based, garbage collection, less efficient
- **Rust**: Unity engine + massive open world + complex physics

---

## Quick Reference Table

| Game | Players | Vanilla RAM | Modded RAM |
|------|---------|-------------|------------|
| **CS2** | 10 | 2GB | 3-4GB |
| **CS2** | 20 | 3GB | 4-6GB |
| **Minecraft** | 10 | 4GB | 8GB |
| **Minecraft** | 25 | 6GB | 12GB |
| **Minecraft** | 50 | 8GB | 16GB |
| **Rust** | 50 | 6GB | 10GB |
| **Rust** | 100 | 8GB | 12GB |
| **Rust** | 200 | 12GB | 16GB+ |

---

## Still Not Sure?

**When in doubt:**
1. Use the **recommended** amount shown in green
2. Start your server
3. Monitor RAM usage for 24-48 hours
4. Adjust if needed

The recommendation engine has been carefully calibrated based on real-world server hosting experience!

---

Need more help? Check the main README or VM integration guide.

