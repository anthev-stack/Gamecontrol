#!/bin/bash

#################################################
# GameControl FTP Server Setup Script
# This script configures vsftpd for per-user FTP access
#################################################

set -e

echo "🔧 GameControl FTP Setup"
echo "========================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Please run as root (use sudo)"
  exit 1
fi

# Install vsftpd
echo "📦 Installing vsftpd..."
apt-get update
apt-get install -y vsftpd

# Backup original config
if [ ! -f /etc/vsftpd.conf.backup ]; then
  cp /etc/vsftpd.conf /etc/vsftpd.conf.backup
  echo "✅ Backed up original config"
fi

# Create FTP base directory
echo "📁 Creating FTP directory structure..."
mkdir -p /home/gamecontrol-ftp
chmod 755 /home/gamecontrol-ftp

# Create vsftpd user list
touch /etc/vsftpd.userlist
chmod 600 /etc/vsftpd.userlist

# Configure vsftpd
echo "⚙️  Configuring vsftpd..."
cat > /etc/vsftpd.conf << 'EOF'
# Listen on IPv4
listen=YES
listen_ipv6=NO

# Disable anonymous FTP
anonymous_enable=NO

# Enable local users
local_enable=YES

# Enable write access
write_enable=YES

# Local user file permissions
local_umask=022

# Enable chroot jail for security
chroot_local_user=YES
allow_writeable_chroot=YES

# User list for access control
userlist_enable=YES
userlist_file=/etc/vsftpd.userlist
userlist_deny=NO

# Security settings
ssl_enable=NO
require_ssl_reuse=NO
force_local_logins_ssl=NO
force_local_data_ssl=NO

# Passive mode ports
pasv_enable=YES
pasv_min_port=40000
pasv_max_port=40100

# Connection settings
max_clients=50
max_per_ip=5

# Logging
xferlog_enable=YES
xferlog_std_format=YES
log_ftp_protocol=YES

# Banner
ftpd_banner=Welcome to GameControl FTP Server

# Hide IDs
hide_ids=YES

# Performance
use_sendfile=YES
local_max_rate=0

# UTF-8
utf8_filesystem=YES
EOF

echo "✅ Configuration created"

# Configure firewall for FTP
echo "🔥 Configuring firewall..."
ufw allow 21/tcp
ufw allow 40000:40100/tcp
echo "✅ Firewall rules added"

# Enable and start vsftpd
echo "🚀 Starting vsftpd..."
systemctl enable vsftpd
systemctl restart vsftpd

# Check status
if systemctl is-active --quiet vsftpd; then
  echo "✅ vsftpd is running"
else
  echo "❌ vsftpd failed to start"
  systemctl status vsftpd
  exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "✅ FTP Server Setup Complete!"
echo "═══════════════════════════════════════════════════"
echo ""
echo "FTP Server Details:"
echo "  Port: 21"
echo "  Passive Ports: 40000-40100"
echo "  Base Directory: /home/gamecontrol-ftp"
echo ""
echo "Next Steps:"
echo "  1. FTP users will be created automatically by VM Manager"
echo "  2. Users are added to: /etc/vsftpd.userlist"
echo "  3. Each user gets isolated directory"
echo ""
echo "Commands:"
echo "  Check status:  sudo systemctl status vsftpd"
echo "  Restart:       sudo systemctl restart vsftpd"
echo "  View logs:     sudo journalctl -u vsftpd -f"
echo "  List users:    cat /etc/vsftpd.userlist"
echo ""
echo "Security Notes:"
echo "  ✅ Chroot jail enabled (users can't escape their directory)"
echo "  ✅ Anonymous access disabled"
echo "  ✅ User list access control enabled"
echo "  ⚠️  SSL/TLS currently disabled (can be enabled later)"
echo ""
echo "═══════════════════════════════════════════════════"

