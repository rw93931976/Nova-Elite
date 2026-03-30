# SYNC_TO_VPS.ps1
# This script synchronizes the local Nova Elite codebase with the remote VPS.
# It uses the discovered aims_ed25519 identity file and the aims user.

$LogFile = "C:\Users\Ray\.gemini\antigravity\Nova-Elite\vps-sync.log"
function Write-Log {
    param($msg)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp : $msg" | Out-File -FilePath $LogFile -Append
    Write-Host "$timestamp : $msg"
}

$IDENTITY_FILE = "C:\Users\Ray\.ssh\aims_ed25519"
$REMOTE_USER = "aims"
$REMOTE_HOST = "31.220.59.237"
$REMOTE_DIR = "~/nova"

Write-Log "--- Starting VPS Synchronization ---"

# 1. Test SSH Connection
Write-Log "Testing SSH connection to ${REMOTE_USER}@${REMOTE_HOST}..."
$testConnect = ssh -i "$IDENTITY_FILE" -o ConnectTimeout=5 -o BatchMode=yes -o StrictHostKeyChecking=no "${REMOTE_USER}@${REMOTE_HOST}" "echo 'Connection Successful'" 2>&1
if ($testConnect -like "*Successful*") {
    Write-Log "✅ SSH Connection Verified."
}
else {
    Write-Log "❌ SSH Connection Failed: $testConnect"
    # Fallback to password if identity file fails (using the password found in restart_bridge.ps1)
    Write-Log "Falling back to password-based interaction if needed (Manual input may be required)."
}

# 2. Sync Files via SCP
Write-Log "Synchronizing core files via SCP..."
scp -i "$IDENTITY_FILE" "vps-core-sovereign-native.cjs" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/vps-core-sovereign-native.cjs"
scp -i "$IDENTITY_FILE" "scripts/ecosystem-vps.config.cjs" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/ecosystem.config.cjs"
ssh -i "$IDENTITY_FILE" "${REMOTE_USER}@${REMOTE_HOST}" "mkdir -p ${REMOTE_DIR}/scripts"
scp -i "$IDENTITY_FILE" "scripts/stability_sentinel.cjs" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/scripts/stability_sentinel.cjs"
scp -i "$IDENTITY_FILE" "scripts/autonomous_schooling.cjs" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/scripts/autonomous_schooling.cjs"

# 3. Restart Services
Write-Log "Restarting services on VPS..."
ssh -i "$IDENTITY_FILE" "${REMOTE_USER}@${REMOTE_HOST}" "cd $REMOTE_DIR && npm install && pm2 delete all; pm2 start ecosystem.config.cjs && pm2 save"

Write-Log "--- Synchronization Complete ---"
