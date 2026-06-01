# ✅ VPS Deployment Checklist

**Complete step-by-step checklist for deploying UI-GES to production**

---

## 📋 Pre-Deployment

### Requirements Gathered

- [ ] VPS purchased and accessible
  - [ ] Ubuntu 20.04 or 22.04
  - [ ] Minimum 4 CPU cores, 8GB RAM (or as per your needs)
  - [ ] Root or sudo access
  - [ ] SSH access working

- [ ] Domain name purchased
  - [ ] Access to domain registrar
  - [ ] Know how to access DNS settings

- [ ] Credentials prepared
  - [ ] Strong database password (20+ characters)
  - [ ] Email for SSL certificates
  - [ ] SSH key or password for VPS

---

## 🖥️ VPS Initial Setup

### System Preparation

- [ ] Connected to VPS via SSH
  ```bash
  ssh root@YOUR_VPS_IP
  ```

- [ ] Noted VPS IP address
  ```bash
  curl ifconfig.me
  # Save this IP: ________________
  ```

- [ ] Uploaded deployment scripts
  ```bash
  # From Windows: Run deploy-scripts/upload-to-vps.bat
  # Or use: scp -r deploy-scripts root@YOUR_VPS_IP:~/
  ```

- [ ] Ran VPS setup script
  ```bash
  cd deploy-scripts
  chmod +x vps-setup.sh
  ./vps-setup.sh
  ```

- [ ] Verified services installed
  - [ ] Node.js: `node --version` (should be v18.x)
  - [ ] PostgreSQL: `sudo systemctl status postgresql`
  - [ ] Nginx: `sudo systemctl status nginx`
  - [ ] PM2: `pm2 --version`

---

## 📁 Code Deployment

### Upload Application Code

- [ ] Code uploaded to VPS
  
  **Option chosen:**
  - [ ] Git clone: `git clone YOUR_REPO_URL /home/uiges/UI-GES-1`
  - [ ] SCP upload: `scp -r . uiges@YOUR_VPS_IP:/home/uiges/UI-GES-1`
  - [ ] FileZilla/WinSCP upload

- [ ] Verified code is in place
  ```bash
  ls -la /home/uiges/UI-GES-1
  # Should see: backend/, mobile/, desktop/, src/, etc.
  ```

---

## 🔧 Backend Deployment

- [ ] Switched to uiges user
  ```bash
  su - uiges
  ```

- [ ] Navigated to project
  ```bash
  cd /home/uiges/UI-GES-1
  ```

- [ ] Made backend script executable
  ```bash
  chmod +x deploy-scripts/deploy-backend.sh
  ```

- [ ] Ran backend deployment
  ```bash
  ./deploy-scripts/deploy-backend.sh
  ```

- [ ] Saved JWT secret (shown in output)
  ```
  JWT_SECRET: ________________________________
  (Keep this safe!)
  ```

- [ ] Verified backend is running
  ```bash
  pm2 status
  # uiges-backend should show "online"
  ```

- [ ] Tested backend health
  ```bash
  curl http://localhost:3001/health
  # Should return: {"status":"ok"}
  ```

- [ ] Tested backend login
  ```bash
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@uiges.com","password":"password"}'
  # Should return token and user info
  ```

---

## 🌐 Web Portal Deployment

- [ ] Made web script executable
  ```bash
  chmod +x deploy-scripts/deploy-web.sh
  ```

- [ ] Ran web deployment
  ```bash
  ./deploy-scripts/deploy-web.sh
  ```

- [ ] Verified build completed
  ```bash
  ls -la dist/
  # Should see: index.html, assets/, etc.
  ```

- [ ] Verified Nginx configuration
  ```bash
  sudo nginx -t
  # Should say "syntax is ok"
  ```

---

## 🌍 DNS Configuration

- [ ] Logged into domain registrar

- [ ] Added A record for main domain
  ```
  Type: A
  Name: @ (or blank)
  Value: YOUR_VPS_IP
  TTL: 3600
  ```

