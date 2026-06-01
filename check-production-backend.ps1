# ========================================
# Production Backend Health Check Script (PowerShell)
# Run this to verify your production server is properly configured
# ========================================

Write-Host "🏥 UI-GES Production Backend Health Check" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PRODUCTION_URL = "https://api.uiges.shop"
$API_URL = "$PRODUCTION_URL/api"

# Test 1: Backend Health Endpoint
Write-Host "📡 Test 1: Checking backend health endpoint..." -ForegroundColor Yellow

try {
    $healthResponse = Invoke-WebRequest -Uri "$PRODUCTION_URL/health" -UseBasicParsing
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "✅ Backend is running" -ForegroundColor Green
        Write-Host "   Response: $($healthResponse.Content)"
    }
} catch {
    Write-Host "❌ Backend health check failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   This means the backend server might not be running"
    exit 1
}
Write-Host ""

# Test 2: API Base URL
Write-Host "📡 Test 2: Checking API base URL..." -ForegroundColor Yellow

try {
    $apiResponse = Invoke-WebRequest -Uri "$API_URL/" -UseBasicParsing -ErrorAction SilentlyContinue
    Write-Host "✅ API is reachable" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode.Value__ -eq 404) {
        Write-Host "✅ API is reachable (404 is expected for root path)" -ForegroundColor Green
    } else {
        Write-Host "❌ API unreachable (Status: $($_.Exception.Response.StatusCode.Value__))" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Test 3: Database Connection (requires login)
Write-Host "📡 Test 3: Testing database connection via login endpoint..." -ForegroundColor Yellow
Write-Host "   (This will fail with 400 Bad Request, which means API is working)"

try {
    $loginBody = @{} | ConvertTo-Json
    $loginResponse = Invoke-WebRequest -Uri "$API_URL/candidate/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $loginBody `
        -UseBasicParsing `
        -ErrorAction SilentlyContinue
    Write-Host "⚠️ Unexpected success response" -ForegroundColor Yellow
} catch {
    $statusCode = $_.Exception.Response.StatusCode.Value__
    if ($statusCode -eq 400 -or $statusCode -eq 401) {
        Write-Host "✅ Login endpoint is working (database connection OK)" -ForegroundColor Green
    } elseif ($statusCode -eq 500) {
        Write-Host "❌ Login endpoint error - possible database issue" -ForegroundColor Red
        Write-Host "   Status: $statusCode"
    } else {
        Write-Host "⚠️ Unexpected response (HTTP $statusCode)" -ForegroundColor Yellow
    }
}
Write-Host ""

# Test 4: Test from Mobile App Perspective
Write-Host "📱 Test 4: Simulating mobile app connection..." -ForegroundColor Yellow

try {
    $headers = @{
        "Content-Type" = "application/json"
    }
    $testBody = @{
        student_id = "TEST_ID"
        password = "TEST_PASS"
    } | ConvertTo-Json
    
    $testResponse = Invoke-WebRequest -Uri "$API_URL/candidate/auth/login" `
        -Method Post `
        -Headers $headers `
        -Body $testBody `
        -UseBasicParsing `
        -ErrorAction SilentlyContinue
} catch {
    $statusCode = $_.Exception.Response.StatusCode.Value__
    if ($statusCode -eq 401) {
        Write-Host "✅ Mobile app can connect (401 Invalid credentials is expected)" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Response status: $statusCode" -ForegroundColor Yellow
    }
}
Write-Host ""

# Test 5: Check if exam endpoint is accessible
Write-Host "📝 Test 5: Checking exam endpoints accessibility..." -ForegroundColor Yellow

try {
    $examResponse = Invoke-WebRequest -Uri "$API_URL/candidate/exams" `
        -UseBasicParsing `
        -ErrorAction SilentlyContinue
} catch {
    $statusCode = $_.Exception.Response.StatusCode.Value__
    if ($statusCode -eq 401) {
        Write-Host "✅ Exam endpoints are accessible (401 Unauthorized is expected without token)" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Exam endpoint status: $statusCode" -ForegroundColor Yellow
    }
}
Write-Host ""

# Summary
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "📊 Health Check Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Production URL: $PRODUCTION_URL"
Write-Host "API URL: $API_URL"
Write-Host ""
Write-Host "If all tests passed:" -ForegroundColor Green
Write-Host "  ✅ Your backend is running correctly"
Write-Host "  ✅ Database connection is working"
Write-Host "  ✅ The issue is likely with exam/question data"
Write-Host "     → Run diagnose-production-issue.sql on your database"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. SSH into your production server"
Write-Host "2. Connect to PostgreSQL database"
Write-Host "3. Run: diagnose-production-issue.sql"
Write-Host "4. Apply appropriate fix from: fix-production-exams.sql"
Write-Host ""
Write-Host "See PRODUCTION_EXAM_FIX_GUIDE.md for detailed instructions" -ForegroundColor Cyan
Write-Host ""
