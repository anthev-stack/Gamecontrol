#!/bin/bash

#################################################
# Enable SSL/TLS for FTP (FTPS)
# Run this after basic FTP setup for encrypted connections
#################################################

set -e

echo "🔐 Enabling FTPS (FTP over SSL/TLS)"
echo "===================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Please run as root (use sudo)"
  exit 1
fi

# Generate self-signed certificate
echo "📜 Generating SSL certificate..."
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /etc/ssl/private/vsftpd.key \
  -out /etc/ssl/certs/vsftpd.crt \
  -subj "/C=US/ST=State/L=City/O=GameControl/CN=$(hostname)"

chmod 600 /etc/ssl/private/vsftpd.key
chmod 644 /etc/ssl/certs/vsftpd.crt

echo "✅ Certificate generated"

# Update vsftpd config for SSL
echo "⚙️  Updating configuration..."
cat >> /etc/vsftpd.conf << 'EOF'

# SSL/TLS Settings
ssl_enable=YES
allow_anon_ssl=NO
force_local_data_ssl=YES
force_local_logins_ssl=YES
ssl_tlsv1=YES
ssl_sslv2=NO
ssl_sslv3=NO
require_ssl_reuse=NO
ssl_ciphers=HIGH

# Certificate paths
rsa_cert_file=/etc/ssl/certs/vsftpd.crt
rsa_private_key_file=/etc/ssl/private/vsftpd.key
EOF

# Restart vsftpd
echo "🔄 Restarting vsftpd..."
systemctl restart vsftpd

echo ""
echo "✅ FTPS Enabled!"
echo ""
echo "FileZilla Settings:"
echo "  Encryption: Require explicit FTP over TLS"
echo "  Port: 21"
echo ""
echo "Note: Self-signed certificate will show a warning"
echo "Users need to accept it on first connection"
echo ""