- [ ] Added A record for www
  ```
  Type: A
  Name: www
  Value: YOUR_VPS_IP
  TTL: 3600
  ```

- [ ] Added A record for API
  ```
  Type: A
  Name: api
  Value: YOUR_VPS_IP
  TTL: 3600
  ```

- [ ] Saved DNS changes

- [ ] Waited for DNS propagation (5-30 minutes)

- [ ] Tested DNS resolution
  ```bash
  ping yourdomain.com
  ping www.yourdomain.com
  ping api.yourdomain.com
  # All should return YOUR_VPS_IP
  ```

- [ ] Tested HTTP access (before SSL)
  - [ ] `http://yourdomain.com` loads (may show "Not Secure")
  - [ ] `http://api.yourdomain.com/health` returns `{"status":"ok"}`

---

## 🔒 SSL Certificate Installation

- [ ] Installed SSL certificates
  ```bash
  sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
  ```

- [ ] Chose to redirect HTTP to HTTPS

- [ ] Tested HTTPS access
  - [ ] `https://yourdomain.com` loads with padlock 🔒
  - [ ] `https://api.yourdomain.com/health` works
  - [ ] No SSL warnings in browser

- [ ] Verified certificate auto-renewal
  ```bash
  sudo certbot certificates
  # Should show expiry date ~90 days out
  ```

---

## 🎨 Web Portal Testing

- [ ] Opened web portal: `https://yourdomain.com`

- [ ] Tested admin login
  - Email: `admin@uiges.com`
  - Password: `password`
  - [ ] Login successful

- [ ] Navigated to Dashboard
  - [ ] Dashboard loads
  - [ ] Shows statistics

- [ ] Tested exam creation
  - [ ] Can access "Create Exam"
  - [ ] All tabs work (Basic Info, Candidates, Questions, Settings)

- [ ] Tested question bank
  - [ ] Can view question bank
  - [ ] Can add question manually

- [ ] Tested results page
  - [ ] Results page loads
  - [ ] Can view demo results

- [ ] Tested teacher login
  - Email: `teacher@uiges.com`
  - Password: `password`
  - [ ] Login successful
  - [ ] Sees limited access (no admin features)

---

## 🔐 Security Configuration

- [ ] Changed default passwords
  
  **Admin password:**
  ```bash
  # On VPS, connect to database
  psql -U uiges_user -d gesDB -h localhost
  
  # Change admin password
  UPDATE users SET password_hash = crypt('YOUR_NEW_PASSWORD', gen_salt('bf')) 
  WHERE email = 'admin@uiges.com';
  
  \q
  ```
  - [ ] New admin password set: ________________

  **Teacher password:**
  ```bash
  psql -U uiges_user -d gesDB -h localhost
  
  UPDATE users SET password_hash = crypt('YOUR_NEW_PASSWORD', gen_salt('bf')) 
  WHERE email = 'teacher@uiges.com';
  
  \q
  ```
  - [ ] New teacher password set: ________________

- [ ] Updated backend CORS
  ```bash
  nano /home/uiges/UI-GES-1/backend/.env
  # Verify CORS_ORIGIN is correct
  ```

- [ ] Verified firewall is active
  ```bash
  sudo ufw status
  # Should show: Status: active
  ```

- [ ] Verified only necessary ports are open
  - [ ] 22 (SSH)
  - [ ] 80 (HTTP)
  - [ ] 443 (HTTPS)
  - [ ] Nothing else exposed

---

## 💾 Backup Configuration

- [ ] Verified backup script exists
  ```bash
  ls -la /home/uiges/backups/backup.sh
  ```

- [ ] Tested backup manually
  ```bash
  /home/uiges/backups/backup.sh
  ```

- [ ] Verified backup file created
  ```bash
  ls -la /home/uiges/backups/
  # Should see: gesDB_YYYYMMDD_HHMMSS.sql.gz
  ```

