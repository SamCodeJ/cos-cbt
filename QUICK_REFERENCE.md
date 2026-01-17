# ⚡ Quick Reference - Time Extension Feature

## 🚀 Setup (Do This First!)

```bash
# 1. Apply database migration
cd backend
node database/migrations/apply-time-extension.js

# 2. Restart backend
npm run dev
```

## 👨‍🏫 Teacher: How to Extend Time

### Option A: Extend for All Students
1. Go to **My Exams**
2. Click **⋮** on exam → **Extend Time**
3. Enter minutes → Click **Extend All**

### Option B: Extend for One Student
1. Go to **My Exams**
2. Click **⋮** on exam → **Extend Time**
3. Find student in list
4. Enter minutes next to their name → Click **Add**

## 👨‍🎓 Student: What Happens

1. Notification appears: "⏰ Time Extended"
2. Timer updates automatically (within 30 seconds)
3. Continue exam with new time

## 🔍 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't see "Extend Time" | Exam must be Active/Scheduled status |
| Migration fails | Check database credentials in `.env` |
| Timer not updating | Wait 30 seconds, check mobile connection |
| "Not started yet" error | Student must start exam first for individual extension |

## 📊 Time Calculation

```
Total Time = Base + Global Extension + Individual Extension
Example: 60 + 10 + 5 = 75 minutes
```

## 🎯 Best Practices

- ✅ Test with practice exam first
- ✅ Use global for fair extensions to all
- ✅ Use individual for special cases
- ✅ Communicate with students verbally too
- ✅ Extensions are logged automatically

## 📞 Need Help?

See detailed docs: `TIME_EXTENSION_FEATURE.md`

---

**That's it! Simple and powerful.** 🎉

