# Per-User FTP Access Guide

Complete guide to GameControl's per-user FTP system for isolated file access.

## Overview

GameControl provides **secure, isolated FTP access** for each user to manage their game server files. Each user gets:

- ✅ **Unique FTP account** with isolated directory
- ✅ **Access only to their own servers** (chroot jail security)
- ✅ **No access to other users' files** or system files
- ✅ **Easy file management** via FileZilla or any FTP client
- ✅ **Automatic server linking** - files appear when servers are created

---

## Architecture

```
User: john@example.com
├── FTP Username: gc_clx123abc
├── FTP Password: (auto-generated, shown once)
├── FTP Port: 21
├── Isolated Directory: /home/gamecontrol-ftp/gc_clx123abc/
│   └── servers/
│       ├── minecraft-survival/     ← Symlink to Docker volume
│       │   ├── server.properties
│       │   ├── world/
│       │   ├── plugins/
│       │   └── logs/
│       ├── cs2-competitive/        ← Symlink to Docker volume
│       │   ├── cfg/
│       │   ├── maps/
│       │   └── addons/
│       └── rust-monthly/           ← Symlink to Docker volume
│           ├── cfg/
│           ├── oxide/
│           └── saves/
└── Can ONLY access this directory (security via chroot)
```

---

## VPS Setup (One-Time)

### Step 1: Run FTP Setup Script

On your VPS:

```bash
cd /opt/gamecontrol-vm

# Download setup script
curl -L -o setup-ftp.sh https://raw.githubusercontent.com/anthev-stack/Gamecontrol/main/vm-manager/setup-ftp.sh

# Make executable
chmod +x setup-ftp.sh

# Run as root
sudo ./setup-ftp.sh
```

This script:
- ✅ Installs vsftpd (FTP server)
- ✅ Configures chroot jails for security
- ✅ Sets up passive mode ports
- ✅ Configures firewall rules
- ✅ Creates base directory structure

### Step 2: Optional - Enable SSL/TLS (FTPS)

For encrypted connections:

```bash
# Download SSL setup script
curl -L -o enable-ftp-ssl.sh https://raw.githubusercontent.com/anthev-stack/Gamecontrol/main/vm-manager/enable-ftp-ssl.sh

# Make executable
chmod +x enable-ftp-ssl.sh

# Run as root
sudo ./enable-ftp-ssl.sh
```

This enables FTPS (FTP over SSL/TLS) for encrypted file transfers.

---

## User Setup (Automatic)

### How Users Get FTP Access

1. **User logs into GameControl panel**
2. **Clicks "Setup FTP Access"** button in dashboard
3. **FTP account created automatically** on VM
4. **Credentials displayed** (username + password)
5. **User saves password** (shown only once!)
6. **Ready to connect** with FileZilla

### What Happens Behind the Scenes

1. GameControl sends request to VM Manager API
2. VM Manager creates system user with isolated directory
3. Sets secure password
4. Adds user to vsftpd user list
5. Creates directory structure
6. Returns credentials to GameControl
7. GameControl stores encrypted password
8. User gets credentials displayed once

---

## Using FTP Access

### With FileZilla

