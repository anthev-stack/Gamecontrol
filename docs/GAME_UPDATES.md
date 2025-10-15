# Game Server Updates Guide

This guide explains how game updates work for CS2, Minecraft, and Rust servers.

## Overview

Game servers need regular updates to stay compatible with client versions. GameControl handles this in two ways:

1. **Automatic Updates** - Updates happen automatically when servers restart
2. **Manual Updates** - You can force an update anytime

---

## Counter-Strike 2 Updates

### How CS2 Updates Work

CS2 uses **SteamCMD** for updates. Our Docker image automatically:
- ✅ Checks for updates on every server start
- ✅ Downloads updates before starting the server
- ✅ Validates game files to prevent corruption

### Automatic Update Settings

When you create a CS2 server, these are automatically enabled:

```
STEAMCMD_VALIDATE=1  # Validates files on each start
```

### Update Frequency

- **Valve releases**: Usually weekly (Thursdays)
- **Critical patches**: Anytime
- **Update size**: 100MB - 2GB typically

### What Happens During Update

1. Server restarts
2. SteamCMD checks for new version
3. Downloads update if available (takes 2-10 minutes)
4. Validates all game files
5. Server starts with new version

### Manual Update

**Via GameControl Panel:**
1. Find your CS2 server
2. Click "Update" button (coming soon)
3. Server restarts and updates

**Via VM:**
```bash
# Find container
docker ps | grep cs2

# Restart to trigger update
docker restart <container-id>

# Watch update progress
docker logs -f <container-id>
```

### Update Issues

**Problem**: Players can't connect after update
- **Cause**: Client version doesn't match server
- **Solution**: Tell players to update Steam/CS2

**Problem**: Update takes too long
- **Cause**: Slow download speed or validating files
- **Solution**: Wait it out (can take 10-15 minutes)

**Problem**: Server won't start after update
- **Cause**: Corrupted files
- **Solution**: 
  ```bash
  docker stop <container-id>
  docker start <container-id>
  ```

---

## Rust Updates

### How Rust Updates Work

Rust uses **SteamCMD** with additional logic:

```
RUST_UPDATE_CHECKING=1      # Enable update checking
RUST_UPDATE_BRANCH=public   # Use public branch
RUST_START_MODE=2           # Update before starting
```

### Automatic Updates

Rust servers automatically:
- ✅ Check for updates on start
- ✅ Download and install updates
- ✅ Restart with new version

### Update Frequency

- **Facepunch releases**: Every Thursday (~3-5 PM EST)
- **Hotfixes**: As needed (usually Friday)
- **Forced wipes**: First Thursday of every month
- **Update size**: 500MB - 2GB

### Wipe Schedule

**Monthly Forced Wipes** (First Thursday):
- Map wipes automatically
- Blueprint wipes (optional, server choice)
- All players lose progress

**Weekly Updates** (Every Thursday):
- Content updates
- Bug fixes
- No forced wipes (unless map changed)

### What Happens During Rust Update

1. Server warns players (if online)
2. Saves world data
3. Server stops
4. SteamCMD downloads update
5. Server validates files
6. Server restarts with new version

### Manual Update

**Via GameControl Panel:**
1. Find your Rust server
2. Click "Update" button
3. Server updates and restarts

**Via VM:**
```bash
# Restart to trigger update
docker restart <rust-container>

# Watch update (takes 5-15 minutes)
docker logs -f <rust-container>
```

### Handling Wipes

**Map Wipes:**
```bash
# SSH into VM
docker exec -it <rust-container> bash

# Delete map files
rm -rf /steamcmd/rust/server/my_server_identity/map.*

# Restart server
docker restart <rust-container>
```

**Full Wipe (Map + Blueprints):**
```bash
# Delete entire save
rm -rf /steamcmd/rust/server/my_server_identity/*

# Restart server
docker restart <rust-container>
```

### Update Issues

**Problem**: Server stuck updating
- **Cause**: Download interrupted
- **Solution**: Stop and restart container

**Problem**: Players disconnected after update
- **Cause**: Client-server version mismatch
- **Solution**: Players need to update Rust client

**Problem**: World disappeared after wipe
- **Cause**: Forced wipe or manual wipe
- **Solution**: This is intentional, part of Rust's design

---

## Minecraft Updates

### How Minecraft Updates Work

Minecraft updates are **different** from CS2/Rust:

- Java Edition: Downloads from Mojang servers
- Updates automatically via Docker image
- Version can be pinned if needed

### Automatic Updates

```
VERSION=LATEST  # Always use latest version (default)
```

Or pin to specific version:
```
VERSION=1.20.4  # Use specific version
```

### Update Frequency

- **Major releases**: 1-2 per year (1.20, 1.21, etc.)
- **Minor updates**: Monthly (1.20.1, 1.20.2, etc.)
- **Snapshots**: Weekly (if enabled)

### Version Management

**Always Latest (Default):**
```
VERSION=LATEST
```

**Specific Version:**
```
VERSION=1.20.4
TYPE=VANILLA
```

**Snapshots (Experimental):**
```
VERSION=SNAPSHOT
```

### What Happens During Update

