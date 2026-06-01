#!/bin/bash

# C-COS Backend Deployment Script
# Run this from /home/ccos/C-COS-1 directory

set -e

echo "======================================"
echo "C-COS Backend Deployment"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo "Error: backend directory not found!"
    echo "Please run this script from /home/ccos/C-COS-1"
    exit 1
fi

# Get configuration
read -p "Enter your domain (e.g., example.com): " DOMAIN
read -sp "Enter database password: " DB_PASSWORD
echo ""

# Generate JWT secret
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

echo ""
echo "======================================"
echo "Step 1: Installing Backend Dependencies"
echo "======================================"
cd backend
npm install --production

echo ""
echo "======================================"
echo "Step 2: Creating .env file"
echo "======================================"
cat > .env <<EOF
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gesDB
DB_USER=ccos_user
DB_PASSWORD=$DB_PASSWORD

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=https://$DOMAIN
EOF

echo ".env file created"

echo ""
echo "======================================"
echo "Step 3: Running Database Migrations"
echo "======================================"
npm run db:migrate

echo ""
echo "======================================"
echo "Step 4: Seeding Database"
echo "======================================"
npm run db:seed || echo "Seed data may already exist, continuing..."

echo ""
echo "======================================"
echo "Step 5: Testing Backend"
echo "======================================"
timeout 5 npm start &
sleep 3
curl http://localhost:3001/health || echo "Backend test may have failed, check logs"
pkill -f "node server.js" || true

echo ""
echo "======================================"
echo "Step 6: Setting up PM2"
echo "======================================"
pm2 delete ccos-backend || true
pm2 start server.js --name "ccos-backend" -i 2
pm2 save
pm2 startup | grep "sudo" | bash || echo "PM2 startup already configured"

echo ""
echo "======================================"
echo "Backend Deployment Complete!"
echo "======================================"
echo ""
echo "Backend Status:"
pm2 status

echo ""
echo "View logs with: pm2 logs ccos-backend"
echo "Backend API running on: http://localhost:3001"
echo ""
echo "IMPORTANT: Save this JWT secret securely!"
echo "JWT_SECRET=$JWT_SECRET"
echo ""
