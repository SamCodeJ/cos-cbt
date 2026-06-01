#!/bin/bash

# UI-GES Update Script
# Use this to update your application after making changes

set -e

echo "======================================"
echo "UI-GES Application Update"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -f "package.json" ]; then
    echo "Error: Not in the correct directory!"
    echo "Please run this script from /home/uiges/UI-GES-1"
    exit 1
fi

echo "Choose what to update:"
echo "1. Backend only"
echo "2. Web portal only"
echo "3. Both backend and web portal"
read -p "Enter choice (1-3): " CHOICE

case $CHOICE in
    1)
        UPDATE_BACKEND=true
        UPDATE_WEB=false
        ;;
    2)
        UPDATE_BACKEND=false
        UPDATE_WEB=true
        ;;
    3)
        UPDATE_BACKEND=true
        UPDATE_WEB=true
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

# Pull latest changes (if using git)
read -p "Pull latest changes from git? (y/n): " PULL_GIT
if [ "$PULL_GIT" = "y" ] || [ "$PULL_GIT" = "Y" ]; then
    echo "Pulling latest changes..."
    git pull
fi

if [ "$UPDATE_BACKEND" = true ]; then
    echo ""
    echo "======================================"
    echo "Updating Backend"
    echo "======================================"
    
    cd backend
    
    echo "Installing dependencies..."
    npm install --production
    
    read -p "Run database migrations? (y/n): " RUN_MIGRATIONS
    if [ "$RUN_MIGRATIONS" = "y" ] || [ "$RUN_MIGRATIONS" = "Y" ]; then
        echo "Running migrations..."
        npm run db:migrate
    fi
    
    echo "Restarting backend..."
    pm2 restart uiges-backend
    
    echo "Backend updated successfully!"
    pm2 status
    
    cd ..
fi

if [ "$UPDATE_WEB" = true ]; then
    echo ""
    echo "======================================"
    echo "Updating Web Portal"
    echo "======================================"
    
    echo "Installing dependencies..."
    npm install
    
    echo "Building web portal..."
    npm run build
    
    if [ -d "dist" ]; then
        echo "Build successful!"
        echo "Web portal updated successfully!"
        echo "Changes will be live immediately (Nginx serves static files)"
    else
        echo "Error: Build failed!"
        exit 1
    fi
fi

echo ""
echo "======================================"
echo "Update Complete!"
echo "======================================"
echo ""

if [ "$UPDATE_BACKEND" = true ]; then
    echo "Backend logs:"
    pm2 logs uiges-backend --lines 20 --nostream
fi

echo ""
echo "Clear browser cache to see web portal changes"
echo ""
