# Exam Time Limiting - Visual Guide

## Timeline Visualization

### Scenario 1: Student Starts On Time ✅
```
Exam Window:     [=========================]
                 9:00 AM                  11:00 AM
                 
Student Login:   ↓
                 9:05 AM
                 
Available Time:  [====================]
                 60 minutes (full duration)
                 
Student Ends:                            ↓
                                      10:05 AM
                                      
Status: NOT LIMITED (✓)
```

---

### Scenario 2: Student Starts Late ⚠️
```
Exam Window:     [=========================]
                 9:00 AM                  11:00 AM
                 
Student Login:                      ↓
                                 10:30 AM
                                 
Allocated Time: [====================]
                60 minutes
                
Time Until Close:               [====]
                                30 min
                                
Available Time:                 [====]
                                30 minutes (LIMITED!)
                                
Student Ends:                        ↓
                                  11:00 AM
                                  
Status: LIMITED BY END_DATE (⚠️)
```

---

### Scenario 3: Student Starts Very Late 🚨
```
Exam Window:     [=========================]
                 9:00 AM                  11:00 AM
                 
Student Login:                          ↓
                                     10:55 AM
                                     
Allocated Time: [====================]
                60 minutes
                
Time Until Close:                      [=]
                                       5 min
                                
Available Time:                        [=]
                                       5 minutes (VERY LIMITED!)
                                
Student Ends:                          ↓
                                    11:00 AM
                                    
Status: LIMITED BY END_DATE (🚨)
```

---

### Scenario 4: Resume After Crash 🔄
```
Exam Window:     [=========================]
                 9:00 AM                  11:00 AM
                 
Student Started:             ↓
                          10:20 AM
                          
Allocated Time: [====================]
                60 minutes
                
Expected End:                            ↓
                                      11:20 AM (would exceed!)
                
App Crashes!                    💥
Student Rejoins:                    ↓
                                 10:50 AM
                                 
Elapsed:        [==========]
                30 minutes
                
Remaining:                  [==========]
                            30 minutes
                            
Time Until Close:               [====]
                                10 min
                                
Available Time:                 [====]
                                10 minutes (LIMITED!)
                                
Student Ends:                        ↓
                                  11:00 AM
                                  
Status: LIMITED BY END_DATE (⚠️)
```

---

## Logic Flow Diagram

```
┌─────────────────────────────────────────────┐
│    Student Clicks "Start Exam"             │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Backend Calculates:                        │
│  - Allocated Time = Base + Extensions       │
│  - Time Until Close = end_date - now        │
└──────────────┬──────────────────────────────┘
               │
               ▼
         ┌────────────┐
         │ Is Resume? │
         └─────┬──────┘
          Yes  │  No
        ┌──────┴──────┐
        ▼             ▼
  ┌────────────┐  ┌────────────────────┐
  │ Calculate  │  │ Use Allocated Time │
  │ Elapsed    │  └──────┬─────────────┘
  │ Time       │         │
  └─────┬──────┘         │
        │                │
        ▼                │
  ┌────────────┐         │
  │ Remaining  │         │
  │ = Alloc -  │         │
  │   Elapsed  │         │
  └─────┬──────┘         │
        │                │
        └────────┬───────┘
                 │
                 ▼
  ┌─────────────────────────────────┐
  │ Final Time = MIN(               │
  │   Remaining/Allocated,          │
  │   Time Until Close              │
  │ )                               │
  └────────────┬────────────────────┘
               │
               ▼
  ┌─────────────────────────────────┐
  │ Send to Mobile App:             │
  │ - time_remaining_seconds        │
  │ - limited_by_end_date flag      │
  └────────────┬────────────────────┘
               │
               ▼
  ┌─────────────────────────────────┐
  │ Mobile Timer Starts             │
  │ Polls every 30 seconds          │
  └─────────────────────────────────┘
```

---

## Decision Tree

```
                     Start Exam
                         │
                         ▼
              ┌──────────────────────┐
              │ Calculate Times:     │
              │ A = Allocated        │
              │ C = Until Close      │
              └──────────┬───────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │  A <= C ?    │
                  └──┬────────┬──┘
                Yes  │        │  No
                     │        │
        ┌────────────┘        └────────────┐
        ▼                                  ▼
   ┌─────────┐                      ┌──────────┐
   │ Give A  │                      │  Give C  │
   │ (Full)  │                      │ (Limited)│
   └────┬────┘                      └─────┬────┘
        │                                 │
        ▼                                 ▼
   ┌─────────────────┐            ┌───────────────────┐
   │ limited = false │            │  limited = true   │
   └─────────────────┘            └───────────────────┘
```

