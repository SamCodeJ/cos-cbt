# 🔧 VPS Deployment Troubleshooting Guide

**Solutions to common issues during deployment**

---

## Table of Contents

1. [Connection Issues](#connection-issues)
2. [Installation Problems](#installation-problems)
3. [Database Issues](#database-issues)
4. [Backend API Issues](#backend-api-issues)
5. [Frontend/Nginx Issues](#frontendnginx-issues)
6. [DNS and SSL Issues](#dns-and-ssl-issues)
7. [Mobile App Issues](#mobile-app-issues)
8. [Performance Issues](#performance-issues)
9. [Security Issues](#security-issues)

---

## Connection Issues

### Cannot SSH into VPS

**Symptoms:**
```
ssh: connect to host YOUR_IP port 22: Connection refused
```

**Solutions:**

1. **Check VPS is running**
   - Login to your VPS provider's control panel
   - Verify VPS status is "Running"
   - Restart VPS if needed

2. **Verify IP address**
   ```bash
   # Make sure you're using the correct IP
   ping YOUR_VPS_IP
   ```

3. **Check SSH port**
   ```bash
   # Try specifying port explicitly
   ssh -p 22 root@YOUR_VPS_IP
   ```

4. **Check firewall (from VPS console)**
   ```bash
   sudo ufw status
   sudo ufw allow 22/tcp
   ```

5. **Use VPS console**
   - Most providers offer browser-based console
   - Login through control panel
   - Fix SSH from inside

---

### SSH Connection Timeout

**Symptoms:**
```
ssh: connect to host YOUR_IP port 22: Connection timed out
```

**Solutions:**

1. **Check your local firewall**
   - Windows: Allow outbound port 22
   - Antivirus: Check if blocking SSH

2. **Try different network**
   - Some corporate/school networks block SSH
   - Use mobile hotspot or home network

3. **Check VPS firewall**
   - Login via VPS console
   - Check firewall rules

---

## Installation Problems

### Node.js Installation Failed

**Symptoms:**
```
E: Unable to locate package nodejs
```

**Solutions:**

1. **Update package lists**
   ```bash
   sudo apt update
   ```

2. **Install from NodeSource manually**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

3. **Verify installation**
   ```bash
   node --version
   npm --version
   ```

---

### PostgreSQL Installation Issues

**Symptoms:**
```
E: Package 'postgresql' has no installation candidate
```

**Solutions:**

1. **Update repositories**
   ```bash
   sudo apt update
   sudo apt install -y postgresql postgresql-contrib
   ```

2. **Add PostgreSQL repository (if needed)**
   ```bash
   wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
   echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list
   sudo apt update
   sudo apt install -y postgresql-14
   ```

---

### PM2 Command Not Found

**Symptoms:**
```bash
pm2: command not found
```

**Solutions:**

1. **Install PM2 globally**
   ```bash
   sudo npm install -g pm2
   ```

2. **Check npm global path**
   ```bash
   npm config get prefix
   # Should be /usr or /usr/local
   ```

3. **Fix npm permissions**
   ```bash
   sudo chown -R $(whoami) /usr/lib/node_modules
   sudo npm install -g pm2
   ```

---

## Database Issues

### Cannot Create Database

**Symptoms:**
```
ERROR:  permission denied to create database
```

**Solutions:**

1. **Use postgres superuser**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE gesDB;
   ```

2. **Grant privileges properly**
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE gesDB TO ccos_user;
   \c gesDB
   GRANT ALL ON SCHEMA public TO ccos_user;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ccos_user;
   ```

---

### Connection to Database Failed

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**

1. **Check PostgreSQL is running**
   ```bash
   sudo systemctl status postgresql
   
   # If not running
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

2. **Check PostgreSQL is listening**
   ```bash
   sudo netstat -plnt | grep 5432
   # Should show postgres listening on 5432
   ```

3. **Check connection settings**
   ```bash
   # Edit pg_hba.conf
   sudo nano /etc/postgresql/14/main/pg_hba.conf
   
   # Add this line if not exists
   host    all             all             127.0.0.1/32            md5
   
   # Restart PostgreSQL
   sudo systemctl restart postgresql
   ```

4. **Verify .env settings**
   ```bash
   cat backend/.env | grep DB_
   # Check DB_HOST=localhost
   # Check DB_PORT=5432
   # Check DB_USER and DB_PASSWORD are correct
   ```

---

### Database Migration Failed

**Symptoms:**
```
Error running migrations: relation "users" already exists
```

**Solutions:**

1. **Check if tables already exist**
   ```bash
   psql -U ccos_user -d gesDB -h localhost
   \dt
   # If tables exist, migrations already ran
   ```

2. **Reset database (WARNING: Deletes all data)**
   ```bash
   psql -U ccos_user -d gesDB -h localhost
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   GRANT ALL ON SCHEMA public TO ccos_user;
   \q
   
   # Run migrations again
   cd /home/ccos/C-COS-1/backend
   npm run db:migrate
   ```

---

## Backend API Issues

### Backend Won't Start

**Symptoms:**
```
Error: Cannot find module 'express'
```

**Solutions:**

1. **Install dependencies**
   ```bash
   cd /home/ccos/C-COS-1/backend
   npm install --production
   ```

2. **Check for errors**
   ```bash
   npm start
   # Read error messages carefully
   ```

3. **Verify .env file exists**
   ```bash
   ls -la backend/.env
   cat backend/.env
   ```

---

### Port 3001 Already in Use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solutions:**

1. **Find and kill process using port**
   ```bash
   sudo lsof -i :3001
   # Note the PID
   sudo kill -9 PID
   ```

2. **Use different port**
   ```bash
   # Edit backend/.env
   PORT=3002
   
   # Also update Nginx proxy in deploy-web.sh
   ```

3. **Check PM2 isn't already running it**
   ```bash
   pm2 status
   pm2 delete ccos-backend
   ```

---

### JWT Token Errors

**Symptoms:**
```
Error: jwt malformed
Error: jwt must be provided
```

**Solutions:**

1. **Verify JWT_SECRET is set**
   ```bash
   grep JWT_SECRET backend/.env
   # Should show a long random string
   ```

2. **Generate new JWT secret**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   # Copy output to .env
   ```

3. **Restart backend**
   ```bash
   pm2 restart ccos-backend
   ```

---

### CORS Errors

**Symptoms:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solutions:**

1. **Check CORS_ORIGIN in .env**
   ```bash
   cat backend/.env | grep CORS_ORIGIN
   # Should be: CORS_ORIGIN=https://yourdomain.com
   ```

2. **Update allowedOrigins in server.js**
   ```bash
   nano backend/server.js
   # Add your domain to allowedOrigins array
   ```

3. **For development, temporarily allow all**
   ```javascript
   // In server.js (NOT for production!)
   app.use(cors({
     origin: true,
     credentials: true
   }));
   ```

4. **Restart backend**
   ```bash
   pm2 restart ccos-backend
   ```

---

## Frontend/Nginx Issues

### Nginx Won't Start

**Symptoms:**
```
nginx: [emerg] bind() to 0.0.0.0:80 failed
```

**Solutions:**

1. **Check if another service is using port 80**
   ```bash
   sudo lsof -i :80
   # Kill the process or stop it
   ```

2. **Check Nginx configuration**
   ```bash
   sudo nginx -t
   # Fix any syntax errors shown
   ```

3. **Check file permissions**
   ```bash
   sudo chown -R www-data:www-data /var/log/nginx
   ```

---

### 502 Bad Gateway

**Symptoms:**
Browser shows: "502 Bad Gateway"

**Solutions:**

1. **Check backend is running**
   ```bash
   pm2 status
   # ccos-backend should be "online"
   
   curl http://localhost:3001/health
   # Should return {"status":"ok"}
   ```

2. **Check Nginx proxy settings**
   ```bash
   sudo nano /etc/nginx/sites-available/ccos-web
   # Verify proxy_pass http://localhost:3001;
   ```

3. **Check Nginx error logs**
   ```bash
   sudo tail -50 /var/log/nginx/error.log
   ```

4. **Restart both services**
   ```bash
   pm2 restart ccos-backend
   sudo systemctl restart nginx
   ```

---

### 404 Not Found on Refresh

**Symptoms:**
- Homepage loads fine
- Click links, works fine
- Refresh page, get 404

**Solutions:**

1. **Check Nginx configuration has try_files**
   ```bash
   sudo nano /etc/nginx/sites-available/ccos-web
   ```
   
   Should have:
   ```nginx
   location / {
       try_files $uri $uri/ /index.html;
   }
   ```

2. **Reload Nginx**
   ```bash
   sudo systemctl reload nginx
   ```

---

### Web Portal Shows White Screen

**Symptoms:**
- Page loads but shows blank/white screen
- No errors in browser

**Solutions:**

1. **Check browser console**
   - Press F12 in browser
   - Look for errors in Console tab
   - Usually shows API connection issues

2. **Verify API URL in build**
   ```bash
   cat .env.production
   # Should show correct API URL
   ```

3. **Rebuild with correct API URL**
   ```bash
   npm run build
   sudo systemctl reload nginx
   ```

4. **Clear browser cache**
   - Ctrl+F5 (hard refresh)
   - Or clear cache in browser settings

---

## DNS and SSL Issues

### DNS Not Resolving

**Symptoms:**
```
ping: yourdomain.com: Name or service not known
```

**Solutions:**

1. **Wait longer**
   - DNS can take up to 48 hours to propagate
   - Usually 5-30 minutes

2. **Check DNS records in registrar**
   - Login to domain registrar
   - Verify A records are correct
   - Check for typos in IP address

3. **Test with different DNS**
   ```bash
   nslookup yourdomain.com 8.8.8.8
   # Tests using Google DNS
   ```

4. **Clear local DNS cache**
   
   **Windows:**
   ```cmd
   ipconfig /flushdns
   ```
   
   **Mac:**
   ```bash
   sudo dscacheutil -flushcache
   ```
   
   **Linux:**
   ```bash
   sudo systemd-resolve --flush-caches
   ```

---

### SSL Certificate Installation Failed

**Symptoms:**
```
Certbot failed to authenticate some domains
```

**Solutions:**

1. **Check DNS is working**
   ```bash
   ping yourdomain.com
   # Must resolve to your VPS IP
   ```

2. **Check Nginx is running on port 80**
   ```bash
   sudo systemctl status nginx
   curl http://yourdomain.com
   ```

3. **Check firewall allows ports 80 and 443**
   ```bash
   sudo ufw status
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

4. **Try manual certificate**
   ```bash
   sudo certbot certonly --nginx -d yourdomain.com
   ```

5. **Check rate limits**
   - Let's Encrypt has rate limits
   - If you tried many times, wait 1 hour
   - See: https://letsencrypt.org/docs/rate-limits/

---

### SSL Certificate Expired

**Symptoms:**
Browser shows: "Your connection is not private"

**Solutions:**

1. **Check certificate status**
   ```bash
   sudo certbot certificates
   ```

2. **Renew certificate**
   ```bash
   sudo certbot renew
   sudo systemctl reload nginx
   ```

3. **Force renewal if needed**
   ```bash
   sudo certbot renew --force-renewal
   sudo systemctl reload nginx
   ```

4. **Setup auto-renewal**
   ```bash
   # Test renewal process
   sudo certbot renew --dry-run
   
   # Add to crontab
   crontab -e
   # Add: 0 0 * * 0 certbot renew --quiet && systemctl reload nginx
   ```

---

## Mobile App Issues

### Mobile App Can't Connect to API

**Symptoms:**
- App shows "Network Error"
- Login fails with connection error

**Solutions:**

1. **Verify API URL in mobile app**
   ```javascript
   // In mobile/src/api/client.js
   console.log(API_BASE_URL);
   // Should be: https://api.yourdomain.com/api
   ```

2. **Test API from browser**
   ```
   https://api.yourdomain.com/health
   # Should return JSON
   ```

3. **Check backend CORS allows mobile**
   ```bash
   # On VPS
   nano backend/server.js
   ```
   
   Should have:
   ```javascript
   app.use(cors({
     origin: function(origin, callback) {
       if (!origin) return callback(null, true); // Allow mobile
       // ... rest of code
     }
   }));
   ```

4. **Restart backend**
   ```bash
   pm2 restart ccos-backend
   ```

---

### Mobile App SSL Certificate Error

**Symptoms:**
```
Error: Network Error
SSL certificate problem
```

**Solutions:**

1. **Check SSL certificate is valid**
   ```bash
   curl https://api.yourdomain.com/health
   # Should not show certificate errors
   ```

2. **Test in browser**
   - Open `https://api.yourdomain.com` in phone browser
   - Should not show security warning

3. **For development only: Disable SSL verification**
   ```javascript
   // ONLY FOR TESTING! Remove in production
   // In mobile/src/api/client.js
   axios.defaults.rejectUnauthorized = false;
   ```

---

## Performance Issues

### Slow Response Times

**Symptoms:**
- Pages load slowly
- API requests take >2 seconds

**Solutions:**

1. **Check server resources**
   ```bash
   htop
   # Check CPU and memory usage
   ```

2. **Optimize PostgreSQL**
   ```bash
   sudo nano /etc/postgresql/14/main/postgresql.conf
   # Increase shared_buffers, effective_cache_size
   # See VPS_DEPLOYMENT_GUIDE.md for values
   ```

3. **Scale backend with PM2**
   ```bash
   pm2 delete ccos-backend
   pm2 start backend/server.js -i 4 --name "ccos-backend"
   pm2 save
   ```

4. **Enable Nginx caching**
   ```bash
   sudo nano /etc/nginx/sites-available/ccos-web
   # Add caching directives (see deployment guide)
   ```

---

### High Memory Usage

**Symptoms:**
```
free -h shows >90% memory used
```

**Solutions:**

1. **Restart services**
   ```bash
   pm2 restart all
   sudo systemctl restart nginx
   ```

2. **Reduce PM2 instances**
   ```bash
   pm2 delete ccos-backend
   pm2 start backend/server.js -i 2 --name "ccos-backend"
   ```

3. **Add swap space**
   ```bash
   sudo fallocate -l 4G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   # Make permanent:
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```

---

### Database Too Slow

**Symptoms:**
- Queries take >1 second
- High database CPU usage

**Solutions:**

1. **Add database indexes**
   ```sql
   psql -U ccos_user -d gesDB -h localhost
   
   CREATE INDEX IF NOT EXISTS idx_exam_attempts_candidate ON exam_attempts(candidate_id);
   CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam ON exam_attempts(exam_id);
   CREATE INDEX IF NOT EXISTS idx_exams_teacher ON exams(teacher_id);
   ```

2. **Analyze database**
   ```sql
   VACUUM ANALYZE;
   ```

3. **Check slow queries**
   ```bash
   # Enable query logging
   sudo nano /etc/postgresql/14/main/postgresql.conf
   # Set: log_min_duration_statement = 1000
   # Restart PostgreSQL
   sudo systemctl restart postgresql
   ```

---

## Security Issues

### Unauthorized Access Attempts

**Symptoms:**
- SSH login attempts in logs
- Unusual traffic

**Solutions:**

1. **Install Fail2ban**
   ```bash
   sudo apt install -y fail2ban
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```

2. **Setup SSH key authentication**
   ```bash
   # On local machine, generate key
   ssh-keygen -t rsa -b 4096
   
   # Copy to VPS
   ssh-copy-id ccos@YOUR_VPS_IP
   
   # Disable password auth
   sudo nano /etc/ssh/sshd_config
   # Set: PasswordAuthentication no
   sudo systemctl restart sshd
   ```

3. **Change SSH port (optional)**
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Change: Port 22 to Port 2222
   sudo systemctl restart sshd
   
   # Update firewall
   sudo ufw allow 2222/tcp
   ```

---

### Database Security

**Solutions:**

1. **Never expose PostgreSQL port externally**
   ```bash
   sudo ufw status
   # Should NOT show: 5432 ALLOW Anywhere
   ```

2. **Use strong passwords**
   ```bash
   # Change database password
   sudo -u postgres psql
   ALTER USER ccos_user WITH PASSWORD 'NEW_STRONG_PASSWORD';
   \q
   
   # Update backend/.env
   ```

3. **Regular security updates**
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo reboot
   ```

---

## Emergency Procedures

### Restore from Backup

```bash
# Stop backend
pm2 stop ccos-backend

# Restore database
cd /home/ccos/backups
gunzip -c gesDB_YYYYMMDD_HHMMSS.sql.gz | psql -U ccos_user -d gesDB -h localhost

# Restart backend
pm2 restart ccos-backend
```

---

### Complete System Reset

**WARNING: This deletes everything!**

```bash
# Stop all services
pm2 delete all
sudo systemctl stop nginx

# Drop database
sudo -u postgres psql
DROP DATABASE gesDB;
CREATE DATABASE gesDB;
GRANT ALL PRIVILEGES ON DATABASE gesDB TO ccos_user;
\q

# Re-run deployment
cd /home/ccos/C-COS-1
./deploy-scripts/deploy-backend.sh
./deploy-scripts/deploy-web.sh
```

---

## Getting Help

### Collect Debug Information

Before asking for help, collect this info:

```bash
# System info
uname -a
lsb_release -a

# Service status
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql

# Recent logs
pm2 logs ccos-backend --lines 50 --nostream
sudo tail -50 /var/log/nginx/error.log

# Health check
cd /home/ccos/C-COS-1
./deploy-scripts/health-check.sh
```

---

### Common Log Locations

- **Backend logs**: `pm2 logs ccos-backend`
- **Nginx access**: `/var/log/nginx/access.log`
- **Nginx error**: `/var/log/nginx/error.log`
- **PostgreSQL**: `/var/log/postgresql/postgresql-14-main.log`
- **System logs**: `/var/log/syslog`

---

**Still stuck? Check other documentation files or create a GitHub issue with the debug information above.**
