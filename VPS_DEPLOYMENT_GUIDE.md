# 🚀 UI-GES VPS Deployment Guide

**Complete guide to deploying UI-GES to your VPS with custom domain**

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [VPS Initial Setup](#vps-initial-setup)
3. [Install Required Software](#install-required-software)
4. [Deploy Backend API](#deploy-backend-api)
5. [Deploy Web Portal](#deploy-web-portal)
6. [Configure Domain & SSL](#configure-domain--ssl)
7. [Setup Mobile App](#setup-mobile-app)
8. [Desktop Portal Setup](#desktop-portal-setup)
9. [Production Optimization](#production-optimization)
10. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### What You Need:
- ✅ VPS server (Ubuntu 20.04+ or 22.04 recommended)
- ✅ Domain name (e.g., `yourdomain.com`)
- ✅ SSH access to your VPS
- ✅ Root or sudo privileges
- ✅ This codebase ready to upload

### Recommended VPS Specs:
For **1,000 concurrent users** (as per your documentation):
- **CPU**: 8-12 cores
- **RAM**: 32-64 GB
- **Storage**: 200+ GB SSD
- **Bandwidth**: 500 Mbps+

For **smaller deployments** (100-200 users):
- **CPU**: 4 cores
- **RAM**: 8-16 GB
- **Storage**: 50+ GB SSD
- **Bandwidth**: 100 Mbps+

---

## 🖥️ VPS Initial Setup

### Step 1: Connect to Your VPS

```bash
# From your local machine
ssh root@YOUR_VPS_IP

# Or if you have a non-root user
ssh your_username@YOUR_VPS_IP
```

### Step 2: Update System

```bash
# Update package lists
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git vim ufw build-essential
```

### Step 3: Create Application User

```bash
# Create a dedicated user for the application
sudo adduser uiges
sudo usermod -aG sudo uiges

# Switch to the new user
su - uiges
```

### Step 4: Setup Firewall

```bash
# Enable firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 3001/tcp    # Backend API (temporary, will proxy through Nginx)
sudo ufw enable
sudo ufw status
```

---

## 📦 Install Required Software

### Step 1: Install Node.js 18+

```bash
# Install NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version
```

### Step 2: Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
sudo systemctl status postgresql
```

### Step 3: Setup PostgreSQL Database

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt, run:
CREATE DATABASE gesDB;
CREATE USER uiges_user WITH ENCRYPTED PASSWORD 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE gesDB TO uiges_user;

# Grant additional privileges (PostgreSQL 15+)
\c gesDB
GRANT ALL ON SCHEMA public TO uiges_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO uiges_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO uiges_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO uiges_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO uiges_user;

# Exit
\q
```

### Step 4: Install Nginx (Web Server)

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify
sudo systemctl status nginx
```

### Step 5: Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify
pm2 --version
```

### Step 6: Install Certbot (SSL Certificates)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

---

## 🔧 Deploy Backend API

### Step 1: Upload Your Code

**Option A: Using Git (Recommended)**

```bash
# On your VPS
cd /home/uiges
git clone https://github.com/YOUR_USERNAME/UI-GES-1.git
cd UI-GES-1
```

**Option B: Using SCP (Manual Upload)**

```bash
# From your local machine (in your project directory)
# Replace YOUR_VPS_IP with actual IP
scp -r . uiges@YOUR_VPS_IP:/home/uiges/UI-GES-1
```

**Option C: Using FTP/SFTP**
- Use FileZilla or WinSCP
- Upload entire project to `/home/uiges/UI-GES-1`

### Step 2: Setup Backend Environment

```bash
cd /home/uiges/UI-GES-1/backend

# Install dependencies
npm install --production

# Create environment file
nano .env
```

Add the following to `.env`:

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration (use the password you set earlier)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gesDB
DB_USER=uiges_user
DB_PASSWORD=STRONG_PASSWORD_HERE

# JWT Configuration (CHANGE THIS!)
JWT_SECRET=GENERATE_A_VERY_LONG_RANDOM_STRING_HERE_USE_AT_LEAST_64_CHARACTERS
JWT_EXPIRES_IN=7d

# CORS Configuration (will update after domain setup)
CORS_ORIGIN=https://yourdomain.com
```

**Generate a strong JWT secret:**

```bash
# Run this command to generate a random secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Save and exit (Ctrl+X, then Y, then Enter)

### Step 3: Initialize Database

```bash
# Still in backend directory
npm run db:migrate
npm run db:seed
```

### Step 4: Test Backend

```bash
# Start backend temporarily
npm start

# In another SSH session, test:
curl http://localhost:3001/health
# Should return: {"status":"ok"}

# Stop the server (Ctrl+C in first session)
```

### Step 5: Setup PM2 for Backend

```bash
# Start backend with PM2
pm2 start server.js --name "uiges-backend"

# Configure PM2 to start on boot
pm2 startup
# Copy and run the command it outputs

pm2 save

# Check status
pm2 status
pm2 logs uiges-backend
```

---

## 🌐 Deploy Web Portal

### Step 1: Configure API URL

```bash
cd /home/uiges/UI-GES-1

# Create production environment file
nano .env.production
```

Add:

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

Replace `yourdomain.com` with your actual domain.

### Step 2: Build Web Portal

```bash
# Install dependencies
npm install

# Build for production
npm run build

# The build output will be in 'dist' folder
ls -la dist/
```

### Step 3: Setup Nginx for Web Portal

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/uiges-web
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Web Portal (React App)
    root /home/uiges/UI-GES-1/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Enable compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}

server {
    listen 80;
    server_name api.yourdomain.com;
    
    # Backend API
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for long-running requests
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

**Replace all instances of `yourdomain.com` with your actual domain!**

```bash
# Enable the configuration
sudo ln -s /etc/nginx/sites-available/uiges-web /etc/nginx/sites-enabled/

# Remove default configuration
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

---

## 🔒 Configure Domain & SSL

### Step 1: Configure DNS Records

Go to your domain registrar's DNS management and add these records:

```
Type    Name    Value               TTL
----    ----    -----               ---
A       @       YOUR_VPS_IP         3600
A       www     YOUR_VPS_IP         3600
A       api     YOUR_VPS_IP         3600
```

**Wait 5-30 minutes for DNS propagation**

### Step 2: Verify DNS

```bash
# Test if DNS is working
ping yourdomain.com
ping api.yourdomain.com
```

### Step 3: Install SSL Certificates

```bash
# Get SSL certificates for all domains
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Follow the prompts:
# 1. Enter your email
# 2. Agree to terms
# 3. Choose to redirect HTTP to HTTPS (option 2)
```

Certbot will automatically:
- Get SSL certificates from Let's Encrypt
- Update your Nginx configuration
- Setup auto-renewal

### Step 4: Test SSL

Visit in your browser:
- `https://yourdomain.com` - Should show your web portal
- `https://api.yourdomain.com/health` - Should show `{"status":"ok"}`

### Step 5: Update Backend CORS

```bash
cd /home/uiges/UI-GES-1/backend
nano .env
```

Update CORS_ORIGIN:

```env
CORS_ORIGIN=https://yourdomain.com
```

Restart backend:

```bash
pm2 restart uiges-backend
```

---

## 📱 Setup Mobile App

### Step 1: Update API URL

On your **local development machine** (not VPS):

```bash
cd mobile/src/api
```

Edit `client.js` and update:

```javascript
const API_BASE_URL = 'https://api.yourdomain.com/api';
```

### Step 2: Update Backend CORS for Mobile

```bash
# On VPS
cd /home/uiges/UI-GES-1/backend
nano server.js
```

Find the `allowedOrigins` array and update it to allow mobile:

```javascript
const allowedOrigins = [
  'https://yourdomain.com',
  'https://www.yourdomain.com',
  'http://localhost:5173', // Keep for development
  'http://localhost:19006' // Keep for Expo development
];
```

Also update the CORS configuration to be more permissive for mobile:

```javascript
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      return callback(null, true);
    }
    
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

Restart backend:

```bash
pm2 restart uiges-backend
```

### Step 3: Build Mobile App

**For Android:**

```bash
# On your local machine
cd mobile
eas build --platform android --profile production
```

**For iOS:**

```bash
# On your local machine (requires macOS)
cd mobile
eas build --platform ios --profile production
```

Follow Expo's documentation for building and publishing: https://docs.expo.dev/build/introduction/

---

## 🖥️ Desktop Portal Setup

### Step 1: Build Desktop App

On your **local machine**:

```bash
cd desktop
npm install

# Update API URL in desktop/src/api/client.js
# Change to: https://api.yourdomain.com/api

npm run build
```

### Step 2: Package Desktop App

The desktop portal can be distributed as:
- Electron app (Windows/Mac/Linux)
- Simple Chromium shortcut to web portal
- Kiosk mode browser

For Electron packaging:

```bash
cd desktop
npm run package
```

Distribute the executable to computer lab machines.

---

## ⚡ Production Optimization

### Step 1: Optimize PostgreSQL

```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```

Add/update these settings (adjust based on your RAM):

```conf
# For 32GB RAM server
shared_buffers = 8GB
effective_cache_size = 24GB
maintenance_work_mem = 2GB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 41943kB
min_wal_size = 1GB
max_wal_size = 4GB
max_worker_processes = 8
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
max_parallel_maintenance_workers = 4
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

### Step 2: Setup Database Backups

```bash
# Create backup script
mkdir -p /home/uiges/backups
nano /home/uiges/backups/backup.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/home/uiges/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/gesDB_$DATE.sql"

# Backup database
PGPASSWORD="YOUR_DB_PASSWORD" pg_dump -U uiges_user -h localhost gesDB > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "gesDB_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

Make executable and setup cron:

```bash
chmod +x /home/uiges/backups/backup.sh

# Setup daily backup at 2 AM
crontab -e
```

Add:

```
0 2 * * * /home/uiges/backups/backup.sh >> /home/uiges/backups/backup.log 2>&1
```

### Step 3: Setup Monitoring

```bash
# Install monitoring tools
sudo npm install -g pm2-logrotate

# Configure log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### Step 4: Performance Tuning

Edit backend `.env`:

```env
# Increase for production
NODE_ENV=production
MAX_CONNECTIONS=1000
```

Update PM2 configuration:

```bash
pm2 delete uiges-backend

# Start with clustering (4 instances)
pm2 start server.js -i 4 --name "uiges-backend"

pm2 save
```

---

## 📊 Monitoring & Maintenance

### Check System Status

```bash
# Check all services
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql

# Check resource usage
htop
# or
top

# Check disk space
df -h

# Check memory
free -h
```

### View Logs

```bash
# Backend logs
pm2 logs uiges-backend

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Restart Services

```bash
# Restart backend
pm2 restart uiges-backend

# Restart Nginx
sudo systemctl restart nginx

# Restart PostgreSQL (careful!)
sudo systemctl restart postgresql
```

### Update Application

```bash
cd /home/uiges/UI-GES-1

# Pull latest changes
git pull

# Update backend
cd backend
npm install --production
pm2 restart uiges-backend

# Update web portal
cd ..
npm install
npm run build
```

---

## 🔐 Security Checklist

- [ ] Changed all default passwords
- [ ] Generated strong JWT secret
- [ ] Enabled firewall (ufw)
- [ ] Installed SSL certificates
- [ ] Setup automatic security updates
- [ ] Configured database backups
- [ ] Limited SSH access (consider SSH keys only)
- [ ] Setup fail2ban for brute force protection
- [ ] Regular security audits

### Optional: Install Fail2ban

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 🎯 Testing Your Deployment

### 1. Test Web Portal
- Visit `https://yourdomain.com`
- Login with: `admin@uiges.com` / `password`
- Create a test exam
- Add candidates and questions

### 2. Test API
```bash
curl https://api.yourdomain.com/health
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@uiges.com","password":"password"}'
```

### 3. Test Mobile App
- Install on device
- Login with: `candidate@uiges.com` / `password`
- Take test exam

---

## 🆘 Troubleshooting

### Issue: Website not loading

```bash
# Check Nginx is running
sudo systemctl status nginx

# Check Nginx configuration
sudo nginx -t

# View error logs
sudo tail -50 /var/log/nginx/error.log
```

### Issue: API not responding

```bash
# Check backend is running
pm2 status

# View backend logs
pm2 logs uiges-backend --lines 50

# Restart backend
pm2 restart uiges-backend
```

### Issue: Database connection error

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U uiges_user -d gesDB -h localhost

# Check credentials in backend/.env
```

### Issue: SSL certificate error

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate (if needed)
sudo certbot renew

# Reload Nginx
sudo systemctl reload nginx
```

---

## 📞 Support & Resources

- **Documentation**: Check all `.md` files in project root
- **Backend Setup**: `BACKEND_SETUP_GUIDE.md`
- **System Overview**: `COMPLETE_SYSTEM_SUMMARY.md`
- **Troubleshooting**: `TROUBLESHOOTING.md`

---

## 🎉 Success!

Your UI-GES system is now live on:

- **Web Portal**: `https://yourdomain.com`
- **API**: `https://api.yourdomain.com`
- **Mobile**: Connected to your API
- **Desktop**: Distributed to computer labs

**Next Steps:**
1. Change all default passwords
2. Customize branding (logo, colors)
3. Train your staff
4. Run pilot tests
5. Full rollout!

---

**Deployment completed! 🚀 Your CBT system is production-ready!**