- [ ] Verified cron job for automatic backups
  ```bash
  crontab -l
  # Should see: 0 2 * * * /home/uiges/backups/backup.sh
  ```

---

## 📱 Mobile App Configuration

### Update API URL

- [ ] On local development machine, updated mobile API URL
  ```javascript
  // In mobile/src/api/client.js
  const API_BASE_URL = 'https://api.yourdomain.com/api';
  ```

- [ ] Updated backend CORS for mobile
  ```bash
  # On VPS
  nano /home/uiges/UI-GES-1/backend/server.js
  # Verify allowedOrigins allows mobile (no origin)
  ```

- [ ] Restarted backend
  ```bash
  pm2 restart uiges-backend
  ```

- [ ] Tested mobile login from dev environment
  ```bash
  # On local machine
  cd mobile
  npm start
  # Test login in app
  ```

### Build Mobile App

- [ ] Built Android app
  ```bash
  cd mobile
  npx eas build --platform android --profile production
  ```

- [ ] Built iOS app (if applicable)
  ```bash
  npx eas build --platform ios --profile production
  ```

- [ ] Downloaded and tested APK/IPA
  - [ ] App installs on device
  - [ ] Login works
  - [ ] Can see exams
  - [ ] Can take test exam

---

## 🖥️ Desktop Portal Configuration

- [ ] Updated desktop API URL
  ```javascript
  // In desktop/src/api/client.js
  const API_BASE_URL = 'https://api.yourdomain.com/api';
  ```

- [ ] Built desktop app
  ```bash
  cd desktop
  npm run build
  npm run package
  ```

- [ ] Tested desktop app
  - [ ] App runs
  - [ ] Login works
  - [ ] Can access all features

- [ ] Prepared distribution
  - [ ] Copied executable to distribution folder
  - [ ] Created installation instructions
  - [ ] Ready to deploy to computer labs

---

## 📊 Performance Testing

- [ ] Ran health check
  ```bash
  cd /home/uiges/UI-GES-1
  ./deploy-scripts/health-check.sh
  ```

- [ ] Verified all services green
  - [ ] Nginx: ✓ running
  - [ ] PostgreSQL: ✓ running
  - [ ] Backend: ✓ online
  - [ ] Ports: ✓ listening
  - [ ] API health: ✓ responding

- [ ] Tested exam flow end-to-end
  - [ ] Admin creates exam
  - [ ] Admin adds candidates and questions
  - [ ] Candidate logs in (mobile/desktop)
  - [ ] Candidate takes exam
  - [ ] Candidate submits exam
  - [ ] Results appear immediately
  - [ ] Admin can view results

- [ ] Load testing (optional)
  - [ ] Tested with 10+ simultaneous users
  - [ ] No errors or timeouts
  - [ ] Response times acceptable

---

## 📈 Monitoring Setup

- [ ] Setup PM2 monitoring
  ```bash
  pm2 install pm2-logrotate
  pm2 set pm2-logrotate:max_size 10M
  pm2 set pm2-logrotate:retain 7
  ```

- [ ] Setup health check cron
  ```bash
  crontab -e
  # Add: 0 * * * * /home/uiges/UI-GES-1/deploy-scripts/health-check.sh >> /home/uiges/logs/health.log 2>&1
  ```

- [ ] Setup SSL renewal cron
  ```bash
  # Add: 0 0 * * 0 certbot renew --quiet && systemctl reload nginx
  ```

- [ ] Optional: Setup external monitoring
  - [ ] UptimeRobot for uptime monitoring
  - [ ] Google Analytics for usage tracking
  - [ ] Error tracking service (Sentry, etc.)

---

## 📝 Documentation

- [ ] Documented credentials securely
  ```
  VPS IP: ________________
  Domain: ________________
  Admin Email: ________________
  Admin Password: ________________
  Database Password: ________________
  JWT Secret: ________________
  ```

- [ ] Saved SSH key (if using key authentication)

