# 🚀 Quick Start: Deploy C-COS to VPS

**Get your system running in under 30 minutes!**

---

## Prerequisites Checklist

- [ ] VPS with Ubuntu 20.04 or 22.04
- [ ] Domain name purchased
- [ ] SSH access to VPS (root or sudo user)
- [ ] Project files ready

---

## Step-by-Step Deployment

### 1️⃣ Initial VPS Setup (10 minutes)

```bash
# Connect to your VPS
ssh root@YOUR_VPS_IP

# Upload the setup script
# From your local machine:
scp deploy-scripts/vps-setup.sh root@YOUR_VPS_IP:/root/

# On VPS, run the setup script
chmod +x vps-setup.sh
./vps-setup.sh

# Follow the prompts and enter:
# - Your domain name
# - Your email for SSL
# - Database password (save this!)
```

This script will install:
- Node.js 18
- PostgreSQL
- Nginx
- PM2
- Certbot
- Configure firewall
- Create database and user

---

### 2️⃣ Upload Your Code (5 minutes)

**Option A: Using Git**

```bash
# On VPS as ccos user
su - ccos
cd /home/ccos
git clone https://github.com/YOUR_USERNAME/C-COS-1.git
cd C-COS-1
```

**Option B: Using SCP**

```bash
# From your local machine (in project folder)
cd c:\Users\Donation\Documents\ReactProjects\C-COS-1
scp -r . ccos@YOUR_VPS_IP:/home/ccos/C-COS-1
```

**Option C: Using FileZilla/WinSCP**
- Connect to: YOUR_VPS_IP
- Username: ccos
- Upload entire project to: /home/ccos/C-COS-1

---

### 3️⃣ Deploy Backend (5 minutes)

```bash
# On VPS
cd /home/ccos/C-COS-1

# Make script executable
chmod +x deploy-scripts/deploy-backend.sh

# Run deployment
./deploy-scripts/deploy-backend.sh

# Enter when prompted:
# - Your domain name
# - Database password (from step 1)
```

This will:
- Install dependencies
- Create .env file
- Run migrations
- Seed database
- Start backend with PM2

Test backend:
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok"}
```

---

### 4️⃣ Deploy Web Portal (5 minutes)

```bash
# Still on VPS
cd /home/ccos/C-COS-1

# Make script executable
chmod +x deploy-scripts/deploy-web.sh

# Run deployment
./deploy-scripts/deploy-web.sh

# Enter your domain when prompted
```

This will:
- Build React app
- Configure Nginx
- Set up reverse proxy

---

### 5️⃣ Configure DNS (5 minutes + waiting time)

Go to your domain registrar (GoDaddy, Namecheap, etc.) and add these DNS records:

```
Type    Name    Value               TTL
----    ----    -----               ---
A       @       YOUR_VPS_IP         3600
A       www     YOUR_VPS_IP         3600
A       api     YOUR_VPS_IP         3600
```

**Wait 5-30 minutes for DNS propagation**

Check DNS propagation:
```bash
# From your local machine
ping yourdomain.com
ping api.yourdomain.com
```

---

### 6️⃣ Install SSL Certificate (2 minutes)

```bash
# On VPS
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Follow prompts:
# 1. Enter email
# 2. Agree to terms
# 3. Choose redirect HTTP to HTTPS (option 2)
```

---

### 7️⃣ Test Everything! ✅

**Web Portal:**
- Open browser: `https://yourdomain.com`
- Login: `admin@ccos.com` / `password`
- Should see dashboard

**API:**
- Open: `https://api.yourdomain.com/health`
- Should see: `{"status":"ok"}`

**Create Test Exam:**
1. Login to web portal
2. Click "Create Exam"
3. Add title, candidates, questions
4. Save

---

## 🎯 What's Running

After successful deployment:

| Service | Location | Status Check |
|---------|----------|--------------|
| Backend API | `https://api.yourdomain.com` | `pm2 status` |
| Web Portal | `https://yourdomain.com` | Browser |
| Database | localhost:5432 | `sudo systemctl status postgresql` |
| Nginx | localhost:80/443 | `sudo systemctl status nginx` |

---

## 🔐 Change Default Passwords

**IMPORTANT: Change these immediately!**

```bash
# Connect to database
psql -U ccos_user -d gesDB -h localhost

# Change admin password (in psql)
UPDATE users SET password_hash = crypt('YOUR_NEW_PASSWORD', gen_salt('bf')) WHERE email = 'admin@ccos.com';

UPDATE users SET password_hash = crypt('YOUR_NEW_PASSWORD', gen_salt('bf')) WHERE email = 'teacher@ccos.com';

\q
```

