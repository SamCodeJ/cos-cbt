# 🖥️ Hardware Requirements for 1000 Concurrent Users

## 📋 QUICK REFERENCE

### Server Hardware (Primary Backend + Database)

#### ✅ RECOMMENDED SPECIFICATION (Best Performance)
```
┌─────────────────────────────────────────────────┐
│         PRODUCTION SERVER (1000 Users)          │
├─────────────────────────────────────────────────┤
│ CPU:     12-16 cores @ 3.5+ GHz               │
│          (Intel Xeon Gold 6254/AMD EPYC 7413)  │
│                                                 │
│ RAM:     64 GB DDR4 ECC (minimum)              │
│          - PostgreSQL: ~32 GB                   │
│          - Node.js: ~16 GB                      │
│          - OS & Cache: ~16 GB                   │
│                                                 │
│ Storage: 1 TB NVMe SSD (PCIe 4.0)              │
│          - Read: 7000+ MB/s                     │
│          - Write: 5000+ MB/s                    │
│          - IOPS: 1,000,000+                     │
│                                                 │
│ Network: 10 Gbps Ethernet (dual port)          │
│          - Primary: Production traffic          │
│          - Secondary: Backup/Management         │
│                                                 │
│ PSU:     Redundant 1000W+ (80+ Platinum)       │
│                                                 │
│ UPS:     2000VA+ (2-3 hour runtime)            │
└─────────────────────────────────────────────────┘

Price Range: $8,000 - $12,000 USD (new)
             $4,000 - $6,000 USD (refurbished enterprise)
```

#### ⚠️ MINIMUM SPECIFICATION (Budget Option)
```
┌─────────────────────────────────────────────────┐
│      BUDGET SERVER (500-700 Users Max)          │
├─────────────────────────────────────────────────┤
│ CPU:     8 cores @ 3.0+ GHz                    │
│          (Intel Core i7-12700/AMD Ryzen 9 5900X)│
│                                                 │
│ RAM:     32 GB DDR4                             │
│                                                 │
│ Storage: 500 GB NVMe SSD (PCIe 3.0)             │
│          - Read: 3500+ MB/s                     │
│          - Write: 2500+ MB/s                    │
│                                                 │
│ Network: 1 Gbps Ethernet                        │
│                                                 │
│ PSU:     650W+ (80+ Gold)                       │
│                                                 │
│ UPS:     1500VA (1-2 hour runtime)             │
└─────────────────────────────────────────────────┘

Price Range: $3,000 - $5,000 USD (new)
             $1,500 - $2,500 USD (used)

⚠️ Note: With optimization, can handle 1000 users
         but with slower response times (300-500ms)
```

---

## 🏢 SERVER OPTIONS BY BUDGET

### Option 1: Enterprise Server (New) - $8K-12K
**Best Choice:** Dell PowerEdge R750 / HP ProLiant DL380 Gen10+

**Example Configuration:**
```yaml
Model:      Dell PowerEdge R750
CPU:        2× Intel Xeon Silver 4314 (16 cores, 32 threads, 2.4GHz)
RAM:        64 GB DDR4 ECC RDIMM (4× 16GB, expandable to 512GB)
Storage:    2× 960GB NVMe SSD (RAID 1)
RAID:       PERC H745 Hardware RAID Controller
Network:    4× 1GbE + 2× 10GbE ports
Remote:     iDRAC9 Enterprise (remote management)
Warranty:   3-year ProSupport Plus
Power:      Dual 1100W Redundant PSU

Total: ~$9,500 USD
```

**Pros:**
- ✅ Enterprise-grade reliability
- ✅ Hardware RAID protection
- ✅ Remote management (iDRAC/iLO)
- ✅ Hot-swappable components
- ✅ 3-year warranty with next-day service
- ✅ ECC RAM (error correction)

**Cons:**
- ❌ Higher upfront cost
- ❌ Louder (datacenter equipment)
- ❌ Requires rack mount (optional tower)

### Option 2: Workstation Server (Mid-Range) - $4K-6K
**Best Choice:** Custom Built Workstation / Dell Precision 7920