1. Server checks for new version
2. Downloads if available (100-200MB)
3. Generates new chunks with new features
4. Server starts with new version

### Manual Update

**Via GameControl Panel:**
1. Edit server settings
2. Change VERSION if needed
3. Restart server

**Via VM:**
```bash
# Restart to check for updates
docker restart <minecraft-container>

# Watch logs
docker logs -f <minecraft-container>
```

### Update Issues

**Problem**: Plugins/mods broken after update
- **Cause**: Incompatible with new version
- **Solution**: Update plugins or rollback version

**Problem**: World corruption
- **Cause**: Rare, but can happen
- **Solution**: Restore from backup

**Problem**: Players can't join
- **Cause**: Client/server version mismatch
- **Solution**: Players update client or server rolls back

---

## Best Practices

### Before Updates

1. **Backup your data**
   ```bash
   docker cp <container>:/data /backup/server-name-$(date +%Y%m%d)
   ```

2. **Notify players**
   - Announce maintenance window
   - Give 5-10 minute warning

3. **Check disk space**
   ```bash
   df -h
   ```

### During Updates

1. **Monitor logs**
   ```bash
   docker logs -f <container-id>
   ```

2. **Don't interrupt**
   - Let updates complete
   - Usually takes 5-15 minutes

3. **Check for errors**
   - Watch for download failures
   - Verify server starts successfully

### After Updates

1. **Test connectivity**
   - Try connecting to server
   - Check player count/performance

2. **Monitor first hour**
   - Watch for crashes
   - Check logs for errors

3. **Keep backups**
   - Maintain last 3-5 backups
   - Test restore process

---

## Update Commands

### Check for Updates

**CS2:**
```bash
docker exec <container> steamcmd +force_install_dir /home/steam/cs2-dedicated +login anonymous +app_update 730 validate +quit
```

**Rust:**
```bash
docker exec <container> steamcmd +force_install_dir /steamcmd/rust +login anonymous +app_update 258550 validate +quit
```

**Minecraft:**
```bash
# Just restart - it checks automatically
docker restart <container>
```

### Force Update

```bash
# Stop server
docker stop <container-id>

# Pull latest Docker image
docker pull <image-name>

# Start server (will update game)
docker start <container-id>
```

### Rollback (if needed)

```bash
# Stop server
docker stop <container-id>

# Remove container (keeps data)
docker rm <container-id>

# Restore from backup
docker cp /backup/server-data <container>:/data

# Start server
docker start <container-id>
```

---

## Automated Update Schedule

### Recommended Schedule

**CS2 Servers:**
- Check for updates: Every restart
- Manual check: After Valve's Thursday updates
- Downtime: Usually 5-10 minutes

**Rust Servers:**
- Force wipe: First Thursday of month (plan downtime)
- Weekly update: Every Thursday afternoon
- Manual update: Friday for hotfixes
- Downtime: 10-20 minutes

**Minecraft Servers:**
- Check for updates: Every restart
- Major version: Plan migration carefully
- Downtime: 5-15 minutes

### Setting Up Automated Restarts

Use `cron` on your VM:

```bash
# Edit crontab
crontab -e

# Add entries:
# CS2: Restart daily at 4 AM
0 4 * * * docker restart gamecontrol-cs2-*

# Rust: Restart Thursday at 4 AM (after updates)
0 4 * * 4 docker restart gamecontrol-rust-*

# Minecraft: Restart daily at 3 AM
0 3 * * * docker restart gamecontrol-minecraft-*
```

---

## Monitoring Updates

### Check Current Version

**CS2:**
```bash
docker exec <container> cat /home/steam/cs2-dedicated/game/csgo/steam.inf
```

**Rust:**
```bash
docker exec <container> cat /steamcmd/rust/steam.inf
```

**Minecraft:**
```bash
docker logs <container> | grep "Starting minecraft server version"
```

### Update Logs

```bash
# Live logs
docker logs -f <container> | grep -i update

# Recent update activity
docker logs --since 1h <container> | grep -i update
```

---

## Troubleshooting

### Update Failed

1. **Check disk space:**
   ```bash
   df -h
   ```

2. **Check logs:**
   ```bash
   docker logs <container> | tail -100
   ```

3. **Try manual update:**
   ```bash
   docker restart <container>
   ```

4. **Last resort - recreate:**
   ```bash
   # Backup first!
   docker cp <container>:/data /backup/
   
   # Remove and recreate via GameControl panel
   ```

### Players Can't Connect

1. **Check versions match:**
   - Server version vs client version
   
2. **Clear DNS cache:**
   - Players: flush DNS, restart game

3. **Check firewall:**
   ```bash
   sudo ufw status
   ```

### Server Won't Start After Update

1. **Check logs for errors:**
   ```bash
   docker logs <container> | tail -50
   ```

2. **Validate files:**
   ```bash
   docker restart <container>
   ```

3. **Restore backup if needed**

---

## Questions?

- Check Docker logs first: `docker logs <container>`
- Review VM Manager logs: `pm2 logs gamecontrol-vm`
- Check game-specific forums for known issues
- Open issue on GameControl GitHub

---

**Keep your servers updated for best security and compatibility!** 🔄✨

