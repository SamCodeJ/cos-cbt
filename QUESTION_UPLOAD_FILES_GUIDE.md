# Question Upload Files - Complete Guide

## 📋 Overview

Your system supports **three methods** for uploading/creating questions:

1. **Manual Creation** - Individual question entry through UI
2. **Bulk Import (CSV)** - Multiple questions via CSV file
3. **Word Document Import (.docx)** - Import from formatted Word documents with support for images, passages, and sections

---

## 🗂️ Files Responsible for Question Uploads

### **Backend Files**

#### 1. **Route Handler** - `backend/routes/questionBank.js`
Main API endpoints for all question operations:

**Key Endpoints:**
- `POST /api/question-bank` - Create single question (lines 100-186)
- `POST /api/question-bank/bulk-import` - Bulk import from JSON/CSV (lines 306-375)
- `POST /api/question-bank/import-word` - Import from Word document (lines 377-522)
- `POST /api/question-bank/preview-word` - Preview Word doc before import (lines 524-579)
- `GET /api/question-bank/template` - Download Word template (lines 15-29)
- `PUT /api/question-bank/:id` - Update question (lines 188-266)
- `DELETE /api/question-bank/:id` - Delete question (lines 268-304)

**Important:** Lines 436-447 handle `passage`, `instruction`, and `section_id` fields during Word import!

#### 2. **Word Upload Middleware** - `backend/middleware/wordUpload.js`
Handles file upload for Word documents:
- Uses `multer` for file uploads
- Accepts only `.docx` files
- Max file size: 50MB
- Stores files temporarily in `backend/uploads/word-temp/`
- Cleans up temp files after processing

#### 3. **Word Parser Utility** - `backend/utils/wordParser.js`
Parses Word documents and extracts questions:
- Uses `mammoth` library to parse .docx files
- Extracts images and saves to `backend/uploads/question-images/`
- Parses sections, instructions, and passages
- Extracts underlined text as correct answers
- Validates question format
- Returns structured question data

**Key Functions:**
- `parseWordDocument(filePath)` - Main parser
- `extractUnderlinedText(filePath)` - Gets correct answers from underlined text
- `validateQuestions(questions)` - Validates parsed questions

#### 4. **Word Template Generator** - `backend/utils/wordTemplateGenerator.js`
Generates downloadable Word template for teachers

---

### **Frontend Files**

#### 1. **Question Bank UI** - `src/pages/QuestionBank.jsx`
Main interface for managing questions:
- Displays all questions in a paginated table
- Create/Edit/Delete individual questions
- Search and filter by subject/difficulty
- **Note:** Currently supports manual entry, but has icons imported for CSV/Word upload (Upload, Download icons on line 24)
  - CSV/Word upload UI is **not yet implemented** on frontend
  - Backend API is ready and waiting for frontend implementation

#### 2. **API Client** - `src/api/client.js`
Frontend API wrapper (lines 177-207):
- `questionBankAPI.list()` - Get all questions
- `questionBankAPI.get(id)` - Get single question
- `questionBankAPI.create(data)` - Create question
- `questionBankAPI.update(id, data)` - Update question
- `questionBankAPI.delete(id)` - Delete question
- `questionBankAPI.bulkImport(questions)` - Bulk import (available but not used in UI yet)

**Missing Frontend Methods:**
```javascript
// These need to be added to questionBankAPI:
importWord: async (formData) => {
  const response = await apiClient.post('/question-bank/import-word', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
},

previewWord: async (formData) => {
  const response = await apiClient.post('/question-bank/preview-word', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
},

downloadTemplate: async () => {
  const response = await apiClient.get('/question-bank/template', {
    responseType: 'blob'
  });
  return response.data;
}
```

---

### **Template Files**

#### 1. **CSV Template** - `csv-templates/questions_template.csv`
Example CSV format for bulk import:
- Columns: `question_text`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_answer`, `points`, `is_multi_answer`
- Supports single and multi-answer questions
- Multi-answer format: `"A,C"` for multiple correct answers

#### 2. **Word Template**
Dynamically generated via API endpoint:
- Download: `GET /api/question-bank/template`
- Includes instructions and examples
- Supports sections, passages, and instructions

---

## 📊 Question Data Structure

### Database Schema
```sql
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER REFERENCES exams(id),
    subject VARCHAR(255),
    difficulty VARCHAR(50) DEFAULT 'medium',
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT,
    option_d TEXT,
    correct_answer VARCHAR(10) NOT NULL,
    points INTEGER DEFAULT 1,
    is_multi_answer BOOLEAN DEFAULT false,
    
    -- These fields need to be added if missing:
    section_id VARCHAR(255),      -- ⚠️ Add if missing
    instruction TEXT,              -- ⚠️ Add if missing  
    passage TEXT,                  -- ⚠️ Add if missing
    
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### API Request Format (Create/Update)
```json
{
  "exam_id": 1,                    // Optional - null for question bank
  "subject": "Mathematics",
  "difficulty": "medium",          // easy, medium, hard
  "question_text": "What is 2+2?",
  "option_a": "3",
  "option_b": "4",
  "option_c": "5",
  "option_d": "6",
  "correct_answer": "B",           // Single: "A" | Multi: "A,B,D"
  "points": 1,
  "is_multi_answer": false,
  "section_id": "Section A",       // Optional
  "instruction": "Choose one",     // Optional
  "passage": "Read this text..."   // Optional
}
```

---

## 🔄 How Each Upload Method Works

### 1. **Manual Creation (Currently Working)**

