# 🎨 VPS Deployment Visual Guide

**Visual diagrams and flowcharts for UI-GES deployment**

---

## 📊 System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                   │
│                         (Your Users Access)                            │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           DNS LAYER                                     │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  yourdomain.com           → YOUR_VPS_IP (Web Portal)            │ │
│  │  www.yourdomain.com       → YOUR_VPS_IP (Web Portal)            │ │
│  │  api.yourdomain.com       → YOUR_VPS_IP (Backend API)           │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         YOUR VPS SERVER                                 │
│                     (Ubuntu 20.04 / 22.04)                             │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                    NGINX (Port 80 & 443)                         │ │
│  │  ┌────────────────────────────────────────────────────────────┐ │ │
│  │  │  SSL Termination (Let's Encrypt)                           │ │ │
│  │  │  - Automatic certificate renewal                           │ │ │
│  │  │  - Redirect HTTP → HTTPS                                   │ │ │
│  │  └────────────────────────────────────────────────────────────┘ │ │
│  │                                                                   │ │
│  │  ┌─────────────────────┐      ┌─────────────────────────────┐  │ │
│  │  │  Static Files       │      │  Reverse Proxy              │  │ │
│  │  │  /dist/             │      │  api.yourdomain.com         │  │ │
│  │  │  (Web Portal)       │      │  → localhost:3001           │  │ │
│  │  └─────────────────────┘      └─────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                    │                                    │
│                                    │ Proxy Pass                         │
│                                    ▼                                    │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │            BACKEND API (Node.js + Express)                       │ │
│  │                   Port: 3001 (localhost only)                    │ │
│  │                                                                   │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐│ │
│  │  │  Instance  │  │  Instance  │  │  Instance  │  │  Instance ││ │
│  │  │     #1     │  │     #2     │  │     #3     │  │    #4     ││ │
│  │  └────────────┘  └────────────┘  └────────────┘  └───────────┘│ │
│  │         ▲              ▲              ▲              ▲          │ │
│  │         └──────────────┴──────────────┴──────────────┘          │ │
│  │                     Managed by PM2                               │ │
│  │                  (Load Balancing + Auto-Restart)                │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                    │                                    │
│                                    │ SQL Queries                        │
│                                    ▼                                    │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │              PostgreSQL Database (Port 5432)                     │ │
│  │                    Database: gesDB                               │ │
│  │                 (localhost only - not exposed)                   │ │
│  │                                                                   │ │
│  │  Tables:                                                         │ │
│  │  • users              • exams                                    │ │
│  │  • candidates         • exam_candidates                          │ │
│  │  • question_bank      • exam_questions                           │ │
│  │  • exam_attempts      • audit_logs                               │ │
│  │  • violations                                                    │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                     BACKUP SYSTEM                                │ │
│  │  Daily automated backups at 2 AM                                │ │
│  │  Location: /home/uiges/backups/                                 │ │
│  │  Retention: 7 days                                               │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ API Calls
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           CLIENT DEVICES                                │
│                                                                         │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐          │
│  │  Web Browsers│     │  Mobile Apps │     │ Desktop Apps │          │
│  │  (Teachers/  │     │  (Students)  │     │ (Computer    │          │
│  │   Admins)    │     │              │     │  Labs)       │          │
│  │              │     │  iOS/Android │     │              │          │
│  └──────────────┘     └──────────────┘     └──────────────┘          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Deployment Flow Diagram

```
START
  │
  ▼
┌─────────────────────────────────────┐
│  1. PREPARATION                     │
│  • Purchase VPS                     │
│  • Purchase Domain                  │
│  • Get SSH access                   │
│  Time: 10 minutes                   │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│  2. UPLOAD DEPLOYMENT SCRIPTS       │
│  • From Windows: upload-to-vps.bat  │
│  • Or: scp -r deploy-scripts/       │
│  Time: 2 minutes                    │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│  3. RUN VPS-SETUP.SH                │
│  • Install Node.js                  │
│  • Install PostgreSQL               │
│  • Install Nginx                    │
│  • Install PM2 & Certbot            │
│  • Create database                  │
│  • Configure firewall               │
│  Time: 10 minutes                   │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│  4. UPLOAD APPLICATION CODE         │
│  • Git clone OR                     │
│  • SCP upload OR                    │
│  • FTP/SFTP upload                  │
│  Time: 5 minutes                    │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│  5. RUN DEPLOY-BACKEND.SH           │
│  • Install dependencies             │
│  • Create .env file                 │
│  • Generate JWT secret              │
│  • Run migrations                   │
│  • Seed database                    │
│  • Start with PM2                   │
│  Time: 5 minutes                    │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│  6. RUN DEPLOY-WEB.SH               │
│  • Install dependencies             │
│  • Build React app                  │
│  • Configure Nginx                  │
│  • Enable site                      │
│  Time: 5 minutes                    │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│  7. CONFIGURE DNS                   │
│  • Add A records:                   │
│    - @ → VPS_IP                     │
│    - www → VPS_IP                   │
│    - api → VPS_IP                   │
│  • Wait for propagation             │
│  Time: 30-60 minutes                │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│  8. INSTALL SSL CERTIFICATE         │
│  • Run: certbot --nginx             │
│  • Enter email & agree to terms     │
│  • Choose redirect HTTP→HTTPS       │
│  Time: 3 minutes                    │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│  9. TEST EVERYTHING                 │
│  • Test web portal                  │
│  • Test API                         │
│  • Create test exam                 │
│  • Test mobile app                  │
│  Time: 10 minutes                   │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│  10. PRODUCTION READY! 🎉           │
│  • Change default passwords         │
│  • Configure monitoring             │
│  • Train users                      │
│  • Go live!                         │
└─────────────────────────────────────┘
  │
  ▼
END (Total: 1-2 hours)
```

---

## 🌐 DNS Configuration Diagram

```
Your Domain Registrar
(GoDaddy, Namecheap, etc.)
        │
        │ Configure DNS
        ▼
┌─────────────────────────────────────────────┐
│           DNS Records                        │
│                                              │
│  A Record    @      →  123.456.789.012      │
│  A Record    www    →  123.456.789.012      │
│  A Record    api    →  123.456.789.012      │
│                                              │
│  TTL: 3600 seconds (1 hour)                 │
└─────────────────────────────────────────────┘
        │
        │ DNS Propagation (5-30 min)
        ▼
┌─────────────────────────────────────────────┐
│         Global DNS Servers                   │
│  • Google DNS (8.8.8.8)                     │
│  • Cloudflare DNS (1.1.1.1)                 │
│  • ISP DNS servers                          │
│  • ... propagating worldwide ...            │
└─────────────────────────────────────────────┘
        │
        │ Users lookup domain
        ▼
┌─────────────────────────────────────────────┐
│          User's Browser                      │
│                                              │
│  yourdomain.com → 123.456.789.012           │
│         ↓                                    │
│  Connects to your VPS                       │
└─────────────────────────────────────────────┘
```

---

## 🔒 Security Layers Diagram

```
┌────────────────────────────────────────────────┐
│         Layer 1: Network Security               │
│  • Firewall (UFW)                              │
│  • Only ports 22, 80, 443 open                 │
│  • SSH key authentication (optional)           │
│  • Fail2ban for brute force protection         │
└────────────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────┐
│         Layer 2: Transport Security             │
│  • SSL/TLS Certificates (Let's Encrypt)        │
│  • HTTPS enforced (HTTP→HTTPS redirect)        │
│  • TLS 1.2+ only                               │
└────────────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────┐
│         Layer 3: Web Server Security            │
│  • Nginx security headers                      │
│  • Rate limiting                                │
│  • CORS policy                                  │
│  • Request size limits                          │
└────────────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────┐
│         Layer 4: Application Security           │
│  • JWT authentication                           │
│  • Password hashing (bcrypt)                    │
│  • Input validation                             │
│  • SQL injection prevention (parameterized)     │
│  • XSS protection                               │
└────────────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────┐
│         Layer 5: Database Security              │
│  • Not exposed to internet (localhost only)    │
│  • Strong password authentication               │
│  • Role-based access control                    │
│  • Encrypted connections                        │
│  • Daily backups                                │
└────────────────────────────────────────────────┘
```

---

## 📱 User Access Flow

```
                     START
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
    ┌─────────┐  ┌─────────┐  ┌─────────┐
    │  Admin  │  │ Teacher │  │Candidate│
    │  (Web)  │  │  (Web)  │  │ (Mobile)│
    └─────────┘  └─────────┘  └─────────┘
          │            │            │
          └────────────┼────────────┘
                       │
              Open app/website
                       │
                       ▼
              ┌────────────────┐
              │  Login Screen  │
              │  Enter email   │
              │  Enter password│
              └────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │  POST /login   │
              │  to API        │
              └────────────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
    ┌─────────┐  ┌─────────┐  ┌─────────┐
    │  Admin  │  │ Teacher │  │Candidate│
    │Dashboard│  │Dashboard│  │Dashboard│
    └─────────┘  └─────────┘  └─────────┘
          │            │            │
          │            │            │
    ┌─────▼────┐ ┌─────▼────┐ ┌────▼─────┐
    │ Manage   │ │ Create   │ │ Take     │
    │ Teachers │ │ Exams    │ │ Exams    │
    │          │ │          │ │          │
    │ View All │ │ Add      │ │ View     │
    │ Results  │ │ Questions│ │ Results  │
    │          │ │          │ │          │
    │ Audit    │ │ View     │ │          │
    │ Logs     │ │ Results  │ │          │
    └──────────┘ └──────────┘ └──────────┘
```

---

## 🔄 Exam Taking Flow

```
     Candidate opens mobile app
              │
              ▼
     ┌─────────────────┐
     │  Login          │
     │  (email/pass)   │
     └─────────────────┘
              │
              ▼
     ┌─────────────────┐
     │  Dashboard      │
     │  Shows assigned │
     │  exams          │
     └─────────────────┘
              │
              ▼
     ┌─────────────────┐
     │  Select exam    │
     │  View details   │
     └─────────────────┘
              │
              ▼
     ┌─────────────────┐
     │  Instructions   │
     │  Screen         │
     │  - Duration     │
     │  - Rules        │
     └─────────────────┘
              │
              ▼
     ┌─────────────────┐
     │  Start Exam     │
     │  (Button)       │
     └─────────────────┘
              │
              ▼
     Backend randomizes questions
     and sends to candidate
              │
              ▼
     ┌─────────────────────────────┐
     │  Exam Screen                │
     │  • Question display         │
     │  • Answer options (A/B/C/D) │
     │  • Timer countdown          │
     │  • Navigation buttons       │
     │  • Question palette         │
     └─────────────────────────────┘
              │
              │ Answer selected
              ▼
     ┌─────────────────┐
     │  Auto-save      │
     │  every 30 sec   │
     │  or on answer   │
     └─────────────────┘
              │
              ▼
     Continue until all questions
     answered or time expires
              │
              ▼
     ┌─────────────────┐
     │  Submit Exam    │
     │  (Confirmation) │
     └─────────────────┘
              │
              ▼
     Backend calculates score
     immediately
              │
              ▼
     ┌─────────────────┐
     │  Result Screen  │
     │  • Score        │
     │  • Pass/Fail    │
     │  • Time used    │
     │  • Review (opt.)│
     └─────────────────┘
              │
              ▼
          END
```

---

## 💾 Backup & Recovery Flow

```
        Every day at 2 AM (Cron Job)
                    │
                    ▼
        ┌───────────────────────┐
        │  backup.sh executes   │
        └───────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  pg_dump gesDB        │
        │  Export to SQL file   │
        └───────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Compress with gzip   │
        │  gesDB_YYMMDD.sql.gz  │
        └───────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Save to:             │
        │  /home/uiges/backups/ │
        └───────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Delete backups       │
        │  older than 7 days    │
        └───────────────────────┘
                    │
                    ▼
                  DONE

    ╔═════════════════════════════════╗
    ║   IF DISASTER HAPPENS:          ║
    ║                                 ║
    ║   1. Stop backend:              ║
    ║      pm2 stop uiges-backend     ║
    ║                                 ║
    ║   2. Restore from backup:       ║
    ║      gunzip -c backup.sql.gz |  ║
    ║      psql -U user -d gesDB      ║
    ║                                 ║
    ║   3. Restart backend:           ║
    ║      pm2 restart uiges-backend  ║
    ╚═════════════════════════════════╝
```

---

## 📊 Monitoring Dashboard

```
┌────────────────────────────────────────────────────────────┐
│                    HEALTH CHECK DASHBOARD                   │
│                   (health-check.sh output)                  │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Services Status:                                          │
│  ✓ Nginx           [RUNNING]                              │
│  ✓ PostgreSQL      [RUNNING]                              │
│  ✓ Backend (PM2)   [ONLINE - 4 instances]                │
│                                                             │
│  Ports:                                                     │
│  ✓ 80  (HTTP)      [LISTENING]                            │
│  ✓ 443 (HTTPS)     [LISTENING]                            │
│  ✓ 3001 (Backend)  [LISTENING]                            │
│  ✓ 5432 (PostgreSQL) [LISTENING - localhost only]         │
│                                                             │
│  API Health:                                                │
│  ✓ https://api.yourdomain.com/health  [OK]               │
│                                                             │
│  Database:                                                  │
│  ✓ Connection      [SUCCESS]                              │
│  • Size:           2.5 GB                                  │
│  • Exams:          157                                     │
│  • Users:          523                                     │
│                                                             │
│  Resources:                                                 │
│  • Disk Usage:     45% (120GB / 250GB)                    │
│  • Memory:         62% (10GB / 16GB)                      │
│  • CPU:            23% average                             │
│                                                             │
│  SSL Certificates:                                          │
│  ✓ yourdomain.com     [Valid until: 2026-04-15]          │
│  ✓ api.yourdomain.com [Valid until: 2026-04-15]          │
│                                                             │
│  Last Backup:                                               │
│  ✓ gesDB_20260117_020001.sql.gz  [2.1 GB]                │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## 🎯 File Organization

```
/home/uiges/UI-GES-1/
│
├── deploy-scripts/          ← Deployment automation
│   ├── vps-setup.sh
│   ├── deploy-backend.sh
│   ├── deploy-web.sh
│   ├── update-app.sh
│   └── health-check.sh
│
├── backend/                 ← Backend API
│   ├── server.js
│   ├── .env                ← Configuration (SECURE!)
│   ├── database/
│   ├── routes/
│   ├── middleware/
│   └── package.json
│
├── src/                     ← Web portal source
│   ├── pages/
│   ├── components/
│   └── api/
│
├── dist/                    ← Built web portal
│   ├── index.html          ← Served by Nginx
│   ├── assets/
│   └── ...
│
├── mobile/                  ← Mobile app
│   ├── src/
│   └── package.json
│
├── desktop/                 ← Desktop app
│   ├── src/
│   └── package.json
│
├── Documentation files:
│   ├── DEPLOYMENT_DOCS_INDEX.md
│   ├── QUICK_START_VPS_DEPLOYMENT.md
│   ├── VPS_DEPLOYMENT_GUIDE.md
│   ├── VPS_DEPLOYMENT_CHECKLIST.md
│   ├── DNS_CONFIGURATION_GUIDE.md
│   └── VPS_TROUBLESHOOTING_GUIDE.md
│
└── /home/uiges/backups/     ← Database backups
    ├── backup.sh
    └── gesDB_*.sql.gz
```

---

## 🔄 Update Process Flow

```
Code changes made locally
         │
         ▼
    ┌──────────┐
    │ Git push │ (optional)
    └──────────┘
         │
         ▼
    ┌──────────────────────┐
    │ SSH to VPS           │
    │ cd /home/uiges/...   │
    └──────────────────────┘
         │
         ▼
    ┌──────────────────────┐
    │ Run update-app.sh    │
    └──────────────────────┘
         │
         ▼
    Choose what to update:
    1. Backend only
    2. Frontend only
    3. Both
         │
         ├─────────────────────┐
         │                     │
         ▼                     ▼
    ┌─────────┐         ┌──────────┐
    │ BACKEND │         │ FRONTEND │
    └─────────┘         └──────────┘
         │                     │
         ▼                     ▼
    Pull latest code    Pull latest code
         │                     │
         ▼                     ▼
    npm install         npm install
         │                     │
         ▼                     ▼
    Run migrations?     npm run build
         │                     │
         ▼                     ▼
    pm2 restart         Files updated
         │                     │
         └──────────┬──────────┘
                    │
                    ▼
            ┌──────────────┐
            │ Update Done! │
            │ Show logs    │
            └──────────────┘
```

---

## 🎉 Congratulations!

You now have visual guides for:

- ✅ System architecture
- ✅ Deployment flow
- ✅ DNS configuration
- ✅ Security layers
- ✅ User access flow
- ✅ Exam taking process
- ✅ Backup & recovery
- ✅ Health monitoring
- ✅ File organization
- ✅ Update process

**These diagrams complement the written documentation!**

---

*Refer to these diagrams alongside the deployment guides for better understanding.*