**Example Configuration:**
```yaml
Model:      Custom Workstation Build
CPU:        AMD Ryzen 9 5950X (16 cores, 32 threads, 3.4GHz)
Motherboard: ASUS Pro WS WRX80E-SAGE SE WIFI
RAM:        64 GB DDR4 ECC (4× 16GB, 3200MHz)
Storage:    1TB Samsung 980 PRO NVMe SSD
RAID:       Software RAID 1 (2× 1TB drives)
Network:    10GbE Intel X550-T2 PCIe Card
GPU:        Integrated (no dedicated GPU needed)
Case:       Fractal Design Define 7 XL (quiet, spacious)
PSU:        Corsair RM1000x (1000W, 80+ Gold)
Cooling:    Noctua NH-D15 (quiet, efficient)

Total: ~$5,200 USD
```

**Pros:**
- ✅ Excellent performance/price ratio
- ✅ Quieter than enterprise servers
- ✅ Easier to upgrade
- ✅ ECC RAM option
- ✅ More flexible configuration

**Cons:**
- ❌ No redundant PSU (add UPS)
- ❌ No remote management (add KVM)
- ❌ Self-support (no warranty)

### Option 3: Cloud Server (Monthly) - $330-1,100/mo
**Best Choice:** DigitalOcean / AWS / Azure

**DigitalOcean (Budget-Friendly):**
```yaml
Service:    CPU-Optimized Droplet
vCPU:       8 dedicated cores
RAM:        16 GB
Storage:    320 GB NVMe SSD
Network:    5 TB transfer / 10 Gbps
Location:   Choose nearest datacenter

Cost: $320/month ($3,840/year)
+ Managed PostgreSQL 4GB: $120/month
Total: $440/month or $5,280/year
```

**AWS EC2 (Enterprise):**
```yaml
Instance:   c5.2xlarge (compute optimized)
vCPU:       8 cores
RAM:        16 GB
Storage:    500 GB EBS SSD
RDS:        db.r5.2xlarge PostgreSQL (8 vCPU, 64GB)

Total: ~$1,175/month or $14,100/year
```

**Break-Even Analysis:**
```
Self-Hosted Server: $10,000 initial + $500/month
Cloud (AWS):        $0 initial + $1,175/month

Break-even: ~15 months
After 3 years:
- Self-hosted: $28,000 total
- Cloud (AWS):  $42,300 total
- Savings: $14,300 with self-hosted

Cloud (DigitalOcean):  $0 initial + $440/month
After 3 years: $15,840 total
- Savings: $12,160 over AWS
```

### Option 4: Refurbished Enterprise (Best Value) - $2K-4K
**Best Choice:** Off-lease enterprise servers (2-3 years old)

**Example Configuration:**
```yaml
Model:      Dell PowerEdge R740 (refurbished)
CPU:        2× Intel Xeon Gold 6130 (32 cores total, 2.1GHz)
RAM:        128 GB DDR4 ECC RDIMM (8× 16GB)
Storage:    4× 480GB SSD (RAID 10)
RAID:       PERC H730P Hardware RAID
Network:    4× 1GbE ports
Warranty:   90-day reseller warranty

Total: ~$3,500 USD
```

**Where to Buy:**
- ServerMonkey.com
- ServerSupply.com
- eBay (search "Dell R740 refurbished")
- Local IT liquidation companies

**Pros:**
- ✅ Best price/performance ratio
- ✅ Enterprise features (RAID, remote management)
- ✅ Often more RAM than needed
- ✅ Proven reliability

**Cons:**
- ❌ Limited warranty (90 days typical)
- ❌ Older generation (slightly slower)
- ❌ Higher power consumption

---

## 📱 CLIENT DEVICE REQUIREMENTS

### Mobile Phones (Candidates)

#### ✅ RECOMMENDED DEVICES

**Android (Best Value):**
```yaml
Budget Option ($150-250):
- Samsung Galaxy A14 5G
- Xiaomi Redmi Note 12
- Motorola Moto G Power (2023)
- Realme 9 Pro

Specs:
- OS: Android 12+
- RAM: 4 GB
- Storage: 64 GB
- Screen: 6.5" HD+
- Battery: 5000mAh
- Network: 4G LTE or 5G
```

