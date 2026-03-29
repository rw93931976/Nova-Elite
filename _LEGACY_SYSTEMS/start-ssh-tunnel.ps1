# start-ssh-tunnel.ps1
# This script establishes a reverse SSH tunnel from the Home PC to the VPS.
# It forwards VPS port 39922 to Desktop port 3505 (the Nova Bridge).

$LogFile = "C:\Users\Ray\.gemini\antigravity\Nova-Elite\nova-tunnel.log"
function Write-Log {
    param($msg)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp : $msg" | Out-File -FilePath $LogFile -Append
    Write-Host "$timestamp : $msg"
}

$IDENTITY_FILE = "C:\Users\Ray\.ssh\aims_ed25519"
$REMOTE_USER = "aims"
$REMOTE_HOST = "31.220.59.237"
$REMOTE_PORT = "44922"
$LOCAL_HOST = "localhost"
$LOCAL_PORT = "3505"

Write-Log "Starting Reverse SSH Tunnel: VPS:39922->3505 AND VPS:39925->39925 (User: ${REMOTE_USER})"
ssh -v -i "$IDENTITY_FILE" -R "0.0.0.0:${REMOTE_PORT}:${LOCAL_HOST}:${LOCAL_PORT}" -R "0.0.0.0:39925:localhost:39925" -R "0.0.0.0:5173:localhost:5173" "${REMOTE_USER}@${REMOTE_HOST}" -N -o ServerAliveInterval=60 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes -o BatchMode=yes -o StrictHostKeyChecking=no 2>&1 | Tee-Object -FilePath "$LogFile" -Append