---

## Math Examples

### Example 1: On Time Start
```
Given:
  Base Duration       = 60 min
  Global Extension    = 0 min
  Individual Ext      = 0 min
  Current Time        = 9:05 AM
  Exam End Time       = 11:00 AM

Calculate:
  Allocated Time      = 60 + 0 + 0 = 60 minutes
  Time Until Close    = 11:00 - 9:05 = 115 minutes
  Given Time          = MIN(60, 115) = 60 minutes ✅

Result: Student gets full 60 minutes
```

### Example 2: Late Start
```
Given:
  Base Duration       = 60 min
  Global Extension    = 0 min
  Individual Ext      = 0 min
  Current Time        = 10:30 AM
  Exam End Time       = 11:00 AM

Calculate:
  Allocated Time      = 60 + 0 + 0 = 60 minutes
  Time Until Close    = 11:00 - 10:30 = 30 minutes
  Given Time          = MIN(60, 30) = 30 minutes ⚠️

Result: Student gets 30 minutes (LIMITED!)
```

### Example 3: Resume After 30 Min
```
Given:
  Base Duration       = 60 min
  Started At          = 10:20 AM
  Current Time        = 10:50 AM
  Exam End Time       = 11:00 AM

Calculate:
  Allocated Time      = 60 minutes
  Elapsed Time        = 10:50 - 10:20 = 30 minutes
  Remaining (Alloc)   = 60 - 30 = 30 minutes
  Time Until Close    = 11:00 - 10:50 = 10 minutes
  Given Time          = MIN(30, 10) = 10 minutes ⚠️

Result: Student gets 10 minutes (LIMITED!)
```

---

## Color-Coded Status

### 🟢 Not Limited (Full Time Available)
```
Allocated Time ≤ Time Until Exam Closes
Student gets their full allocated time
No warning needed
```

### 🟡 Slightly Limited (Some Restriction)
```
Allocated Time > Time Until Exam Closes
Student still has reasonable time (> 15 min)
Consider showing informational notice
```

### 🔴 Heavily Limited (Very Restricted)
```
Time Until Exam Closes < 10 minutes
Student has very little time
Should show warning before starting
```

### ⚫ Cannot Start
```
Time Until Exam Closes ≤ 0
Exam has ended
Block exam start entirely
```

---

## Backend Response Examples

### Response 1: Full Time
```json
{
  "attempt_id": 123,
  "questions": [...],
  "time_remaining_seconds": 3600,
  "total_duration_minutes": 60,
  "limited_by_end_date": false
}
```

### Response 2: Limited Time
```json
{
  "attempt_id": 124,
  "questions": [...],
  "time_remaining_seconds": 1800,
  "total_duration_minutes": 30,
  "limited_by_end_date": true
}
```

### Response 3: Time Poll Update
```json
{
  "time_remaining_seconds": 600,
  "total_duration_minutes": 10,
  "elapsed_minutes": 20,
  "base_duration": 60,
  "global_extension": 0,
  "individual_extension": 0,
  "status": "in_progress",
  "limited_by_end_date": true
}
```

---

## Database Query Visualization

```sql
-- This query calculates both values simultaneously:

SELECT 
  e.duration as base_duration,                      -- 60 min
  e.global_time_extension_minutes,                  -- 10 min
  e.end_date,                                       -- 2026-01-17 11:00:00
  ea.time_extension_minutes,                        -- 5 min
  -- Calculate minutes until exam closes in real-time:
  EXTRACT(EPOCH FROM (e.end_date - CURRENT_TIMESTAMP))/60 
    as minutes_until_exam_closes                    -- 30.5 min
FROM exams e
JOIN exam_attempts ea ON ea.exam_id = e.id
WHERE e.id = $1 AND ea.id = $2;

-- Then in code:
allocatedTime = 60 + 10 + 5 = 75 minutes
minutesUntilClose = 30.5 minutes
givenTime = MIN(75, 30.5) = 30.5 → rounded to 31 minutes
```

---

## Key Takeaways

1. **Priority Order**: `MIN(Allocated, Until_Close)`
2. **Always Respect**: Exam `end_date` is the hard deadline
3. **Real-Time**: Calculated every time (start, resume, poll)
4. **Fair**: Everyone finishes by the same deadline
5. **Logged**: All calculations logged for debugging

---

**For more details, see**: `EXAM_END_DATE_TIME_LIMITING.md`