1. **Download FileZilla**: [filezilla-project.org](https://filezilla-project.org/)
2. **Click "Download FileZilla Config"** in GameControl
3. **Open downloaded XML** file in FileZilla
4. **Enter your FTP password** when prompted
5. **Connect!**

**Manual Setup:**
- Host: `your-vps-ip`
- Port: `21`
- Protocol: `FTP` (or `FTPS` if SSL enabled)
- Username: `gc_xxxxx` (shown in panel)
- Password: (your FTP password)

### With Other FTP Clients

**WinSCP (Windows):**
```
File Protocol: FTP
Host: your-vps-ip
Port: 21
Username: gc_xxxxx
Password: your-ftp-password
```

**Cyberduck (Mac/Windows):**
```
Connection: FTP
Server: your-vps-ip
Port: 21
Username: gc_xxxxx
Password: your-ftp-password
```

**Command Line:**
```bash
ftp your-vps-ip
# Enter username and password when prompted
```

---

## Directory Structure

When you connect via FTP, you'll see:

```
/
├── servers/
│   ├── your-minecraft-server/
│   │   ├── server.properties       ← Edit server settings
│   │   ├── bukkit.yml
│   │   ├── spigot.yml
│   │   ├── world/                  ← World save files
│   │   ├── world_nether/
│   │   ├── world_the_end/
│   │   ├── plugins/                ← Upload plugins here
│   │   │   ├── EssentialsX.jar
│   │   │   └── WorldEdit.jar
│   │   └── logs/                   ← View server logs
│   │
│   ├── your-cs2-server/
│   │   ├── cfg/                    ← Server config files
│   │   │   ├── server.cfg
│   │   │   └── autoexec.cfg
│   │   ├── maps/                   ← Upload custom maps
│   │   ├── addons/                 ← SourceMod/MetaMod
│   │   └── logs/
│   │
│   └── your-rust-server/
│       ├── cfg/                    ← Server config
│       ├── oxide/                  ← Oxide/uMod plugins
│       │   ├── plugins/            ← Upload Rust plugins (.cs files)
│       │   ├── config/             ← Plugin configs
│       │   └── data/
│       └── saves/                  ← World save files
│
├── backups/                        ← Store your backups
└── shared/                         ← Shared resources across servers
```

---

## Common Tasks

### Upload Plugin (Minecraft)

1. Connect via FTP
2. Navigate to `/servers/your-server/plugins/`
3. Upload `.jar` file
4. Restart server from GameControl panel
5. Plugin is active!

### Edit Config File (CS2)

1. Connect via FTP
2. Navigate to `/servers/your-cs2/cfg/`
3. Download `server.cfg`
4. Edit locally
5. Upload back to server
6. Restart server

### Upload Custom Map (CS2)

1. Connect via FTP
2. Navigate to `/servers/your-cs2/maps/`
3. Upload `.bsp` and `.nav` files
4. Update server settings in GameControl
5. Map is available!

### Install Oxide Plugin (Rust)

1. Connect via FTP
2. Navigate to `/servers/your-rust/oxide/plugins/`
3. Upload `.cs` plugin file
4. Plugin loads automatically (or restart server)

### Download Backup

1. Connect via FTP
2. Navigate to `/servers/your-server/`
3. Download entire folder
4. Save locally as backup

### Restore Backup

1. Stop server in GameControl
2. Connect via FTP
3. Delete old files
4. Upload backup files
5. Start server

---

## Security Features

### Chroot Jail
- Users are "jailed" in their home directory
- Cannot navigate to `/`, `/etc`, or other system directories
- Cannot see other users' directories
- Cannot execute system commands

### File Permissions
- Users can only modify their own files
- Cannot change file ownership
- Cannot modify system files

### Access Control
- Username/password authentication
- Optional FTPS encryption
- Limited to userlist only
- Rate limiting prevents brute force

---

## Troubleshooting

### Cannot Connect to FTP

**Check VM FTP Status:**
```bash
# On VPS
sudo systemctl status vsftpd

# If not running
sudo systemctl start vsftpd
```

**Check Firewall:**
```bash
sudo ufw status | grep 21
sudo ufw status | grep 40000:40100
```

**Test Connection:**
```bash
# From local machine
telnet your-vps-ip 21
```

### Login Failed

**Check Username/Password:**
- Username should start with `gc_`
- Use password shown when first created
- Reset password in GameControl if forgotten

**Check User Exists:**
```bash
# On VPS
cat /etc/vsftpd.userlist | grep gc_
```

### Cannot See Server Files

**Check Symlinks:**
```bash
# On VPS
ls -la /home/gamecontrol-ftp/gc_xxxxx/servers/
```

**Recreate Link:**
```bash
# VM Manager should auto-link
# Or manually:
sudo ln -s /var/lib/docker/volumes/<volume>/_data /home/gamecontrol-ftp/gc_xxxxx/servers/servername
```

### Permission Denied

**Fix Ownership:**
```bash
# On VPS
sudo chown -R gc_xxxxx:gc_xxxxx /home/gamecontrol-ftp/gc_xxxxx/
```

### Passive Mode Issues

If you're behind a router/NAT:

**FileZilla Settings:**
- Edit → Settings → Connection → FTP
- Transfer mode: Passive
- Limit local ports: No

**In vsftpd.conf:**
```
pasv_address=your-public-ip
pasv_enable=YES
pasv_min_port=40000
pasv_max_port=40100
```

---

## Password Management

### First-Time Password

When you click "Setup FTP Access":
- ✅ Secure random password generated
- ✅ Shown **once** in green box
- ✅ **Must be saved immediately**
- ❌ Cannot be retrieved later (only reset)

### Resetting Password

1. Click **"Reset Password"** button (🔄 icon)
2. Confirm reset
3. New password generated and displayed
4. Save new password
5. Update in your FTP client

### Best Practices

- **Save password** in password manager
- **Don't share** FTP credentials
- **Reset periodically** for security
- **Use FTPS** if handling sensitive data

---

## Advanced Configuration

### Enable FTPS (Encrypted)

```bash
# On VPS
sudo ./enable-ftp-ssl.sh
```

**FileZilla Settings for FTPS:**
- Encryption: `Require explicit FTP over TLS`
- Port: `21`
- Accept self-signed certificate

### Custom FTP Port

Edit `.env` on VPS:
```env
FTP_PORT=2121
```

Update vsftpd.conf:
```
listen_port=2121
```

Update firewall:
```bash
sudo ufw allow 2121/tcp
```

### Bandwidth Limiting

In vsftpd.conf:
```
local_max_rate=102400  # 100 KB/s per connection
```

### Connection Limits

In vsftpd.conf:
```
max_clients=50         # Total simultaneous connections
max_per_ip=5          # Connections per IP
```

---

## File Access by Game

### Counter-Strike 2

**Config Files:**
- `/servers/your-cs2/cfg/server.cfg` - Main config
- `/servers/your-cs2/cfg/autoexec.cfg` - Auto-executed commands
- `/servers/your-cs2/cfg/gamemode_competitive.cfg` - Game mode settings

**Custom Content:**
- `/servers/your-cs2/maps/` - Custom maps (.bsp files)
- `/servers/your-cs2/addons/` - SourceMod/MetaMod plugins

**Logs:**
- `/servers/your-cs2/logs/` - Server logs

### Minecraft

**Main Files:**
- `/servers/your-minecraft/server.properties` - Server configuration
- `/servers/your-minecraft/bukkit.yml` - Bukkit settings (if using)
- `/servers/your-minecraft/spigot.yml` - Spigot settings (if using)

**Plugins/Mods:**
- `/servers/your-minecraft/plugins/` - Bukkit/Spigot plugins
- `/servers/your-minecraft/mods/` - Forge/Fabric mods

**Worlds:**
- `/servers/your-minecraft/world/` - Overworld
- `/servers/your-minecraft/world_nether/` - Nether dimension
- `/servers/your-minecraft/world_the_end/` - End dimension

### Rust

**Config:**
- `/servers/your-rust/cfg/` - Server configuration files

**Plugins:**
- `/servers/your-rust/oxide/plugins/` - Oxide/uMod plugins (.cs files)
- `/servers/your-rust/oxide/config/` - Plugin configuration files
- `/servers/your-rust/oxide/data/` - Plugin data storage

**World Data:**
- `/servers/your-rust/saves/` - Map and player save files

---

## Monitoring

### Check FTP Usage

```bash
# On VPS
who | grep ftp

# Active FTP sessions
sudo lsof -i :21
```

### View FTP Logs

```bash
# Real-time logs
sudo tail -f /var/log/vsftpd.log

# Transfer logs
sudo tail -f /var/log/xferlog
```

### Check User Activity

```bash
# Last logins
sudo lastlog | grep gc_

# Current connections
sudo netstat -an | grep :21
```

---

## Best Practices

### For Users

1. **Save your password** when first shown
2. **Use FTPS** for encrypted transfers
3. **Don't share credentials** with others
4. **Backup before editing** critical files
5. **Test changes** on stopped servers first

### For Admins

1. **Enable FTPS** for security
2. **Monitor disk usage** regularly
3. **Set up automated backups**
4. **Review FTP logs** periodically
5. **Keep vsftpd updated**

### File Editing Tips

1. **Stop server** before editing config files
2. **Use proper encoding** (UTF-8)
3. **Keep backups** of original files
4. **Test syntax** before uploading
5. **Restart server** to apply changes

---

## Migration from Manual Access

If you were using direct SSH/SFTP before:

### Advantages of Per-User FTP

| Feature | Manual SSH | Per-User FTP |
|---------|-----------|--------------|
| **Security** | Full system access | Isolated directory |
| **Complexity** | Need to know Linux | Simple FTP client |
| **Risk** | Can break system | Only affects own servers |
| **User-friendly** | Command line | GUI tools |
| **Multi-user** | Risky | Safe isolation |

---

## Frequently Asked Questions

### Q: Can I see other users' servers?
**A:** No. Chroot jail restricts you to your own directory only.

### Q: Can I upload to system directories?
**A:** No. You can only access `/home/gamecontrol-ftp/your-username/`

### Q: What if I forget my password?
**A:** Click "Reset Password" in GameControl panel to generate a new one.

### Q: Can I use FTP in passive mode?
**A:** Yes. Passive ports 40000-40100 are configured.

### Q: Is FTP encrypted?
**A:** By default no, but FTPS can be enabled with the SSL setup script.

### Q: Can I access files while server is running?
**A:** Yes, but be careful. Editing config files while running may cause issues.

### Q: How do I upload a plugin?
**A:** Navigate to appropriate folder (`plugins/`, `addons/`, `oxide/plugins/`), upload file, restart server.

### Q: Can I delete files?
**A:** Yes, you have full read/write/delete access to your directories.

### Q: What happens if I delete everything?
**A:** Only your server files are affected. Server may fail to start until restored.

### Q: Can I create new folders?
**A:** Yes, within your accessible directories.

---

## Security Notes

### What You CAN Do:
- ✅ Upload/download files in your servers
- ✅ Edit configuration files
- ✅ Create/delete folders
- ✅ Rename files
- ✅ View logs

### What You CANNOT Do:
- ❌ Access other users' directories
- ❌ Navigate to system directories
- ❌ Execute system commands
- ❌ Modify FTP server settings
- ❌ See Docker containers directly

### Chroot Jail Protection

The chroot jail means:
- Your FTP session sees `/` as your home directory
- You cannot use `cd ..` to escape
- Paths like `/etc`, `/var`, `/root` don't exist for you
- Complete isolation from system

---

## Technical Details

### FTP Server: vsftpd

**Why vsftpd?**
- Industry standard
- Very secure
- High performance
- Well documented
- Actively maintained

**Configuration Location:**
- Main config: `/etc/vsftpd.conf`
- User list: `/etc/vsftpd.userlist`
- Base directory: `/home/gamecontrol-ftp/`

### File Linking System

Server files are **symlinked** from Docker volumes:

```bash
# Docker volume (actual files)
/var/lib/docker/volumes/abc123/_data/

# Symlinked to FTP directory
/home/gamecontrol-ftp/gc_user123/servers/minecraft-survival/
                                           ↑
                                    Points to volume
```

**Benefits:**
- Real-time access to live server files
- No file duplication
- Changes apply immediately
- Organized directory structure

---

## Troubleshooting Commands

### Check FTP Server Status
```bash
sudo systemctl status vsftpd
```

### View FTP Configuration
```bash
cat /etc/vsftpd.conf
```

### List FTP Users
```bash
cat /etc/vsftpd.userlist
```

### Check User Directories
```bash
ls -la /home/gamecontrol-ftp/
```

### View Active FTP Connections
```bash
sudo lsof -i :21
```

### Restart FTP Server
```bash
sudo systemctl restart vsftpd
```

### View FTP Logs
```bash
sudo journalctl -u vsftpd -f
```

### Test FTP Locally
```bash
# On VPS
ftp localhost
# Try logging in with a user account
```

---

## Maintenance

### Daily Checks
```bash
# Check FTP is running
sudo systemctl is-active vsftpd

# Check disk usage
df -h /home/gamecontrol-ftp
```

### Weekly Tasks
```bash
# Review logs for issues
sudo journalctl -u vsftpd --since "1 week ago"

# Check for failed login attempts
sudo grep "FAIL" /var/log/vsftpd.log
```

### Monthly Tasks
```bash
# Clean old logs
sudo journalctl --vacuum-time=30d

# Review user access
cat /etc/vsftpd.userlist

# Update vsftpd
sudo apt update && sudo apt upgrade vsftpd
```

---

## Support

For issues or questions:
- Check vsftpd logs: `sudo journalctl -u vsftpd -f`
- Check VM Manager logs: `pm2 logs gamecontrol-vm`
- Review GameControl panel for FTP status
- Open issue on GitHub with error details

---

## Additional Resources

- [vsftpd Documentation](https://security.appspot.com/vsftpd.html)
- [FileZilla Documentation](https://wiki.filezilla-project.org/)
- [FTP Security Best Practices](https://www.ssh.com/academy/ssh/ftp)

---

**Your users now have secure, isolated file access to their game servers!** 🎉

