# Expo Network Error Fix

## Error
```
TypeError: fetch failed
    at fetchWithCredentials
    at getNativeModuleVersionsAsync
```

## Cause
Expo CLI is trying to fetch module version information from Expo's servers but failing due to:
- Network connectivity issues
- Firewall/proxy blocking
- Expo servers temporarily unavailable
- Corporate network restrictions

## Solutions

### Solution 1: Skip Dependency Validation (Recommended)
Disable Expo's dependency checking during startup:

**PowerShell:**
```powershell
cd mobile
$env:EXPO_NO_DOCTOR="1"
npm start
```

**Or set it permanently:**
```powershell
cd mobile
[System.Environment]::SetEnvironmentVariable('EXPO_NO_DOCTOR', '1', 'User')
npm start
```

### Solution 2: Use Offline Mode
```powershell
cd mobile
npm start -- --offline
```

### Solution 3: Clear Expo Cache
```powershell
cd mobile
npx expo start --clear
```

### Solution 4: Check Network/Proxy
If you're behind a corporate firewall or proxy:

```powershell
# Check if you can reach Expo servers
curl https://exp.host/--/api/v2/versions

# If this fails, configure proxy
$env:HTTP_PROXY="http://proxy.company.com:8080"
$env:HTTPS_PROXY="http://proxy.company.com:8080"
npm start
```

### Solution 5: Update Expo CLI
```powershell
cd mobile
npm install expo@latest
```

## Quick Fix (Current Session)
The network check is not critical - your app will still work! The error happens during:
- Checking for package updates
- Validating native module versions
- Fetching recommended versions

**None of these are required for the app to run!**

## Verify It's Working
Even with the fetch error, if you see:
```
› Metro waiting on exp://...
› Scan the QR code above
```

**Your app is running fine!** ✅

## Long-term Fix
Add to `mobile/.expo/settings.json`:
```json
{
  "doctor": {
    "enabled": false
  }
}
```

Or add to `mobile/app.json`:
```json
{
  "expo": {
    "doctor": {
      "enabled": false
    }
  }
}
```

## Alternative: Use Tunnel Connection
If local network is the issue:
```powershell
cd mobile
npm start -- --tunnel
```

This uses ngrok to create a tunnel, bypassing local network issues.

## Check What Worked
Look for these lines in the output:
```
✓ Metro is ready
› Metro waiting on exp://...
```

If you see these, **ignore the fetch error** - your app is working!

## Troubleshooting

### Still getting errors?
1. Check internet connection
2. Try running with admin privileges
3. Temporarily disable antivirus/firewall
4. Check if corporate network blocks Expo

### Need to use proxy?
Create `mobile/.npmrc`:
```
proxy=http://proxy.company.com:8080
https-proxy=http://proxy.company.com:8080
strict-ssl=false
```

## Summary
The fetch error is **not critical** - it only affects:
- Dependency version checking
- Update notifications
- Version recommendations

Your app functionality is **not affected**! The Expo Metro bundler will still work fine for development.

