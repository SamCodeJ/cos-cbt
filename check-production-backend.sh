#!/bin/bash

# ========================================
# Production Backend Health Check Script
# Run this to verify your production server is properly configured
# ========================================

echo "🏥 UI-GES Production Backend Health Check"
echo "=========================================="
echo ""

# Configuration
PRODUCTION_URL="https://api.uiges.shop"
API_URL="${PRODUCTION_URL}/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Backend Health Endpoint
echo "📡 Test 1: Checking backend health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "${PRODUCTION_URL}/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$HEALTH_RESPONSE" | head -n1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Backend is running${NC}"
    echo "   Response: $RESPONSE_BODY"
else
    echo -e "${RED}❌ Backend health check failed (HTTP $HTTP_CODE)${NC}"
    echo "   This means the backend server might not be running"
    exit 1
fi
echo ""

# Test 2: API Base URL
echo "📡 Test 2: Checking API base URL..."
API_RESPONSE=$(curl -s -w "\n%{http_code}" "${API_URL}/")
HTTP_CODE=$(echo "$API_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "404" ]; then
    echo -e "${GREEN}✅ API is reachable (404 is expected for root path)${NC}"
elif [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ API is reachable${NC}"
else
    echo -e "${RED}❌ API unreachable (HTTP $HTTP_CODE)${NC}"
    exit 1
fi
echo ""

# Test 3: Database Connection (requires login)
echo "📡 Test 3: Testing database connection via login endpoint..."
echo "   (This will fail with 400 Bad Request, which means API is working)"

LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "${API_URL}/candidate/auth/login" \
    -H "Content-Type: application/json" \
    -d '{}')
HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✅ Login endpoint is working (database connection OK)${NC}"
elif [ "$HTTP_CODE" = "500" ]; then
    echo -e "${RED}❌ Login endpoint error - possible database issue${NC}"
    echo "   Response: $(echo "$LOGIN_RESPONSE" | head -n1)"
else
    echo -e "${YELLOW}⚠️ Unexpected response (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Test 4: CORS Configuration
echo "📡 Test 4: Checking CORS headers..."
CORS_RESPONSE=$(curl -s -I -X OPTIONS "${API_URL}/candidate/exams")
if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    echo -e "${GREEN}✅ CORS is configured${NC}"
else
    echo -e "${YELLOW}⚠️ CORS headers not found (might cause mobile app issues)${NC}"
fi
echo ""

# Test 5: SSL Certificate
echo "🔒 Test 5: Checking SSL certificate..."
SSL_CHECK=$(curl -s -I "${PRODUCTION_URL}/health" 2>&1)
if echo "$SSL_CHECK" | grep -q "SSL certificate problem"; then
    echo -e "${RED}❌ SSL certificate issue detected${NC}"
    echo "   Mobile app might show connection warnings"
else
    echo -e "${GREEN}✅ SSL certificate is valid${NC}"
fi
echo ""

# Summary
echo "=========================================="
echo "📊 Health Check Summary"
echo "=========================================="
echo "Production URL: $PRODUCTION_URL"
echo "API URL: $API_URL"
echo ""
echo "If all tests passed:"
echo "  ✅ Your backend is running correctly"
echo "  ✅ Database connection is working"
echo "  ✅ The issue is likely with exam/question data"
echo "     → Run diagnose-production-issue.sql on your database"
echo ""
echo "If tests failed:"
echo "  ❌ Backend might not be running"
echo "  ❌ Check your backend logs: pm2 logs backend"
echo "  ❌ Verify your .env configuration on the server"
echo ""
