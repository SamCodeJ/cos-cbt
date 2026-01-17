# 📱 Testing Time Extension on Mobile

## Quick Test Steps

### 1. Start an Exam on Mobile
- Login to mobile app
- Start any exam (even a test exam with 1-2 minutes)
- Note the timer countdown

### 2. Extend Time from Web Portal
- Open web portal
- Go to "My Exams"
- Click ⋮ on the exam
- Click "Extend Time"
- Add 5 minutes globally or for that specific student

### 3. Watch Mobile App
- Within 30 seconds, you should see:
  - Alert: "⏰ Time Extended - Your teacher has added X minute(s)"
  - Timer updates to show new time

## 🔍 Debugging Steps

### Check Backend Logs
When student is taking exam, you should see in backend console:
```
GET /api/candidate/exams/:id/time-remaining 200
```

If you see errors, check:
1. Is the endpoint returning data?
2. Are the columns recognized?

### Check Mobile Console
In mobile app (Expo dev tools), look for:
```
Time check error: [any error message]
```

### Manual Test of Endpoint

Test the endpoint directly:
```bash
# Replace with actual exam ID and auth token
curl http://YOUR_IP:3001/api/candidate/exams/14/time-remaining \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected response:
```json
{
  "total_duration_minutes": 60,
  "time_remaining_seconds": 3000,
  "elapsed_minutes": 10,
  "base_duration": 60,
  "global_extension": 0,
  "individual_extension": 0,
  "status": "in_progress"
}
```

## ⚠️ Common Issues

### Issue 1: Endpoint Returns 500 Error
**Cause:** Database columns not recognized
**Fix:** Restart backend server

### Issue 2: No Alert Shows Up
**Cause:** Polling not working or time difference < 5 seconds
**Fix:** 
- Add more time (10+ minutes)
- Check mobile console for errors
- Verify polling is happening (check backend logs)

### Issue 3: "Time check error" in Console
**Cause:** API endpoint not accessible
**Fix:**
- Verify mobile app can reach backend
- Check IP address in mobile/src/api/client.js
- Test connection from mobile browser

### Issue 4: Timer Doesn't Update
**Cause:** Server time difference < 5 seconds threshold
**Fix:** Code only updates if difference > 5 seconds to avoid flickering

## 🧪 Recommended Test

1. Create a SHORT test exam (2 minutes)
2. Start it on mobile
3. After 30 seconds, extend by 10 minutes from web
4. Wait 30 seconds on mobile
5. Should see alert and timer jump from ~1:30 to ~11:30

## 📊 What Should Happen

```
Student Timer: 1:45 remaining
Teacher extends: +10 minutes
After 30 seconds:
  - Alert appears
  - Timer shows: 11:45 remaining
  - Exam continues normally
```

