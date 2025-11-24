# Test Plan: Exam Access Control

## Overview
This document provides test cases to verify that only candidates who have been added to an exam can access and take that exam.

## Test Environment Setup

### Prerequisites
1. Backend server running on configured port
2. Mobile app installed on device/emulator
3. At least 2 candidate accounts created
4. At least 2 exams created
5. One candidate assigned to Exam A only
6. Another candidate NOT assigned to any exam

### Test Data

**Candidate 1 (Assigned)**
- Email: candidate1@test.com
- Password: password
- Assigned to: Exam A (ID: 1)

**Candidate 2 (Not Assigned)**
- Email: candidate2@test.com
- Password: password
- Assigned to: Nothing

**Exam A**
- ID: 1
- Title: Mathematics Final Exam
- Candidates: candidate1@test.com only

**Exam B**
- ID: 2
- Title: Physics Midterm
- Candidates: (none)

---

## Test Cases

### Test Case 1: Get Exam List - Assigned Candidate
**Endpoint**: `GET /api/candidate/exams`  
**User**: Candidate 1 (Assigned)  
**Expected Result**: ✅ **PASS**
- Status Code: 200
- Response: Array containing only Exam A
- Exam B should NOT be in the list

**Test Steps (Mobile App)**:
1. Login as candidate1@test.com
2. Navigate to Dashboard
3. Observe exam list

**Expected**: Only Exam A is visible

---

### Test Case 2: Get Exam List - Unassigned Candidate
**Endpoint**: `GET /api/candidate/exams`  
**User**: Candidate 2 (Not Assigned)  
**Expected Result**: ✅ **PASS**
- Status Code: 200
- Response: Empty array `[]`

**Test Steps (Mobile App)**:
1. Login as candidate2@test.com
2. Navigate to Dashboard
3. Observe exam list

**Expected**: No exams visible, "No exams available" message shown

---

### Test Case 3: Get Exam Details - Authorized Access
**Endpoint**: `GET /api/candidate/exams/1`  
**User**: Candidate 1 (Assigned to Exam A)  
**Expected Result**: ✅ **PASS**
- Status Code: 200
- Response: Exam details returned

**Test Steps**:
```bash
curl -H "Authorization: Bearer {candidate1_token}" \
  http://localhost:3000/api/candidate/exams/1
```

**Expected**: Full exam details returned

---

### Test Case 4: Get Exam Details - Unauthorized Access
**Endpoint**: `GET /api/candidate/exams/1`  
**User**: Candidate 2 (NOT assigned to Exam A)  
**Expected Result**: ✅ **PASS**
- Status Code: 403 Forbidden
- Response Body: `{ "error": "You are not assigned to this exam" }`

**Test Steps**:
```bash
curl -H "Authorization: Bearer {candidate2_token}" \
  http://localhost:3000/api/candidate/exams/1
```

**Expected**: 403 error with clear message

---

### Test Case 5: Start Exam - Authorized
**Endpoint**: `POST /api/candidate/exams/1/start`  
**User**: Candidate 1 (Assigned)  
**Expected Result**: ✅ **PASS**
- Status Code: 200
- Response: Questions array and attempt_id

**Test Steps (Mobile App)**:
1. Login as candidate1@test.com
2. Tap on Exam A
3. Tap "Start Exam"

**Expected**: Exam starts, questions are loaded

---

### Test Case 6: Start Exam - Unauthorized
**Endpoint**: `POST /api/candidate/exams/1/start`  
**User**: Candidate 2 (NOT assigned)  
**Expected Result**: ✅ **PASS**
- Status Code: 403 Forbidden
- Response: `{ "error": "You are not assigned to this exam" }`

**Test Steps**:
```bash
curl -X POST \
  -H "Authorization: Bearer {candidate2_token}" \
  http://localhost:3000/api/candidate/exams/1/start
```

**Expected**: 403 error, exam does not start

---

### Test Case 7: Save Answer - Unauthorized
**Endpoint**: `POST /api/candidate/exams/1/save-answer`  
**User**: Candidate 2 (NOT assigned)  
**Body**: `{ "question_id": 1, "answer": "A" }`  
**Expected Result**: ✅ **PASS**
- Status Code: 403 Forbidden
- Response: `{ "error": "You are not assigned to this exam" }`

**Test Steps**:
```bash
curl -X POST \
  -H "Authorization: Bearer {candidate2_token}" \
  -H "Content-Type: application/json" \
  -d '{"question_id": 1, "answer": "A"}' \
  http://localhost:3000/api/candidate/exams/1/save-answer
```

**Expected**: Answer is NOT saved, 403 error returned