**iPhone (Premium):**
```yaml
Budget Option ($400-600):
- iPhone SE (3rd gen, 2022)
- iPhone 11 (refurbished)
- iPhone 12 mini (refurbished)

Mid-Range ($700-900):
- iPhone 13
- iPhone 14

Specs:
- OS: iOS 15+
- RAM: 3-4 GB
- Storage: 64 GB minimum
- Battery: All-day battery life
- Network: 4G LTE or 5G
```

#### ⚠️ MINIMUM REQUIREMENTS (Not Recommended)

**Devices that WILL work but may be slow:**
```yaml
- Android 10+ with 2 GB RAM
- iPhone 8 or iPhone SE (1st gen)
- Screen smaller than 5"
- 3G network only

Issues:
- ⚠️ Slower app loading (15-30 seconds)
- ⚠️ Occasional freezing
- ⚠️ Battery drains faster
- ⚠️ Network timeouts on 3G
```

#### ❌ INCOMPATIBLE DEVICES
```yaml
- Android 9 or older
- iOS 12 or older
- Windows Phone
- BlackBerry
- Feature phones (non-smartphones)
- Tablets smaller than 7"
```

### Tablets (Alternative to Phones)

**Android Tablets:**
```yaml
Budget ($150-300):
- Samsung Galaxy Tab A8
- Lenovo Tab M10 Plus
- Amazon Fire HD 10 (with Google Play)

Premium ($400-800):
- Samsung Galaxy Tab S8
- Samsung Galaxy Tab S7 FE
- Lenovo Tab P11 Pro
```

**iPad:**
```yaml
Budget ($329-429):
- iPad 10th generation
- iPad 9th generation

Mid-Range ($449-599):
- iPad Air (4th/5th gen)
- iPad Mini (6th gen)

Premium ($799-1,099):
- iPad Pro 11"
- iPad Pro 12.9"
```

### Teacher/Admin Computers (Web Portal)

#### Desktop/Laptop Requirements:

**Budget Option ($400-700):**
```yaml
Specs:
- Processor: Intel Core i3 / AMD Ryzen 3
- RAM: 8 GB
- Storage: 256 GB SSD
- Screen: 15.6" Full HD
- OS: Windows 10/11, macOS, or Ubuntu

Examples:
- Lenovo IdeaPad 3
- HP 15.6" Laptop
- Acer Aspire 5
- Dell Inspiron 15
```

**Recommended ($700-1,200):**
```yaml
Specs:
- Processor: Intel Core i5 / AMD Ryzen 5
- RAM: 16 GB
- Storage: 512 GB SSD
- Screen: 15.6" Full HD IPS
- OS: Windows 11 Pro / macOS

Examples:
- MacBook Air M2
- Dell XPS 13
- HP Pavilion 15
- Lenovo ThinkPad E15
```

**Existing Computers:**
- ✅ Most computers from 2018 or newer will work fine
- ✅ 4 GB RAM minimum (8 GB recommended)
- ✅ Any modern browser (Chrome, Firefox, Edge, Safari)

---

## 🌐 NETWORK REQUIREMENTS

### Internet Connection (Required)

**For 1000 Concurrent Users:**
```yaml
Upload Speed:   500 Mbps minimum (1 Gbps recommended)
Download Speed: 100 Mbps minimum (500 Mbps recommended)
Latency:        < 20ms (ping to nearest city)
Connection:     Business/Enterprise tier
Reliability:    99.9% uptime SLA
Backup:         Secondary ISP (4G/5G failover recommended)
Static IP:      Recommended (for SSL certificate)
```

**Bandwidth Calculation:**
```
Per User:
- Initial load: 5 MB (one-time)
- During exam: 20 KB/minute
- 90-minute exam: ~7 MB total

1000 Users:
- Simultaneous start: 5 GB (within 5 minutes)
- = 133 Mbps peak upload needed
- Steady state: ~33 Mbps upload
- Add 3× safety margin: 500 Mbps recommended
```

### Router/Firewall

**Required Specifications:**
```yaml
Throughput:     10 Gbps WAN-to-LAN
Sessions:       100,000+ concurrent connections
NAT:            Full Cone NAT or Port Forwarding
QoS:            Traffic prioritization support
VLAN:           Support for network segmentation
Ports:          Gigabit Ethernet (RJ45)

Recommended Models:
Budget ($200-400):
- Ubiquiti UniFi Dream Machine
- TP-Link ER7206

Mid-Range ($400-800):
- Ubiquiti UniFi Dream Machine Pro
- Fortinet FortiGate 60F
- Sophos XG 115

Enterprise ($800-2,000):
- Fortinet FortiGate 100F
- Sophos XG 230
- pfSense Custom Build
```

