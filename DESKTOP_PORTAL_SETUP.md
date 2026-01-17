# Desktop Candidate Portal - Quick Setup Guide

This guide will help you set up the desktop candidate portal for use in computer labs or examination halls.

## 🎯 Overview

The UI-GES system now includes **two candidate interfaces**:

1. **Mobile App** (`/mobile` folder) - For smartphones and tablets
2. **Desktop Web Portal** (`/desktop` folder) - **NEW!** For PCs and laptops in examination halls

## 📁 What Was Created

A complete web-based candidate portal in the `/desktop` folder with:

### ✅ Features Implemented
- ✅ Candidate login (Student ID + Password)
- ✅ Dashboard showing assigned exams
- ✅ Exam instructions screen
- ✅ Full exam taking interface with:
  - Real-time countdown timer
  - Question navigation (Previous/Next/Palette)
  - Answer selection (Radio/Checkbox for multi-answer)
  - Flag questions for review
  - Auto-save functionality
  - Time extension support
  - Auto-submit on timer expiry
- ✅ Results display with performance analysis
- ✅ Question-by-question review

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies

```bash
cd desktop
npm install
```

### Step 2: Configure Backend URL

Edit `desktop/.env`:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### Step 3: Run Development Server

```bash
npm run dev
```

Access at: `http://localhost:5174`

## 🖥️ Physical Hall Setup (Production)

### Scenario: 50 PCs in Computer Lab

**Server Computer (Your Main Machine):**

1. **Start Backend**:
   ```bash
   cd backend
   npm run dev
   ```
   Note your IP (e.g., `192.168.1.100`)

2. **Build Desktop Portal**:
   ```bash
   cd desktop
   
   # Update .env with your server IP
   echo "VITE_API_BASE_URL=http://192.168.1.100:3001/api" > .env
   
   # Build
   npm run build
   ```

3. **Serve the Build**:
   ```bash
   # Option A: Using serve
   npm install -g serve
   serve -s dist -p 5174
   
   # Option B: Copy dist to backend public folder
   # Then access via backend server
   ```

**Client PCs (Student Computers):**

1. Open any modern browser (Chrome, Firefox, Edge)
2. Navigate to: `http://192.168.1.100:5174`
3. Students login with their Student ID and password
4. Take exams

## 🔐 Candidate Credentials

When teachers create candidates in the web portal:
- A **password** is auto-generated or manually set
- Teachers must provide this password to students
- Students login using: **Student ID** + **Password**

## 📊 Comparison: Mobile vs Desktop

| Feature | Mobile App | Desktop Portal |
|---------|------------|----------------|
| Platform | iOS/Android | Any web browser |
| Login | Student ID + Password | Student ID + Password |
| Kiosk Mode | ✅ Yes | ❌ No (browser-based) |
| Offline Support | ✅ Limited | ❌ Requires connection |
| Installation | Required | None (just open URL) |
| Best For | Personal devices | Computer labs |

## 🎓 Usage Scenarios

### Scenario 1: Personal Devices (Use Mobile App)
- Students use their own smartphones
- Download and install mobile app
- Take exams anywhere within time window

### Scenario 2: Computer Lab (Use Desktop Portal)
- Students come to physical hall
- Each PC has browser open to desktop portal
- Students login and take exams on-site

### Scenario 3: Hybrid
- Some students use mobile app at home
- Some students use desktop portal in lab
- Both connect to same backend server

## 🔧 Network Configuration

### For Local Network (Recommended for Halls):

1. **Find Your Server IP**:
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```
   Look for IPv4 address (e.g., `192.168.1.100`)

2. **Update Desktop Portal**:
   Edit `desktop/.env`:
   ```env
   VITE_API_BASE_URL=http://192.168.1.100:3001/api
   ```

3. **Update Mobile App** (if using):
   Edit `mobile/src/api/client.js` line 8:
   ```javascript
   export const SERVER_URL = 'http://192.168.1.100:3001';
   ```

4. **Firewall**:
   - Allow incoming connections on port 3001 (backend)
   - Allow incoming connections on port 5174 (desktop portal)

## 📱 Testing the Setup

### 1. Test Backend Health
```bash
# From server or any PC
curl http://192.168.1.100:3001/health
# Should return: {"status":"ok", ...}
```

### 2. Test Desktop Portal
- Open browser on client PC
- Navigate to `http://192.168.1.100:5174`
- Should see login screen

### 3. Test Login
- Create a test candidate in teacher portal
- Note the Student ID and password
- Login via desktop portal
- Should see dashboard

## 🎯 Workflow for Exam Day

### Before Exam:

1. ✅ Start backend server
2. ✅ Start desktop portal (serve build)
3. ✅ Test on one PC
4. ✅ Create exam with candidates
5. ✅ Distribute Student IDs and passwords

### During Exam:

1. Students arrive at computer lab
2. Students navigate to desktop portal URL
3. Students login with credentials
4. Students read instructions and start exam
5. Timer runs, auto-submits at end

### After Exam:

1. Teachers view results in web portal
2. Generate reports
3. Download transcripts

## 🐛 Troubleshooting

### "Cannot Connect to Backend"
- ✅ Check backend is running: `http://your-ip:3001/health`
- ✅ Check firewall allows port 3001
- ✅ Verify IP address in `.env` file
- ✅ Ensure PCs are on same network

### "Exam Won't Start"
- ✅ Check exam status is "active"
- ✅ Check current date/time is within exam window
- ✅ Verify candidate is assigned to exam
- ✅ Check browser console for errors

### "Timer Not Working"
- ✅ Check browser JavaScript is enabled
- ✅ Verify system clocks are synchronized
- ✅ Check backend `/time-remaining` endpoint

## 📂 File Structure

```
UI-GES-1/
├── desktop/           # 🆕 NEW Desktop Portal
│   ├── src/
│   │   ├── api/      # API client
│   │   ├── components/  # UI components
│   │   ├── pages/    # All pages (Login, Dashboard, Exam, Results)
│   │   ├── App.jsx   # Main app
│   │   └── main.jsx  # Entry point
│   ├── package.json
│   ├── .env          # Configure backend URL here
│   └── README.md     # Detailed documentation
│
├── mobile/           # Existing Mobile App
├── src/              # Existing Web Portal (Teachers/Admins)
└── backend/          # Backend Server
```

## 🎉 Summary

You now have a complete desktop candidate portal that:
- ✅ Runs in any modern web browser
- ✅ Requires zero installation on client PCs
- ✅ Connects to same backend as mobile app
- ✅ Perfect for computer labs and examination halls
- ✅ Full-featured exam taking experience
- ✅ Real-time timer and auto-save
- ✅ Beautiful, modern UI

## 📞 Next Steps

1. **Test the setup**: `cd desktop && npm install && npm run dev`
2. **Create test candidates** in teacher portal
3. **Try taking an exam** via desktop portal
4. **Deploy for production** when ready

For detailed documentation, see `desktop/README.md`

---

**Questions? Check the troubleshooting section or review the detailed README in the desktop folder.**
