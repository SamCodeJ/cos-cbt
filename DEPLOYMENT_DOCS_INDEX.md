# 📚 VPS Deployment Documentation Index

**Complete guide to deploying UI-GES to your VPS**

---

## 🚀 Start Here

**New to VPS deployment?** Follow this path:

1. 📖 **[Quick Start Guide](QUICK_START_VPS_DEPLOYMENT.md)** ⭐ **START HERE**
   - 30-minute deployment walkthrough
   - Step-by-step instructions
   - Perfect for beginners

2. ✅ **[Deployment Checklist](VPS_DEPLOYMENT_CHECKLIST.md)**
   - Complete task-by-task checklist
   - Track your progress
   - Ensure nothing is missed

3. 🌐 **[DNS Configuration Guide](DNS_CONFIGURATION_GUIDE.md)**
   - Setup your domain
   - Registrar-specific instructions
   - DNS troubleshooting

---

## 📘 Complete Documentation

### Main Guides

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[VPS Deployment Guide](VPS_DEPLOYMENT_GUIDE.md)** | Comprehensive deployment manual | Reference for detailed steps |
| **[Quick Start Guide](QUICK_START_VPS_DEPLOYMENT.md)** | Fast 30-minute deployment | First-time setup |
| **[Deployment Checklist](VPS_DEPLOYMENT_CHECKLIST.md)** | Step-by-step checklist | Track deployment progress |
| **[DNS Configuration](DNS_CONFIGURATION_GUIDE.md)** | Domain setup guide | Configure domain records |
| **[Troubleshooting Guide](VPS_TROUBLESHOOTING_GUIDE.md)** | Fix common issues | When something goes wrong |

---

## 🛠️ Deployment Scripts

All automated scripts are in the `deploy-scripts/` folder:

| Script | Purpose | Documentation |
|--------|---------|---------------|
| `vps-setup.sh` | Initial VPS configuration | [Deploy Scripts README](deploy-scripts/README.md) |
| `deploy-backend.sh` | Deploy backend API | [Deploy Scripts README](deploy-scripts/README.md) |
| `deploy-web.sh` | Deploy web portal | [Deploy Scripts README](deploy-scripts/README.md) |
| `update-app.sh` | Update running app | [Deploy Scripts README](deploy-scripts/README.md) |
| `health-check.sh` | Monitor system health | [Deploy Scripts README](deploy-scripts/README.md) |
| `upload-to-vps.bat` | Upload scripts (Windows) | [Deploy Scripts README](deploy-scripts/README.md) |

**Full documentation:** [deploy-scripts/README.md](deploy-scripts/README.md)

---

## 📋 Deployment Process Overview

### Phase 1: Preparation (10 minutes)
- [ ] Purchase VPS
- [ ] Purchase domain name
- [ ] Gather credentials
- [ ] Read Quick Start Guide

### Phase 2: VPS Setup (10 minutes)
- [ ] Connect to VPS via SSH
- [ ] Upload deployment scripts
- [ ] Run `vps-setup.sh`
- [ ] Verify installation

