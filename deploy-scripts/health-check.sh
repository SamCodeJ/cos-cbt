#!/bin/bash

# C-COS Health Check Script
# Run this to check the status of all services

echo "======================================"
echo "C-COS System Health Check"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_service() {
    SERVICE=$1
    if systemctl is-active --quiet $SERVICE; then
        echo -e "${GREEN}✓${NC} $SERVICE is running"
        return 0
    else
        echo -e "${RED}✗${NC} $SERVICE is NOT running"
        return 1
    fi
}

check_port() {
    PORT=$1
    NAME=$2
    if nc -z localhost $PORT 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $NAME is listening on port $PORT"
        return 0
    else
        echo -e "${RED}✗${NC} $NAME is NOT listening on port $PORT"
        return 1
    fi
}

echo "Checking Services..."
echo "--------------------"
check_service nginx
check_service postgresql
echo ""

echo "Checking PM2 Processes..."
echo "-------------------------"
if command -v pm2 &> /dev/null; then
    pm2 status
    echo ""
    if pm2 status | grep -q "ccos-backend.*online"; then
        echo -e "${GREEN}✓${NC} Backend is running in PM2"
    else
        echo -e "${RED}✗${NC} Backend is NOT running in PM2"
    fi
else
    echo -e "${RED}✗${NC} PM2 is not installed"
fi
echo ""

echo "Checking Ports..."
echo "-----------------"
check_port 80 "Nginx (HTTP)"
check_port 443 "Nginx (HTTPS)"
check_port 3001 "Backend API"
check_port 5432 "PostgreSQL"
echo ""

echo "Checking API Health..."
echo "----------------------"
if command -v curl &> /dev/null; then
    HEALTH_RESPONSE=$(curl -s http://localhost:3001/health)
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Backend API health endpoint: $HEALTH_RESPONSE"
    else
        echo -e "${RED}✗${NC} Backend API health endpoint not responding"
    fi
else
    echo -e "${YELLOW}!${NC} curl not installed, skipping health check"
fi
echo ""

echo "Checking Database Connection..."
echo "--------------------------------"
if command -v psql &> /dev/null; then
    if PGPASSWORD='' psql -U ccos_user -d gesDB -h localhost -c "SELECT 1;" &> /dev/null; then
        echo -e "${GREEN}✓${NC} Database connection successful"
        
        # Get database stats
        DB_SIZE=$(PGPASSWORD='' psql -U ccos_user -d gesDB -h localhost -t -c "SELECT pg_size_pretty(pg_database_size('gesDB'));" 2>/dev/null | xargs)
        if [ -n "$DB_SIZE" ]; then
            echo "  Database size: $DB_SIZE"
        fi
        
        # Get table counts
        EXAMS=$(PGPASSWORD='' psql -U ccos_user -d gesDB -h localhost -t -c "SELECT COUNT(*) FROM exams;" 2>/dev/null | xargs)
        USERS=$(PGPASSWORD='' psql -U ccos_user -d gesDB -h localhost -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs)
        echo "  Exams: $EXAMS"
        echo "  Users: $USERS"
    else
        echo -e "${RED}✗${NC} Database connection failed"
    fi
else
    echo -e "${YELLOW}!${NC} psql not installed, skipping database check"
fi
echo ""

echo "Checking Disk Space..."
echo "----------------------"
df -h / | awk 'NR==1 || /\/$/ {print}'
echo ""

echo "Checking Memory Usage..."
echo "------------------------"
free -h
echo ""

echo "Checking SSL Certificates..."
echo "-----------------------------"
if command -v certbot &> /dev/null; then
    sudo certbot certificates 2>/dev/null | grep -E "(Certificate Name|Expiry Date|Domains)" || echo "No certificates found"
else
    echo -e "${YELLOW}!${NC} Certbot not installed, skipping SSL check"
fi
echo ""

echo "Recent Backend Logs..."
echo "----------------------"
if command -v pm2 &> /dev/null; then
    pm2 logs ccos-backend --lines 10 --nostream 2>/dev/null || echo "No logs available"
else
    echo "PM2 not available"
fi
echo ""

echo "Recent Nginx Errors..."
echo "----------------------"
if [ -f "/var/log/nginx/error.log" ]; then
    sudo tail -5 /var/log/nginx/error.log 2>/dev/null || echo "No recent errors"
else
    echo "Nginx error log not found"
fi
echo ""

echo "======================================"
echo "Health Check Complete"
echo "======================================"
