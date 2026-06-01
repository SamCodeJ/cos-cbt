# 🚀 Deployment Scripts

**Automated scripts to deploy C-COS to your VPS**

---

## Scripts Overview

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `vps-setup.sh` | Initial VPS configuration | First time setup only |
| `deploy-backend.sh` | Deploy backend API | After uploading code |
| `deploy-web.sh` | Deploy web portal | After backend is running |
| `update-app.sh` | Update running application | After making code changes |
| `health-check.sh` | Check system health | Anytime, for monitoring |

---

## Prerequisites

These scripts are designed for:
- **OS**: Ubuntu 20.04, 22.04, or Debian-based Linux
- **User**: Root or sudo privileges
- **Shell**: Bash

---

## Usage

### 1. Upload Scripts to VPS

**From Windows (PowerShell):**

```powershell
# Navigate to project directory
cd C:\Users\Donation\Documents\ReactProjects\C-COS-1

# Upload scripts
scp -r deploy-scripts root@YOUR_VPS_IP:/root/
```

**From Linux/Mac:**

```bash
cd /path/to/C-COS-1
scp -r deploy-scripts root@YOUR_VPS_IP:/root/
```

---

### 2. Initial VPS Setup

```bash
# Connect to VPS
ssh root@YOUR_VPS_IP

# Navigate to scripts
cd /root/deploy-scripts

# Make executable
chmod +x vps-setup.sh

# Run setup
./vps-setup.sh
```

**What it does:**
- Updates system packages
- Installs Node.js, PostgreSQL, Nginx, PM2, Certbot
- Creates application user
- Configures firewall
- Creates database
- Sets up backup system

**Prompts you for:**
- Domain name
- Email for SSL
- Database password

---

### 3. Deploy Backend

```bash
# Switch to application user
su - ccos

# Navigate to project
cd /home/ccos/C-COS-1

# Make script executable
chmod +x deploy-scripts/deploy-backend.sh

# Run deployment
./deploy-scripts/deploy-backend.sh
```

**What it does:**
- Installs backend dependencies
- Creates .env file with secure JWT secret
- Runs database migrations
- Seeds initial data
- Starts backend with PM2
- Configures PM2 to start on boot

**Prompts you for:**
- Domain name
- Database password

---

### 4. Deploy Web Portal

```bash
# Still as ccos user
cd /home/ccos/C-COS-1

# Make script executable
chmod +x deploy-scripts/deploy-web.sh

# Run deployment
./deploy-scripts/deploy-web.sh
```

**What it does:**
- Installs frontend dependencies
- Builds React app for production
- Configures Nginx
- Sets up reverse proxy for API
- Enables gzip compression
- Adds security headers

**Prompts you for:**
- Domain name

---

### 5. Configure DNS

**Before proceeding, configure DNS records!**

See: `DNS_CONFIGURATION_GUIDE.md`

Add these A records to your domain:
- `@` → YOUR_VPS_IP
- `www` → YOUR_VPS_IP
- `api` → YOUR_VPS_IP

Wait 5-30 minutes for DNS propagation.

---

### 6. Install SSL Certificate

```bash
# As root or with sudo
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Follow prompts:
# 1. Enter email
# 2. Agree to terms
# 3. Choose redirect HTTP to HTTPS
```

---

### 7. Health Check

```bash
# Check system status
cd /home/ccos/C-COS-1
chmod +x deploy-scripts/health-check.sh
./deploy-scripts/health-check.sh
```

**What it checks:**
- Service status (Nginx, PostgreSQL, PM2)
- Port availability
- API health endpoint
- Database connection
- Disk space
- Memory usage
- SSL certificates
- Recent logs

---

### 8. Update Application (Future Updates)

```bash
# Pull latest changes (if using git)
cd /home/ccos/C-COS-1
git pull

# Run update script
chmod +x deploy-scripts/update-app.sh
./deploy-scripts/update-app.sh

# Choose what to update:
# 1. Backend only
# 2. Web portal only
# 3. Both
```

**What it does:**
- Pulls latest code (optional)
- Updates dependencies
- Runs migrations (optional)
- Rebuilds frontend
- Restarts services

---

## Script Details

### vps-setup.sh

**Purpose:** One-time initial server setup

**Features:**
- ✅ System updates
- ✅ Install all required software
- ✅ Create application user
- ✅ Configure firewall (UFW)
- ✅ Setup PostgreSQL database
- ✅ Create backup script
- ✅ Configure automatic backups

**Run as:** root

**Idempotent:** Partially (safe to run multiple times, but some steps may fail if already done)

---

### deploy-backend.sh

**Purpose:** Deploy Node.js backend API

**Features:**
- ✅ Install npm dependencies
- ✅ Generate secure JWT secret
- ✅ Create environment file
- ✅ Run database migrations
- ✅ Seed demo data
- ✅ Start with PM2 (2 instances)
- ✅ Configure auto-start on boot

**Run as:** ccos user

**Idempotent:** Yes (safe to run multiple times)

---

### deploy-web.sh

**Purpose:** Build and deploy React web portal

