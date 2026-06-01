# Mobile App Network Configuration Guide

## Quick Setup

The mobile app needs to connect to your backend server. By default, it's configured for local network development.

## Current Configuration

**File:** `mobile/src/api/client.js`

```javascript
const API_BASE_URL = 'http://10.25.38.125:3001/api';
```

## How to Update the IP Address

### Step 1: Find Your Computer's IP Address

1. **Look at the backend terminal** - When the backend starts, it displays:
   ```
   🚀 C-COS Backend Server running on port 3001
   📱 Mobile Device URL: http://YOUR_IP_HERE:3001/api
   ```

2. **Or find it manually:**
   - **Windows:** Open Command Prompt and run `ipconfig`, look for "IPv4 Address"
   - **Mac:** Open Terminal and run `ifconfig | grep "inet "`, look for your local IP
   - **Linux:** Run `ip addr show` or `ifconfig`

### Step 2: Update the Mobile App

1. Open `mobile/src/api/client.js`
2. Update line 8:
   ```javascript
   export const API_BASE_URL = 'http://YOUR_IP_HERE:3001/api';
   ```
3. Save the file
4. Reload your mobile app (press 'r' in Expo terminal or shake device)

## Common Issues

### ❌ "Cannot reach server" / "Network Error"

**Causes:**
- IP address has changed (WiFi reconnection, network change)
- Backend server is not running
- Phone and computer are on different WiFi networks
- Firewall blocking connections

**Solutions:**
1. Check backend server is running:
   ```bash
   cd backend
   npm run dev
   ```
   You should see: "🚀 C-COS Backend Server running on port 3001"

2. Verify your computer's current IP address matches `API_BASE_URL`

3. Ensure phone and computer are on the **same WiFi network**

4. Check Windows Firewall isn't blocking port 3001:
   - Open Windows Defender Firewall
   - Allow Node.js through firewall
   - Or temporarily disable firewall for testing

5. Try accessing backend from phone browser:
   - Open browser on phone
   - Navigate to: `http://YOUR_IP:3001/health`
   - Should see: `{"status":"ok","timestamp":"..."}`

### ⏱️ "Connection timeout"

**Causes:**
- Backend server is slow or not responding
- Network congestion

**Solutions:**
- Restart backend server
- Check backend terminal for errors
- Try restarting your computer's network

### 🔐 "Invalid credentials" (after fixing connection)

**Causes:**
- Wrong email or password
- Candidate not added to exam yet
- Password not set correctly

**Solutions:**
1. Verify candidate was added to an exam from the web portal
2. Check the password that was shown when adding the candidate
3. Passwords are case-sensitive
4. Make sure you're using the candidate's email (not teacher/admin email)

## Enhanced Logging

The mobile app now includes detailed logging to help diagnose issues:

### On App Startup
```
📱 C-COS Mobile App - API Configuration
🔗 API Base URL: http://10.57.236.125:3000/api
📍 Server IP: 10.57.236.125
🔌 Server Port: 3000
```

### During Login
```
🔐 Attempting login for: candidate@example.com
📡 Connecting to: http://10.57.236.125:3000/api/auth/login
✅ Login successful
💾 Stored user data for: John Doe
```

### On Errors
```
❌ Network Error - Cannot reach server
🔍 Current API URL: http://10.57.236.125:3000/api
💡 Troubleshooting:
   1. Check if backend server is running
   2. Verify computer IP address hasn't changed
   3. Ensure phone and computer are on same WiFi network
   4. Check backend terminal for correct IP address
```

## Connection Test Feature

The login screen now includes a connection test that runs automatically:

- **Green check:** Backend is reachable ✅
- **Yellow warning:** Backend may not be reachable ⚠️
  - Click "Test Connection Again" to retry

## Port Configuration

The default port is `3000`. If you need to change it:

1. Update backend `.env` file:
   ```
   PORT=3001
   ```

2. Update mobile app `API_BASE_URL` to match:
   ```javascript
   const API_BASE_URL = 'http://YOUR_IP:3001/api';
   ```

3. Restart backend server
4. Reload mobile app

## For Developers

### Testing Connection Programmatically

```javascript
import { testConnection } from '../api/client';

const result = await testConnection();
if (result.success) {
  console.log('Backend is reachable');
} else {
  console.log('Backend is not reachable');
  console.log('Troubleshooting:', result.troubleshooting);
}
```

### Production Deployment

For production, replace the hardcoded IP with:

```javascript
import { Platform } from 'react-native';

const API_BASE_URL = __DEV__
  ? Platform.select({
      ios: 'http://localhost:3000/api',
      android: 'http://10.0.2.2:3000/api', // Android emulator
    })
  : 'https://your-production-domain.com/api';
```

## Need Help?

1. Check the console logs in Expo (press 'j' to open debugger)
2. Check backend server logs for incoming requests
3. Verify network connectivity between devices
4. Restart both backend server and mobile app

