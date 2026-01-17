/**
 * Test Script: Exam End Date Time Limiting
 * 
 * This script tests the time calculation logic for ensuring students
 * cannot exceed the exam's end_date when starting late.
 */

// Mock SQL EXTRACT function behavior
function calculateMinutesUntilExamCloses(endDate, currentDate) {
  const milliseconds = endDate - currentDate;
  return milliseconds / (1000 * 60); // Convert to minutes
}

function calculateTimeGiven(baseDuration, globalExt, individualExt, endDate, currentDate) {
  const allocatedTime = baseDuration + globalExt + individualExt;
  const minutesUntilClose = calculateMinutesUntilExamCloses(endDate, currentDate);
  const givenTime = Math.min(allocatedTime, Math.ceil(minutesUntilClose));
  const givenSeconds = Math.max(0, givenTime * 60);
  
  return {
    allocatedTime,
    minutesUntilClose: minutesUntilClose.toFixed(2),
    givenTime,
    givenSeconds,
    limitedByEndDate: allocatedTime > minutesUntilClose
  };
}

function calculateResumedTime(baseDuration, globalExt, individualExt, startedAt, endDate, currentDate) {
  const allocatedTime = baseDuration + globalExt + individualExt;
  const minutesUntilClose = calculateMinutesUntilExamCloses(endDate, currentDate);
  const elapsedMinutes = (currentDate - startedAt) / (1000 * 60);
  const remainingFromAllocation = Math.max(0, allocatedTime - elapsedMinutes);
  const actualRemaining = Math.min(remainingFromAllocation, minutesUntilClose);
  const remainingSeconds = Math.max(0, Math.floor(actualRemaining * 60));
  
  return {
    allocatedTime,
    elapsedMinutes: elapsedMinutes.toFixed(2),
    remainingFromAllocation: remainingFromAllocation.toFixed(2),
    minutesUntilClose: minutesUntilClose.toFixed(2),
    actualRemaining: actualRemaining.toFixed(2),
    remainingSeconds,
    limitedByEndDate: remainingFromAllocation > minutesUntilClose
  };
}

// Test Cases
console.log('='.repeat(80));
console.log('EXAM END DATE TIME LIMITING - TEST CASES');
console.log('='.repeat(80));

// Test 1: Student starts on time
console.log('\n📝 Test 1: Student Starts On Time');
console.log('-'.repeat(80));
const test1StartDate = new Date('2026-01-17T09:00:00Z');
const test1EndDate = new Date('2026-01-17T11:00:00Z');
const test1CurrentDate = new Date('2026-01-17T09:05:00Z');
const test1Result = calculateTimeGiven(60, 0, 0, test1EndDate, test1CurrentDate);
console.log('Exam: 60 min duration, 9:00 AM - 11:00 AM');
console.log('Student logs in at: 9:05 AM');
console.log('Result:', test1Result);
console.log('✅ Expected: 60 minutes (not limited)');
console.log(test1Result.givenTime === 60 && !test1Result.limitedByEndDate ? '✅ PASS' : '❌ FAIL');

// Test 2: Student starts late
console.log('\n📝 Test 2: Student Starts Late');
console.log('-'.repeat(80));
const test2StartDate = new Date('2026-01-17T09:00:00Z');
const test2EndDate = new Date('2026-01-17T11:00:00Z');
const test2CurrentDate = new Date('2026-01-17T10:30:00Z');
const test2Result = calculateTimeGiven(60, 0, 0, test2EndDate, test2CurrentDate);
console.log('Exam: 60 min duration, 9:00 AM - 11:00 AM');
console.log('Student logs in at: 10:30 AM');
console.log('Result:', test2Result);
console.log('✅ Expected: 30 minutes (limited by end_date)');
console.log(test2Result.givenTime === 30 && test2Result.limitedByEndDate ? '✅ PASS' : '❌ FAIL');

// Test 3: Student starts very late
console.log('\n📝 Test 3: Student Starts Very Late');
console.log('-'.repeat(80));
const test3StartDate = new Date('2026-01-17T09:00:00Z');
const test3EndDate = new Date('2026-01-17T11:00:00Z');
const test3CurrentDate = new Date('2026-01-17T10:55:00Z');
const test3Result = calculateTimeGiven(60, 10, 0, test3EndDate, test3CurrentDate);
console.log('Exam: 60 min duration + 10 min extension, 9:00 AM - 11:00 AM');
console.log('Student logs in at: 10:55 AM');
console.log('Result:', test3Result);
console.log('✅ Expected: 5 minutes (limited by end_date)');
console.log(test3Result.givenTime === 5 && test3Result.limitedByEndDate ? '✅ PASS' : '❌ FAIL');