**Flow:**
1. User clicks "Add Question" button in UI
2. Fills out form with question details
3. Clicks Save
4. Frontend: `questionBankAPI.create(formData)`
5. Backend: `POST /api/question-bank`
6. Database: Question inserted
7. UI refreshes with new question

**Files:**
- Frontend: `src/pages/QuestionBank.jsx`
- Backend: `backend/routes/questionBank.js` (lines 100-186)

---

### 2. **CSV Bulk Import (Backend Ready, Frontend Not Implemented)**

**Current Status:** ⚠️ Backend API exists but frontend UI is missing

**How It Should Work:**
1. User downloads CSV template
2. Fills in questions in Excel/CSV editor
3. Uploads CSV file
4. System parses CSV and validates
5. Shows preview
6. User confirms import
7. Questions inserted into database

**Files Needed:**
- Backend: ✅ `backend/routes/questionBank.js` (lines 306-375) - Already exists
- Frontend: ❌ Need to add CSV upload UI to `QuestionBank.jsx`
- Template: ✅ `csv-templates/questions_template.csv` - Already exists

**To Implement Frontend CSV Upload:**
```jsx
// Add to QuestionBank.jsx
const handleCSVUpload = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const result = await questionBankAPI.bulkImport(formData);
    toast.success(`Imported ${result.imported} questions`);
    loadQuestions();
  } catch (error) {
    toast.error('Failed to import CSV');
  }
};
```

---

### 3. **Word Document Import (Backend Ready, Frontend Not Implemented)**

**Current Status:** ⚠️ Backend fully functional but frontend UI is missing

**How It Works (Backend):**
1. User uploads .docx file
2. Backend parses document using `mammoth` library
3. Extracts:
   - Section headers (bold text starting with "SECTION")
   - Instructions (text blocks before questions)
   - Passages (text blocks before questions)
   - Question text
   - Options (labeled A, B, C, D)
   - Correct answers (underlined options)
   - Images (saved to `uploads/question-images/`)
4. Validates all questions
5. Inserts into database
6. Returns import summary

**Files:**
- Backend Parser: ✅ `backend/utils/wordParser.js`
- Backend Middleware: ✅ `backend/middleware/wordUpload.js`
- Backend Route: ✅ `backend/routes/questionBank.js` (lines 377-522)
- Frontend UI: ❌ Not implemented yet

**Word Document Format Expected:**
```
SECTION A: General Knowledge

[INSTRUCTION]
Choose the best answer from the options below.

[PASSAGE]
The following text is about...

Question 1: What is 2+2?
A) 3
B) 4  ← (Underline correct answer)
C) 5
D) 6

Question 2: Select all prime numbers:
A) 2  ← (Underline for multi-answer)
B) 4
C) 7  ← (Underline for multi-answer)
D) 9
```

**To Implement Frontend Word Upload:**
```jsx
// Add to QuestionBank.jsx
const handleWordUpload = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const result = await questionBankAPI.importWord(formData);
    toast.success(`Imported ${result.imported} questions from Word`);
    loadQuestions();
  } catch (error) {
    toast.error('Failed to import Word document');
  }
};
```

---

## ⚠️ Current Status & Known Issues

### ✅ What's Working:
1. Manual question creation/editing/deletion via UI
2. Backend API for all three upload methods
3. Word document parsing with sections, passages, instructions
4. CSV template exists
5. Image extraction from Word documents

### ❌ What's Missing:
1. **Frontend CSV upload UI** - Backend ready, needs frontend implementation
2. **Frontend Word upload UI** - Backend ready, needs frontend implementation
3. **Database columns** - `section_id`, `instruction`, `passage` may be missing (see `ADD_MISSING_QUESTION_FIELDS.sql`)
4. **Template download button** in frontend UI
5. **Preview feature** for Word uploads before committing

### 🔧 To Fix:
1. Run the database migration: `ADD_MISSING_QUESTION_FIELDS.sql`
2. Add upload UI components to `QuestionBank.jsx`
3. Add API methods to `src/api/client.js`
4. Test Word and CSV uploads

---

## 📝 Summary Table

| Upload Method | Backend Status | Frontend Status | Files Involved |
|--------------|----------------|-----------------|----------------|
| **Manual Entry** | ✅ Working | ✅ Working | `QuestionBank.jsx`, `questionBank.js` |
| **CSV Import** | ✅ Working | ❌ Missing UI | `questionBank.js` (line 306), template exists |
| **Word Import** | ✅ Working | ❌ Missing UI | `questionBank.js` (line 377), `wordParser.js`, `wordUpload.js` |
| **Database Fields** | ⚠️ May be missing | N/A | Run `ADD_MISSING_QUESTION_FIELDS.sql` |

---

## 🎯 Next Steps

To fully enable question uploads:

1. **Fix Database** (If needed):
   ```bash
   psql -d your_database < ADD_MISSING_QUESTION_FIELDS.sql
   ```

2. **Add Frontend Upload UI**:
   - Add file upload components to `QuestionBank.jsx`
   - Add API methods to `src/api/client.js`
   - Add download template button

3. **Test All Methods**:
   - Test manual entry ✅
   - Test CSV bulk import
   - Test Word document import
   - Verify images display correctly
   - Verify sections/instructions/passages display in mobile app

---

## 📞 Quick Reference

**Backend Entry Point:** `backend/routes/questionBank.js`
**Frontend Entry Point:** `src/pages/QuestionBank.jsx`
**Database Migration:** `ADD_MISSING_QUESTION_FIELDS.sql`
**CSV Template:** `csv-templates/questions_template.csv`