### WiFi (For Mobile Devices)

**Access Points for 1000 Users:**
```yaml
Users per AP:    50-80 maximum
Total APs:       13-20 access points
Standard:        WiFi 6 (802.11ax) recommended
Bandwidth:       Dual-band (2.4 GHz + 5 GHz)
Management:      Centralized controller

Calculation:
- 1000 users ÷ 60 per AP = 17 access points
- Distributed across exam halls
- Overlap coverage for seamless roaming

Recommended:
- Ubiquiti UniFi WiFi 6 LR (Long Range)
- TP-Link Omada EAP660 HD
- Aruba Instant On AP22
- Cisco Meraki MR36

Cost per AP: $150-300
Total: 17 APs × $200 = ~$3,400
```

**Network Design Example:**
```
Internet (1 Gbps) → Router/Firewall → Core Switch (10G) → Distribution Switches → Access Points
                                                        ↓
                                                    Server (10G)
```

---

## 💾 STORAGE REQUIREMENTS

### Database Storage Growth Estimation

**Per Exam:**
```yaml
Questions:      ~2 KB per question × 50 = 100 KB
Candidates:     ~1 KB per candidate × 100 = 100 KB
Attempts:       ~500 bytes per attempt × 100 = 50 KB
Answers:        ~200 bytes × 5,000 (50q × 100c) = 1 MB
Images:         Variable (0-50 MB per exam)

Total per exam: ~1-52 MB
```

**Annual Storage Estimate:**
```yaml
Exams per year:     100 exams
Students:           10,000 students
Attempts:           20,000 exam attempts
Profile pictures:   50 MB (10,000 × 5KB average)
Question images:    500 MB (100 exams × 5MB average)

Database:       ~5 GB per year
Files:          ~550 MB per year
Backups:        ~20 GB per year (daily backups, 30-day retention)
Logs:           ~10 GB per year

Total first year:   ~35 GB
Total after 5 years: ~175 GB
```

**Recommended Storage:**
```yaml
Database:       500 GB (10 years capacity)
Backups:        500 GB (separate drive or NAS)
Total:          1 TB minimum
```

---

## 🔌 POWER & COOLING

### Power Requirements

**Server Power Consumption:**
```yaml
Idle:           150-200W
Average Load:   300-400W
Peak Load:      500-700W
24/7 Annual:    ~3,500 kWh

Electricity Cost:
- At $0.15/kWh: ~$525/year
- At $0.20/kWh: ~$700/year
```

**UPS (Uninterruptible Power Supply):**
```yaml
Minimum:        1500VA / 900W
Recommended:    2000VA / 1200W
Runtime:        2-3 hours at 50% load
Features:       - Pure sine wave
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

### Cooling Requirements

**Server Room Specifications:**
```yaml
Temperature:    18-24°C (64-75°F)
Humidity:       40-60% RH
Ventilation:    Good airflow, no obstructions
Cooling:        Dedicated AC or server room HVAC

BTU Calculation:
- Server: 500W × 3.412 = 1,706 BTU/hr
- Add 30% for equipment: 2,218 BTU/hr
- Minimum AC: 5,000 BTU/hr unit

Recommended:
- Portable AC: 8,000-10,000 BTU/hr
- Split AC: 12,000 BTU/hr (1 ton)
- For 3+ servers: 18,000 BTU/hr (1.5 ton)
```

---

## 📦 COMPLETE SETUP PACKAGES

### Package 1: PREMIUM SETUP ($12K-15K)
```
✅ Best for: Universities, large institutions

Hardware:
- Dell PowerEdge R750 (16-core, 64GB RAM, 1TB SSD)     $9,500
- UPS (APC Smart-UPS 2200VA)                            $800
- Network Switch (UniFi Pro Max 24)                     $799
- WiFi Access Points (15× UniFi U6-LR)                $2,250
- Rack Cabinet (12U wall mount)                         $400
- Cables & Accessories                                  $250

