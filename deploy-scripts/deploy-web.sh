#!/bin/bash

# UI-GES Web Portal Deployment Script
# Run this from /home/uiges/UI-GES-1 directory

set -e

echo "======================================"
echo "UI-GES Web Portal Deployment"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found!"
    echo "Please run this script from /home/uiges/UI-GES-1"
    exit 1
fi

# Get configuration
read -p "Enter your domain (e.g., example.com): " DOMAIN

echo ""
echo "======================================"
echo "Step 1: Creating production environment"
echo "======================================"
cat > .env.production <<EOF
VITE_API_BASE_URL=https://api.$DOMAIN/api
EOF

echo ".env.production created"

echo ""
echo "======================================"
echo "Step 2: Installing dependencies"
echo "======================================"
npm install

echo ""
echo "======================================"
echo "Step 3: Building web portal"
echo "======================================"
npm run build

echo ""
echo "======================================"
echo "Step 4: Verifying build"
echo "======================================"
if [ -d "dist" ]; then
    echo "Build successful! Files in dist/:"
    ls -lh dist/
else
    echo "Error: Build failed, dist/ directory not found"
    exit 1
fi

echo ""
echo "======================================"
echo "Step 5: Creating Nginx configuration"
echo "======================================"
sudo tee /etc/nginx/sites-available/uiges-web > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    root /home/uiges/UI-GES-1/dist;
    index index.html;
    
    # Enable compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
    gzip_disable "MSIE [1-6]\.";
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}

server {
    listen 80;
    server_name api.$DOMAIN;
    
    # Increase upload size for CSV imports
    client_max_body_size 10M;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts for long-running requests
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
EOF

echo "Nginx configuration created"

echo ""
echo "======================================"
echo "Step 6: Enabling Nginx site"
echo "======================================"
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/uiges-web /etc/nginx/sites-enabled/

echo ""
echo "======================================"
echo "Step 7: Testing Nginx configuration"
echo "======================================"
sudo nginx -t

echo ""
echo "======================================"
echo "Step 8: Reloading Nginx"
echo "======================================"
sudo systemctl reload nginx

echo ""
echo "======================================"
echo "Web Portal Deployment Complete!"
echo "======================================"
echo ""
echo "Your web portal is now served by Nginx"
echo ""
echo "Next Steps:"
echo "1. Configure DNS records:"
echo "   A    @      YOUR_VPS_IP"
echo "   A    www    YOUR_VPS_IP"
echo "   A    api    YOUR_VPS_IP"
echo ""
echo "2. Wait for DNS propagation (5-30 minutes)"
echo ""
echo "3. Install SSL certificate:"
echo "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN -d api.$DOMAIN"
echo ""
echo "4. Test your sites:"
echo "   http://$DOMAIN"
echo "   http://api.$DOMAIN/health"
echo ""