- [ ] Documented server configuration
  - [ ] CPU cores: ________
  - [ ] RAM: ________
  - [ ] Disk space: ________
  - [ ] VPS provider: ________________

- [ ] Created runbook for common tasks
  - [ ] How to restart services
  - [ ] How to view logs
  - [ ] How to update application
  - [ ] Emergency contacts

---

## 👥 User Training

- [ ] Trained admin users
  - [ ] How to login
  - [ ] How to create exams
  - [ ] How to manage teachers
  - [ ] How to view results
  - [ ] How to export data

- [ ] Trained teachers
  - [ ] How to login
  - [ ] How to create exams
  - [ ] How to add candidates
  - [ ] How to add questions
  - [ ] How to view results

- [ ] Trained candidates
  - [ ] How to install mobile app
  - [ ] How to login
  - [ ] How to take exam
  - [ ] How to view results

- [ ] Created user guides (optional)
  - [ ] Admin guide
  - [ ] Teacher guide
  - [ ] Student guide

---

## 🚀 Go-Live

- [ ] Announced to users
  - [ ] Email sent with instructions
  - [ ] Login credentials distributed
  - [ ] Support contact provided

- [ ] Created first production exam

- [ ] Monitored first exam session
  - [ ] All candidates logged in successfully
  - [ ] Exam ran smoothly
  - [ ] Results generated correctly
  - [ ] No major issues

---

## 🎯 Post-Deployment

### Week 1

- [ ] Daily health checks
- [ ] Monitor error logs
- [ ] Collect user feedback
- [ ] Fix critical issues immediately
- [ ] Document common questions

### Week 2-4

- [ ] Weekly health checks
- [ ] Review and address feedback
- [ ] Optimize based on usage patterns
- [ ] Plan feature improvements
- [ ] Update documentation

### Ongoing

- [ ] Monthly security updates
  ```bash
  sudo apt update && sudo apt upgrade
  ```

- [ ] Monthly database backups verification
  ```bash
  ls -lh /home/uiges/backups/
  ```

- [ ] Quarterly SSL certificate check
  ```bash
  sudo certbot certificates
  ```

- [ ] Quarterly performance review
- [ ] Annual security audit

---

## 📞 Support Resources

- [ ] Bookmarked documentation
  - [ ] `VPS_DEPLOYMENT_GUIDE.md`
  - [ ] `QUICK_START_VPS_DEPLOYMENT.md`
  - [ ] `DNS_CONFIGURATION_GUIDE.md`
  - [ ] `TROUBLESHOOTING.md`

- [ ] Setup support channels
  - [ ] Email support address
  - [ ] Phone/WhatsApp support
  - [ ] Ticket system (optional)

- [ ] Emergency procedures documented
  - [ ] How to restore from backup
  - [ ] How to rollback updates
  - [ ] Who to contact for help

---

## 🎉 Deployment Complete!

**Congratulations! Your UI-GES system is now live and serving users.**

### Your System URLs:

- **Web Portal**: https://yourdomain.com
- **API**: https://api.yourdomain.com
- **Admin Login**: admin@uiges.com / [your-new-password]

### Quick Commands Reference:

```bash
# Check status
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql

# View logs
pm2 logs uiges-backend
sudo tail -f /var/log/nginx/error.log

# Restart services
pm2 restart uiges-backend
sudo systemctl restart nginx

# Health check
cd /home/uiges/UI-GES-1
./deploy-scripts/health-check.sh

# Update application
./deploy-scripts/update-app.sh
```

### Next Steps:

1. ✅ Monitor system for first week
2. ✅ Collect and address user feedback
3. ✅ Customize branding and colors
4. ✅ Add your organization's logo
5. ✅ Plan feature enhancements
6. ✅ Scale as needed

---

**Well done! 🚀 Your Computer-Based Testing system is production-ready!**

---

**Date Deployed**: ________________

**Deployed By**: ________________

**Production URL**: ________________
