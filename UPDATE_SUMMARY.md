# ✅ Automatic Steam Updates - Quick Summary

Your CS2 and Rust servers now have **automatic Steam updates** enabled!

---

## 🎯 How It Works

### Counter-Strike 2 🎯
- ✅ **Auto-checks for updates** every time server starts
- ✅ **Downloads updates** via SteamCMD before starting
- ✅ **Validates files** to prevent corruption
- ⏱️ Takes 2-10 minutes depending on update size

**When do CS2 updates happen?**
- Valve usually releases updates on **Thursdays**
- Your server updates automatically when restarted

### Rust 🔧
- ✅ **Auto-checks for updates** on startup
- ✅ **Downloads and installs** before starting
- ✅ **RCON web interface** enabled for easier management
- ⏱️ Takes 5-15 minutes for updates

**When do Rust updates happen?**
- Every **Thursday afternoon** (~3-5 PM EST)
- **Forced wipes**: First Thursday of every month
- Hotfixes as needed

### Minecraft ⛏️
- ✅ **Auto-updates** via Docker image
- ✅ Can pin specific versions if needed
- ✅ Always uses latest stable by default

---

## 🔄 What Happens During Updates

```
1. You restart server (or it restarts automatically)
   ↓
2. Server checks for Steam updates
   ↓
3. Downloads new game files (2-15 minutes)
   ↓
4. Validates game files
   ↓
5. Server starts with latest version
   ↓
6. Players can connect!
```

---

## 💡 Key Features

### Automatic (Default)
- Every server restart checks for updates
- No manual intervention needed
- Players always have latest version

### Manual Update Option
Coming soon to GameControl panel:
- "Update" button on each server
- Forces immediate update check
- Useful for critical patches

For now, manual update via VM:
```bash
docker restart <container-name>
```

---

## 📅 Update Schedule

| Game | Frequency | Downtime | Notes |
|------|-----------|----------|-------|
| **CS2** | Weekly (Thu) | 5-10 min | Valve patches |
| **Rust** | Weekly (Thu) | 10-20 min | Monthly forced wipes |
| **Minecraft** | As released | 5-15 min | Version can be pinned |

---

## ⚠️ Important Notes

### CS2
- Updates happen automatically on restart
- File validation ensures integrity
- Players need Steam to be up-to-date

### Rust
- **First Thursday = Map Wipe** (players lose progress)
- Automatic update before start
- RCON web interface: `http://your-ip:28082`

### Minecraft
- Updates automatically to latest version
- Old worlds work with new versions
- Can pin version: `VERSION=1.20.4`

---

## 🛠️ Configuration

All update settings are **pre-configured** in your VM Manager!

### CS2 Settings:
```javascript
STEAMCMD_VALIDATE=1  // Validates on every start
```

### Rust Settings:
```javascript
RUST_UPDATE_CHECKING=1   // Enable checking
RUST_START_MODE=2        // Update before start
RUST_UPDATE_BRANCH=public // Use public branch
```

### Minecraft Settings:
```javascript
VERSION=LATEST  // Always use latest
```

---

## 📖 Full Documentation

For detailed information, see: **`docs/GAME_UPDATES.md`**

Includes:
- Update frequency details
- Wipe schedules (Rust)
- Troubleshooting guide
- Manual update commands
- Backup procedures
- Version management

---

## 🎮 What This Means For You

✅ **No manual updates needed** - Servers stay current automatically  
✅ **Compatible with clients** - Players always match server version  
✅ **Security patches** - Get fixes as soon as they're released  
✅ **New features** - Access latest content automatically  
✅ **Less maintenance** - Just restart servers periodically  

---

## 🚀 Quick Actions

### Check if Update Available
```bash
# Just restart - it checks automatically
docker restart <container-name>
```

### Watch Update Progress
```bash
docker logs -f <container-name>
```

### Verify Update Completed
```bash
# Check logs for "Server started"
docker logs <container-name> | grep -i "started"
```

---

## ❓ Common Questions

**Q: Do I need to do anything?**  
A: Nope! Updates happen automatically on restart.

**Q: Will players lose progress?**  
A: No for CS2/Minecraft. Rust wipes monthly (intentional).

**Q: How long does it take?**  
A: Usually 5-15 minutes depending on update size.

**Q: What if update fails?**  
A: Server automatically retries. Check logs if issues persist.

**Q: Can I disable updates?**  
A: Not recommended, but you can pin specific versions for Minecraft.

---

**Your servers now stay updated automatically! 🎉**

Just restart them occasionally to get latest updates.