Or use the web portal:
1. Login as admin
2. Go to Settings
3. Change password

---

## 📱 Configure Mobile App

On your **local development machine**:

1. **Update API URL:**
   ```bash
   cd mobile/src/api
   # Edit client.js
   ```
   
   Change:
   ```javascript
   const API_BASE_URL = 'https://api.yourdomain.com/api';
   ```

2. **Build Mobile App:**
   ```bash
   cd mobile
   
   # For Android
   npx eas build --platform android --profile production
   
   # For iOS
   npx eas build --platform ios --profile production
   ```

3. **Distribute to users**

---

## 🖥️ Configure Desktop Portal

1. **Update API URL:**
   ```bash
   cd desktop/src/api
   # Edit client.js
   ```
   
   Change to: `https://api.yourdomain.com/api`

2. **Build:**
   ```bash
   cd desktop
   npm run build
   npm run package
   ```

3. **Distribute to computer labs**

---

## 🛠️ Useful Commands

**Check Status:**
```bash
cd /home/ccos/C-COS-1
chmod +x deploy-scripts/health-check.sh
./deploy-scripts/health-check.sh
```

**View Logs:**
```bash
# Backend logs
pm2 logs ccos-backend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

**Restart Services:**
```bash
# Restart backend
pm2 restart ccos-backend

# Restart Nginx
sudo systemctl restart nginx

# Restart database (careful!)
sudo systemctl restart postgresql
```

**Update Application:**
```bash
cd /home/ccos/C-COS-1
chmod +x deploy-scripts/update-app.sh
./deploy-scripts/update-app.sh
```

---

## 🆘 Troubleshooting

### Website not loading

```bash
# Check Nginx
sudo systemctl status nginx
sudo nginx -t

# Check DNS
ping yourdomain.com
```

### API not responding

```bash
# Check backend
pm2 status
pm2 logs ccos-backend

# Restart if needed
pm2 restart ccos-backend
```

### SSL certificate issues

```bash
# Check certificate
sudo certbot certificates

# Renew if needed
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

---

## 📊 Performance Optimization

After deployment, optimize for your user load:

**For 100-200 concurrent users:**
```bash
# Current setup is fine
```

**For 500-1000 concurrent users:**
```bash
# Scale backend
pm2 delete ccos-backend
pm2 start backend/server.js -i 4 --name "ccos-backend"
pm2 save
```

**For 1000+ concurrent users:**
- Follow `SCALE_TO_1000_CONCURRENT_USERS.md`
- Optimize PostgreSQL (in main deployment guide)
- Consider load balancing

---

## ✅ Post-Deployment Checklist

- [ ] Web portal loads and login works
- [ ] API health endpoint responds
- [ ] Can create exam
- [ ] Can add candidates and questions
- [ ] Mobile app connects to API
- [ ] Desktop portal configured
- [ ] SSL certificates installed and working
- [ ] Changed all default passwords
- [ ] Database backups configured
- [ ] Firewall enabled and configured
- [ ] PM2 starts on system boot
- [ ] Monitoring setup (optional)

---

## 🎉 Success!

Your C-COS system is now live at:

- **Web Portal**: https://yourdomain.com
- **API**: https://api.yourdomain.com
- **Admin Login**: admin@ccos.com / [your-new-password]
- **Teacher Login**: teacher@ccos.com / [your-new-password]

---

## 📞 Next Steps

1. **Customize branding**
   - Upload your logo to `/home/ccos/C-COS-1/public/`
   - Update colors in `tailwind.config.js`

2. **Train your team**
   - Show teachers how to create exams
   - Train students on mobile app

3. **Run pilot test**
   - Create test exam with 20-50 students
   - Identify any issues

4. **Full rollout**
   - Announce to all users
   - Monitor performance
   - Collect feedback

---

## 📚 Additional Documentation

- **Full Deployment Guide**: `VPS_DEPLOYMENT_GUIDE.md`
- **Backend Setup**: `BACKEND_SETUP_GUIDE.md`
- **System Overview**: `COMPLETE_SYSTEM_SUMMARY.md`
- **Troubleshooting**: `TROUBLESHOOTING.md`
- **Scaling Guide**: `SCALE_TO_1000_CONCURRENT_USERS.md`

---

**Deployment complete! 🚀**