// Test 4: Student resumes after crash
console.log('\n📝 Test 4: Student Resumes After Crash');
console.log('-'.repeat(80));
const test4ExamStart = new Date('2026-01-17T09:00:00Z');
const test4ExamEnd = new Date('2026-01-17T11:00:00Z');
const test4StudentStarted = new Date('2026-01-17T09:30:00Z');
const test4CurrentDate = new Date('2026-01-17T10:15:00Z');
const test4Result = calculateResumedTime(60, 0, 0, test4StudentStarted, test4ExamEnd, test4CurrentDate);
console.log('Exam: 60 min duration, 9:00 AM - 11:00 AM');
console.log('Student started at: 9:30 AM');
console.log('Student rejoins at: 10:15 AM (after 45 min elapsed)');
console.log('Result:', test4Result);
console.log('✅ Expected: 15 minutes remaining (60 - 45 = 15)');
const test4Expected = Math.floor(parseFloat(test4Result.actualRemaining));
console.log(test4Expected === 15 ? '✅ PASS' : '❌ FAIL');

// Test 5: With time extensions
console.log('\n📝 Test 5: With Time Extensions');
console.log('-'.repeat(80));
const test5StartDate = new Date('2026-01-17T09:00:00Z');
const test5EndDate = new Date('2026-01-17T11:00:00Z');
const test5CurrentDate = new Date('2026-01-17T09:10:00Z');
const test5Result = calculateTimeGiven(60, 15, 5, test5EndDate, test5CurrentDate);
console.log('Exam: 60 min + 15 global + 5 individual = 80 min total');
console.log('Exam window: 9:00 AM - 11:00 AM');
console.log('Student logs in at: 9:10 AM');
console.log('Result:', test5Result);
console.log('✅ Expected: 80 minutes (not limited, 110 minutes until close)');
console.log(test5Result.givenTime === 80 && !test5Result.limitedByEndDate ? '✅ PASS' : '❌ FAIL');

// Test 6: Exactly at end time
console.log('\n📝 Test 6: Student Logs In At Exact End Time');
console.log('-'.repeat(80));
const test6StartDate = new Date('2026-01-17T09:00:00Z');
const test6EndDate = new Date('2026-01-17T11:00:00Z');
const test6CurrentDate = new Date('2026-01-17T11:00:00Z');
const test6Result = calculateTimeGiven(60, 0, 0, test6EndDate, test6CurrentDate);
console.log('Exam: 60 min duration, 9:00 AM - 11:00 AM');
console.log('Student logs in at: 11:00 AM (exact end time)');
console.log('Result:', test6Result);
console.log('✅ Expected: 0 minutes');
console.log(test6Result.givenTime === 0 ? '✅ PASS' : '❌ FAIL');

// Test 7: Resume late with little time left
console.log('\n📝 Test 7: Resume After Exceeding Allocated Time');
console.log('-'.repeat(80));
const test7ExamStart = new Date('2026-01-17T09:00:00Z');
const test7ExamEnd = new Date('2026-01-17T11:00:00Z');
const test7StudentStarted = new Date('2026-01-17T09:30:00Z');
const test7CurrentDate = new Date('2026-01-17T10:55:00Z');
const test7Result = calculateResumedTime(60, 0, 0, test7StudentStarted, test7ExamEnd, test7CurrentDate);
console.log('Exam: 60 min duration, 9:00 AM - 11:00 AM');
console.log('Student started at: 9:30 AM');
console.log('Student rejoins at: 10:55 AM (85 min elapsed, allocation was 60)');
console.log('Result:', test7Result);
console.log('✅ Expected: 0 minutes (used up allocated time)');
const test7Expected = Math.floor(parseFloat(test7Result.actualRemaining));
console.log(test7Expected === 0 ? '✅ PASS' : '❌ FAIL');

// Test 8: Resume with remaining time but close to end_date
console.log('\n📝 Test 8: Resume With Time Left But Close To End Date');
console.log('-'.repeat(80));
const test8ExamStart = new Date('2026-01-17T09:00:00Z');
const test8ExamEnd = new Date('2026-01-17T11:00:00Z');
const test8StudentStarted = new Date('2026-01-17T10:20:00Z');
const test8CurrentDate = new Date('2026-01-17T10:50:00Z');
const test8Result = calculateResumedTime(60, 0, 0, test8StudentStarted, test8ExamEnd, test8CurrentDate);
console.log('Exam: 60 min duration, 9:00 AM - 11:00 AM');
console.log('Student started at: 10:20 AM');
console.log('Student rejoins at: 10:50 AM (30 min elapsed, 30 remaining, but only 10 min until close)');
console.log('Result:', test8Result);
console.log('✅ Expected: 10 minutes (limited by end_date)');
const test8Expected = Math.floor(parseFloat(test8Result.actualRemaining));
console.log(test8Expected === 10 && test8Result.limitedByEndDate ? '✅ PASS' : '❌ FAIL');

console.log('\n' + '='.repeat(80));
console.log('TEST SUITE COMPLETE');
console.log('='.repeat(80));
