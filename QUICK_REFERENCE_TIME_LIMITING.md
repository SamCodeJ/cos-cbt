# 🎯 Quick Reference: Exam Time Limiting Feature

## The Core Rule

```
Student's Time = MIN(Allocated Duration, Time Until Exam Closes)
```

## Three Scenarios

| Scenario | Allocated | Until Close | Gets | Limited? |
|----------|-----------|-------------|------|----------|
| **On Time** | 60 min | 115 min | 60 min | ❌ No |
| **Late** | 60 min | 30 min | 30 min | ✅ Yes |
| **Very Late** | 60 min | 5 min | 5 min | ✅ Yes |

## Quick Test

### Create Test Exam
```
Duration: 60 minutes
End Date: 30 minutes from now
```

### Expected Behavior
- Student starts → Gets 30 minutes (not 60)
- Timer shows 30:00
- Auto-submits at exam end_date

## Files Changed

| File | Lines | What Changed |
|------|-------|--------------|
| `backend/routes/candidate.js` | ~240-290 | Resume logic |
| `backend/routes/candidate.js` | ~540-570 | Start logic |
| `backend/routes/candidate.js` | ~1082-1175 | Poll logic |

## API Changes

### New Response Field
```json
{
  "limited_by_end_date": true
}
```

### All Three Endpoints Return This
- `POST /api/candidate/exams/:id/start`
- `GET /api/candidate/exams/:id/time-remaining`

## Console Logs to Watch

```
⏱️ Time calculation for new exam start: {
  allocatedTime: '60 minutes',
  minutesUntilExamCloses: '30.00 minutes',
  givenTime: '30 minutes',
  limited: true
}
```

## Testing Checklist

- [ ] Create exam ending in 30 min, duration 60 min
- [ ] Student starts exam
- [ ] Verify timer shows 30:00 (not 60:00)
- [ ] Wait for exam to end
- [ ] Verify auto-submit works
- [ ] Check `limited_by_end_date: true` in response

## Important Notes

⚠️ **If teacher extends time mid-exam, also extend end_date!**

✅ **Students starting on time are unaffected**

🔄 **Mobile app polls every 30 seconds (real-time enforcement)**

## Test Script

```bash
node backend/test-exam-time-limiting.js
```

Expected: ✅ All 8 tests pass

## Status

✅ **COMPLETE & READY FOR TESTING**

---

**Date**: January 17, 2026  
**See Also**: 
- `EXAM_END_DATE_TIME_LIMITING.md` (full docs)
- `EXAM_TIME_LIMITING_VISUAL_GUIDE.md` (visual guide)
- `IMPLEMENTATION_COMPLETE_SUMMARY.md` (summary)
