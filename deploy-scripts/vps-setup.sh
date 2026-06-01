#!/bin/bash

# C-COS VPS Initial Setup Script
# This script automates the initial VPS setup process
# Run as root or with sudo privileges

set -e  # Exit on error

echo "======================================"
echo "C-COS VPS Setup Script"
echo "======================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root or with sudo"
    exit 1
fi

# Get user inputs
read -p "Enter domain name (e.g., example.com): " DOMAIN
read -p "Enter email for SSL certificates: " EMAIL
read -sp "Enter PostgreSQL password: " DB_PASSWORD
echo ""
read -sp "Confirm PostgreSQL password: " DB_PASSWORD_CONFIRM
echo ""

if [ "$DB_PASSWORD" != "$DB_PASSWORD_CONFIRM" ]; then
    echo "Passwords do not match!"
    exit 1
fi

echo ""
echo "======================================"
echo "Step 1: Updating System"
echo "======================================"
apt update && apt upgrade -y
apt install -y curl wget git vim ufw build-essential

echo ""
echo "======================================"
echo "Step 2: Creating Application User"
echo "======================================"
if id "ccos" &>/dev/null; then
    echo "User 'ccos' already exists"
else
    adduser --disabled-password --gecos "" ccos
    usermod -aG sudo ccos
    echo "User 'ccos' created"
fi

echo ""
echo "======================================"
echo "Step 3: Configuring Firewall"
echo "======================================"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status

echo ""
echo "======================================"
echo "Step 4: Installing Node.js 18"
echo "======================================"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

echo ""
echo "======================================"
echo "Step 5: Installing PostgreSQL"
echo "======================================"
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
echo "PostgreSQL installed and started"

echo ""
echo "======================================"
echo "Step 6: Setting up Database"
echo "======================================"
# Create database and user
sudo -u postgres psql <<EOF
CREATE DATABASE gesDB;
CREATE USER ccos_user WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE gesDB TO ccos_user;
\c gesDB
GRANT ALL ON SCHEMA public TO ccos_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ccos_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ccos_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ccos_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ccos_user;
EOF
echo "Database 'gesDB' created successfully"

echo ""
echo "======================================"
echo "Step 7: Installing Nginx"
echo "======================================"
apt install -y nginx
systemctl start nginx
systemctl enable nginx
echo "Nginx installed and started"

echo ""
echo "======================================"
echo "Step 8: Installing PM2"
echo "======================================"
npm install -g pm2
echo "PM2 version: $(pm2 --version)"

echo ""
echo "======================================"
echo "Step 9: Installing Certbot"
echo "======================================"
apt install -y certbot python3-certbot-nginx
echo "Certbot installed"

echo ""
echo "======================================"
echo "Step 10: Creating directories"
echo "======================================"
mkdir -p /home/ccos/backups
mkdir -p /home/ccos/logs
chown -R ccos:ccos /home/ccos
echo "Directories created"

echo ""
echo "======================================"
echo "Step 11: Creating backup script"
echo "======================================"
cat > /home/ccos/backups/backup.sh <<'EOFBACKUP'
#!/bin/bash
BACKUP_DIR="/home/ccos/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/gesDB_$DATE.sql"

# Backup database
PGPASSWORD="REPLACE_WITH_DB_PASSWORD" pg_dump -U ccos_user -h localhost gesDB > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "gesDB_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
EOFBACKUP

# Replace password in backup script
sed -i "s/REPLACE_WITH_DB_PASSWORD/$DB_PASSWORD/g" /home/ccos/backups/backup.sh
chmod +x /home/ccos/backups/backup.sh
chown ccos:ccos /home/ccos/backups/backup.sh

echo ""
echo "======================================"
echo "Setup Complete!"
echo "======================================"
echo ""
echo "Configuration Summary:"
echo "----------------------"
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo "Database: gesDB"
echo "Database User: ccos_user"
echo "Application User: ccos"
echo ""
echo "Next Steps:"
echo "1. Upload your code to /home/ccos/C-COS-1"
echo "2. Run the deployment script: ./deploy-backend.sh"
echo "3. Run the web deployment script: ./deploy-web.sh"
echo "4. Configure DNS records for $DOMAIN"
echo "5. Run: certbot --nginx -d $DOMAIN -d www.$DOMAIN -d api.$DOMAIN"
echo ""
echo "Save this information securely:"
echo "Database Password: [HIDDEN]"
echo ""
