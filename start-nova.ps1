# Nova Elite - Shielded Auto-Start (Persistent Mode)
# This script launches the Bridge, Sentinel, and UI via PM2.

Set-Location "C:\Users\Ray\.gemini\antigravity\Nova-Elite"

# Use npx to run pm2 from node_modules if not in PATH
# This starts the bridge, sentinel, and frontend with 5s auto-restart
npx pm2 start ecosystem.config.cjs --silent

Write-Host "🚀 Nova Elite Bridge & UI are now running persistently via PM2." -ForegroundColor Green
Write-Host "Services will auto-restart within 5 seconds if they crash." -ForegroundColor Cyan