**Security Impact**: ⚠️ **CRITICAL** - Without this check, unauthorized candidates could submit answers

---

### Test Case 8: Submit Exam - Unauthorized
**Endpoint**: `POST /api/candidate/exams/1/submit`  
**User**: Candidate 2 (NOT assigned)  
**Body**: `{ "answers": [...], "violations": [] }`  
**Expected Result**: ✅ **PASS**
- Status Code: 403 Forbidden
- Response: `{ "error": "You are not assigned to this exam" }`

**Test Steps**:
```bash
curl -X POST \
  -H "Authorization: Bearer {candidate2_token}" \
  -H "Content-Type: application/json" \
  -d '{"answers": [], "violations": []}' \
  http://localhost:3000/api/candidate/exams/1/submit
```

**Expected**: Exam is NOT submitted, 403 error returned

**Security Impact**: ⚠️ **CRITICAL** - Without this check, unauthorized candidates could submit exam attempts

---

### Test Case 9: Get Result - Unauthorized
**Endpoint**: `GET /api/candidate/exams/1/result`  
**User**: Candidate 2 (NOT assigned)  
**Expected Result**: ✅ **PASS**
- Status Code: 403 Forbidden
- Response: `{ "error": "You are not assigned to this exam" }`

**Test Steps**:
```bash
curl -H "Authorization: Bearer {candidate2_token}" \
  http://localhost:3000/api/candidate/exams/1/result
```

**Expected**: Results are NOT shown, 403 error returned

**Security Impact**: ⚠️ **HIGH** - Without this check, unauthorized candidates could view others' exam results

---

### Test Case 10: Mobile App Error Handling
**Scenario**: Candidate tries to access unassigned exam via deep link or direct navigation  
**User**: Candidate 2 (NOT assigned)  
**Expected Result**: ✅ **PASS**

**Test Steps**:
1. Login as candidate2@test.com
2. Manually navigate to an exam they're not assigned to (if possible via deep link)
3. Observe error handling

**Expected**: 
- Clear error message: "You are not assigned to this exam"
- User is redirected back to Dashboard
- No crash or undefined behavior

---

### Test Case 11: Database Integrity
**Scenario**: Verify database constraints prevent unauthorized access at DB level  
**Expected Result**: ✅ **PASS**

**Test Steps**:
1. Attempt to manually insert exam attempt for unassigned candidate:
```sql
-- This should succeed (no FK constraint violation)
INSERT INTO exam_attempts (exam_id, candidate_id, total_questions, status)
VALUES (1, 2, 10, 'in_progress');
```

2. However, application layer should prevent this through access checks

**Expected**: Application prevents unauthorized attempts before DB insertion

---

### Test Case 12: Concurrent Access
**Scenario**: Multiple candidates accessing different exams simultaneously  
**Expected Result**: ✅ **PASS**

**Test Steps**:
1. Candidate 1 starts Exam A (assigned)
2. Candidate 2 attempts to start Exam A (not assigned)
3. Both requests sent simultaneously

**Expected**:
- Candidate 1: Successfully starts exam
- Candidate 2: Receives 403 Forbidden
- No race conditions or unauthorized access

---

### Test Case 13: Token Tampering
**Scenario**: Candidate attempts to modify JWT token to access other exams  
**Expected Result**: ✅ **PASS**

**Test Steps**:
1. Capture Candidate 2's JWT token
2. Attempt to modify payload to change user ID
3. Send request with tampered token

**Expected**: 
- 401 Unauthorized (invalid signature)
- Request is rejected before reaching access control logic

---

### Test Case 14: Assignment Removal
**Scenario**: Candidate is removed from exam after starting  
**Expected Result**: ✅ **PASS**

**Test Steps**:
1. Candidate 1 starts Exam A
2. Admin removes Candidate 1 from Exam A
3. Candidate 1 attempts to save answer or submit

**Expected**: 
- 403 Forbidden on subsequent requests
- Clear error message
- Exam data already saved is preserved

---

## Automated Test Script

Create a test script to automate these checks:

```javascript
// test-access-control.js
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';
let candidate1Token, candidate2Token;

async function runTests() {
  console.log('🧪 Testing Exam Access Control\n');
  
  // Login candidates
  console.log('1. Logging in candidates...');
  const c1 = await axios.post(`${API_BASE}/candidate/auth/login`, {
    email: 'candidate1@test.com',
    password: 'password'
  });
  candidate1Token = c1.data.token;
  
  const c2 = await axios.post(`${API_BASE}/candidate/auth/login`, {
    email: 'candidate2@test.com',
    password: 'password'
  });
  candidate2Token = c2.data.token;
  console.log('✅ Login successful\n');
  
  // Test: Get exam details (authorized)
  console.log('2. Testing authorized exam details access...');
  try {
    const res = await axios.get(`${API_BASE}/candidate/exams/1`, {
      headers: { Authorization: `Bearer ${candidate1Token}` }
    });
    console.log('✅ Authorized access granted (200)\n');
  } catch (err) {
    console.log('❌ FAILED: Should allow access\n');
  }
  
  // Test: Get exam details (unauthorized)
  console.log('3. Testing unauthorized exam details access...');
  try {
    const res = await axios.get(`${API_BASE}/candidate/exams/1`, {
      headers: { Authorization: `Bearer ${candidate2Token}` }
    });
    console.log('❌ FAILED: Should deny access (got 200)\n');
  } catch (err) {
    if (err.response?.status === 403) {
      console.log('✅ Correctly denied access (403)\n');
    } else {
      console.log(`❌ FAILED: Wrong error code (${err.response?.status})\n`);
    }
  }
  
  // Test: Start exam (unauthorized)
  console.log('4. Testing unauthorized exam start...');
  try {
    const res = await axios.post(`${API_BASE}/candidate/exams/1/start`, {}, {
      headers: { Authorization: `Bearer ${candidate2Token}` }
    });
    console.log('❌ FAILED: Should deny exam start (got 200)\n');
  } catch (err) {
    if (err.response?.status === 403) {
      console.log('✅ Correctly denied exam start (403)\n');
    } else {
      console.log(`❌ FAILED: Wrong error code (${err.response?.status})\n`);
    }
  }
  
  // Test: Save answer (unauthorized)
  console.log('5. Testing unauthorized answer save...');
  try {
    const res = await axios.post(`${API_BASE}/candidate/exams/1/save-answer`, {
      question_id: 1,
      answer: 'A'
    }, {
      headers: { Authorization: `Bearer ${candidate2Token}` }
    });
    console.log('❌ FAILED: Should deny answer save (got 200)\n');
  } catch (err) {
    if (err.response?.status === 403) {
      console.log('✅ Correctly denied answer save (403)\n');
    } else {
      console.log(`❌ FAILED: Wrong error code (${err.response?.status})\n`);
    }
  }
  
  // Test: Submit exam (unauthorized)
  console.log('6. Testing unauthorized exam submit...');
  try {
    const res = await axios.post(`${API_BASE}/candidate/exams/1/submit`, {
      answers: [],
      violations: []
    }, {
      headers: { Authorization: `Bearer ${candidate2Token}` }
    });
    console.log('❌ FAILED: Should deny exam submit (got 200)\n');
  } catch (err) {
    if (err.response?.status === 403) {
      console.log('✅ Correctly denied exam submit (403)\n');
    } else {
      console.log(`❌ FAILED: Wrong error code (${err.response?.status})\n`);
    }
  }
  
  // Test: Get result (unauthorized)
  console.log('7. Testing unauthorized result access...');
  try {
    const res = await axios.get(`${API_BASE}/candidate/exams/1/result`, {
      headers: { Authorization: `Bearer ${candidate2Token}` }
    });
    console.log('❌ FAILED: Should deny result access (got 200)\n');
  } catch (err) {
    if (err.response?.status === 403) {
      console.log('✅ Correctly denied result access (403)\n');
    } else {
      console.log(`❌ FAILED: Wrong error code (${err.response?.status})\n`);
    }
  }
  
  console.log('\n✨ Access Control Tests Complete!');
}

runTests().catch(console.error);
```

## Running the Tests

1. **Setup Test Data**:
   ```bash
   # Run database seed script
   npm run seed:test-data
   ```

2. **Run Backend Tests**:
   ```bash
   node test-access-control.js
   ```

3. **Manual Mobile App Tests**:
   - Follow test cases 1-2, 5-6, 10 manually
   - Verify error messages are user-friendly
   - Check navigation behavior on errors

## Success Criteria

✅ All test cases must pass  
✅ No unauthorized access to any exam endpoint  
✅ Clear, user-friendly error messages  
✅ Proper HTTP status codes (403 for forbidden)  
✅ No data leakage in error responses  
✅ Mobile app handles errors gracefully without crashes  

## Security Notes

⚠️ **Critical Security Checks**:
1. Access control checked on EVERY endpoint, not just entry points
2. Candidate ID comes from authenticated token, NOT request body
3. Database queries use parameterized statements (SQL injection prevention)
4. Error messages don't reveal sensitive information

---

**Last Updated**: November 13, 2025  
**Test Status**: ✅ Ready for Execution

