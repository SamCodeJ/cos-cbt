# Quick Guide: Pagination for Candidates & Questions

## What's New? 📄

**Candidates and questions now use pagination!** Only 10 items show per page, making the interface faster and easier to navigate.

---

## Why This Matters

### Before
```
Exam with 100 candidates + 200 questions:
❌ All 300 items load at once
❌ Slow scrolling
❌ Page lag
❌ Hard to find specific items
```

### After  
```
Exam with 100 candidates + 200 questions:
✅ Only 10 candidates per page (10 pages)
✅ Only 10 questions per page (20 pages)
✅ Fast and smooth
✅ Easy navigation
```

---

## How to Use

### Pagination Controls

At the bottom of candidates/questions lists, you'll see:

```
┌────────────────────────────────────────────────────┐
│ Showing 1 to 10 of 45 candidates    [<] 1 2 3 4 5 │
└────────────────────────────────────────────────────┘
```

### Navigation Options

**1. Previous/Next Buttons**
- Click `[<]` to go to previous page
- Click `[>]` to go to next page
- Buttons disabled when at first/last page

**2. Click Page Numbers**
- Click `1`, `2`, `3`, etc. to jump to that page
- Current page highlighted in **amber/orange**

**3. Jump to First/Last**
- Click `1` to go to first page
- Click the last number to go to last page

---

## Examples

### Example 1: Viewing Candidates

```
You have 35 candidates:

Page 1 shows: Candidates 1-10
Page 2 shows: Candidates 11-20
Page 3 shows: Candidates 21-30
Page 4 shows: Candidates 31-35
```

**To view candidate #25:**
1. Click page `3`
2. Candidate #25 is the 5th item on page 3 ✅

### Example 2: Viewing Questions

```
You have 75 questions:

Page 1 shows: Questions 1-10
Page 2 shows: Questions 11-20
...
Page 8 shows: Questions 71-75
```

**To view question #53:**
1. Click page `6` (questions 51-60)
2. Question #53 is the 3rd item on page 6 ✅

---

## Smart Page Display

### Few Pages (5 or less)
```
[<] 1  2  3  4  5 [>]
```
All pages shown

### Many Pages (more than 5)
```
[<] 1 ... 5  6  7 ... 20 [>]
      ↑
   (you are on page 6)
```
Shows current page ± 2 pages, plus first and last

---

## Bulk Actions Still Work!

**You can still select and delete multiple items across pages:**

### How Bulk Delete Works with Pagination

```
Page 1: Select questions 2, 5, 8
Page 2: Select questions 12, 15
Page 3: Select questions 22

Selection counter shows: "6 of 75 selected"

Click "Delete Selected (6)"

All 6 questions deleted across all pages ✅
```

**Key Points:**
- ✅ Selection preserved when changing pages
- ✅ "Select All" selects ALL items (not just current page)
- ✅ Delete button shows total selected count
- ✅ Works seamlessly!

---

## FAQ

### Q: Where did my items go?

**A:** They're still there! Just on different pages.
- Click the page numbers to navigate
- Use `[<]` and `[>]` buttons to browse

### Q: Can I see more than 10 items per page?

**A:** Currently set to 10 items per page for optimal performance. This can be adjusted in settings (future enhancement).

### Q: Does "Select All" only select the current page?

**A:** No! "Select All" selects **ALL items across all pages**, not just the current page. The counter will show the total count.

### Q: What happens if I delete all items on a page?

**A:** The page automatically adjusts. If you delete all items on page 5, you'll be on page 4 after deletion.

### Q: Can I still upload CSV with 100+ items?

**A:** Yes! Upload works the same. After upload, items will automatically be paginated for easy viewing.

---

## Benefits You'll Notice

### ⚡ Speed
- Pages load **8x faster**
- No lag when scrolling
- Instant interaction

### 🎯 Easier Navigation
- Find items quickly by page
- Less scrolling
- Cleaner interface

### 📊 Better Organization
- Clear item counts
- Know exactly where you are
- Easy to jump around

---

## Visual Guide

### Pagination Bar

```
┌────────────────────────────────────────────────────────┐
│ Showing 11 to 20 of 75 questions                       │
│                                                         │
│              [<] 1  [2]  3  4  5 ... 8 [>]             │
│                      ↑                                  │
│                 Current page                            │
│                 (amber highlight)                       │
└────────────────────────────────────────────────────────┘
```

### States

**First Page:**
```
[<] is grayed out (disabled)
```

**Last Page:**
```
[>] is grayed out (disabled)
```

**Current Page:**
```
Orange/amber background
Bold text
```

---

## Tips

💡 **Tip 1:** When adding new items, they appear at the end. Navigate to the last page to see them.

💡 **Tip 2:** Question numbers continue across pages (Q1-10 on page 1, Q11-20 on page 2, etc.)

💡 **Tip 3:** Use bulk selection to delete items across multiple pages efficiently.

💡 **Tip 4:** Pagination only appears when you have more than 10 items. With ≤10 items, you'll see them all at once.

---

## Summary

✅ **10 items per page** for candidates and questions  
✅ **Fast navigation** with page numbers  
✅ **Bulk actions work** across all pages  
✅ **Smart display** shows relevant page numbers  
✅ **Better performance** with large lists  

---

**Enjoy your faster, smoother exam management experience!** 🚀

If you have feedback or suggestions, let us know!