Total Hardware: $14,000

+ Setup & Configuration: $1,000-2,000
= Total: $15,000-16,000
```

### Package 2: STANDARD SETUP ($6K-8K)
```
✅ Best for: Schools, colleges

Hardware:
- Custom Workstation (16-core Ryzen, 64GB, 1TB NVMe)  $5,200
- UPS (CyberPower 1500VA)                               $400
- Network Switch (UniFi Switch 24)                      $299
- WiFi Access Points (12× UniFi U6-Lite)             $1,200
- Rack Cabinet or Desktop Case                          $200
- Cables & Accessories                                  $150

Total Hardware: $7,450

+ Setup & Configuration: $500-1,000
= Total: $7,950-8,450
```

### Package 3: BUDGET SETUP ($3K-4K)
```
✅ Best for: Small schools, training centers

Hardware:
- Refurbished Server (R740, 32-core, 128GB, 2TB)     $3,500
- UPS (Basic 1000VA)                                    $250
- Network Switch (TP-Link 24-port Gigabit)              $150
- WiFi Access Points (8× TP-Link EAP225)                $600
- Cables & Accessories                                  $100

Total Hardware: $4,600

+ Setup & Installation: $400-800
= Total: $5,000-5,400
```

### Package 4: CLOUD HOSTING (Monthly)
```
✅ Best for: Pilot programs, temporary setups

DigitalOcean:
- CPU-Optimized Droplet (8 vCPU, 16GB)       $320/month
- Managed PostgreSQL (4GB)                   $120/month
- Load Balancer (if needed)                   $12/month
- Backups & Snapshots                         $30/month

Total: $482/month or $5,784/year

Break-even vs self-hosted: ~2 years
```

---

## ✅ PURCHASE CHECKLIST

Before buying hardware, verify:

**Server:**
- [ ] CPU: 8+ cores (16+ recommended)
- [ ] RAM: 32 GB minimum (64 GB recommended)
- [ ] Storage: 500 GB NVMe SSD minimum (1 TB recommended)
- [ ] Network: Gigabit Ethernet (10GbE preferred)
- [ ] Form factor fits your space (tower/rack)
- [ ] Warranty or return policy

**Network:**
- [ ] Router/firewall supports 10,000+ sessions
- [ ] Internet: 500 Mbps+ upload, business tier
- [ ] WiFi APs: 1 per 50-80 users
- [ ] Centralized management for APs
- [ ] VLANs and QoS support

**Power:**
- [ ] UPS rated for 2× server wattage
- [ ] Runtime: 2-3 hours minimum
- [ ] Pure sine wave output
- [ ] Monitoring capability

**Cooling:**
- [ ] Server room temperature controlled
- [ ] AC rated for heat output + 30%
- [ ] Good ventilation, no obstructions
- [ ] Temperature monitoring

**Accessories:**
- [ ] Ethernet cables (Cat6 or Cat6a)
- [ ] KVM switch (if multiple servers)
- [ ] Remote management (iDRAC, iLO, IPMI)
- [ ] Backup storage (NAS or external HDD)
- [ ] Monitoring tools (sensors, software)

---

## 📞 VENDOR CONTACTS

### Server Vendors:
- **Dell Technologies:** dell.com/servers
- **HP Enterprise:** hpe.com/servers
- **Supermicro:** supermicro.com
- **Lenovo:** lenovo.com/servers

### Refurbished Servers:
- **ServerMonkey:** servermonkey.com
- **ServerSupply:** serversupply.com
- **IT Liquidators:** Local search

### Cloud Providers:
- **DigitalOcean:** digitalocean.com (Budget-friendly)
- **AWS:** aws.amazon.com (Enterprise)
- **Azure:** azure.microsoft.com (Enterprise)
- **Google Cloud:** cloud.google.com (Enterprise)

### Network Equipment:
- **Ubiquiti:** ui.com (Recommended)
- **TP-Link:** tp-link.com (Budget)
- **Fortinet:** fortinet.com (Enterprise)
- **Cisco:** cisco.com (Enterprise)

---

**Last Updated:** January 17, 2026
**For:** C-COS CBT System v1.0
**Target:** 1000 Concurrent Users

