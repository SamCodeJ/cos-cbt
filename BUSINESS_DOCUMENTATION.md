# C-COS - Business Documentation
## Computer-Based Testing System

---

## 📋 TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Features](#features)
3. [Benefits](#benefits)
4. [System Requirements](#system-requirements)
5. [Pricing Plans](#pricing-plans)
6. [Deployment Models](#deployment-models)
7. [Support & Maintenance](#support--maintenance)

---

## SYSTEM OVERVIEW

**C-COS** is a comprehensive, enterprise-grade Computer-Based Testing (CBT) system designed for educational institutions, training centers, and organizations conducting assessments. The system consists of three integrated platforms:

- **Web Portal** - For administrators and teachers to manage exams, questions, and results
- **Mobile App** - For candidates to take exams on smartphones (Android/iOS)
- **Desktop Portal** - For candidates to take exams on computers in physical halls

---

## 1. FEATURES

### 1.1 ADMINISTRATION & MANAGEMENT

#### User Management
- **Role-Based Access Control**
  - Admin: Full system access
  - Teacher: Exam creation and management
  - Candidate: Exam taking only
- **Teacher Account Management** - Create, edit, deactivate teacher accounts
- **Candidate Management** - Individual or bulk candidate registration
- **Profile Management** - Profile pictures, personal information updates
- **Audit Trail** - Complete activity logging for accountability

#### Exam Creation & Configuration
- **Multi-Tab Exam Wizard** - Step-by-step exam creation process
- **Flexible Duration Settings** - Set exam duration (minutes to hours)
- **Date & Time Scheduling** - Define start and end dates for exam availability
- **Pass Mark Configuration** - Set custom passing percentages
- **Results Visibility Control** - Choose whether candidates see results immediately
- **Exam Duplication** - Clone existing exams for quick setup
- **Draft & Edit Capability** - Save and modify exams before activation

### 1.2 QUESTION BANK & CONTENT MANAGEMENT

#### Question Types
- **Single Answer Questions** - Traditional multiple choice (A, B, C, D)
- **Multi-Answer Questions** - Select all correct answers (checkbox format)
- **HTML Content Support** - Rich text formatting for questions and options
- **Image Support** - Add images to questions and answer options
- **Point Weighting** - Assign different point values to questions

#### Question Bank Features
- **Centralized Question Repository** - Reusable question library
- **Subject Categorization** - Organize questions by subject/topic
- **Difficulty Levels** - Tag questions by difficulty
- **Usage Tracking** - See how many exams use each question
- **Bulk Import/Export** - CSV upload for mass question creation
- **Search & Filter** - Find questions quickly by subject or text
- **Question Randomization** - Display N random questions from larger bank

### 1.3 CANDIDATE FEATURES

#### Exam Taking Experience
- **Intuitive Interface** - Clean, distraction-free design
- **Real-Time Timer** - Countdown display with color warnings
- **Question Navigation** - Previous/Next buttons for sequential flow
- **Question Palette** - Visual grid showing all questions with status
- **Flag for Review** - Mark questions to revisit later
- **Auto-Save** - Answers saved every 30 seconds
- **Resume Capability** - Continue from last position if interrupted
- **Multi-Device Support** - Take exams on mobile or desktop
- **Offline Resilience** - Works on slow/unstable networks

#### Answer Status Indicators
- 🟢 **Green** - Question answered
- 🟡 **Amber** - Question flagged for review
- ⚪ **Gray** - Question not yet answered
- **Progress Counter** - "Answered 15 of 40 questions"

### 1.4 SECURITY & INTEGRITY

#### Exam Security
- **Screen Lock Enforcement** - Detect app minimization/switching
- **Violation Detection & Logging** - Track suspicious behavior
- **Auto-Submit After Violations** - Automatic submission after 3 strikes
- **Kiosk Mode** (Mobile) - Lock device to exam app during test
- **App Pinning Support** (Android) - Prevent task switching
- **Guided Access Support** (iOS) - Restrict to single app
- **Time-Based Access Control** - Exams only available during scheduled times
- **Student ID Authentication** - Unique credentials per candidate

#### Data Security
- **JWT Authentication** - Secure token-based access
- **Password Hashing** - bcrypt encryption (10 rounds)
- **Role-Based Permissions** - Data isolation between users
- **SQL Injection Protection** - Parameterized queries
- **CORS Configuration** - Controlled cross-origin access
- **Rate Limiting** - Protection against brute force attacks

### 1.5 GRADING & RESULTS

#### Automatic Grading
- **Instant Results** - Automatic scoring upon submission
- **Pass/Fail Determination** - Based on configured pass mark
- **Score Calculation** - Accurate point tallying
- **Percentage Calculation** - Score out of total possible points
- **Question-by-Question Review** - See correct/incorrect answers (if enabled)
- **Performance Analysis** - Breakdown by question difficulty

#### Results Management
- **Teacher Dashboard** - View all exam results at a glance
- **Result Filtering** - Filter by exam, date, pass/fail status
- **Analytics & Charts**
  - Pass/Fail distribution (pie chart)
  - Score distribution (bar chart)
  - Average score calculations
  - Completion statistics
- **PDF Transcript Generation** - Downloadable result certificates
- **Violation Reports** - View security breach logs per candidate
- **Export Capabilities** - Download results as CSV/Excel

### 1.6 ADVANCED FEATURES

#### Time Management
- **Global Time Extension** - Add time for all candidates during exam
- **Individual Time Extension** - Add extra time for specific candidates
- **Real-Time Time Updates** - Mobile/desktop apps update automatically
- **Exam End-Date Limiting** - Prevent starting if insufficient time remains
- **Late Start Handling** - Allocate appropriate time for late starters
- **Extension Notifications** - Candidates notified when time is added

#### Bulk Operations
- **Bulk Candidate Upload** - CSV import for hundreds of students
- **Bulk Question Import** - CSV upload for question banks
- **Bulk Result Export** - Download all results at once
- **Bulk Question Assignment** - Add multiple questions to exam in one action
- **Bulk Candidate Assignment** - Assign entire classes to exams

#### Accessibility & Flexibility
- **Responsive Design** - Works on all screen sizes
- **Cross-Platform** - Windows, macOS, Linux, Android, iOS
- **Multi-Language Support** (Potential) - Framework supports localization
- **Customizable Branding** - Add institution logo and colors
- **Flexible Deployment** - Cloud or on-premise hosting

### 1.7 ADMINISTRATIVE TOOLS

#### Dashboard & Analytics
- **Admin Dashboard** - System-wide statistics and metrics
- **Teacher Dashboard** - Personal exam and result statistics
- **Key Metrics**
  - Total exams created
  - Active/scheduled/completed exams
  - Total candidates
  - Average pass rate
  - Question bank size
  - Recent activity feed

#### Audit & Compliance
- **Comprehensive Audit Logs** - Track all user actions
- **Timestamped Records** - When and who performed each action
- **Activity Types Logged**
  - User logins/logouts
  - Exam creation/modification/deletion
  - Candidate management actions
  - Result viewing
  - Time extensions
  - Settings changes
- **Admin-Only Access** - Audit logs restricted to administrators
- **Compliance Reporting** - Export logs for external audits

### 1.8 DEPLOYMENT OPTIONS

#### Three Deployment Models
1. **Mobile-First** - Candidates use smartphones (BYOD)
2. **Desktop/Computer Lab** - Physical hall with PCs
3. **Hybrid** - Support both mobile and desktop simultaneously

#### Network Capabilities
- **Local Network Mode** - No internet required after setup
- **Cloud-Based Mode** - Accessible from anywhere
- **Offline Capability** - Exams work during network disruptions
- **Auto-Sync** - Data syncs when connection restored

---

## 2. BENEFITS

### 2.1 FOR EDUCATIONAL INSTITUTIONS

#### Cost Savings
- ✅ **Eliminate Paper Costs** - No printing, no photocopying
- ✅ **Reduce Facility Costs** - BYOD reduces computer lab needs
- ✅ **Lower Personnel Costs** - Less manual grading and invigilation
- ✅ **Save on Storage** - No physical exam paper storage needed
- ✅ **ROI Timeframe** - Typical payback within 1-2 years

#### Operational Efficiency
- ✅ **Instant Results** - No waiting days for graded papers
- ✅ **Automated Grading** - Save 90%+ of grading time
- ✅ **Bulk Operations** - Process hundreds of students quickly
- ✅ **Reduced Errors** - Eliminate manual grading mistakes
- ✅ **Faster Exam Cycles** - Create and deploy exams in hours, not days

#### Educational Quality
- ✅ **Standardized Testing** - Every student gets the same experience
- ✅ **Question Randomization** - Reduce cheating with unique exams
- ✅ **Immediate Feedback** - Students learn from results instantly
- ✅ **Performance Analytics** - Identify weak areas and trends
- ✅ **Question Bank Reusability** - Build institutional knowledge base

### 2.2 FOR TEACHERS & INSTRUCTORS

#### Time Savings
- ✅ **80-90% Less Grading Time** - Automatic scoring
- ✅ **Quick Exam Creation** - Use wizard and templates
- ✅ **Easy Duplication** - Reuse previous exams
- ✅ **Bulk Student Import** - Add entire classes in seconds
- ✅ **No Paper Distribution** - Students access exams digitally

#### Better Assessment Tools
- ✅ **Rich Analytics** - Understand class performance deeply
- ✅ **Question Effectiveness** - See which questions are too easy/hard
- ✅ **Flexible Scheduling** - Set exams for any time window
- ✅ **Real-Time Monitoring** - See who's taking exam right now
- ✅ **Individual Support** - Add time for specific students mid-exam

#### Professional Features
- ✅ **Question Bank Management** - Build personal question libraries
- ✅ **Multi-Format Questions** - Single and multi-answer support
- ✅ **Violation Tracking** - Know if students switched apps
- ✅ **Result Transcripts** - Professional PDF certificates
- ✅ **Audit Trail** - Record of all assessment activities

### 2.3 FOR STUDENTS & CANDIDATES

#### Better Experience
- ✅ **Familiar Interface** - Mobile-first design
- ✅ **Clear Instructions** - Step-by-step guidance
- ✅ **Visual Progress** - See completion status
- ✅ **Review Questions** - Flag and revisit questions
- ✅ **Immediate Results** - Know your score instantly (if enabled)

#### Accessibility
- ✅ **Use Own Device** - No need to access computer labs
- ✅ **Take Anywhere** - If teacher allows remote exams
- ✅ **Flexible Timing** - Start within allowed time window
- ✅ **Auto-Save Protection** - Never lose progress
- ✅ **Resume Capability** - Continue after interruptions

#### Fairness & Transparency
- ✅ **Standardized Environment** - Same conditions for all
- ✅ **Clear Timer Display** - Always know time remaining
- ✅ **Question-by-Question Review** - Learn from mistakes
- ✅ **Violation Warnings** - Know the security rules
- ✅ **Equal Opportunity** - Time extensions for special needs

### 2.4 FOR ADMINISTRATORS

#### Control & Oversight
- ✅ **Centralized Management** - Control entire system
- ✅ **Teacher Management** - Create, monitor, deactivate accounts
- ✅ **System-Wide Analytics** - Institution-level metrics
- ✅ **Audit Capabilities** - Full accountability trail
- ✅ **Data Sovereignty** - Own your data (on-premise option)

#### Scalability
- ✅ **Support 1000+ Concurrent Users** - Enterprise-grade
- ✅ **Unlimited Exams** - No artificial limits
- ✅ **Unlimited Question Bank** - Build over years
- ✅ **Multi-Department** - Support entire institution
- ✅ **Growth-Ready** - Add more resources as needed

#### Compliance & Security
- ✅ **Data Protection** - Secure authentication and encryption
- ✅ **Access Control** - Role-based permissions
- ✅ **Audit Reports** - For external compliance
- ✅ **Backup & Recovery** - Protect exam data
- ✅ **Uptime Guarantee** - Reliable during critical exam periods

### 2.5 COMPARED TO TRADITIONAL PAPER EXAMS

| Feature | Paper Exams | C-COS Digital |
|---------|-------------|----------------|
| **Grading Time** | Hours to days | Instant |
| **Cost per Exam** | $2-5 (paper, printing) | $0 (after setup) |
| **Setup Time** | 1-2 weeks | Hours |
| **Error Rate** | 5-10% human error | Near 0% |
| **Storage** | Physical space needed | Digital, unlimited |
| **Analytics** | Manual, time-consuming | Automatic, detailed |
| **Security** | Physical supervision | Digital + supervision |
| **Accessibility** | Computer lab required | BYOD or lab |
| **Scalability** | Limited by printing | 1000+ concurrent |
| **Environmental** | Paper waste | Zero paper |

### 2.6 RETURN ON INVESTMENT (ROI)

#### Cost Comparison: 1000 Students, 10 Exams per Year

**Traditional Paper-Based System:**
```
Paper & Printing: $3 × 1000 × 10 = $30,000/year
Grading Staff: 500 hours × $20/hr = $10,000/year
Storage & Facilities: $2,000/year
Total Annual Cost: $42,000/year
```

**C-COS Digital System:**
```
Software License: $8,000/year (see pricing)
Server Maintenance: $1,500/year
Total Annual Cost: $9,500/year

Annual Savings: $32,500
ROI: 343% (first year)
Payback Period: 4 months
```

---

## 3. SYSTEM REQUIREMENTS

### 3.1 SERVER REQUIREMENTS (On-Premise Deployment)

#### RECOMMENDED SERVER (1000 Concurrent Users)

**Hardware:**
```
CPU:     12-16 cores @ 3.5+ GHz
         (Intel Xeon Gold/AMD EPYC)
RAM:     64 GB DDR4 ECC
Storage: 1 TB NVMe SSD (PCIe 4.0)
         - Read: 7000+ MB/s
         - Write: 5000+ MB/s
Network: 10 Gbps Ethernet
```

**Cost:** $8,000 - $12,000 USD (new) or $4,000 - $6,000 (refurbished)

#### MINIMUM SERVER (500-700 Users)

**Hardware:**
```
CPU:     8 cores @ 3.0+ GHz
         (Intel Core i7/AMD Ryzen 9)
RAM:     32 GB DDR4
Storage: 500 GB NVMe SSD
Network: 1 Gbps Ethernet
```

**Cost:** $3,000 - $5,000 USD (new) or $1,500 - $2,500 (used)

#### SERVER OPTIONS

1. **Enterprise Server (Recommended)**
   - Dell PowerEdge R750
   - HP ProLiant DL380 Gen10+
   - Includes: Redundant PSU, Hardware RAID, Remote management
   - Price: $9,000 - $12,000

2. **Workstation Server (Mid-Range)**
   - Custom AMD Ryzen 9 / Intel Xeon W build
   - Dell Precision / HP Z-Series
   - Price: $4,000 - $6,000

3. **Refurbished Enterprise (Best Value)**
   - Dell PowerEdge R740 / R730 (2-3 years old)
   - Often better specs than new mid-range
   - Price: $2,500 - $4,000

### 3.2 NETWORK REQUIREMENTS

#### Internet Connection (For 1000 Users)

```
Upload Speed:   500 Mbps minimum (1 Gbps recommended)
Download Speed: 100 Mbps minimum (500 Mbps recommended)
Latency:        < 20ms to nearest city
Connection:     Business/Enterprise tier with SLA
Reliability:    99.9% uptime guarantee
Static IP:      Recommended (for SSL certificate)
Backup:         4G/5G failover connection recommended
```

#### WiFi Access Points (For Mobile Devices)

```
Users per AP:   50-80 maximum
Total APs:      13-20 access points for 1000 users
Standard:       WiFi 6 (802.11ax) recommended
Bands:          Dual-band (2.4 GHz + 5 GHz)
Management:     Centralized controller

Recommended Models:
- Ubiquiti UniFi WiFi 6 LR - $150-200 per AP
- TP-Link Omada EAP660 HD - $180-230 per AP
- Cisco/Aruba for enterprise - $300-500 per AP

Total Cost: 17 APs × $200 = ~$3,400
```

#### Router/Firewall

```
Throughput:     10 Gbps WAN-to-LAN
Sessions:       100,000+ concurrent connections
Features:       NAT, QoS, VLAN support

Recommended Models:
Budget ($200-400):
- Ubiquiti UniFi Dream Machine
- TP-Link ER7206

Enterprise ($800-2,000):
- Fortinet FortiGate 100F
- Sophos XG 230
```

### 3.3 CLIENT DEVICE REQUIREMENTS

#### For Mobile App (Candidates)

**Minimum:**
```
Operating System: Android 10+ or iOS 13+
RAM:              2 GB
Storage:          500 MB free space
Screen:           5" or larger
Network:          WiFi or 4G/LTE
```

**Recommended:**
```
Operating System: Android 12+ or iOS 15+
RAM:              4 GB or more
Storage:          2 GB free space
Screen:           6"+ HD display
Battery:          5000mAh for long exams
Network:          WiFi or 5G
```

**Recommended Devices:**

*Budget Android ($150-250):*
- Samsung Galaxy A14 5G
- Xiaomi Redmi Note 12
- Motorola Moto G Power
- Realme 9 Pro

*Budget iPhone ($400-600):*
- iPhone SE (3rd gen)
- iPhone 11 (refurbished)
- iPhone 12 mini (refurbished)

#### For Desktop Portal (Computer Labs)

**Minimum:**
```
Processor:  Intel Core i3 / AMD Ryzen 3
RAM:        4 GB
Storage:    100 MB free space
Screen:     1280x720 resolution
Browser:    Chrome 90+, Firefox 88+, Edge 90+, Safari 14+
Network:    100 Mbps Ethernet or WiFi
```

**Recommended:**
```
Processor:  Intel Core i5 / AMD Ryzen 5
RAM:        8 GB
Storage:    256 GB SSD
Screen:     1920x1080 Full HD
Browser:    Latest version Chrome/Firefox/Edge
Network:    1 Gbps Ethernet or WiFi 6
```

**Compatible With:**
- Windows 10/11
- macOS 10.15+
- Ubuntu/Linux (any modern distro)
- Chrome OS

#### For Teachers/Admins (Web Portal)

**Minimum:**
```
Same as Desktop Portal minimum specs
Plus: Stable internet connection
```

**Recommended:**
```
Processor:  Intel Core i5 / AMD Ryzen 5
RAM:        16 GB
Storage:    512 GB SSD
Screen:     15.6" Full HD (larger for data analysis)
Browser:    Latest version Chrome/Firefox/Edge/Safari
```

### 3.4 SOFTWARE REQUIREMENTS

#### Server Software

**Required:**
```
Operating System: Ubuntu 20.04+, CentOS 8+, or Windows Server 2019+
Node.js:          18.x or 20.x
PostgreSQL:       12.x or higher
npm:              9.x or higher
```

**Optional (Recommended):**
```
Reverse Proxy:    Nginx or Apache
SSL Certificate:  Let's Encrypt (free) or commercial
Monitoring:       PM2, Grafana, Prometheus
Backup:           pg_dump automated scripts
```

#### Client Software

**Web Portal (Teachers/Admins):**
```
Browser:    Chrome 90+, Firefox 88+, Edge 90+, Safari 14+
JavaScript: Must be enabled
Cookies:    Must be enabled for authentication
```

**Mobile App (Candidates):**
```
App Store:  Google Play Store (Android)
            Apple App Store (iOS)
Download:   Expo Go (for development)
            Custom branded app (for production)
```

**Desktop Portal (Candidates):**
```
Browser:    Chrome 90+, Firefox 88+, Edge 90+, Safari 14+
JavaScript: Must be enabled
LocalStorage: Must be enabled for auto-save
```

### 3.5 STORAGE REQUIREMENTS

#### Database Storage Growth

**Per Exam Calculation:**
```
Questions:       ~2 KB × 50 questions = 100 KB
Candidates:      ~1 KB × 100 candidates = 100 KB
Attempts:        ~500 bytes × 100 = 50 KB
Answers:         ~200 bytes × 5,000 = 1 MB
Images:          Variable (0-50 MB)
Total per exam:  ~1-52 MB
```

**Annual Estimate (Typical University):**
```
Exams per year:      100 exams
Students:            10,000 students
Attempts:            20,000 exam attempts
Profile pictures:    50 MB (10,000 × 5KB avg)
Question images:     500 MB

Database:        ~5 GB per year
Files:           ~550 MB per year
Backups:         ~20 GB per year (daily, 30-day retention)
Logs:            ~10 GB per year

Total Year 1:    ~35 GB
Total Year 5:    ~175 GB
```

**Recommended Storage:**
```
Primary Storage:  1 TB NVMe SSD (sufficient for 10+ years)
Backup Storage:   1 TB HDD or NAS (separate device)
Cloud Backup:     Optional offsite backup
```

### 3.6 POWER & INFRASTRUCTURE

#### Electrical Requirements

**Server Power Consumption:**
```
Idle:            150-200W
Average Load:    300-400W
Peak Load:       500-700W
Annual kWh:      ~3,500 kWh

Electricity Cost:
- At $0.15/kWh: ~$525/year
- At $0.20/kWh: ~$700/year
```

**UPS (Uninterruptible Power Supply):**
```
Minimum:     1500VA / 900W (2-hour runtime)
Recommended: 2000VA / 1200W (3-hour runtime)
Features:    - Pure sine wave
             - Automatic voltage regulation
             - USB/Network monitoring
             - Surge protection

Models:
Budget ($300-500):
- CyberPower CP1500PFCLCD
- APC Back-UPS Pro BR1500MS

Premium ($500-1,000):
- APC Smart-UPS SMT2200
- CyberPower OR2200PFCRT2U
```

#### Cooling Requirements

**Server Room Specifications:**
```
Temperature:  18-24°C (64-75°F)
Humidity:     40-60% RH
Ventilation:  Good airflow, no obstructions
Cooling:      Dedicated AC or HVAC

Cooling Capacity Needed:
- Server heat: 500W × 3.412 = 1,706 BTU/hr
- Add 30% margin: 2,218 BTU/hr
- Minimum AC: 5,000 BTU/hr
- Recommended: 10,000-12,000 BTU/hr
```

### 3.7 PERSONNEL REQUIREMENTS

#### Technical Staff Needed

**Minimum Setup (Small Institution):**
```
IT Administrator:     1 person (part-time)
Skills:              - Basic server administration
                     - Network configuration
                     - Database backup
Time Commitment:     5-10 hours/week
```

**Recommended Setup (Medium-Large Institution):**
```
System Administrator: 1 person (full-time)
Skills:              - Linux/Windows server admin
                     - PostgreSQL database management
                     - Network security
                     - Backup/recovery procedures

Network Administrator: 1 person (part-time)
Skills:              - Router/firewall configuration
                     - WiFi network management
                     - Troubleshooting connectivity

Support Staff:       1-2 people during exams
Skills:              - Basic troubleshooting
                     - User support
                     - Device management
```

#### Training Requirements

**For Administrators:**
```
Duration:    2 days (16 hours)
Topics:      - System installation
             - User management
             - Backup/restore
             - Monitoring
             - Troubleshooting
```

**For Teachers:**
```
Duration:    4 hours
Topics:      - Login and navigation
             - Creating exams
             - Adding questions
             - Managing candidates
             - Viewing results
```

**For Candidates:**
```
Duration:    30 minutes (optional)
Topics:      - Login process
             - Taking an exam
             - Navigation and features
             - Security rules
```

### 3.8 SECURITY REQUIREMENTS

#### Physical Security

**Server Location:**
```
Requirements:
- Locked server room or cabinet
- Restricted access (keycard/biometric)
- Climate controlled
- Fire suppression system (for large deployments)
- Surveillance cameras (recommended)
```

#### Network Security

**Firewall Rules:**
```
Required Open Ports:
- 3001 (Backend API) - Internal network only
- 5173 (Web Portal) - Teachers/admins
- 5174 (Desktop Portal) - Candidates
- 5432 (PostgreSQL) - Localhost only (DO NOT expose)

SSL/TLS:
- HTTPS required for production
- Valid SSL certificate (Let's Encrypt or commercial)
- TLS 1.2 or higher
```

#### Data Protection

**Backup Strategy:**
```
Database Backups:
- Frequency: Daily (minimum)
- Retention: 30 days rolling
- Location: Separate storage device
- Testing: Monthly restore test

File Backups:
- Profile pictures: Weekly
- Uploaded questions: Weekly
- System logs: Monthly

Offsite Backup:
- Cloud storage: Optional but recommended
- Frequency: Weekly
```

---

## 4. PRICING PLANS

### 4.1 PERPETUAL LICENSE (ONE-TIME PURCHASE)

**OPTION A: Self-Hosted / On-Premise License**

This model is ideal for institutions that want to own the software outright and host it on their own servers.

#### Pricing Tiers (One-Time Payment)

**STARTER EDITION**
```
Capacity:        Up to 500 concurrent users
Features:        All core features included
Support:         1 year email support
Updates:         1 year free updates
Price:           $15,000 USD (one-time)

After Year 1:
- Optional maintenance: $2,500/year (support + updates)
```

**PROFESSIONAL EDITION**
```
Capacity:        Up to 1,000 concurrent users
Features:        All features + priority support
Support:         1 year email + phone support
Updates:         1 year free updates
Training:        4 hours remote training included
Price:           $25,000 USD (one-time)

After Year 1:
- Optional maintenance: $4,000/year (support + updates)
```

**ENTERPRISE EDITION**
```
Capacity:        Up to 5,000 concurrent users
Features:        All features + customization
Support:         2 years priority support (24/7 on exam days)
Updates:         2 years free updates
Training:        2 days on-site training included
Installation:    Remote installation assistance
Customization:   Logo, colors, branding
Price:           $45,000 USD (one-time)

After Year 2:
- Optional maintenance: $7,000/year (support + updates)
```

**UNLIMITED EDITION**
```
Capacity:        Unlimited concurrent users
Features:        All features + full customization
Support:         3 years priority support (24/7)
Updates:         3 years free updates
Training:        3 days on-site training
Installation:    On-site installation included
Customization:   Complete white-label option
Source Code:     Source code access (optional)
Price:           $75,000 USD (one-time)
                 $95,000 USD (with source code)

After Year 3:
- Optional maintenance: $10,000/year
```

#### What's Included in All Editions

✅ Complete software package (Web, Mobile, Desktop apps)
✅ PostgreSQL database schema
✅ Installation documentation
✅ User manuals (Admin, Teacher, Candidate)
✅ CSV templates for bulk import
✅ Email support during included period
✅ Security updates during included period
✅ Bug fixes during included period

#### What's NOT Included

❌ Server hardware (customer provides)
❌ Network infrastructure (customer provides)
❌ Internet service (customer provides)
❌ Mobile devices for candidates (BYOD or customer provides)
❌ On-site visits (except Enterprise/Unlimited)
❌ Custom feature development (available separately)

### 4.2 SUBSCRIPTION LICENSE (ANNUAL/MONTHLY)

**OPTION B: Cloud-Hosted Subscription**

We host the system on our cloud servers. You pay monthly or annually based on usage.

#### Pricing Tiers (Subscription)

**BASIC PLAN**
```
Capacity:        Up to 200 concurrent users
Storage:         50 GB
Exams/Month:     Unlimited
Support:         Email support (24-hour response)
Updates:         Automatic, included
Uptime SLA:      99.5%
Price:           $299/month or $3,000/year (save 17%)
```

**STANDARD PLAN**
```
Capacity:        Up to 500 concurrent users
Storage:         150 GB
Exams/Month:     Unlimited
Support:         Email + Chat support (8-hour response)
Updates:         Automatic, included
Uptime SLA:      99.9%
Backup:          Daily automated backups
Price:           $699/month or $7,000/year (save 17%)
```

**PROFESSIONAL PLAN**
```
Capacity:        Up to 1,000 concurrent users
Storage:         300 GB
Exams/Month:     Unlimited
Support:         Priority email + phone (4-hour response)
Updates:         Automatic, included
Uptime SLA:      99.95%
Backup:          Daily backups + 90-day retention
Training:        4 hours annual training
Price:           $1,199/month or $12,000/year (save 17%)
```

**ENTERPRISE PLAN**
```
Capacity:        Up to 5,000 concurrent users
Storage:         1 TB
Exams/Month:     Unlimited
Support:         24/7 priority support (1-hour response)
Updates:         Automatic, included
Uptime SLA:      99.99%
Backup:          Hourly backups + 180-day retention
Training:        1 day annual on-site training
Customization:   Logo and branding included
Price:           $2,499/month or $25,000/year (save 17%)
```

**CUSTOM PLAN**
```
For institutions with unique needs:
- Custom capacity (over 5,000 users)
- Dedicated server infrastructure
- Custom integrations (LMS, SIS)
- Multi-region deployment
- Custom SLA requirements
- White-label solutions
Price:           Contact for quote
```

#### Subscription Benefits

✅ No upfront infrastructure costs
✅ Automatic updates and security patches
✅ Daily backups included
✅ 99.9%+ uptime guarantee
✅ Scalability (upgrade/downgrade anytime)
✅ No maintenance burden
✅ Accessible from anywhere with internet
✅ Pay only for what you use
✅ Cancel anytime (no long-term lock-in)

#### Subscription Limitations

⚠️ Requires stable internet connection
⚠️ Data stored on vendor servers (not on-premise)
⚠️ Ongoing monthly/annual fees
⚠️ Dependent on vendor service continuity

### 4.3 PAY-PER-USE MODEL

**OPTION C: Pay-Per-Exam Model**

Ideal for institutions with sporadic or seasonal exam needs.

#### Pricing Structure

**Per Exam Pricing:**
```
Base Fee per Exam:      $50 (covers setup and hosting)
Per Candidate Fee:      $0.50 per candidate taking the exam
Per Question Fee:       $0.05 per question in exam

Example Calculation:
- 1 exam
- 100 candidates
- 40 questions
= $50 + (100 × $0.50) + (40 × $0.05)
= $50 + $50 + $2
= $102 per exam

Volume Discounts:
- 10-50 exams/year:     10% discount
- 51-100 exams/year:    15% discount
- 100+ exams/year:      20% discount
```

**Monthly Minimum:**
```
Minimum Charge:  $0 (only pay when you use)
Maximum Charge:  Capped at equivalent subscription price
```

#### Pay-Per-Use Benefits

✅ No upfront costs
✅ Only pay for actual usage
✅ Perfect for seasonal/sporadic testing
✅ No commitment or contract
✅ Access to all features
✅ Cloud-hosted (no infrastructure needed)

#### Pay-Per-Use Limitations

⚠️ Can be expensive for frequent use
⚠️ Less predictable monthly costs
⚠️ May hit subscription price cap quickly for large institutions

### 4.4 LOCAL HALL LICENSE (OFFLINE VERSION)

**OPTION D: Local Network License with Remote Monitoring**

For institutions that want to run exams on a local network (air-gapped or limited internet) with optional remote monitoring.

#### How It Works

1. **Software Deployment:**
   - Complete system installed on local server
   - Operates on internal LAN/WiFi (no internet required during exams)
   - Candidates connect to local server IP address

2. **Remote Monitoring (Optional):**
   - **Heartbeat Check:** System pings our monitoring server every 5 minutes with anonymized data
   - **Data Transmitted:** License verification, user count, system health (no exam content)
   - **Internet Required:** Brief connection every 5 minutes (< 10 KB)
   - **Offline Grace Period:** Works 48 hours without connection

3. **Licensing Verification:**
   - License tied to unique server ID
   - Annual license renewal required
   - Verification happens automatically when internet available
   - Manual verification possible for air-gapped systems

#### Local Hall Pricing

**SINGLE-SITE LICENSE**
```
Capacity:        Up to 1,000 concurrent users
Duration:        1 year
Monitoring:      Remote heartbeat monitoring
Support:         Email support
Updates:         Annual update package
Price:           $8,000/year

Installation:    +$1,500 (optional on-site setup)
Hardware:        Customer provides server
```

**MULTI-SITE LICENSE**
```
Capacity:        Up to 1,000 users per site
Sites:           3-10 locations
Duration:        1 year
Monitoring:      Centralized dashboard for all sites
Support:         Priority email + phone
Updates:         Quarterly update packages
Price:           $6,500/site/year (3-5 sites)
                 $5,500/site/year (6-10 sites)

Central Console: +$3,000/year (manage all sites)
```

**AIR-GAPPED LICENSE (No Internet)**
```
Capacity:        Up to 1,000 concurrent users
Duration:        1 year
Monitoring:      Manual license verification (USB key)
Support:         Email support (offline documentation)
Updates:         Annual update on USB drive
Price:           $10,000/year

Restrictions:    - No remote support during exams
                 - Manual license renewal process
                 - Updates delivered physically
```

#### Local Hall Monitoring Details

**What Gets Monitored (If Online):**
```json
{
  "license_key": "XXXXX-XXXXX-XXXXX",
  "server_id": "unique-server-hash",
  "timestamp": "2026-01-17T10:30:00Z",
  "active_users": 350,
  "total_exams": 15,
  "system_health": "healthy",
  "version": "1.0.5"
}
```

**What Does NOT Get Transmitted:**
- ❌ Exam content or questions
- ❌ Student answers or results
- ❌ Personal identifiable information (PII)
- ❌ Usernames or passwords
- ❌ Institutional data

**Monitoring Benefits:**
- ✅ Automatic license compliance
- ✅ System health alerts
- ✅ Usage analytics dashboard
- ✅ Proactive support
- ✅ Automatic update notifications

**Privacy Guarantee:**
- All transmitted data is anonymized
- No exam content leaves local network
- Compliant with GDPR, FERPA, local data protection laws
- Optional: Complete air-gap mode available

### 4.5 HYBRID MODEL

**OPTION E: Mixed Deployment**

Combine different licensing models for different use cases.

**Example Scenario:**
```
Primary Use:     Self-hosted on-premise (Perpetual License)
                 Price: $25,000 (one-time)

Seasonal Backup: Cloud subscription during peak exam periods
                 Price: $699/month × 3 months = $2,097/year

Total Year 1:    $27,097
Total Year 2+:   $2,097/year (seasonal cloud backup only)
```

### 4.6 ACADEMIC & NON-PROFIT DISCOUNTS

**Educational Institutions:**
```
Universities:        20% discount on all plans
K-12 Schools:        25% discount on all plans
Developing Nations:  30-50% discount (case-by-case)
```

**Non-Profit Organizations:**
```
Registered NGOs:     25% discount
Government Bodies:   15% discount (volume pricing available)
Research Institutes: 20% discount
```

**Qualifying Requirements:**
- Valid tax-exempt status or educational registration
- Non-commercial use only
- Annual verification of status

### 4.7 ADD-ON SERVICES (ALL MODELS)

#### Professional Services

**Custom Development:**
```
Custom Features:     $150-250/hour
Integration (LMS):   $5,000-15,000 (per integration)
White-Label Design:  $3,000-8,000
Mobile App Branding: $2,000-5,000
Report Customization: $1,000-3,000
```

**Training & Support:**
```
On-Site Training:    $2,000/day + travel expenses
Remote Training:     $150/hour
Custom Documentation: $1,500-5,000
24/7 Support Package: $5,000/year (perpetual license)
```

**Installation & Setup:**
```
Remote Installation:  $500 (4 hours)
On-Site Installation: $2,500 + travel (2 days)
Network Setup:        $1,500 (4 hours)
Data Migration:       $3,000-8,000 (from another system)
```

### 4.8 COMPARISON TABLE

| Feature | Perpetual | Subscription | Pay-Per-Use | Local Hall |
|---------|-----------|--------------|-------------|------------|
| **Upfront Cost** | High ($15K-75K) | Low ($299/mo) | None | Medium ($8K) |
| **Ongoing Cost** | Low ($2.5K-10K/yr) | Medium ($3K-25K/yr) | Variable | Medium ($8K/yr) |
| **Data Location** | Your servers | Our cloud | Our cloud | Your servers |
| **Internet Required** | Setup only | Always | Always | Optional |
| **Scalability** | Hardware limited | Instant | Instant | Hardware limited |
| **Total Cost (5 Years)** | $25K-95K | $36K-150K | Variable | $40K |
| **Best For** | Large institutions | Growing schools | Seasonal use | Secure environments |

### 4.9 RECOMMENDED PLANS BY INSTITUTION SIZE

**Small School (100-500 students):**
```
Recommended:  Subscription Basic Plan ($3,000/year)
Alternative:  Pay-Per-Use (if < 20 exams/year)
Reasoning:    Low upfront cost, scalable, managed hosting
```

**Medium School (500-2,000 students):**
```
Recommended:  Subscription Standard ($7,000/year)
Alternative:  Perpetual Starter + Maintenance ($15K + $2.5K/year)
Reasoning:    Balance of cost and capacity
```

**Large College/University (2,000-10,000 students):**
```
Recommended:  Perpetual Professional ($25K one-time)
Alternative:  Subscription Professional ($12,000/year)
Reasoning:    Better long-term value with perpetual
```

**Multi-Campus University (10,000+ students):**
```
Recommended:  Perpetual Enterprise ($45K one-time)
Alternative:  Multi-Site Local Hall ($30K-55K/year for 3-10 sites)
Reasoning:    Unlimited capacity, full control, customization
```

---

## 5. DEPLOYMENT MODELS

### 5.1 CLOUD DEPLOYMENT (Subscription/Pay-Per-Use)

**Architecture:**
```
Internet
    ↓
Load Balancer (HTTPS)
    ↓
Web Servers (3x redundant)
    ↓
Database (PostgreSQL - Master + Replica)
    ↓
File Storage (S3-compatible)
    ↓
Backup Storage (Separate region)
```

**Features:**
- ✅ Automatic scaling
- ✅ Load balancing
- ✅ Geographic redundancy
- ✅ DDoS protection
- ✅ SSL/TLS encryption
- ✅ Daily backups
- ✅ 99.9%+ uptime

**Access:**
```
Teachers/Admins:  https://yourschool.uiges.cloud (web browser)
Desktop Candidates: https://yourschool.uiges.cloud/candidate (web browser)
Mobile Candidates:  Download "C-COS [Your School]" from app stores
```

### 5.2 ON-PREMISE DEPLOYMENT (Perpetual License)

**Architecture:**
```
Your Server (Physical/VM)
    ↓
Node.js Backend (Port 3001)
PostgreSQL Database (Port 5432)
Static File Server (Port 3001)
    ↓
Internal Network (LAN/WiFi)
    ↓
Client Devices
```

**Features:**
- ✅ Full data control
- ✅ No internet dependency (after setup)
- ✅ Customizable infrastructure
- ✅ Integration with existing systems
- ✅ Faster local network speeds

**Access:**
```
Teachers/Admins:     http://192.168.1.100:5173
Desktop Candidates:  http://192.168.1.100:5174
Mobile Candidates:   Install APK/IPA, configure server IP in app
```

### 5.3 HYBRID DEPLOYMENT

**Architecture:**
```
Primary: On-Premise Server (daily use)
Backup:  Cloud Subscription (during peak or failures)
```

**Use Cases:**
- Regular exams run on local server (fast, secure)
- Remote/makeup exams use cloud (accessible anywhere)
- Failover to cloud if local server down
- Archival storage in cloud

### 5.4 MOBILE-FIRST vs DESKTOP-FIRST DEPLOYMENT

**Mobile-First (BYOD Model):**
```
Advantages:
- ✅ No computer lab required
- ✅ Students use own devices
- ✅ Lower hardware costs
- ✅ Take exams anywhere (if allowed)

Requirements:
- Students must have compatible smartphones
- Strong WiFi network (1 AP per 50-80 students)
- Kiosk mode enforcement
- Clear BYOD policy
```

**Desktop-First (Computer Lab Model):**
```
Advantages:
- ✅ Standardized hardware
- ✅ Better supervision
- ✅ Keyboard typing support
- ✅ Larger screens

Requirements:
- Computer lab with sufficient PCs
- 1 PC per student (or staggered sessions)
- Gigabit LAN connections
- Modern web browsers
```

**Hybrid (Best of Both):**
```
Advantages:
- ✅ Maximum flexibility
- ✅ Students choose device preference
- ✅ Accommodate all students

Setup:
- Support both mobile and desktop portals simultaneously
- Same backend server serves both
- Students pick their preferred method
```

---

## 6. SUPPORT & MAINTENANCE

### 6.1 SUPPORT TIERS

**BASIC SUPPORT (Included in all purchases for 1 year)**
```
Channels:        Email only
Response Time:   24-48 hours (business days)
Coverage:        Monday-Friday, 9 AM - 5 PM (your timezone)
Includes:        - Bug fixes
                 - Installation assistance
                 - General usage questions
                 - Documentation access
```

**PRIORITY SUPPORT (Add-on or included in Enterprise)**
```
Channels:        Email + Phone + Chat
Response Time:   4-8 hours (24/7)
Coverage:        24/7/365 (including weekends)
Includes:        - Everything in Basic
                 - Priority ticket handling
                 - Remote screen sharing
                 - Configuration assistance
Price:           $3,000/year (perpetual license)
                 Included (subscription)
```

**PREMIUM SUPPORT (Enterprise & Unlimited)**
```
Channels:        Email + Phone + Chat + WhatsApp
Response Time:   1-2 hours (24/7)
Coverage:        24/7/365 with dedicated support manager
Includes:        - Everything in Priority
                 - Dedicated support rep
                 - Quarterly system review
                 - On-call during exam periods
                 - Emergency hotline
Price:           $8,000/year (perpetual license)
                 Included (Enterprise subscription)
```

### 6.2 MAINTENANCE & UPDATES

**What's Included:**
```
Security Patches:    Immediate (as soon as discovered)
Bug Fixes:           Monthly or as needed
Minor Updates:       Quarterly (new features)
Major Versions:      Annually (significant upgrades)
```

**Update Delivery:**
- **Cloud:** Automatic, transparent updates
- **On-Premise:** Update packages via email/download portal
  - Automatic update script (recommended)
  - Manual update instructions (if needed)

**Backward Compatibility:**
- All updates maintain database compatibility
- No data loss during updates
- Rollback capability for 30 days

### 6.3 SERVICE LEVEL AGREEMENTS (SLA)

**Uptime Guarantees (Cloud Hosting):**
```
Basic Plan:        99.5% uptime (3.6 hours downtime/month)
Standard Plan:     99.9% uptime (43 minutes downtime/month)
Professional Plan: 99.95% uptime (21 minutes downtime/month)
Enterprise Plan:   99.99% uptime (4 minutes downtime/month)
```

**SLA Credits:**
```
If uptime falls below guarantee:
- 99.0-99.5%:  10% monthly fee credit
- 98.0-99.0%:  25% monthly fee credit
- Below 98.0%: 50% monthly fee credit
```

**Scheduled Maintenance:**
- Weekends only (Saturday 2-6 AM UTC)
- 48-hour advance notice
- Maximum 4 hours per month
- Does not count against uptime SLA

### 6.4 TRAINING OPTIONS

**Online Training (Remote):**
```
Format:      Live video conference (Zoom/Teams)
Duration:    2-4 hours per session
Capacity:    Up to 20 participants
Includes:    - Recorded session
             - Training materials
             - Q&A session
Price:       $500 per session

Topics:
- Admin: System setup, user management
- Teacher: Exam creation, result analysis
- Candidate: Taking exams, troubleshooting
```

**On-Site Training:**
```
Format:      In-person at your location
Duration:    Full day (8 hours) or half-day (4 hours)
Capacity:    Up to 50 participants
Includes:    - Hands-on workshop
             - Printed materials
             - Certificate of completion
             - 30-day post-training support
Price:       $2,000/day + travel expenses

Topics:
- Comprehensive training for all roles
- Custom scenarios and exercises
- Infrastructure setup guidance
- Best practices workshop
```

**Train-the-Trainer:**
```
Format:      Intensive multi-day program
Duration:    3 days on-site or 5 days remote
Capacity:    5-10 key staff members
Includes:    - Deep technical training
             - Trainer certification
             - Training materials package
             - Ongoing train-the-trainer support
Price:       $8,000 + travel (on-site)
             $5,000 (remote)

Goal:
Your staff can train other users independently
```

### 6.5 DATA BACKUP & RECOVERY

**Backup Frequency (Cloud):**
```
Database:        Every 6 hours
File Storage:    Daily
Full System:     Weekly
Retention:       30-90 days (plan dependent)
```

**Backup Frequency (On-Premise - Recommended):**
```
Database:        Daily automated (pg_dump)
File Storage:    Weekly
Full System:     Monthly
Retention:       90 days minimum
Location:        Separate physical device + offsite
```

**Recovery Time Objective (RTO):**
```
Cloud:          4-8 hours (to restore service)
On-Premise:     Depends on backup strategy (typically 8-24 hours)
```

**Recovery Point Objective (RPO):**
```
Cloud:          6 hours (maximum data loss)
On-Premise:     24 hours (if daily backups)
```

### 6.6 SECURITY UPDATES

**Vulnerability Management:**
```
Critical:       Within 24 hours of discovery
High:           Within 1 week
Medium:         Next scheduled update
Low:            Quarterly update
```

**Security Monitoring (Cloud):**
- 24/7 intrusion detection
- DDoS mitigation
- Log analysis
- Penetration testing (annual)

**Security Best Practices (On-Premise):**
- Keep system updated
- Use strong passwords
- Enable firewall
- Regular security audits
- SSL/TLS for all connections

---

## 7. FREQUENTLY ASKED QUESTIONS

### 7.1 Licensing & Pricing

**Q: Can I switch from subscription to perpetual license later?**
A: Yes! We offer credit for 50% of your first-year subscription fees toward a perpetual license purchase.

**Q: What happens if I exceed my user limit?**
A: Cloud: System sends warning at 80% capacity. You can upgrade plan anytime.
   On-Premise: Software enforces limit. Contact us for license upgrade.

**Q: Are there hidden fees?**
A: No hidden fees. All costs are outlined in the pricing section. Optional add-ons clearly marked.

**Q: Can I cancel my subscription anytime?**
A: Yes, cancel anytime. No cancellation fees. Service continues until end of current billing period.

### 7.2 Deployment & Technical

**Q: How long does installation take?**
A: Cloud: Instant (create account and start)
   On-Premise: 1-3 days (including server setup and testing)

**Q: Can I migrate from cloud to on-premise later?**
A: Yes! We provide data export and migration assistance. Migration fee: $2,500-5,000 depending on data size.

**Q: What if my internet goes down during an exam?**
A: Mobile/Desktop apps have offline capability. Answers saved locally and sync when connection restored.

**Q: Can students use the same account on multiple devices?**
A: No. One student = one device during exam (security measure). Login from second device auto-logs out first.

### 7.3 Features & Functionality

**Q: Can I customize the look and feel?**
A: Yes! Enterprise and Unlimited editions include logo and color customization. Full white-label available.

**Q: Is there a question bank limit?**
A: No limit! Store unlimited questions across unlimited subjects.

**Q: Can I import existing questions from Word/Excel?**
A: Yes, via CSV template. We also offer paid data migration service for complex formats.

**Q: Does it support images in questions?**
A: Yes! Upload images for questions and answer options. Supports JPEG, PNG, GIF, WebP.

### 7.4 Security & Compliance

**Q: How is student data protected?**
A: - Encrypted at rest and in transit (AES-256, TLS 1.3)
   - Access control and authentication
   - Regular security audits
   - GDPR/FERPA compliant

**Q: Can students cheat by switching apps?**
A: System detects app switching (mobile) and logs violations. Auto-submits after 3 violations. Kiosk mode prevents switching.

**Q: What prevents students from collaborating?**
A: Question randomization ensures each student gets different questions. Teachers can also shuffle answer options.

**Q: Is data encrypted?**
A: Yes. All data encrypted in transit (SSL/TLS) and at rest (database encryption).

---

## 8. CONTACT & NEXT STEPS

### Getting Started

**1. Book a Demo:**
```
Schedule a live demonstration
See the system in action
Ask questions
Duration: 30-45 minutes
```

**2. Free Trial:**
```
Cloud Subscription: 14-day free trial (no credit card)
Test with up to 50 users
All features unlocked
```

**3. Pilot Program:**
```
Run a small-scale pilot (1-2 exams)
50-100 students
Evaluate before committing
Price: $500 (credited toward purchase)
```

**4. Request Quote:**
```
For custom deployments
Multi-site installations
Enterprise agreements
Government/institutional procurement
```

### Contact Information

**Sales Inquiries:**
```
Email: sales@uiges.com
Phone: +1 (XXX) XXX-XXXX
Web:   https://uiges.com/contact
```

**Technical Support:**
```
Email: support@uiges.com
Phone: +1 (XXX) XXX-XXXX (Priority/Premium only)
Web:   https://support.uiges.com
```

**Social Media:**
```
LinkedIn: /company/uiges
Twitter:  @uiges
Facebook: /uiges
```

---

## 9. APPENDIX

### A. Sample ROI Calculator

Use this formula to calculate your potential savings:

```
Annual Paper Exam Costs:
Paper & Printing:    [# exams] × [# students] × $3 = $______
Grading Labor:       [hours] × [$/hour] = $______
Storage:             $______
Total Traditional:   $______

Annual C-COS Costs:
License Fee:         $______
Server/Maintenance:  $______
Total C-COS:        $______

Annual Savings:      $______
ROI %:               [(Savings ÷ C-COS Cost) × 100]%
Payback Period:      [One-time cost ÷ Annual Savings] years
```

### B. Hardware Shopping List (On-Premise)

**For 1000 Concurrent Users:**
```
☐ Server (Dell R750 or equivalent)       $9,500
☐ UPS (APC 2200VA)                         $800
☐ Network Switch (UniFi 24-port)           $799
☐ WiFi APs (15× UniFi U6-LR)             $2,250
☐ Rack Cabinet (12U)                       $400
☐ Cables & Accessories                     $250
☐ Installation & Setup                   $1,500
─────────────────────────────────────────────────
Total:                                  $15,499

+ C-COS Software License               $25,000
─────────────────────────────────────────────────
Grand Total:                            $40,499
```

### C. Implementation Timeline

**Typical deployment schedule:**

```
Week 1: Planning & Procurement
- Finalize license agreement
- Order hardware (if on-premise)
- Schedule training

Week 2-3: Installation & Setup
- Install server hardware
- Deploy software
- Configure network
- Create admin accounts

Week 4: Training
- Admin training (2 days)
- Teacher training (1 day)
- Create sample exams

Week 5: Pilot Testing
- Run test exams with small group
- Gather feedback
- Fine-tune configuration

Week 6: Full Rollout
- Announce to all users
- Begin production use
- Monitor and support

Total: 6 weeks from purchase to production
```

---

**Document Version:** 1.0
**Last Updated:** January 17, 2026
**Prepared For:** C-COS Business Development

---

*This document contains confidential and proprietary information. Distribution without permission is prohibited.*
