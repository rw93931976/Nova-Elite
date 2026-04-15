# start-ssh-tunnel.ps1
# This script maintains a persistent tunnel to the Sovereign VPS.
# Local Port 5432 (Local DB) -> VPS Port 5432
# Local Port 3000 (UI) -> VPS Port 3000 (Optional)

$VPS_USER = "root"
$VPS_IP = "n8n.mysimpleaihelp.com"
$SSH_KEY = "C:\Users\Ray\.ssh\id_rsa"

Write-Host "🛡️ Initiating Sovereign Tunnel to $VPS_IP..." -ForegroundColor Cyan

# Check if SSH key exists
if (-not (Test-Path $SSH_KEY)) {
    Write-Host "❌ Warning: SSH Key not found at $SSH_KEY. Using default." -ForegroundColor Yellow
}

# Run SSH in the background to tunnel the necessary ports
# -N: Do not execute remote command
# -L: Local port forwarding
# -o ServerAliveInterval=60: Keep connection alive
ssh -N -L 5434:localhost:5432 -o ServerAliveInterval=60 -i $SSH_KEY "$($VPS_USER)@$($VPS_IP)"

Write-Host "✅ Sovereign Tunnel Established." -ForegroundColor Green