**Features:**
- ✅ Install npm dependencies
- ✅ Build production bundle
- ✅ Configure Nginx
- ✅ Enable compression
- ✅ Setup reverse proxy for API
- ✅ Add security headers
- ✅ Cache static assets

**Run as:** ccos user

**Idempotent:** Yes

---

### update-app.sh

**Purpose:** Update running application with new code

**Features:**
- ✅ Pull latest changes from git (optional)
- ✅ Update backend or frontend or both
- ✅ Run migrations (optional)
- ✅ Restart services
- ✅ Zero-downtime updates for frontend
- ✅ Show recent logs

**Run as:** ccos user

**Idempotent:** Yes

---

### health-check.sh

**Purpose:** Monitor system health

**Features:**
- ✅ Check all services (Nginx, PostgreSQL, PM2)
- ✅ Test port availability
- ✅ API health endpoint test
- ✅ Database connection test
- ✅ Disk space monitoring
- ✅ Memory usage
- ✅ SSL certificate status
- ✅ Show recent logs and errors

**Run as:** Any user (some checks require sudo)

**Idempotent:** Yes (read-only, no changes made)

---

## Troubleshooting

### Script Permission Denied

```bash
# Make script executable
chmod +x script-name.sh
```

### Script Not Found

```bash
# Check you're in the right directory
pwd
# Should show: /home/ccos/C-COS-1 or /root/deploy-scripts

# List scripts
ls -la deploy-scripts/
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection manually
psql -U ccos_user -d gesDB -h localhost
```

### PM2 Command Not Found

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

### Nginx Configuration Error

```bash
# Test Nginx config
sudo nginx -t

# View error details
sudo tail -50 /var/log/nginx/error.log
```

---

## Advanced Usage

### Custom Port for Backend

Edit `deploy-backend.sh` before running:

```bash
nano deploy-scripts/deploy-backend.sh
# Change PORT=3001 to desired port
```

Also update Nginx configuration in `deploy-web.sh`:

```bash
nano deploy-scripts/deploy-web.sh
# Change proxy_pass http://localhost:3001 to your port
```

### Multiple Backend Instances (Load Balancing)

```bash
# Instead of starting with script, manually start:
pm2 delete ccos-backend
pm2 start backend/server.js -i 4 --name "ccos-backend"
pm2 save
```

This starts 4 instances (adjust based on CPU cores).

### Custom Database Name

If you want a different database name:

1. Edit `vps-setup.sh` before running:
   ```bash
   # Change CREATE DATABASE gesDB; to your name
   ```

2. Edit `deploy-backend.sh`:
   ```bash
   # Change DB_NAME=gesDB to your name
   ```

---

## Monitoring & Maintenance

### Set Up Cron Jobs

```bash
# Edit crontab
crontab -e

# Add health check every hour
0 * * * * /home/ccos/C-COS-1/deploy-scripts/health-check.sh >> /home/ccos/logs/health.log 2>&1

# Daily backup at 2 AM (already in vps-setup.sh)
0 2 * * * /home/ccos/backups/backup.sh >> /home/ccos/backups/backup.log 2>&1

# Weekly SSL certificate renewal check
0 0 * * 0 certbot renew --quiet && systemctl reload nginx
```

### Log Rotation

```bash
# Install PM2 log rotate
pm2 install pm2-logrotate

# Configure
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

---

## Security Notes

1. **JWT Secret**: Scripts generate a secure random JWT secret. Keep it safe!
2. **Database Password**: Choose a strong password (20+ characters, mixed case, numbers, symbols)
3. **Firewall**: Scripts configure UFW to allow only necessary ports
4. **SSL**: Always use HTTPS in production (scripts help configure)
5. **Backups**: Automated daily backups are set up by vps-setup.sh

---

## Files Created by Scripts

### By vps-setup.sh:
- `/home/ccos/backups/backup.sh` - Database backup script
- `/home/ccos/backups/*.sql.gz` - Database backups
- `/home/ccos/logs/` - Log directory

### By deploy-backend.sh:
- `/home/ccos/C-COS-1/backend/.env` - Backend environment config
- `~/.pm2/` - PM2 configuration and logs

### By deploy-web.sh:
- `/home/ccos/C-COS-1/.env.production` - Frontend environment
- `/home/ccos/C-COS-1/dist/` - Built frontend files
- `/etc/nginx/sites-available/ccos-web` - Nginx config
- `/etc/nginx/sites-enabled/ccos-web` - Nginx enabled config

---

## Need Help?

1. **Read full deployment guide**: `VPS_DEPLOYMENT_GUIDE.md`
2. **Quick start guide**: `QUICK_START_VPS_DEPLOYMENT.md`
3. **DNS configuration**: `DNS_CONFIGURATION_GUIDE.md`
4. **Run health check**: `./health-check.sh`
5. **Check logs**: `pm2 logs ccos-backend`

---

## Contributing

If you improve these scripts:
1. Test thoroughly on fresh VPS
2. Document changes
3. Update this README
4. Submit pull request

---

**Happy Deploying! 🚀**
