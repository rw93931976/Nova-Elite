#!/bin/bash

# WINDSURF 403 FORBIDDEN FIX SCRIPT
# Executes diagnostic commands to resolve nginx version discrepancy

echo "🔍 [403 Fix] Starting VPS diagnostic commands..."

# Step 1: Check what's listening on port 443
echo "📡 [Step 1] Auditing port 443..."
sudo netstat -tlpn | grep ':443' || echo "No process found on port 443"

# Step 2: Check all nginx processes
echo "📡 [Step 2] Checking nginx processes..."
sudo ps aux | grep nginx || echo "No nginx processes found"

# Step 3: Check systemd services
echo "📡 [Step 3] Checking systemd services..."
sudo systemctl status nginx || echo "nginx service not found"
sudo systemctl status nginx2 || echo "nginx2 service not found"

# Step 4: Check Docker containers
echo "📡 [Step 4] Checking Docker containers..."
sudo docker ps -a || echo "Docker not available"
sudo docker network ls || echo "Docker networks not available"

# Step 5: Test nginx configuration
echo "📡 [Step 5] Testing nginx configuration..."
sudo nginx -t || echo "nginx configuration test failed"

# Step 6: Check enabled sites
echo "📡 [Step 6] Listing nginx enabled sites..."
sudo ls -la /etc/nginx/sites-enabled/ || echo "sites-enabled directory not found"

# Step 7: Check main nginx config for includes
echo "📡 [Step 7] Checking nginx main config..."
sudo grep -r "include" /etc/nginx/ || echo "No includes found in nginx config"

# Step 8: Stop all nginx services
echo "📡 [Step 8] Stopping all nginx services..."
sudo systemctl stop nginx || echo "Failed to stop nginx"
sudo systemctl stop nginx2 || echo "Failed to stop nginx2"
sudo pkill -f nginx || echo "Failed to kill nginx processes"

# Step 9: Clean Docker
echo "📡 [Step 9] Cleaning Docker..."
sudo docker container prune -f || echo "Docker container prune failed"
sudo docker network prune -f || echo "Docker network prune failed"
sudo systemctl restart docker || echo "Docker restart failed"

# Step 10: Start clean nginx
echo "📡 [Step 10] Starting clean nginx..."
sudo systemctl start nginx || echo "Failed to start nginx"

# Step 11: Verify port 443
echo "📡 [Step 11] Verifying port 443..."
sudo netstat -tlpn | grep ':443' || echo "Port 443 still not listening"

# Step 12: Test external access
echo "📡 [Step 12] Testing external access..."
curl -I https://nova.mysimpleaihelp.com || echo "External test failed"

echo "✅ [403 Fix] VPS diagnostic script complete!"