### Phase 3: Code Deployment (10 minutes)
- [ ] Upload application code
- [ ] Run `deploy-backend.sh`
- [ ] Run `deploy-web.sh`
- [ ] Test locally (http://VPS_IP)

### Phase 4: DNS & SSL (15-60 minutes)
- [ ] Configure DNS records
- [ ] Wait for DNS propagation
- [ ] Install SSL certificates
- [ ] Test HTTPS access

### Phase 5: Testing (15 minutes)
- [ ] Test web portal
- [ ] Test API
- [ ] Create test exam
- [ ] Configure mobile/desktop apps

### Phase 6: Production (Ongoing)
- [ ] Change default passwords
- [ ] Train users
- [ ] Monitor system
- [ ] Regular maintenance

**Total Time: ~1-2 hours** (plus DNS propagation wait time)

---

## 🎯 Quick Reference by Task

### "I want to..."

| Task | Documentation |
|------|---------------|
| Deploy for the first time | [Quick Start Guide](QUICK_START_VPS_DEPLOYMENT.md) |
| Configure my domain | [DNS Configuration Guide](DNS_CONFIGURATION_GUIDE.md) |
| Fix an error | [Troubleshooting Guide](VPS_TROUBLESHOOTING_GUIDE.md) |
| Update my application | [Deploy Scripts README](deploy-scripts/README.md) → `update-app.sh` |
| Check system health | Run `health-check.sh` script |
| Setup SSL certificate | [VPS Deployment Guide](VPS_DEPLOYMENT_GUIDE.md) → SSL section |
| Scale for more users | [VPS Deployment Guide](VPS_DEPLOYMENT_GUIDE.md) → Performance section |
| Backup my database | [VPS Deployment Guide](VPS_DEPLOYMENT_GUIDE.md) → Backup section |
| Change passwords | [Deployment Checklist](VPS_DEPLOYMENT_CHECKLIST.md) → Security section |
| Configure mobile app | [Quick Start Guide](QUICK_START_VPS_DEPLOYMENT.md) → Mobile section |

---

## 🔧 Troubleshooting Quick Links

### Common Issues

| Problem | Solution |
|---------|----------|
| Can't SSH to VPS | [Connection Issues](VPS_TROUBLESHOOTING_GUIDE.md#connection-issues) |
| PostgreSQL won't install | [Installation Problems](VPS_TROUBLESHOOTING_GUIDE.md#installation-problems) |
| Backend won't start | [Backend API Issues](VPS_TROUBLESHOOTING_GUIDE.md#backend-api-issues) |
| 502 Bad Gateway | [Frontend/Nginx Issues](VPS_TROUBLESHOOTING_GUIDE.md#frontendnginx-issues) |
| DNS not working | [DNS Issues](VPS_TROUBLESHOOTING_GUIDE.md#dns-and-ssl-issues) |
| SSL certificate failed | [SSL Issues](VPS_TROUBLESHOOTING_GUIDE.md#dns-and-ssl-issues) |
| Mobile app can't connect | [Mobile App Issues](VPS_TROUBLESHOOTING_GUIDE.md#mobile-app-issues) |
| Slow performance | [Performance Issues](VPS_TROUBLESHOOTING_GUIDE.md#performance-issues) |

---

## 📊 System Architecture

Your deployed system will have:

```
┌─────────────────────────────────────────────────────────┐
│                        Internet                          │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Your Domain (DNS)                     │
│  yourdomain.com → VPS_IP                                │
│  api.yourdomain.com → VPS_IP                            │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                      VPS Server                          │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Nginx (Port 80/443)                             │   │
│  │  - SSL Termination (Certbot/Let's Encrypt)      │   │
│  │  - Static file serving (Web Portal)             │   │
│  │  - Reverse proxy to backend                     │   │
│  └──────────────────────────────────────────────────┘   │
│                            │                             │
│                            ▼                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Backend API (Node.js + Express)                 │   │
│  │  - Port 3001                                     │   │
│  │  - Managed by PM2                                │   │
│  │  - 2-4 instances (clustering)                    │   │
│  └──────────────────────────────────────────────────┘   │
│                            │                             │
│                            ▼                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │  PostgreSQL Database                             │   │
│  │  - Port 5432 (localhost only)                    │   │
│  │  - Database: gesDB                               │   │
│  │  - Daily backups                                 │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Web Portal   │   │ Mobile App   │   │ Desktop App  │
│ (Browser)    │   │ (iOS/Android)│   │ (Computer    │
│              │   │              │   │  Labs)       │
└──────────────┘   └──────────────┘   └──────────────┘
```

---

## 🔐 Security Checklist

After deployment, ensure:

- [ ] Firewall enabled (UFW)
- [ ] Only ports 22, 80, 443 open
- [ ] SSL certificates installed
- [ ] All default passwords changed
- [ ] PostgreSQL not exposed externally
- [ ] JWT_SECRET is strong and secret
- [ ] Database backups configured
- [ ] Fail2ban installed (optional)
- [ ] SSH key authentication setup (optional)

---

## 📈 Performance Optimization

For different user loads:

| Concurrent Users | Recommended VPS | PM2 Instances | Additional Steps |
|------------------|-----------------|---------------|------------------|
| 50-100 | 2 CPU, 4GB RAM | 1-2 | Basic setup sufficient |
| 100-500 | 4 CPU, 8GB RAM | 2-4 | Optimize PostgreSQL |
| 500-1000 | 8 CPU, 16GB RAM | 4-6 | + Database indexes, Nginx caching |
| 1000+ | 12+ CPU, 32GB+ RAM | 6-8 | + Load balancing, separate DB server |

**See:** [SCALE_TO_1000_CONCURRENT_USERS.md](SCALE_TO_1000_CONCURRENT_USERS.md)

---

## 🛡️ Maintenance Schedule

### Daily
- [ ] Run health check
- [ ] Monitor error logs
- [ ] Check disk space

### Weekly
- [ ] Review access logs
- [ ] Check backup integrity
- [ ] Update application if needed

### Monthly
- [ ] Security updates: `sudo apt update && sudo apt upgrade`
- [ ] Review SSL certificate expiry
- [ ] Database optimization: `VACUUM ANALYZE`

### Quarterly
- [ ] Performance review
- [ ] Security audit
- [ ] User feedback review

---

## 📞 Support & Resources

### Documentation in This Project

- **System Overview**: [COMPLETE_SYSTEM_SUMMARY.md](COMPLETE_SYSTEM_SUMMARY.md)
- **Backend Setup**: [BACKEND_SETUP_GUIDE.md](BACKEND_SETUP_GUIDE.md)
- **General Troubleshooting**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Business Documentation**: [BUSINESS_DOCUMENTATION.md](BUSINESS_DOCUMENTATION.md)
- **One-Page Overview**: [ONE_PAGE_OVERVIEW.md](ONE_PAGE_OVERVIEW.md)

### External Resources

- **Ubuntu Server Guide**: https://ubuntu.com/server/docs
- **Nginx Documentation**: https://nginx.org/en/docs/
- **PostgreSQL Manual**: https://www.postgresql.org/docs/
- **PM2 Documentation**: https://pm2.keymetrics.io/docs/
- **Let's Encrypt**: https://letsencrypt.org/docs/
- **Node.js Best Practices**: https://github.com/goldbergyoni/nodebestpractices

---

## 🎓 Learning Path

### For System Administrators

1. Start with [Quick Start Guide](QUICK_START_VPS_DEPLOYMENT.md)
2. Follow [Deployment Checklist](VPS_DEPLOYMENT_CHECKLIST.md)
3. Learn [VPS Deployment Guide](VPS_DEPLOYMENT_GUIDE.md) in detail
4. Study [Troubleshooting Guide](VPS_TROUBLESHOOTING_GUIDE.md)
5. Optimize using [Performance section](VPS_DEPLOYMENT_GUIDE.md#production-optimization)

### For Developers

1. Understand architecture in [System Overview](COMPLETE_SYSTEM_SUMMARY.md)
2. Setup backend using [Backend Setup Guide](BACKEND_SETUP_GUIDE.md)
3. Learn deployment with [VPS Deployment Guide](VPS_DEPLOYMENT_GUIDE.md)
4. Study deployment scripts in `deploy-scripts/`
5. Practice with [Update process](deploy-scripts/README.md#8-update-application-future-updates)

---

## ✅ Success Criteria

Your deployment is successful when:

- [ ] Web portal loads at https://yourdomain.com
- [ ] SSL certificate shows as valid (padlock 🔒)
- [ ] Can login as admin and teacher
- [ ] Can create exam with candidates and questions
- [ ] Mobile app connects and works
- [ ] Desktop app connects and works
- [ ] Health check script shows all green ✓
- [ ] API responds at https://api.yourdomain.com/health
- [ ] Backups are running daily
- [ ] PM2 starts backend on server reboot

---

## 🆘 Still Need Help?

### Before asking for help, collect:

1. **System Information**
   ```bash
   uname -a
   cat /etc/os-release
   ```

2. **Service Status**
   ```bash
   pm2 status
   sudo systemctl status nginx
   sudo systemctl status postgresql
   ```

3. **Recent Errors**
   ```bash
   pm2 logs uiges-backend --lines 50 --nostream
   sudo tail -50 /var/log/nginx/error.log
   ```

4. **Health Check Output**
   ```bash
   cd /home/uiges/UI-GES-1
   ./deploy-scripts/health-check.sh
   ```

### Then:

1. Check [Troubleshooting Guide](VPS_TROUBLESHOOTING_GUIDE.md)
2. Search error message in documentation
3. Review deployment checklist
4. Create GitHub issue with collected information

---

## 📝 Document Updates

This documentation set includes:

- ✅ VPS_DEPLOYMENT_GUIDE.md (Comprehensive manual)
- ✅ QUICK_START_VPS_DEPLOYMENT.md (30-minute guide)
- ✅ VPS_DEPLOYMENT_CHECKLIST.md (Task-by-task checklist)
- ✅ DNS_CONFIGURATION_GUIDE.md (Domain setup)
- ✅ VPS_TROUBLESHOOTING_GUIDE.md (Fix common issues)
- ✅ deploy-scripts/README.md (Script documentation)
- ✅ deploy-scripts/*.sh (Automated scripts)
- ✅ This index file

**Last Updated**: January 17, 2026

---

## 🎉 Ready to Deploy!

You now have everything you need to deploy UI-GES to your VPS:

1. **📚 Complete documentation** covering every step
2. **🤖 Automated scripts** for one-command deployment
3. **✅ Detailed checklists** to track progress
4. **🔧 Troubleshooting guides** for common issues
5. **📞 Support resources** when you need help

**Start with**: [QUICK_START_VPS_DEPLOYMENT.md](QUICK_START_VPS_DEPLOYMENT.md)

---

**Good luck with your deployment! 🚀**
